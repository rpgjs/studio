
enum MaskDir {
    Left,
    Right,
    Bottom,
    Top,
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight
}

type HexaMask = {
    [mask: number]: [number, number, number]
}

const HEXA_AUTOTILES = [
	0x00, 0x80, 0x20, 0xA0, 0x08, 0x88, 0x28, 0xA8,
	0x02, 0x82, 0x22, 0xA2, 0x0A, 0x8A, 0x2A, 0xAA,
	0x83, 0xA3, 0x8B, 0xAB, 0xE0, 0xE8, 0xE2, 0xEA,
	0x38, 0x3A, 0xB8, 0xBA, 0x0E, 0x8E, 0x2E, 0xAE,
	0xBB, 0xEE, 0xE3, 0xEB, 0xF8, 0xFA, 0x3E, 0xBE,
	0x8F, 0xAF, 0xFB, 0xEF, 0xBF, 0xFE, 0xFF, 0xFF
]

const HEXA_BORDER_MASK: HexaMask = {
	[MaskDir.Left]: [0xFE, -1, 0],
	[MaskDir.Right]: [0xEF, 1, 0],
	[MaskDir.Bottom]: [0xFB, 0, 1],
	[MaskDir.Top]: [0xBF, 0, -1]
	
}

const HEXA_CORNER_MASK: HexaMask = {
	[MaskDir.TopLeft]: [0x7F, -1, -1],
	[MaskDir.TopRight]: [0xDF, 1, -1],
	[MaskDir.BottomLeft]: [0xFD, -1, 1],
	[MaskDir.BottomRight]: [0xF7, 1, 1]
}


export class Autotile {
    static getIdByHexa(hexa: number): number {
        return HEXA_AUTOTILES.findIndex(val => val == hexa)
    }
    
    changeTile(tileX: number, tileY: number) {
        const loopAutotile = (mask: HexaMask, hexa: number) => {
            for (let dir in mask) {
                const [maskHexa, posX, posY] = mask[dir]
            }
        }
        let hexa = loopAutotile(HEXA_BORDER_MASK, 0xFF)
    }
}