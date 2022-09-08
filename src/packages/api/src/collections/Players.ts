import { CollectionConfig } from 'payload/types';
import { MissingFieldType } from 'payload/dist/errors'
import { createAccess, readAccess } from '../access/read';

const Players: CollectionConfig = {
  slug: 'players',
  auth: true,
  admin: {
    useAsTitle: 'nickname',
  },
  access: {
    read: readAccess,
    update: readAccess,
    create: createAccess
  },
  fields: [
    {
        name: 'nickname',
        type: 'text',
    },
    {
        name: 'game',
        type: 'relationship',
        relationTo: ['games'],
        required: true
    },
    {
      name: 'data',
      type: 'code',
      admin: {
        language: 'json'
    }
  }
  ],
  hooks: {
    beforeOperation: [({ args }) => {
      args.collection.Model.schema.plugins[2].opts.findByUsername = (model, params) => {
        const gameId = args?.data?.game?.value
        const email = args?.data?.email
        if (!gameId) {
          const error = new MissingFieldType(args.collection.config.fields.find(field => field.name == 'game'))
          error.status = 400
          throw error
        }
        return model.findOne({ email, 'game.value': gameId })
       }
    }]
  }
};

export default Players;