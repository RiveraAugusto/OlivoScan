import { z } from 'zod'
import { endpoint, json, result } from '@/lib/server/http'
import { parcelaInput, uuid } from '@/lib/contracts'
export const GET = endpoint(async (_, { db }) => json((await result(db.from('parcelas').select('*').order('creado_en', { ascending: false }))).data))
export const POST = endpoint(async (request, { db, user }) => {
  const input = parcelaInput.parse(await request.json())
  return json((await result(db.from('parcelas').insert({ ...input, propietario_id: user.id }).select().single())).data, 201)
})
export const PATCH = endpoint(async (request, { db, user }) => {
  const input = z.object({ id: uuid, codigo: z.string().trim().min(1).max(40).optional(), nombre: z.string().trim().min(1).max(120).optional(), archivada: z.boolean().optional() }).strict().parse(await request.json())
  const { id, ...changes } = input
  return json((await result(db.from('parcelas').update(changes).eq('id', id).eq('propietario_id', user.id).select().single())).data)
})

