import { endpoint, json, result } from '@/lib/server/http'
export const GET = endpoint(async (_, { db }) => json((await result(db.rpc('estadisticas_propias'))).data))
