import { CollectionConfig } from 'payload/types';

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true
  },
  labels: {
    singular: 'user',
    plural: 'users'
  },
  admin: {
    useAsTitle: 'email'
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        'superadmin',
        'admin'
      ]
    }
  ],
};

export default Users;