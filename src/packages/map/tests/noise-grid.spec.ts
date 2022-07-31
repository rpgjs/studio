import { Map2dGenerator, GeneratePatternType, Tileset } from '../src/'
import { Noise } from '../src/noise'
import tileset from './fixtures/tileset'
import * as fs from 'fs'

describe('Checks the placement of buildings next to streets', () => {
    let map: Map2dGenerator

    beforeEach(() => {
        /*Noise.prototype.generateGrid = jest.fn().mockReturnValue([
            [

            ]
        ])*/
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
    })

    it('', () => {
        const [group] = map.getLayers()
        const matrix = group.getLayerByName('Street')?.getMatrix()
        //console.log(matrix)
        //fs.writeFileSync('test.tmx', js2xml(map.toXML(), { compact: true, spaces: 4 }), 'utf-8') 
    })
})