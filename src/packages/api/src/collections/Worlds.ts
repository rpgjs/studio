import { CollectionConfig } from 'payload/types';

const Worlds: CollectionConfig = {
  slug: 'worlds',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
        name: 'game',
        type: 'relationship',
        relationTo: ['games'],
        required: true
    }
  ],
}

export default Worlds;