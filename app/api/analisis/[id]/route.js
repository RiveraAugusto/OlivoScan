import { z } from 'zod'
import { endpoint, json, result } from '@/lib/server/http'
import { readAnalysis } from '@/lib/server/analisis'
import { uuid, optionalUuid, feedbackInput } from '@/lib/contracts'
export const GET = endpoint(async (_, { db, params }) => json(await readAnalysis(db, uuid.parse(params.id))))
export const PATCH = endpoint(async (request, { db, user, params }) => {
  const id = uuid.parse(params.id), body = await request.json()
  const input = body.asociacion ? z.object({ asociacion: z.literal(true), parcela_id: uuid, olivo_id: optionalUuid }).strict().parse(body) : feedbackInput.parse(body)
  const { asociacion: _asociacion, ...changes } = input
  await result(db.from('analisis').update(changes).eq('id', id).eq('usuario_id', user.id).is('eliminado_en', null).select('id').single())
  return json(await readAnalysis(db, id))
})

