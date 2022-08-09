import { buildConfig } from 'payload/config';
import path from 'path';
import Users from './collections/Users';
import Worlds from './collections/Worlds';
import Players from './collections/Players';
import Games from './collections/Games';

const build = buildConfig({
  serverURL: 'http://localhost:8080',
  admin: {
    user: Users.slug,
  },
  collections: [
    Users,
    Games,
    Worlds,
    Players
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
});

build.collections = build.collections.map((collection) => {
  if (collection.slug == 'players') {
    collection.fields = collection.fields.map((field) => {
        if (field.type == 'email') {
          field.unique = false
        }
        return field
    })
  }
  return collection
})

export default build