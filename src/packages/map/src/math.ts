export class Vector2D {
    constructor(public x: number, public y: number) {}
}

export class MathUtils {
    static distance(vector1: Vector2D, vector2: Vector2D): number {
        return Math.sqrt( (vector1.x - vector2.x) ** 2 + (vector1.y - vector2.y) ** 2)
    }

    static map(n: number, start1: number, stop1: number, start2: number, stop2: number, withinBounds: boolean = false): number {
        const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
        if (!withinBounds) {
            return newval;
        }
        if (start2 < stop2) {
            return MathUtils.constrain(newval, start2, stop2);
        } else {
            return MathUtils.constrain(newval, stop2, start2);
        }
    }
    
    static constrain(n: number, low: number, high: number): number {
        return Math.max(Math.min(n, high), low)
    }

    static random(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    static euclideanDistance(point1, point2)  {
        return Math.sqrt(
          Math.abs(Math.pow(point1.x - point2.x, 2)) +
          Math.abs(Math.pow(point1.y - point2.y, 2))
        )
    }
}

export class ArrayUtils {
    static shuffle(array: any[]): any[] {
        let copy: any[] = [],
          n = array.length,
          i;
      
        // While there remain elements to shuffle…
        while (n) {
      
          // Pick a remaining element…
          i = Math.floor(Math.random() * array.length);
      
          // If not already shuffled, move it to the new array.
          if (i in array) {
            copy.push(array[i]);
            delete array[i];
            n--;
          }
        }
      
        return copy;
      }

    static probability<T extends { probability: number }>(array: T[]): T {
        const sumProbability = array.reduce((prev, current) => prev + current.probability, 0)
        const random = MathUtils.random(0, sumProbability * 100)
        let sum = 0
        for (let val of array) {
            sum += val.probability
            if (random / 100 <= Math.ceil(sum * 100) / 100) {
                return val
            }
        }
        return array[0]
    }
}