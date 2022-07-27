export class Tile {
    public id: number
    public terrain?: string
    public terrainArray: number[] = []
    public probability: number = 1
    public properties: Map<string, {
        name: string
        value: string
        type: string
    }> = new Map()

    constructor(public options,  _properties: { property?: any[] } = {}, private objectgroups: any = {}) {
        this.id = +options.id
        this.probability = +options.probability || 1
        if (options.terrain) {
            this.setTerrain(options.terrain)
        }
        if (options.wangid) {
            this.setWangTile(options.wangid)
        }
        if (_properties.property) {
            if (!Array.isArray(_properties.property)) _properties.property = [_properties.property]
            for (let prop of _properties.property) {
                this.properties.set(prop._attributes.name, prop._attributes)
            }
        }
    }
    
    setTerrain(terrain) {
        this.terrain = terrain
        if (this.terrain) this.terrainArray = this.terrain.split(',').map(x => +x)
    }

    setWangTile(wangid) {
        this.terrain = wangid
        if (this.terrain) this.terrainArray = this.terrain.split(',').map(x => +x)
    }

    toXML() {
        let properties: any = []
        this.properties.forEach(property => {
            properties.push({
                property: {
                    _attributes: property
                }
            })
        })
        const xml: any = {
            properties,
            _attributes: {
                probability: this.probability,
                id: this.id
            }
        }
        if (this.objectgroups.id) xml.objectgroup = this.objectgroups
        return xml
    }

    getProperty<T>(name: string): T | null {
        const prop = this.properties.get(name)
        if (prop) {
            switch (prop.type) {
                case 'int':
                    return +prop.value as any
                case 'bool':
                    return prop.value == 'true' ? true : false as any
                default:
                    return prop.value as any
            }
        }
        return null
    }
}