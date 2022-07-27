import { createCanvas, loadImage, Image } from 'canvas'
import * as ColorThief from 'colorthief'


export class ImageProcessing {
    // tiles: { 
    //     _attributes: { id: number }, 
    //     properties: {
    //          property: { name: string, type: string, value: any }[] 
    //     } 
    // } [][] = []

    tiles: Map<number, { name: string, type: string, value: any }[]> = new Map()

    constructor(private imageUrl: string, private width: number, private height: number) {}

    async parse(tileWidth: number, tileHeight: number) {
       const image = await loadImage(this.imageUrl)
       const nbTileWidth = this.width / tileWidth
       const nbTileHeight = this.height / tileHeight

        const findAlpĥaTile = (ctx, id) => {
            for (let j=0; j < tileWidth ; j++) {
                for (let h=0; h < tileHeight ; h++) {
                    const {data} = ctx.getImageData(j, h, 1, 1)
                    if (data[3] == 0) {
                        this.tiles.set(id, [
                            {
                                name: 'autolayer',
                                type: 'bool',
                                value: 'true'
                            }
                        ])
                        return
                    }
                }
                
            }
        }

        let id = 0
        for (let i = 0 ; i < nbTileHeight ; i++) {
            for (let m=0 ; m < nbTileWidth ; m++) {
                const canvas = createCanvas(tileWidth, tileHeight)
                const ctx = canvas.getContext('2d')
                ctx.drawImage(image, m*nbTileWidth, i*tileHeight, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight)
                findAlpĥaTile(ctx, id)
                id++
            }
       }
       return this.tiles
    }
}