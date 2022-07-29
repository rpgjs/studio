import { Map2d } from "./map2d";
import { TilesGroup } from "./tile-group";

export class Map2dRules extends Map2d {
    tilesGroups: TilesGroup[][] = [] // with layers

    constructor(options, tilesetIndex: number = 0) {
        super(options)
        this.extract(tilesetIndex)
    }

    extract(tilesetIndex: number) {
        const layers = this.getAllLayers()
        const search = layers[0].findTilesGroupByBlock()
        for (let blocks of search) {
            let tileGroups: any = []
            layers.forEach(layer => {
                const tilesOption: any = []
                for (let block of blocks) {
                    const tileId = layer.get(block.x, block.y)
                    tilesOption.push({
                        x: block.x,
                        y: block.y,
                        tileId
                    })
                }
                tileGroups.push(new TilesGroup(tilesOption, tilesetIndex))
            })
            this.tilesGroups.push(tileGroups)
        }
    }

    getTilesGroup(groupIndex: number = 0): TilesGroup[] {
        return this.tilesGroups[groupIndex]
    } 

    getAllTilesGroup() {
        return this.tilesGroups
    }
}

