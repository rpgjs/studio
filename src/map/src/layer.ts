import { Map2d } from "./map2d"
import { Properties } from "./properties"
import { Tile } from "./tile"

export enum TiledLayerType {
    Tile = 'tilelayer',
    ObjectGroup = 'objectgroup',
    Image = 'imagelayer',
    Group = 'group'
}

export class Layer extends Properties {
    layers: MapLayer[] = []
    protected map: Map2d
    public name: string = ''
    public id: number

    constructor(private parent?: Layer) {
        super()
    }

    static flatLayers(arr: MapLayer[]) {
        return arr.reduce((acc, val) => {
            return acc.concat(Layer.flatLayers(val.layers))
        }, arr);
    }
    
    private createLayer(layerObj: {
        name: string
        groupId?: number
        id?: number
        data?: {
            encoding?: string,
            content?: string
        },
        type?: TiledLayerType,
        fillTileId?: number
    }, map: Map2d): MapLayer {
        const { type } = layerObj
        const id = Layer.flatLayers(this.map.getLayers()).reduce((prev, current) => Math.max(prev, current.id ?? 1), 0)
        if (!layerObj.data) layerObj.data = { }
        if (!layerObj?.data?.encoding) layerObj.data.encoding = 'csv'
        if (layerObj.data.encoding != 'csv') {
            console.warn('[Warning] Base64 layer not supported')
        }
        const layer = new MapLayer({
            ...(layerObj as any),
            id: layerObj.id ?? id+1,
        }, this).load(map)
        return layer
    }

    addLayerAsGroup(name: string, map: Map2d, id?: number): MapLayer {
        return this.addLayer({
            name,
            id,
            type: TiledLayerType.Group
        }, map)
    }

    addLayer(layerObj, map: Map2d): MapLayer {
        const layer = this.createLayer(layerObj, map)
        this.layers.push(layer)
        return layer
    }

    addLayerBefore(layerId: number, layerObj, map: Map2d): MapLayer | undefined {
        const layerIndex = this.getLayers().findIndex(layer => layer.id == layerId)
        if (layerIndex < 0) return
        const layer = this.createLayer(layerObj, map)
        this.layers.splice(layerIndex, 0, layer)
        return layer
    }

    getLayers(type?: TiledLayerType): MapLayer[] {
        if (type) {
            return this.layers.filter(layer => layer.type == type)
        }
        return this.layers
    }

    getLayerByName(name: string): MapLayer | undefined {
        return this.layers.find(layer => layer.name == name)
    }

    getLayerById(id: number): MapLayer | undefined {
        return this.layers.find(layer => layer.id == id)
    }

    getLastLayer(): MapLayer | undefined {
        return this.layers[this.layers.length-1]
    }

    getParentLayer(): MapLayer | undefined {
        return this.parent as MapLayer
    }

    getBeforeLayer() {
        const parent = this.getParentLayer()
        const findCurrentIndex = parent?.layers.findIndex(layer => layer.id == this.id)
        if (!findCurrentIndex) return
        return parent?.layers[findCurrentIndex-1]
    }
}

export class MapLayer extends Layer {
    private matrix: number[][] = []
    public type: TiledLayerType = TiledLayerType.Tile
    baseY: number[][] = []

    constructor(
        private layerObj: {
            id: number
            name: string
            data: {
                encoding: string,
                content?: string
            },
            type?: TiledLayerType
            fillTileId?: number
        },
        parent: Layer
    ) {
        super(parent)
        this.id = layerObj.id
        this.name = layerObj.name
        if (layerObj.type) this.type = layerObj.type 
    }

    load(map: Map2d) {
        this.map = map
        if (this.type == TiledLayerType.Tile) {
            if (!this.layerObj.data.content) {
                this.fill(this.layerObj.fillTileId)
            }
            else if (this.layerObj.data.encoding == 'csv') {
                this.matrix = MapLayer.csvToMatrix(this.layerObj.data.content, this.map.width)
            }
        }
        return this
    }

    static csvToMatrix(csv: string, width: number): number[][] {
        const array = csv.split(',')
        const matrix: number[][] = []
        let y = -1
        for (let i=0 ; i < array.length ; i++) {
            if (i % width == 0) {
                y++
                matrix[y] = []
            }
            matrix[y].push(+array[i])
        }
        return matrix
    }

    static matrixToCsv(matrix: number[][]): string {
        let array: number[] = []
        for (let i=0 ; i < matrix.length ; i++) {
            if (!matrix[i]) {
                continue
            }
            for (let j=0 ; j < matrix[i].length ; j++) {
                array.push(matrix[i][j])
            }
        }
        return array.join(',')
    }

    private fill(tileId = 0) {
        for (let i=0 ; i < this.map.width ; i++) {
            this.matrix[i] = []
            for (let j=0 ; j < this.map.height ; j++) {
                this.matrix[i][j] = tileId
            }
        }
    }

    private matrixClone(): number[][] {
        const matrix: number[][] = []
        for (let row of this.matrix)  {
            matrix.push([...row])
        }
        return matrix
    }

    matrixForEach(cb: (id: number, x: number, y: number, baseY?: number) => void) {
        for (let i=0 ; i < this.matrix.length ; i++) {
            for (let j=0 ; j < this.matrix[i].length ; j++) {
                cb(this.get(j, i) as number, j, i, this.getBaseY(j, i))
            }
        }
    }

    static cropArray(matrix: any[][], x: number, y: number, width: number, height: number): any[][] {
        let crop = matrix.slice(x, x + width - 1)
        for (let i = 0; i < crop.length; i++){
            if (crop[i]) crop[i] = crop[i].slice(y, y + height - 1)
        }
        return crop
    }

    crop(x: number, y: number, width: number, height: number) {
        this.matrix = MapLayer.cropArray(this.matrix, x, y, width, height)
        if (this.baseY) {
           this.baseY = MapLayer.cropArray(this.baseY, x, y, width, height)
        }    
    }

    get(x: number, y: number, tilesetIndex?: number): number | undefined {
        if (this.matrix[y] === undefined) {
            return
        }
        const tileId = this.matrix[y][x]
        if (tilesetIndex !== undefined) {
            const { firstGid } = this.map.getTilesets(tilesetIndex)
            return tileId - firstGid + 1
        }
        return tileId
    }

    getBaseY(x: number, y: number): number | undefined {
        if (this.baseY[y] === undefined) {
            return
        }
        return this.baseY[y][x]
    }

    setInMatrix(x: number, y: number, id: number, baseY?: number) {
        this.matrix[y][x] = id
        if (baseY) {
            if (baseY !== undefined) {
                if (!this.baseY[y]) this.baseY[y] = []
                this.baseY[y][x] = baseY
            }
        }
    }

    set(x: number, y: number, id: number, options: {
        tilesetIndex?: number,
        baseY?: number
    } = {}) {
        const { tilesetIndex, baseY } = options
        let firstgid = 1
        if (tilesetIndex !== undefined) {
            const tileset = this.map.getTilesets(tilesetIndex)
            if (tileset) {
                firstgid = tileset.firstGid
            }
        }
        this.setInMatrix(x, y, id + firstgid - 1, baseY)
    }

    getMatrix() {
        return this.matrix
    }

    isOutside(x: number, y: number): boolean {
        if (this.matrix[y] === undefined) return true
        if (this.matrix[y][x] === undefined) return true
        return false
    }

    /*
    Si terrainArray n'existe pas (par  exemple, un carreau [0, 1, 1, 0]) alors la génération complète du carreau sera stoppé
     */
    setAutotile(terrainId: number, mapX: number, mapY: number, tilesetIndex: number = 0): Tile[] {
        const tilesetObj = this.map.getTilesets(tilesetIndex)
        const tileCreated: Tile[] = []
        if (!tilesetObj) return []
        const findBestTile = (wangid, id, indexToChange) => {
            const newTerrainId = [...wangid]
            newTerrainId[indexToChange] = id
            return tilesetObj.tileset.getTileByTerrainId(newTerrainId.join(','))
        }
        const setCorner = (cb: Function, x: number, y: number) => {
            const posX = mapX + x
            const posY = mapY + y
            const currentTileId = this.get(posX, posY)
            if (currentTileId == undefined) {
                return
            }
            let tilesetObj
            if (currentTileId === 0) {
                tilesetObj = this.map.getTilesets(tilesetIndex)
            }
            else {
                tilesetObj = this.map.findTileset(currentTileId-1)
            }
            if (!tilesetObj) return
            const { firstGid, tileset } = tilesetObj
            const tile = tileset?.getTile(currentTileId-firstGid)
            let terrainArray
            if (!tile) {
                terrainArray = [0, 0, 0, 0, 0, 0, 0, 0]
            }
            else {
                terrainArray = tile.terrainArray
            }
            const newTile = cb(terrainArray)
            if (!newTile) return
            tileCreated.push(newTile)
            this.set(posX, posY, newTile.id+1, {
                tilesetIndex
            })
        }
        const id = terrainId
        setCorner((wangid) => findBestTile(wangid, id, 7), 1, 1)
        setCorner((wangid) => findBestTile(wangid, id, 5), 1, 0)
        setCorner((wangid) => findBestTile(wangid, id, 3), 0, 0)
        setCorner((wangid) => findBestTile(wangid, id, 1), 0, 1)
        return tileCreated
    }

    findfloodFill(x: number, y: number, cb: (tileId: number) => boolean): { x: number, y: number, tileId: number }[] {
        const array: any = []
        const matrix = this.matrixClone() as (number | null)[][]
        const recursiveFind = (x, y) => {
            if (y < 0 || y >= matrix.length || x < 0 || x >= matrix[y].length) return
            const val = matrix[y][x]
  
            if (val === null || (!cb(this.get(x, y) as number))) {
                return
            }
        
            array.push({ x, y, tileId: val })
            matrix[y][x] = null

            recursiveFind(x + 1, y)
            recursiveFind(x - 1, y)
            recursiveFind(x, y + 1)
            recursiveFind(x, y - 1)
        }
        recursiveFind(x, y)
        return array
    }

    erase(x: number, y: number) {
        this.set(x, y, 0)
    }

    findTilesGroupByBlock() {
        const memoryMatrix = this.matrixClone()
        const blocks: any[] = []
        this.matrixForEach((id: number, x: number, y: number) => {
            if (this.tileIsEmpty(x, y)) return
            const findBlock = this.findfloodFill(x, y, tileId => tileId != 0)
            if (findBlock.length != 0) {
                blocks.push(findBlock)
            }
            findBlock.forEach((tileInfo) => this.erase(tileInfo.x, tileInfo.y))
        })
        this.matrix = memoryMatrix
        return blocks
    }

    tileIsEmpty(x: number, y: number): boolean {
        return this.get(x, y) === 0
    }

    isGroup(): boolean {
        return this.type == TiledLayerType.Group
    }

    toXML() {
        if (this.isGroup()) {
            return {
                _attributes: {
                    id: this.id,
                    name: this.name
                },
                properties: this.propertiesToXML(),
                ...Map2d.toLayersXML(this.layers)
            }
        }
        this.addProperty('base_y', MapLayer.matrixToCsv(this.baseY))
        return {
            _attributes: {
                id: this.id,
                name: this.name,
                width: this.matrix[0].length,
                height: this.matrix.length
            },
            data: {
                _attributes: {
                    encoding: 'csv'
                },
                _text: MapLayer.matrixToCsv(this.matrix)
            },
            properties: this.propertiesToXML()
        }
    }
}