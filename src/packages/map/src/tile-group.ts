interface TileOptions {
    tilesetIndex?: number
    tileId: number
    x: number
    y: number
}

export class TileInfo {
    tilesetIndex?: number
    tileId: number
    flags: Map<string, any> = new Map()
    id: number = Math.random()

    constructor(obj: TileOptions) {
        this.tilesetIndex = obj.tilesetIndex ?? 0
        this.tileId = obj.tileId
    }

    addFlag(key: string, value: any) {
        this.flags.set(key, value)
    }
}

export class TilesGroup {
    tiles: (TileInfo | null)[][] = []
    width: number
    height: number
    ignore: boolean = false

    constructor(tiles: TileOptions[], public tilesetIndex: number = 0, options: { ignore?: boolean } = {}) {
        const pointsX = tiles.map(tile => tile.x)
        const pointsY = tiles.map(tile => tile.y)
        const offsetX = Math.min(...pointsX)
        const offsetY = Math.min(...pointsY)
        this.width = Math.max(...pointsX) - offsetX + 1
        this.height = Math.max(...pointsY) - offsetY + 1
        this.ignore = !!options.ignore
        this.fillTiles()
        for (let tile of tiles) {
            this.addTile(tile.x - offsetX, tile.y - offsetY, tile)
        }
    }

    get tilesBase() {
        return this.tiles[this.tiles.length-1]
    }

    forEach(cb: (tileInfo: TileInfo | null, x: number, y: number) => void) {
        for (let i=0 ; i < this.tiles.length ; i++) {
            for (let j=0 ; j < this.tiles[i].length ; j++) {
                cb(this.tiles[i][j], j, i)
            }
        }
    }

    find(cb: (tileInfo: TileInfo | null, x: number, y: number) => boolean): TileInfo | null {
        let found: TileInfo | null = null
        this.forEach((tileInfo, x, y) => {
            const bool = cb(tileInfo, x, y)
            if (bool) found = tileInfo
        })
        return found
    }

    getOffsetY(): number {
        const tilesBase = this.tilesBase
        let offset = 0
        this.forEach((tile, x, y) => {
            if (tile?.tileId == (tilesBase?.[0]?.tileId)) {
                offset = y
            }
        })
        return offset
    }

    fillTiles() {
        for (let i=0 ; i < this.height ; i++) {
            this.tiles[i] = []
            for (let j=0 ; j < this.width ; j++) {
                this.tiles[i][j] = null
            }
        }
    }

    addTile(x: number, y: number, tileOptions: TileOptions) {
        this.tiles[y][x] = new TileInfo(tileOptions)
    }

    addTileFlag(x: number, y: number, key: string, value: any) {
        this.getTile(x, y)?.addFlag(key, value)
    }

    getTile(x: number, y: number): TileInfo | null {
        return this.tiles[y][x]
    }

    getTilesByFlag(key: string, value: any): { tileInfo: TileInfo, x: number, y: number}[] {
        const array: any = []
        this.forEach((tileInfo, x, y) => {
            const flag = tileInfo?.flags.get(key)
            if (flag && flag == value) {
                array.push({
                    tileInfo,
                    x,
                    y
                })
            }
        })
        return array
    }

    isTileBase(tileInfo: TileInfo): boolean {
        return !!this.tilesBase.find(tile => tile?.id == tileInfo.id)
    }
}