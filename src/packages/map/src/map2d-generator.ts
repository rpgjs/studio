import { Map2d, Map2dOptions } from "./map2d";
import { Crop, Noise } from "./noise";
import RBush from 'rbush';
import Voronoi from 'voronoi';
import { ArrayUtils, MathUtils } from "./math";
import { MapLayer, TiledLayerType } from "./layer";
import { TilesGroup } from "./tile-group";
import { NoiseGrid } from "./noise-grid";

interface TerrainRules {
    height: number,
    children?: TerrainRules[]
    terrains: {
        terrainId: number,
        tilesetIndex: number,
        layer: {
            name: string
            z?: number,
            _cache?: any,
            fillTileId?: number
        }
    }[]
}

export interface Area {
    x: number,
    y: number,
    width?: number,
    height?: number,
    margin: number,
    map?: Map2d,
    crop?: Crop
}

interface BlockRules {
    id: string,
    tiles: TilesGroup[],
    tilesetIndex: number,
    tilesBase:  number[],
    probability?: number,
    terrainCondition: number[],
    tilesCondition?: TilesGroup[]
}

interface DiffusionRules {
    quantity: number,
    zLayer?: number
    tiles: BlockRules[]
}

interface Map2dGeneratorOptions extends Map2dOptions {
    terrainRules: TerrainRules[],
    fillTerrainId?: number,
    frequency: number,
    threshold: number,
    worldWidth: number
    worldHeight: number
    diffusionRules?: DiffusionRules[],
    areas?: Area[],
    crop?: Crop,
    island?: boolean,
    subNoise?: {
        frequency: number,
        threshold: number,
    },
    autocompleteRules?: TilesGroup[][],
    seedId?: string
}

export enum GeneratePatternType {
    Terrain = 'terrain',
    Grid = 'grid'
}

const CROP_EXCESS_PX = 6

export class Map2dGenerator extends Map2d {
    private terrainRules: TerrainRules[] = []
    private diffusionRules?: DiffusionRules[]
    private frequency: number
    private threshold: number
    private worldWidth: number = 0
    private worldHeight: number = 0
    private _layerGroups: Map<number, MapLayer> = new Map()
    private areas: Area[] = []
    private _crop?: Crop
    private _params: Map2dGeneratorOptions
    private autocompleteRules?: TilesGroup[][]
    private generatedNb: number = 0

    constructor(params: Map2dGeneratorOptions) {
        super(params)
        this.width += CROP_EXCESS_PX
        this.height += CROP_EXCESS_PX
        this.worldWidth = params.worldWidth
        this.worldHeight = params.worldHeight
        this.terrainRules = params.terrainRules.sort(((a, b) => a.height - b.height))
        this.diffusionRules = params.diffusionRules
        this.frequency = params.frequency
        this.threshold = params.threshold
        this.autocompleteRules = params.autocompleteRules
        this._params = params
        this._crop = params.crop
        if (params.areas) {
            this.areas = params.areas.map((area) => {
                if (area.map) {
                    area.width = area.map.width
                    area.height = area.map.height
                    if (!area.crop) {
                        area.crop = {}
                    }; 
                    ['terrainHeight', 'distance'].forEach(prop => {
                        const crop = area.crop as Crop
                        if (!crop[prop])crop[prop] = area.map?.['_crop']?.[prop]
                    })
                    
                }
                return area
            })
        }
    }

    generateTerrain(type?: GeneratePatternType) {
        if (this.generatedNb > 0) {
            console.warn('[Warning] Terrain is already generated')
        }
        const subNoiseParams =  this._params.subNoise
        const seedId = this._params.seedId
        const noiseOptions = {
            width: this.width,
            height: this.height,
            frequency: this.frequency,
            threshold: this.threshold,
            worldWidth: this.worldWidth,
            worldHeight: this.worldHeight,
            island: this._params.island,
            areas: this.areas,
            crop: this._crop
        }
        const noise = new Noise({
            ...noiseOptions,
            seedId: seedId ?? 'seed'
        })
        const subNoise = new Noise({
            ...noiseOptions,
            frequency: subNoiseParams?.frequency ?? this.frequency,
            threshold: subNoiseParams?.threshold ?? this.threshold,
            seedId: seedId ? `sub${seedId}` : 'subseed'
        })
        let noiseArray, subNoiseArray
        switch (type) {
            case GeneratePatternType.Grid:
                noiseArray = noise.generateGrid()
                subNoiseArray = noiseArray
                break;
        
            default:
                noiseArray = noise.generate(this.worldX, this.worldY)
                subNoiseArray = subNoise.generate(this.worldX, this.worldY)
                break;
        }
        this.applyTilesRule(noiseArray, subNoiseArray)
        this.autocomplete()
        this.transferMaps()
        this.diffusion(noiseArray, subNoiseArray)
        this.crop(CROP_EXCESS_PX/2-1, CROP_EXCESS_PX/2-1, this.width-CROP_EXCESS_PX, this.height-CROP_EXCESS_PX)
        this.generatedNb++
    }

    applyTilesRule(grid: number[][], subgrid: number[][]) {

        const drawTerrain = (terrainObj: TerrainRules, x: number, y: number) => {
            for (let terrain of terrainObj.terrains) {
                if (!terrain.layer._cache) {
                    const { name, z, fillTileId } = terrain.layer
                    const zlayer = z ?? 0
                    if (!this._layerGroups.has(zlayer)) {
                        const groupLayer = this.addLayerAsGroup(name, this)
                        groupLayer.addProperty('z', zlayer, 'int')
                        this._layerGroups.set(zlayer, groupLayer)
                    }
                    const groupLayer = this._layerGroups.get(zlayer) as MapLayer
                    const existingLayer = groupLayer.getLayerByName(name)
                    if (!existingLayer) {
                        terrain.layer._cache = groupLayer.addLayer({
                            name,
                            fillTileId
                        }, this)
                    }
                    else {
                        terrain.layer._cache = existingLayer
                    }
                }
                const layer = terrain.layer._cache;
                (layer as MapLayer).setAutotile(terrain.terrainId, x, y, terrain.tilesetIndex)
            }
        }
    
        for (let x = 0; x < this.width ; x ++) {
            for (let y = 0; y < this.height ; y ++) {
                const height = grid[x][y]
                const subheight = subgrid[x][y]
                for (let terrainObj of this.terrainRules) {
                    if (height <= terrainObj.height) {
                        drawTerrain(terrainObj, x, y)
                        if (terrainObj.children) {
                            for (let terrainChildObj of terrainObj.children) {
                                if (subheight <= terrainChildObj.height) {
                                    drawTerrain(terrainChildObj, x, y)
                                } 
                            }
                        }
                        break
                    }   
                }
            }
        }
    }

    diffusion(noiseArray: number[][], subNoiseArray: number[][]) {
        if (!this.diffusionRules) {
            return
        }
        for (let diffusion of this.diffusionRules) {
            const padding = 3
            const voronoi = new Voronoi()
            const { quantity, tiles, zLayer } = diffusion
            const sites = new Array(quantity).fill(0).map(_ => ({
                x: MathUtils.random(0, this.width),
                y: MathUtils.random(0, this.height)
            }));
            const diagram = voronoi.compute(sites, {xl: 0, xr: this.width, yt: 0, yb: this.height})
            const layerGroup = this._layerGroups.get(zLayer ?? 0)
            const layer = layerGroup?.getLastLayer()
            const rbush = new RBush(quantity)
            if (!layer) continue
            for (let pt of diagram.vertices) {
                const x = Math.floor(pt.x)
                const y = Math.floor(pt.y)
                let inArea = false
                if (this.areas) {
                    for (let area of this.areas) {
                        if (Map2d.inBox(area, x, y)) {
                            inArea = true
                        }
                    }
                }
                if (!layer.isOutside(x, y) && !inArea) {
                    const tile = ArrayUtils.probability<any>(tiles) as BlockRules
                    const block: TilesGroup[] = tile.tiles
                    const blockInfo = block[0]
                    const rect = {
                        minX: x,
                        minY: y,
                        maxX: x + blockInfo.width,
                        maxY: y + blockInfo.height
                    }
                    const { terrainCondition, tilesCondition } = tile
                    const height = noiseArray[x][y]
                    if (
                        x >= this.width - padding || 
                        x <= padding ||
                        y >= this.height - padding || 
                        y <= padding
                    ) {
                        continue
                    }
                    if (height <=  terrainCondition[0] || height >= terrainCondition[1]) {
                        continue
                    }
                    const result = rbush.search(rect)
                    if (result.length) {
                        let sameY = false
                        for (let ret of result) {
                            if (ret.maxY == y) {
                                sameY = true
                                //break
                            }
                        }
                        if (sameY) continue
                    }
                    rbush.insert(rect)
                    this.setTilesBlock(block, x, y, {
                        ...tile,
                        layerGroup,
                        tilesCondition: tilesCondition?.[0],
                        ignoreIfParentGroup: true
                    })
                }
            }
        }
    }

    autocomplete() {
        if (!this.autocompleteRules) {
            return
        }
        const layers = [...this.getAllLayers()]
        for (let layer of layers) {
            if (layer.type == TiledLayerType.Group) {
                continue
            }
            layer.matrixForEach((tileId, x, y) => {
                if (!this.autocompleteRules || !tileId) {
                    return
                }
                for (let autoRules of this.autocompleteRules) {
                    const tilesetObj = this.findTileset(tileId-1)
                    const [autoRulesInfo] = autoRules
                    const realTileId = tileId - (tilesetObj?.firstGid ?? 0)
                    if (tilesetObj?.index != autoRulesInfo.tilesetIndex) {
                        return
                    }
                    const [autoTiles] = autoRulesInfo.getTilesByFlag('autocomplete', true)
                    const { tileInfo } = autoTiles
                    if (tileInfo.tileId == realTileId+1) {
                        const parent = layer.getParentLayer()
                        const beforeGroup = parent?.getBeforeLayer()
                        const zLayer = beforeGroup?.getProperty('z') ?? 0
                        const layerGroup = this._layerGroups.get(zLayer)
                        this.setTilesBlock(autoRules, x, y + autoRulesInfo.height - 1, {
                            layerGroup,
                            conditionToDrawTile: (_tileInfo) => {
                                return _tileInfo.tileId != tileInfo.tileId
                            }
                        })
                    }
                }
            })
        }     
    }

    transferMaps(): void {
        for (let area of this.areas) {
            if (!area.map) continue
            this.transferMap(area.map, area.x, area.y)
        }
    }
}