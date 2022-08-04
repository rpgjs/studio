import { xml2js } from "xml-js";
import { Layer, MapLayer, TiledLayerType } from "./layer";
import { Area } from "./map2d-generator";
import { Tile } from "./tile";
import { TileInfo, TilesGroup } from "./tile-group";
import { Tileset } from "./tileset";

export interface LayerOptions { 
    _attributes: { id: number, name: string }, 
    data: { _attributes: { encoding: 'csv' }, _text: string } 
}

export interface Map2dOptions {
    _attributes: {
        width: number;
        height: number;
        tileheight: number;
        tilewidth: number;  
    },
   // tileset: { _attributes: { firstgid: number, source: string } }[],
    tileset: Tileset[]
    layer?: LayerOptions[],
    group?: {
        _attributes: { id: number, name: string },
        layer: LayerOptions
    }[]
    worldX: number,
    worldY: number
}

interface MapTilesets {
    firstGid: number, 
    tileset: Tileset
}

interface TilesBlockOptions {
    tilesetIndex?: number,
    tilesBase?: number[],
    layerGroup?: MapLayer,
    tilesCondition?: TilesGroup
    ignoreIfParentGroup?: boolean
    conditionToDrawTile?: (tileInfo: TileInfo, x: number, y: number) => boolean
    presenceOfOtherTiles?: {
        tiles: TilesGroup,
        gap?: number,
        direction: ('top' | 'right' | 'bottom' | 'left')[]
    }
}

export class Map2d extends Layer {
    private tilesets: MapTilesets[] = []
    width: number
    height: number
    tileWidth: number
    tileHeight: number
    worldX: number
    worldY: number

    constructor(private options: Map2dOptions | string) {
        super()
        let params: Map2dOptions
        if (typeof options == 'string') {
            params = (xml2js(options, { compact: true }) as any).map as Map2dOptions
        }
        else {
            params = options
        }
        this.map = this
        this.width = +params._attributes.width
        this.height = +params._attributes.height
        this.tileWidth = +params._attributes.tilewidth
        this.tileHeight = +params._attributes.tileheight
        this.worldX = +params.worldX
        this.worldY = +params.worldY
        if (!Array.isArray(params.tileset)) {
            params.tileset = [params.tileset]
        }
        if (params.layer && !Array.isArray(params.layer)) {
            params.layer = [params.layer]
        }
        if (params.group && !Array.isArray(params.group)) {
            params.group = [params.group]
        }
        for (let tileset of params.tileset) {
            this.addTileset(tileset)
        }
        if (params.group) {
            for (let group of params.group) {
                
            }
        }
        if (params.layer) {
            for (let layer of params.layer) {
                this.addLayer({
                    ...layer._attributes,
                    id: layer._attributes.id,
                    data: {
                        encoding: layer.data._attributes.encoding,
                        content: layer.data._text
                    }
                }, this)
            }
        }
    }

    addTileset(tileset: Tileset, firstGid?): Tileset {
        const lastTileset = this.tilesets[this.tilesets.length-1]
        const firstgid = ((lastTileset?.firstGid ?? 1) +( lastTileset?.tileset.tilecount ?? 0))
        this.tilesets.push({
            firstGid: firstgid,
            tileset
        })
        return tileset
    }

    getTilesets(): MapTilesets[]
    getTilesets(index: number): MapTilesets
    getTilesets(index?: number): MapTilesets[] | MapTilesets {
        if (index !== undefined) {
            return this.tilesets[index]
        }
        return this.tilesets
    }

    findTileset(tileId: number): { index: number } & MapTilesets | undefined {
        const firstGids: number[] = []
        for (let tileset of this.tilesets) {
            if (tileId >= tileset.firstGid) {
                firstGids.push(tileset.firstGid)
            }
        }
        const tilesetIndex = this.tilesets.findIndex(tileset => Math.max(...firstGids) == tileset.firstGid)
        return {
            index: tilesetIndex,
            ...this.tilesets[tilesetIndex]
        }
    }

    private positionHasGroup(x, y, currentLayer: MapLayer): boolean {
        const groups = this.getLayers()
        for (let i = groups.length-1 ; i >= 0 ; i--) {
            if (currentLayer.id == groups[i].id) break
            const groupLayer = groups[i].getLayers()
            for (let j=0 ; j < groupLayer.length ; j++) {
                const currentTileId = groupLayer[j].get(x, y)
                if (currentTileId) return true
            }
        }
        return false
    }

    private findEmptyLayer(posX: number, posY: number, zlayer: MapLayer | Map2d, baseY: number, tileToDraw?: Tile): 
    { layer?: MapLayer, insert?: 'before' | 'add' } | undefined {
        let foundAvailableLayer = false
        let findLayer: any = {
            insert: 'add'
        }
        if (!tileToDraw) return
        for (let layer of zlayer.getLayers(TiledLayerType.Tile)) {
            const currentTileId = layer.get(posX, posY)
            const currentTileBaseY = layer.getBaseY(posX, posY) ?? 0
            if (currentTileId) {
                if (currentTileBaseY > baseY) {
                    if (!findLayer.layer) {
                        findLayer = {
                            layer,
                            insert: 'before'
                        }
                    }
                    break
                }
                else {
                    findLayer = {
                        insert: 'add'
                    }
                }
                foundAvailableLayer = false
            }
            else if (!foundAvailableLayer) {
                findLayer = {
                    layer
                }
                foundAvailableLayer = true
            }

        }
        return findLayer
    }

    canSetTilesBlocks(tilesBlocks: TilesGroup[], x: number, y: number, options: TilesBlockOptions = {} as any): boolean {
        const { layerGroup, ignoreIfParentGroup,  tilesetIndex, tilesCondition, presenceOfOtherTiles } = options
        const tilesBlock = tilesBlocks[0]
        let baseY = y
        y -= tilesBlock.getOffsetY()
        let stop = false
        const _tilesetIndex = tilesetIndex ?? tilesBlock.tilesetIndex
        const { tileset } = this.getTilesets(_tilesetIndex)
        const zlayer = layerGroup ?? this
        tilesBlock.forEach((tileInfo, i, j) => {
            const tile = tileInfo?.tileId
            if (!tile) return
            const posX = x+i
            const posY = y+j
            const tileToDraw = tileset.getTile(tile-1)
            let layerInfo = this.findEmptyLayer(posX, posY, zlayer, baseY, tileToDraw)
            if (ignoreIfParentGroup) {
                const hasParentGroup = this.positionHasGroup(posX, posY, zlayer as MapLayer)
                if (hasParentGroup) {
                    stop = true
                    return
                }
            }
            if (stop || !layerInfo) return
            let { layer, insert } = layerInfo
            if (tilesBlock.isTileBase(tileInfo)) {
                const findOtherTile = (tilesCondition: TilesGroup, posX: number, posY: number) => {
                    let stop = false
                    const layers = [...zlayer.getLayers()].reverse()
                    if (layers.length == 0) {
                        return false
                    }
                    let index
                    if (!layer) {
                        index = layers.length-1
                    }
                    else {
                        index = layers.findIndex(_layer => _layer.id == layer?.id)
                        if (insert == 'before') {
                            index =- 1
                        }
                    }
                    for (let i=index ; i < layers.length ; i++) {
                        const layer = layers[i]
                        const tileId = layer?.get(posX, posY)
                        if (!tileId) {
                            stop = true
                            continue
                        }
                        const tileset = this.findTileset(tileId)
                        if (!tileset) {
                            stop = true
                            continue
                        }
                        //if (tilesCondition.tilesetIndex != tileset.index) continue
                        const realTileId = tileId - tileset?.firstGid
                        const foundConditionTile = tilesCondition.find((_tileInfo) => {
                            const _tileId = _tileInfo?.tileId
                            if (!_tileId) return false
                            if (_tileId - 1 == realTileId) {
                                return true
                            }
                            return false
                        })
                        if (realTileId == 0) {
                            stop = true
                            continue
                        }
                        else if (foundConditionTile) {
                            stop = false
                            break
                        }
                        else if (!foundConditionTile) {
                            return false
                        }
                    }
                    return !stop
                }
                if (tilesCondition) {
                    stop = !findOtherTile(tilesCondition, posX, posY)
                }
                if (presenceOfOtherTiles) {
                    const { gap = 1, direction, tiles } = presenceOfOtherTiles
                    for (let dir of direction) {
                        let and = 1
                        switch (dir) {
                            case 'top':
                                and &= +findOtherTile(tiles, posX, posY - gap)
                                break
                            case 'bottom':
                                and &= +findOtherTile(tiles, posX, posY + gap)
                                break
                            case 'left':
                                const tileleft = tilesBlock.tilesBase[0]
                                if (tileleft?.id == tileInfo.id) {
                                    and &= +findOtherTile(tiles, posX - gap, posY)
                                }
                                break
                            case 'right':
                                const tileRight = tilesBlock.tilesBase[tilesBlock.tilesBaseWidth-1]
                                if (tileRight?.id == tileInfo.id) {
                                    and &= +findOtherTile(tiles, posX + gap, posY)
                                }
                                break
                            default:
                                and = 0
                                break
                        }
                        if (!and) {
                            stop = true
                        }
                    }
                }
            }
            
        })
        return !stop
    }

    setTilesBlock(tilesBlocks: TilesGroup | TilesGroup[], x: number, y: number, options: TilesBlockOptions = {}) {
        if (!Array.isArray(tilesBlocks)) {
            tilesBlocks = [tilesBlocks]
        }
        const canSet = this.canSetTilesBlocks(tilesBlocks, x, y, options)
        if (!canSet) return false

        const { layerGroup, tilesetIndex } = options
        const tilesBlock = tilesBlocks[0]
        let baseY = y
        y -= tilesBlock.getOffsetY()
        const _tilesetIndex = tilesetIndex ?? tilesBlock.tilesetIndex
        const { tileset } = this.getTilesets(_tilesetIndex)
        const zlayer = layerGroup ?? this

        for (let tilesBlock of tilesBlocks) {
            if (tilesBlock.ignore) continue
            tilesBlock.forEach((tileInfo, i, j) => {
                const tile = tileInfo?.tileId
                if (!tile) return
                const posX = x+i
                const posY = y+j
                const tileToDraw = tileset.getTile(tile-1)
                if (options.conditionToDrawTile) {
                    if (!options.conditionToDrawTile(tileInfo, posX, posY)) {
                        return
                    }
                }
                let layerInfo = this.findEmptyLayer(posX, posY, zlayer, baseY, tileToDraw)
                if (!layerInfo) return
                let { layer, insert } = layerInfo
                if (!layer) {
                    layer = zlayer.addLayer({
                        name: ''
                    }, this)
                    layer.name = '[AutoLayer Added] #' + layer.id
                }
                else {
                    if (insert == 'before') {
                        layer = zlayer.addLayerBefore(layer.id, {
                            name: ''
                        }, this)
                        if (layer) layer.name = '[AutoLayer Before] #' + layer.id
                    }
                }
                const mapLayer = layer as MapLayer
                if (!mapLayer.isOutside(posX, posY)) {
                    mapLayer.set(posX, posY, tile, {
                        tilesetIndex: _tilesetIndex,
                        baseY
                    })
                }
            })
        }
    }

    searchTilesToSetTilesBlock(tilesBlocks: TilesGroup[], options: TilesBlockOptions = {}): {
        x: number, 
        y: number
    }[] {
        const tiles: {
            x: number, 
            y: number
        }[] = []
        for (let i=0 ; i < this.width ; i++) {
            for (let j=0 ; j < this.height ; j++) {
                const bool = this.canSetTilesBlocks(tilesBlocks, i, j, options)
                if (bool) {
                    tiles.push({
                        x: i,
                        y: j
                    })
                }
            }
        }
        return tiles
    }

    getAllLayers(): MapLayer[] {
        return Layer.flatLayers(this.getLayers())
    }

    crop(x: number, y: number, width: number, height: number) {
        this.width = width
        this.height = height
        this.getAllLayers().forEach(layer => layer.crop(x, y, width, height))
    }

    transferMap(map: Map2d, x: number, y: number) {
        const copyLayers = (layers: MapLayer[], parent: Layer) => {
            for (let layer of layers) {
                if (layer.type == TiledLayerType.Group) {
                    const group = parent.addLayerAsGroup(layer.name, this)
                    copyLayers(layer.layers, group)
                }
                else if (layer.type == TiledLayerType.Tile) {
                    const layerCreated = parent.addLayer({
                        name: layer.name,
                    }, this)
                    layer.matrixForEach((id, posX, posY, baseY) => {
                        layerCreated.setInMatrix(x + posX, y + posY, id, baseY !== undefined ? baseY + posY : undefined)
                    })
                }
            }
        }
        copyLayers(map.layers, this)
    }

    static inBox = (area: Area, x: number, y: number) => {
        const { width, height, x: areaX, y: areaY } = area
        return x >= areaX && x <= areaX + (width ?? 0) && y >= areaY && y <= areaY + (height ?? 0)
    }

    static toLayersXML(layers: MapLayer[]) {
        let obj: any = {
            layer: [],
            group: []
        }
        for (let layer of layers) {
            obj[layer.isGroup() ? 'group' : 'layer'].push(layer.toXML())
        }
        return obj
    }

    createMiniMap(rules?: { groupParentName?: string | RegExp, color: string }[]): number[][][] {
        const map: number[][][] = []
        const layers = this.getAllLayers()

        function hexToRgb(hex) {
            var result = /^#?([a-f\d]{2})?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [parseInt(result[2], 16), parseInt(result[3], 16), parseInt(result[4], 16)] : [0, 0, 0]
        }

        for (let layer of layers) {
            if (layer.type != TiledLayerType.Tile) continue
            layer.matrixForEach((id, x, y) => {
                const assignColor = (color) => map[y][x] = hexToRgb(color)

                if (!map[y]) map[y] = []
                if (!map[y][x])  map[y][x] = [0, 0, 0]
                if (!id) return
                const tileset = this.findTileset(id)
                if (!tileset) return
                const tile = tileset.tileset.getTile(id - tileset.firstGid)
                if (!tile) return
                if (rules) {
                    for (let rule of rules) {
                        const { groupParentName, color } = rule
                        if (groupParentName) {
                            const parent = layer.getParentLayer()
                            if (parent) {
                                if (groupParentName instanceof RegExp) {
                                    if (groupParentName.test(parent?.name)) {
                                        assignColor(color)
                                    }
                                }
                                else if (parent.name == groupParentName) {
                                    assignColor(color)
                                }
                            }
                            
                        }
                    }
                }
                const color = tile.getProperty<string>('color')
                if (!color) return
                assignColor(color)
            })
        }
        return map
    }

    toXML() {
        return {
            _declaration: { _attributes: { version: '1.0', encoding: 'UTF-8' } },
            map: {
                _attributes: {
                    version: '1.8',
                    tiledversion: '1.8.2',
                    orientation: 'orthogonal',
                    renderorder: 'right-down',
                    width: this.width,
                    height: this.height,
                    tilewidth: this.tileWidth,
                    tileheight: this.tileHeight,
                    infinite: '0'
                },
                tileset: this.tilesets.map(tilesetObj => ({
                    _attributes: {
                        firstgid: tilesetObj.firstGid,
                        source: tilesetObj.tileset.source
                    }     
                })),
                ...Map2d.toLayersXML(this.layers)
            }
        } 
    }
}

