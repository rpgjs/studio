import { RpgStudio } from '../src'
import axios from "axios"

let rpgStudio: RpgStudio

jest.mock('axios') 
const mockedAxios = axios as jest.Mocked<typeof axios>;

const USER_ID = '62f277ff19a7cc966b602986'

beforeEach(() => {
    rpgStudio = new RpgStudio({
        url: 'http://localhost:8080',
        secretKey: '84a1b7bb-2f9e-44c0-b257-db2252791a39',
        publicKey: '62f22f9f8f375acf6a7630ce'
    })
})

it('[Login]', async () => {
    mockedAxios.post.mockResolvedValueOnce({
        message: 'Auth Passed',
        user: {
          id: USER_ID,
          email: 'bb@bc.net',
          nickname: 'aaaa'
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJiQGJjLm5ldCIsImlkIjoiNjJmMjc3ZmYxOWE3Y2M5NjZiNjAyOTg2IiwiY29sbGVjdGlvbiI6InBsYXllcnMiLCJpYXQiOjE2NjAyMDM5OTIsImV4cCI6MTY2MDIxMTE5Mn0.GTU-RH5FU4aDG19MDpxZfqokTxEQ0CQOa9p6eqrkZmk',
        exp: 1660211192
    })
    const data = await rpgStudio.player.login({
        email: 'bb@bc.net',
        password: 'aa'
    })
    expect(data.token).toBeDefined()
    expect(data.user).toHaveProperty('id', USER_ID)
})