import { CollectionConfig } from 'payload/types';
import payload, { Payload } from 'payload';
import { MissingFieldType } from 'payload/dist/errors'
import { createAccess, readAccess } from '../access/read';
import { PlayerJWTStrategy } from '../auth/strategies/player-jwt';

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
    }
  ],
  hooks: {
   /* afterLogin: [({ req }) => {
        throw 'Not !'
    }],*/
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
       /*findByUsername = async (email) => {
        const gameId = args?.data?.game?.value
        if (!gameId) {
          const error = new MissingFieldType(args.collection.config.fields.find(field => field.name == 'game'))
          error.status = 400
          throw error
        }
        const user = await args.collection.Model.findOne({ email, 'game.value': gameId})
        return user
       }*/
    }]
  }
};

export default Players;