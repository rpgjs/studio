import { CollectionConfig } from 'payload/types';
import { v4 as uuidv4 } from 'uuid'

const Games: CollectionConfig = {
  slug: 'games',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    async read({ req, id }) {
        const { user, headers } = req
        if (req.user) {
            return {
                'users.value': {
                  equals: req.user.id,
                }
            }
        }
        return false
    },
    admin(req) {
        return true
    }
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
        name: 'users',
        type: 'relationship',
        relationTo: ['users'],
        required: true,
        hasMany: true
    }
  ],
}

export default Games; 