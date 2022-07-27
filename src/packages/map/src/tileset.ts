import { ArrayUtils, MathUtils } from "./math"
import { Tile } from "./tile"
import { TilesGroup } from "./tile-group";
import { ImageProcessing } from "./image";

export interface TilesetOptions {
    _attributes: {
        tileheight: number;
        tilewidth: number;
        tilecount: number
        columns: number
        source: string
        name: string
    },
    image: {
        _attributes: {
            height: number
            source: string,
            width: number
        }
    },
    terraintypes?: { _attributes: { tile: number, name: string } }[],
    tile: { 
        _attributes: { id: number, terrain: string }, 
        properties: { property: { _attributes: { name: string, type: string, value: string } }[] },
        objectgroup: { 
            _attributes: { draworder: string, index: number }, 
            object: { id: number, x: number, y: number, width: number, height: number }[] 
        }
    }[],
    wangsets?: {
        wangset: {
            _attributes: { type: string }
            wangcolor: { _attributes: { color: number, tile: string } }[]
            wangtile: { _attributes: { tileid: number, wangid: string } }[]
        }[]
    }[]
}

class WangSet {
    private wangtile: Map<number, any> = new Map()
    constructor(wangset) {
        for (let wangtile of wangset.wangtile) {
            this.wangtile.set(+wangtile._attributes.tileid, wangtile._attributes)
        }
    }

    getTile(id: number) {
        return this.wangtile.get(id)
    }
}

export class Tileset {
    private cacheTileId: Map<number, Tile> = new Map()
    private cacheTerrain: Map<string, Tile[]> = new Map()
    private tilesGroup: Map<number, TilesGroup> = new Map()
    private wangsets: WangSet[] = []
    public tilecount: number = 0
    private tilewidth: number = 0
    private tileheight: number = 0
    private columns: number = 0
    private name: string = ''
    public source: string = ''
    private image: {
        height: number
        source: string,
        width: number
    }

    constructor(private options: TilesetOptions) {
        let tiles = options.tile
        this.image = options.image._attributes
        this.source = options._attributes.source
        this.tilecount = +options._attributes.tilecount
        this.tilewidth = +options._attributes.tilewidth
        this.tileheight = +options._attributes.tileheight
        this.columns = +options._attributes.columns
        this.name = options._attributes.name
        if (options.wangsets) {
            if (!Array.isArray(options.wangsets)) options.wangsets = [options.wangsets]
            for (let wangsets of options.wangsets) {
                if (!Array.isArray(wangsets.wangset)) wangsets.wangset = [wangsets.wangset]
               for (let wangset of wangsets.wangset) {
                    this.wangsets.push(new WangSet(wangset))
               }
            }
        }
        let tmpTile = new Map()
        if (!Array.isArray(tiles)) tiles = [tiles]
        for (let tileObj of tiles) {
            if (!tileObj) continue
            tmpTile.set(+tileObj._attributes.id, tileObj)
        }
        for (let i=0 ; i < this.tilecount ; i++) {
            const tile = tmpTile.get(i)
            const wangtile = this.getTileInWangset(i)
            const params = {
                _attributes: {
                    ...(tile ?? {}),
                    ...(wangtile ?? {}),
                    id: i
                },
                properties: tile?.properties
            }
            this.addTile(params)
        }
    }

    setImage(source: string, width: number, height: number) {
        this.image = {
            source,
            width,
            height
        }
    }

    getTileInWangset(id: number) {
        for (let wangset of this.wangsets) {
            const tile = wangset.getTile(id)
            if (tile) return tile
        }
    }

    addTileProperties(tiles) {
        tiles.forEach((properties, id) => {
            let tile = this.cacheTileId.get(id)
            if (!tile) {
                tile = this.addTile({
                    id
                })
            }
            for (let prop of properties) {
                tile.properties.set(id, prop)
            } 
        })
    }

    addTile(tileObj): Tile {
        const tile = new Tile(tileObj._attributes, tileObj.properties)
        this.cacheTileId.set(tile.id, tile)
        if (tile.terrain) {
            if (this.cacheTerrain.has(tile.terrain)) {
                this.cacheTerrain.set(tile.terrain, [
                    ...this.cacheTerrain.get(tile.terrain) as Tile[],
                    tile
                ])
            }
            else {
                this.cacheTerrain.set(tile.terrain, [tile])
            }
        }
        return tile
    }

    getTileGroup(groupId: number): TilesGroup | undefined {
        return this.tilesGroup.get(groupId)
    }

    getTile(id: number): Tile | undefined {
        return this.cacheTileId.get(+id)
    }

    getTileByTerrainId(terrainId: string): Tile | undefined {
        const tiles = this.cacheTerrain.get(terrainId) || []
        if (tiles.length == 1) {
            return tiles[0]
        }
       return ArrayUtils.probability<Tile>(tiles)
    }

    toXML(hasRoot = false) {
        let tile: any = []
        this.cacheTileId.forEach(tileObj => {
            tile.push(tileObj.toXML())
        })
        let common = {
            tile,
            image: {
                _attributes: this.image
            }
        }
        if (hasRoot) {
            return {
                _declaration: { _attributes: { version: '1.0', encoding: 'UTF-8' } },
                tileset: {
                    _attributes: {
                        version: "1.8",
                        tiledversion: "1.8.2",
                        name: this.name,
                        tilewidth: this.tilewidth,
                        tileheight: this.tileheight,
                        tilecount: this.tilecount,
                        columns: this.columns
                    },
                    ...common
                }
            }
        }
        return common
    }
}