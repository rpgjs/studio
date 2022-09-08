import request from 'supertest'
import { app } from '../src/server'
import { resolve } from 'path';

jest.setTimeout(90000)

require('dotenv').config({
    path: resolve(__dirname, '../.env'),
  });


beforeAll(async () => {
    const testCredentials = {
        email: 'test@test.com',
        password: 'test',
        role: 'superadmin'
      }
    
   
    const { body: data } = await request(app)
        .post('/api/users/first-register')
        .send(testCredentials)
        
    if (!data.user || !data.user.token) {
        throw new Error('Failed to register first user');
    }
})

it('[GET]', async () => {
    const res = await request(app)
        .get('/api/players')
    expect(res.status).toBe(403)
})