import { Map2dGenerator, GeneratePatternType, MapLayer } from '../src/'
import { Noise } from '../src/noise'
import { js2xml } from 'xml-js'
import tileset from './fixtures/tileset'
import street from './fixtures/street'

describe('Checks the placement of buildings next to streets', () => {
    let map: Map2dGenerator
    let matrix: number[][]

    beforeEach(() => {
        MapLayer.prototype.getMatrix = jest.fn().mockReturnValue(street)
        map = new Map2dGenerator({
            _attributes: {
                width: 30,
                height: 30,
                tileheight: 32,
                tilewidth: 32
              },
              worldX: 0,
              worldY: 0,
              worldHeight: 30,
              worldWidth: 30,
              tileset: [tileset],
              frequency: 0,
              terrainRules: [
                {
                  height: 0.9999,
                  terrains: [
                    {
                      terrainId: 0,
                      tilesetIndex: 0,
                      layer: {
                        name: 'Empty'
                      }
                    }
                  ]
                },
                {
                  height: 1,
                  terrains: [
                    {
                      terrainId: 4,
                      tilesetIndex: 0,
                      layer: {
                        name: 'Street'
                      }
                    }
                  ],
                }
              ],
              threshold: 0
        })
        map.generateTerrain(GeneratePatternType.Grid)
        const [group] = map.getLayers()
        matrix = group.getLayerByName('Street')?.getMatrix() as number[][]
    })

    it('Search for a free space', () => {
        
        
    })
})