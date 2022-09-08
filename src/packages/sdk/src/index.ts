import axios from "axios";
import { Player } from "./players"

export interface AdminConfig {
    url: string,
    secretKey: string,
    publicKey: string
}

export class RpgStudio {
    player = new Player()

    constructor(private adminConfig: AdminConfig) {
        axios.interceptors.request.use((config) => {
            const { method } = config
            config.url = adminConfig.url + config.url
            config.headers = {
                ...config.headers,
                'Authorization': 'user API-Key ' + adminConfig.secretKey
            }
            if (method != 'GET') {
                config.data = {
                    ...config.data,
                    game: {
                        value: adminConfig.publicKey
                    }
                }
            }
            
            return config
        },  Promise.reject)
        axios.interceptors.response.use(response => response.data, Promise.reject)
    }
}