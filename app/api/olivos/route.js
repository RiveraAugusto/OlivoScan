import { z } from 'zod'
import { endpoint, json, result, HttpError } from '@/lib/server/http'
import { olivoInput, uuid } from '@/lib/contracts'
export const GET = endpoint(async (request, { db }) => {
  const parcela = uuid.parse(new URL(request.url).searchParams.get('parcela_id'))
  return json((await result(db.from('olivos').select('*').eq('parcela_id', parcela).order('codigo'))).data)
})
export const POST = endpoint(async (request, { db }) => json((await result(db.from('olivos').insert(olivoInput.parse(await request.json())).select().single())).data, 201))
export const PATCH = endpoint(async (request, { db }) => {
  const { id, ...changes } = z.object({ id: uuid, codigo: z.string().trim().min(1).max(40).optional(), archivado: z.boolean().optional() }).strict().parse(await request.json())
  const { data } = await result(db.from('olivos').update(changes).eq('id', id).select().maybeSingle())
  if (!data) throw new HttpError(404, 'El olivo no está disponible.')
  return json(data)
})

