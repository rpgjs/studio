import payload from "payload";
import { PaginatedDocs } from "payload/dist/mongoose/types";
import { Role } from "./role";

export async function gameAccess({ req }): Promise<boolean | any[]> {
    const { user } = req
    if (!user) {
      return false
    }
    switch (user.role) {
      case Role.SuperAdmin:
        return true;
      case Role.Admin:
        const games = await payload.find({
          collection: 'games',
          where: {
            'users.value': {
              equals: user.id
            }
          }
        })
        if (games.totalDocs == 0) {
          return false
        }
        return games.docs
    }
    return false
}

export async function readAccess(params) {
    const access = await gameAccess(params)
    if (typeof access == 'boolean') {
        return access
    }
    return {
        'game.value': {
            in: access.map(doc => doc.id).join(',')
        }
    }
}

export async function createAccess(params) {
    const { data } = params
    const access = await gameAccess(params)
    if (typeof access == 'boolean') {
        return access
    }
    return access.some(val => val.id == data?.game)
}