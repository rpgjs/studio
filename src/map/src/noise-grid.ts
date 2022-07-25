import { MathUtils } from "./math"

export class NoiseGrid {
    
    getRand ( min, max) {
        return Math.floor (( Math.random () * ( max - min)) + min)
    }
    
    generate ( c, r, s, str) {
        let tmp: any = []
        for ( let i = 0; i < r; i ++) {
            tmp.push ([])
            for ( let j = 0; j < c; j ++)
                tmp[i].push ({ c: j, r: i, s: s, value: 0 })
        }
        let d: any = []
        for ( let i = 0; i < str; i ++)	{
            if ( !d.length) d.push ( this.getRand( 1, 5))
            let r: any = []
            switch ( d[ d.length - 1]) {
                case 1:	r = [ 1, 2, 4];	break
                case 2:	r = [ 1, 2, 3];	break
                case 3:	r = [ 2, 3, 4];	break
                case 4:	r = [ 1, 3, 4];	break
            }
            d.push ( r[ this.getRand ( 0, r.length)])
        }
        
        let steps, placed, _r, _c, dc, dr
        placed = 0
        _r = this.getRand ( 0, tmp.length - 1)
        _c = this.getRand ( 0, tmp[0].length - 1)
        do {
            if ( !steps) {
                steps = this.getRand ( 8, 10)
                dc = 0
                dr = 0
                switch ( d.pop()) {
                    case 1:	dr = 1;		break
                    case 2:	dc = 1;		break
                    case 3:	dr = -1;	break
                    case 4:	dc = -1;	break
                }
                placed ++
            } else {
                do {
                    if ( tmp [_r] != undefined && tmp [_r][_c] != undefined) {
                        tmp [_r][_c].value = 1
                        _r += dr
                        _c += dc
                        steps --
                    } else {
                        let t: any = []
                        for ( let t1 of tmp)
                            for ( let t2 of t1)
                                if ( t2.value == 1) t.push (t2)
                        let rand = this.getRand ( 0, t.length - 1)
                        _r = t[ rand].r
                        _c = t[ rand].c
                        steps = 0
                    }
                } while ( steps > 0)
            }
        } while ( d.length)
        return tmp
    }
}