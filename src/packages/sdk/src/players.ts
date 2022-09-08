import axios from "axios"

export interface PlayerAuth { 
    message: string;
    user: User;
    token: string;
    exp: number;
}
export interface Game { 
    value: string;
    relationTo: string;
}
export interface User { 
    game: Game;
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    nickname?: string;
    data?: string
}
  
export class Player {
    static readonly Uri = '/api/players'

    login(payload: { email: string, password: string }): Promise<PlayerAuth> {
        return axios.post(Player.Uri + '/login', payload)
    }

    create(payload: { nickname: string, email: string, password: string }): Promise<User> {
        return axios.post(Player.Uri, payload)
    }

    update(id: string, payload): Promise<User> {
        return axios.put(Player.Uri + '/' + id, payload)
    }
}