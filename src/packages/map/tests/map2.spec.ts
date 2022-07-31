import { Map2d, Tileset } from '../src/'
import { xml2js, js2xml } from 'xml-js'
import tileset from './fixtures/tileset'

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
        expect(map.width).toBe(22)
        expect(map.height).toBe(22)
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
            expect(matrix.length).toBe(22)
            expect(matrix[0].length).toBe(22)
        })
    })
})