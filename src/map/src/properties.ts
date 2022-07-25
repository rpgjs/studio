export class Properties {
    _properties: Map<string, { value: any, type: string }> = new Map()

    addProperty(name: string, value: any, type: string = 'string') {
        this._properties.set(name, {
            value,
            type
        })
    }

    getProperty(name: string) {
        return this._properties.get(name)?.value
    }

    propertiesToXML() {
        const property: any = []
        this._properties.forEach((prop, name) => {
            property.push({ 
                _attributes: {  
                    value:  prop.value,
                    type: prop.type,
                    name
                }  
            })
        })
        return {
            property
        }
    }
}