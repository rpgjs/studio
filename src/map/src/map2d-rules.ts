import { Map2d } from "./map2d";
import { TilesGroup } from "./tile-group";

export class Map2dRules extends Map2d {
    tilesGroup: TilesGroup[] = []

    constructor(options, tilesetIndex: number = 0) {
        super(options)
        this.extract(tilesetIndex)
    }

    extract(tilesetIndex: number) {
        this.getAllLayers().forEach(layer => {
            const search = layer.findTilesGroupByBlock()
            this.tilesGroup = search.map(val => new TilesGroup(val, tilesetIndex))
        })
    }
}

