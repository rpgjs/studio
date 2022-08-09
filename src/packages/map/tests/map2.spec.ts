import { Map2d, Tileset } from '../src/'
import { xml2js, js2xml } from 'xml-js'
import tileset from './fixtures/tileset'
import rule from './fixtures/rule'

describe('Checks the placement of buildings next to streets', () => {
    let map: Map2d

    const WIDTH = 30
    const HEIGHT = 30

    beforeEach(() => {
        map = new Map2d({
            _attributes: {
                width: WIDTH,
                height: HEIGHT,
                tileheight: 32,
                tilewidth: 32
              },
              worldX: 0,
              worldY: 0,
              tileset: [tileset],
              
        })
    })

    it('Width', () => {
        expect(map.width).toBe(WIDTH)
    })

    it('Height', () => {
        expect(map.height).toBe(HEIGHT)
    })

    it('Add Layer', () => {
        const layer = map.addLayer({
            name: 'foo'
        }, map)
        expect(map.layers).toHaveLength(1)
    })

    it('Get All Layers (Flat Array)', () => {
        const group = map.addLayer({
            name: '1',
            type: 'group'
        }, map)
        group.addLayer({
            name: '2'
        }, map)
        const layers = map.getAllLayers()
        expect(layers).toHaveLength(2)
    })

    it ('Crop Map', () => {
        map.crop(4, 4, 26, 26)
        expect(map.width).toBe(26)
        expect(map.height).toBe(26)
    })

    it ('Crop Map, Test layers', () => {
        map.addLayer({
            name: '1'
        }, map)
        map.addLayer({
            name: '2'
        }, map)
        map.crop(4, 4, 26, 26)
        const layers = map.getAllLayers()
        layers.forEach((layer) => {
            const matrix = layer.getMatrix()
            expect(matrix.length).toBe(26)
            expect(matrix[0].length).toBe(26)
        })
    })

    describe('Set Tiles Block', () => {
        it('Set Tile Block', () => {
            map.setTilesBlock(rule.getTilesGroup(), 0, 0)
            expect(map.layers).toHaveLength(1)
            const tileId = map.layers[0].getMatrix()[0][0]
            expect(tileId).toBe(17)
        })

        it('Several Tile Block', () => {
            map.setTilesBlock(rule.getTilesGroup(), 0, 0)
            map.setTilesBlock(rule.getTilesGroup(), 0, 1)
            expect(map.layers).toHaveLength(2)
            let tileId = map.layers[0].getMatrix()[0][0]
            expect(tileId).toBe(17)
            tileId = map.layers[1].getMatrix()[0][0]
            expect(tileId).toBe(9)
        })

        it('Can Set Tile Block (without condition)', () => {
            const bool = map.canSetTilesBlocks(rule.getTilesGroup(), 0, 0)
            expect(bool).toBe(true)
        })

        /*it('Can Set Tile Block (conditionToDraw options)', () => {
            const bool = map.canSetTilesBlocks(rule.getTilesGroup(), 0, 0, {
                conditionToDrawTile() {
                    return false
                }
            })
            expect(bool).toBe(false)
        })*/

        it('Search All Tiles To Set Tiles Block', () => {
            const tiles = map.searchTilesToSetTilesBlock(rule.getTilesGroup())
            expect(tiles).toHaveLength(WIDTH*HEIGHT)
        })

        it('Search All Tiles To Set Tiles Block (condition)', () => {
            const tiles = map.searchTilesToSetTilesBlock(rule.getTilesGroup(), {
                tilesCondition: rule.getTilesGroup(1)[0]
            })
            expect(tiles).toHaveLength(0)
        })

        it('Search All Tiles To Set Tiles Block (condition )', () => {
            map.setTilesBlock(rule.getTilesGroup(1), 0, 0)
            const tiles = map.searchTilesToSetTilesBlock(rule.getTilesGroup(), {
                tilesCondition: rule.getTilesGroup(1)[0]
            })
            expect(tiles).toHaveLength(1)
            expect(tiles[0]).toMatchObject({x: 0, y: 0})
        })

        it('Search All Tiles To Set Tiles Block (condition: several)', () => {
            map.setTilesBlock(rule.getTilesGroup(1), 0, 0)
            map.setTilesBlock(rule.getTilesGroup(1), 1, 0)
            const tiles = map.searchTilesToSetTilesBlock(rule.getTilesGroup(), {
                tilesCondition: rule.getTilesGroup(1)[0]
            })
            expect(tiles).toHaveLength(2)
            expect(tiles[0]).toMatchObject({x: 0, y: 0})
            expect(tiles[1]).toMatchObject({x: 1, y: 0})
        })

        it('Search All Tiles To Set Tiles Block (presence of other tiles, top)', () => {
            map.setTilesBlock(rule.getTilesGroup(1), 0, 0)
            map.setTilesBlock(rule.getTilesGroup(1), 1, 0)
            const tiles = map.searchTilesToSetTilesBlock(rule.getTilesGroup(), {
                presenceOfOtherTiles: {
                    tiles: rule.getTilesGroup(1)[0],
                    direction: ['top']
                }
            })
            expect(tiles).toHaveLength(2)
            expect(tiles[0]).toMatchObject({x: 0, y: 1})
            expect(tiles[1]).toMatchObject({x: 1, y: 1})
        })


        it('Search All Tiles To Set Tiles Block (presence of other tiles, corner)', () => {
            map.setTilesBlock(rule.getTilesGroup(1), 0, 0)
            map.setTilesBlock(rule.getTilesGroup(1), 2, 0)
            map.setTilesBlock(rule.getTilesGroup(1), 4, 0)
            map.setTilesBlock(rule.getTilesGroup(1), 4, 2)
            const tiles = map.searchTilesToSetTilesBlock(rule.getTilesGroup(), {
                presenceOfOtherTiles: {
                    tiles: rule.getTilesGroup(1)[0],
                    direction: ['right', 'top']
                }
            })
            expect(tiles).toHaveLength(2)
            expect(tiles[0]).toMatchObject({x: 2, y: 1})
            expect(tiles[1]).toMatchObject({x: 3, y: 1})
        })

        it('Search All Tiles, tilesCondition & presenceOfOtherTiles', () => {
            map.setTilesBlock(rule.getTilesGroup(0), 0, 2)
            map.setTilesBlock(rule.getTilesGroup(1), 0, 0)
            map.setTilesBlock(rule.getTilesGroup(1), 2, 0)
            map.setTilesBlock(rule.getTilesGroup(1), 4, 0)
            map.setTilesBlock(rule.getTilesGroup(1), 4, 2)
            const tiles = map.searchTilesToSetTilesBlock(rule.getTilesGroup(), {
                tilesCondition: rule.getTilesGroup()[0],
                presenceOfOtherTiles: {
                    tiles: rule.getTilesGroup(1)[0],
                    direction: ['top'],
                }
            })
            expect(tiles).toHaveLength(1)
            expect(tiles[0]).toMatchObject({x: 0, y: 1})
        })
    })
})