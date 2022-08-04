import { Map2d, Map2dGenerator, Tileset } from '../src/'
import { xml2js, js2xml } from 'xml-js'
import tileset from './fixtures/tileset'
import rule from './fixtures/rule'

describe('Checks Generator', () => {
    let map: Map2dGenerator

    const WIDTH = 30
    const HEIGHT = 30

    beforeEach(() => {
        rule.getAllTilesGroup().forEach(([group]) => {
            group.addTileFlag(0, 0, 'autocomplete', true)
        })

        map = new Map2dGenerator({
            _attributes: {
                width: WIDTH,
                height: HEIGHT,
                tileheight: 32,
                tilewidth: 32
                },
                worldX: 0,
                worldY: 0,
                tileset: [tileset],
                worldHeight: WIDTH,
                worldWidth: HEIGHT,
                frequency: 0.02,
                threshold: 0.5,
                terrainRules: [
                    {
                        height: 0,
                        terrains: [
                            {
                                terrainId: 0,
                                tilesetIndex: 0,
                                layer: {
                                    name: 'Terrain'
                                }
                            }
                        ]
                    }
                ],
                autocompleteRules:  rule.getAllTilesGroup(),
              
        })
    })

    it('Autocomplete', () => {
        const layer = map.addLayer({
            name: '1'
        }, map)
        layer.set(0, 0, 9)
        map.autocomplete()
        expect(map.layers).toHaveLength(1)
        const matrix = layer.getMatrix()
        expect(matrix[0][0]).toBe(9)
        expect(matrix[0][1]).toBe(10)
        expect(matrix[1][0]).toBe(17)
        expect(matrix[1][1]).toBe(18)
    })

    it('Autocomplete Base Y', () => {
        const layer = map.addLayer({
            name: '1'
        }, map)
        layer.set(0, 0, 9)
        map.autocomplete()
        const baseY = layer.baseY
        expect(baseY[0][0]).toBe(undefined)
        expect(baseY[0][1]).toBe(1)
        expect(baseY[1][0]).toBe(1)
        expect(baseY[1][1]).toBe(1)
    })

    function expectMatrix(firstLayer, secondLayer, x, y) {
        const matrix1 = firstLayer.getMatrix()
        expect(matrix1[x][y]).toBe(9)
        expect(matrix1[x][y+1]).toBe(10)
        expect(matrix1[x+1][y]).toBe(17)
        expect(matrix1[x+1][y+1]).toBe(18)
        expect(matrix1[x+2][y]).toBe(19)
        expect(matrix1[x+2][y+1]).toBe(20)
        const matrix2 = secondLayer.getMatrix()
        expect(matrix2[x][y]).toBe(0)
        expect(matrix2[x][y+1]).toBe(0)
        expect(matrix2[x+1][y]).toBe(11)
        expect(matrix2[x+1][y+1]).toBe(12)
    }

    it('Autocomplete and Set Tile Block', () => {
        const layer = map.addLayer({
            name: '1'
        }, map)
        layer.set(0, 0, 9)
        map.autocomplete()
        map.setTilesBlock(rule.getTilesGroup(1), 0, 2)
        expect(map.layers).toHaveLength(2)
        const [firstLayer, secondLayer] = map.layers
        expectMatrix(firstLayer, secondLayer, 0, 0)
    })

    it('Autocomplete and Set Tile Block and Crop', () => {
        const layer = map.addLayer({
            name: '1'
        }, map)
        layer.set(10, 10, 9)
        map.autocomplete()
        map.crop(3, 3, map.width-2, map.height-2)
        map.setTilesBlock(rule.getTilesGroup(1), 7, 9)
        expect(map.layers).toHaveLength(2)
        const [firstLayer, secondLayer] = map.layers
        expectMatrix(firstLayer, secondLayer, 7, 7)
    })
})