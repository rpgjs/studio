import { MathUtils, Vector2D } from './math'
import SimplexNoise from 'simplex-noise';
import { Area } from './map2d-generator';
import { Map2d } from './map2d';
import { NoiseGrid } from './noise-grid';

export interface Crop {
  distance?: number
  frequency?: number,
  terrainHeight?: number,
  margin?: number
}

export interface NoiseOptions {
    width: number
    height: number
    frequency: number
    threshold: number
    island?: boolean
    worldWidth: number
    worldHeight: number
    areas?: Area[]
    crop?: Crop
    seedId: string
}

interface NoiseCropOptions extends Crop {
  simplexEdge: string,
  area?: Area
}

class NoiseFilter {
  private edge: SimplexNoise
  private isTransformed: boolean = false
  static DEFAULT_DISTANCE: number = 10
  static DEFAULT_FREQUENCY: number = 0.02
  static DEFAULT_MARGIN: number = 10
  static DEFAULT_TERRAIN_HEIGHT: number = -1

  constructor(
    private x: number, 
    private y: number, 
    private h: number, 
    private noise: Noise,
    private simplex: any
  ) {}

  private areaAdditionalCondition(prop: string, options: NoiseCropOptions) {
    const area = options.area as Area
    const { distance = NoiseFilter.DEFAULT_DISTANCE } = options
    return prop == 'x' 
    ? this.y >= area.y && this.y <= area.y + (area.height ?? 0)
    : this.x >= area.x - distance && this.x <= area.x + (area.width ?? 0) + distance
  }

  private getIntervalTiles(options: NoiseCropOptions) {
    const { distance = NoiseFilter.DEFAULT_DISTANCE, frequency = NoiseFilter.DEFAULT_FREQUENCY, simplexEdge } = options
    let seedHeight = this.simplex[simplexEdge].noise2D(this.x * frequency, this.y * frequency)
    return distance + Math.abs(Math.round(seedHeight * distance / 3))
  }

  private applyCropLeftTop(options: NoiseCropOptions, prop: string) {
    const intervalTiles = this.getIntervalTiles(options)
    let condition = this[prop] <= intervalTiles
    let blurA = intervalTiles
    let blurB = intervalTiles + (options.margin ?? NoiseFilter.DEFAULT_MARGIN)
    let blurDirection = true
    let additionalCondition = true
    if (options.area) {
      const { area } = options
      condition = Map2d.inBox(options.area, this.x, this.y)
      blurA = area[prop] - intervalTiles
      blurB = area[prop]
      blurDirection = false
      additionalCondition = this.areaAdditionalCondition(prop, options)
    }
    if (condition) {
      this.isTransformed = true
      return options.terrainHeight ?? NoiseFilter.DEFAULT_TERRAIN_HEIGHT
    }
    else if (this[prop] > blurA && this[prop] <= blurB && !this.isTransformed && additionalCondition) {
      this.isTransformed = true
      return this.h * MathUtils.map(this[prop], blurDirection ? blurA : blurB, blurDirection ? blurB : blurA, 0, 1)
    }
    return this.h
  }

  private applyCropRightBottom(options: NoiseCropOptions, prop: string) {
    const intervalTiles = this.getIntervalTiles(options)
    const val = this.noise[prop == 'y' ? 'worldHeight' : 'worldWidth'] - intervalTiles
    let condition = this[prop] >= val
    let blurA = val
    let blurB = val - (options.margin ?? NoiseFilter.DEFAULT_MARGIN)
    let blurDirection = true
    let additionalCondition = true
    if (options.area) {
      const { area } = options
      const direction = area[prop == 'y' ? 'height' : 'width']
      condition = Map2d.inBox(options.area, this.x, this.y)
      blurA = area[prop] + direction + intervalTiles
      blurB = area[prop] + direction
      blurDirection = false
      additionalCondition = this.areaAdditionalCondition(prop, options)
    }
    if (condition) {
      this.isTransformed = true
      return options.terrainHeight ?? NoiseFilter.DEFAULT_TERRAIN_HEIGHT
    }
    else if (this[prop] < blurA && this[prop] >= blurB && !this.isTransformed && additionalCondition) {
       this.isTransformed = true
       return this.h * (1-MathUtils.map(this[prop], blurDirection ? blurB : blurA, blurDirection ? blurA : blurB, 0, 1))
    }
    return this.h
  }

  applyCropTop(options: NoiseCropOptions): number {
   return this.applyCropLeftTop(options, 'y')
  }

  applyCropBottom(options: NoiseCropOptions): number {
    return this.applyCropRightBottom(options, 'y')
   }

  applyCropLeft(options: NoiseCropOptions): number {
    return this.applyCropLeftTop(options, 'x')
  }

  applyCropRight(options: NoiseCropOptions): number {
    return this.applyCropRightBottom(options, 'x')
  }

  applyAroundCrop(options: NoiseCropOptions) {
    this.h = this.applyCropLeft(options)
    this.h = this.applyCropRight(options)
    this.h = this.applyCropTop(options)
    this.h = this.applyCropBottom(options)
    return this.h
  }
}

export class Noise {
  width: number = 0
  height: number = 0
  worldWidth: number = 0
  worldHeight: number = 0
  frequency: number = 0
  threshold: number = 0
  island?: boolean = false
  private furthestDistanceFromCentre
  private centrePoint
  private simplex: SimplexNoise
  private simplexFilter: any
  private areas?: Area[]
  private crop?: Crop
  
  constructor(options: NoiseOptions) {
      this.width = options.width
      this.height = options.height
      this.worldWidth = options.worldWidth
      this.worldHeight = options.worldHeight
      this.frequency = options.frequency
      this.threshold = options.threshold
      this.island = options.island
      this.areas = options.areas
      this.crop = options.crop
      this.simplex = new SimplexNoise(options.seedId)
      this.simplexFilter = {
         edge: new SimplexNoise(options.seedId + '-edge')
      }
  }
  
  generate(xoff: number = 0, yoff: number = 0): number[][] {
    let min = 1;
    let max = 0;
    let noiseArray: number[][] = [];

    this.centrePoint = {x: Math.floor(this.width / 2), y: Math.floor(this.height / 2)}
    this.furthestDistanceFromCentre = MathUtils.euclideanDistance(
      {x: 0, y: 0}, this.centrePoint
    )

    for (let x = 0; x < this.width; x++) {
      noiseArray.push([]);
      for (let y = 0; y < this.height; y++) {
        let height = this.generateHeight(x+xoff, y+yoff);
        noiseArray[x].push(height);
        if (height < min) {
          min = height;
        } else if (height > max) {
          max = height;
        }
      }
    }
    
    // normalize the array of heights
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        noiseArray[x][y] = MathUtils.map(noiseArray[x][y], -1, 1, 0, 1);
      }
    }

    return noiseArray
  }

  generateGrid(): number[][] {
    const noiseGrid = new NoiseGrid(this.width, this.height, 1)
    let map = noiseGrid.setRandomPath()
    for (let i=0 ; i < map.length ; i++) {
      for (let j=0 ; j < map[i].length ; j++) {
        map[i][j] = this.applyFilters(j, i, map[i][j])
      }
    }
    return map
  }

  private generateHeight(x: number, y: number): number {
      const h = this.simplex.noise2D(x * this.frequency, y * this.frequency)
      return this.applyFilters(x, y, h)
    }

  private applyFilters(x: number, y: number, h: number): number {
    const filter = new NoiseFilter(x, y, h, this, this.simplexFilter)

    if (this.areas) {
      for (let area of this.areas) {
        h = filter.applyAroundCrop({
          simplexEdge: 'edge',
          area,
          ...area.crop
        })
      }
    }

    if (this.crop) {
      h = filter.applyAroundCrop({
        simplexEdge: 'edge',
        ...this.crop
      })
    }

    return h
  }
}
