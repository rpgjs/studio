export class NoiseGrid {
    noOfPaths: number
    arr: number[][] = [] //	hold all the possible paths and represent as 2D array

    constructor(private rows: number, private cols: number, private pathWidth: number) {							
		this.noOfPaths = ( rows * cols)				//	number of possible paths on map													
		for ( let r = 0; r < rows; r ++) {
			this.arr.push ([])
			for ( let c = 0; c < cols; c ++)
				this.arr[r].push (0)
		}
    }

    static getRand (min: number, max: number): number {
        return Math.floor (( Math.random () * ( max - min)) + min)
    }
    
    setRandomPath(): number[][] {
		let r = Math.floor ( Math.sqrt( this.rows)) + 5,
			c = Math.floor ( Math.sqrt( this.cols)) + 5
		for ( let _r = NoiseGrid.getRand( 1, 2); _r < this.rows; _r += r)
			for ( let _c = NoiseGrid.getRand( 1, 2); _c < this.cols; _c += c) {
				let __r = _r + NoiseGrid.getRand( 1, 3) * this.pathWidth, __c = _c + NoiseGrid.getRand( 1, 3) * this.pathWidth, steps = 0
				let d = NoiseGrid.getRand ( 0, 5)
				if ( d)	this.addBlock ( __r, __c, this.pathWidth)
				do {
					switch ( d) {
						case 1:
							this.addBlock ( __r - steps, __c, this.pathWidth)
						break
						case 2:
							this.addBlock ( __r - steps, __c, this.pathWidth)
							this.addBlock ( __r, __c - steps, this.pathWidth)
						break
						case 3:
							this.addBlock ( __r - steps, __c, this.pathWidth)
							this.addBlock ( __r, __c - steps, this.pathWidth)
							this.addBlock ( __r + steps, __c, this.pathWidth)
						break
						case 4:
							this.addBlock ( __r - steps, __c, this.pathWidth)
							this.addBlock ( __r, __c - steps, this.pathWidth)
							this.addBlock ( __r + steps, __c, this.pathWidth)
							this.addBlock ( __r, __c + steps, this.pathWidth)
						break
					}
					steps ++
				} while ( steps < r || steps < c)
			}

        return this.arr
	}

    addBlock( r: number, c: number, s: number) {
		for ( let _r = r; _r < r + s; _r ++)
			for ( let _c = c; _c < c + s; _c ++)
				if ( this.arr [ _r] != undefined && this.arr [ _r][ _c] != undefined && !this.arr [ _r][ _c])
					this.arr [ _r][ _c] = 1
	}
}