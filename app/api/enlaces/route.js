import { z } from 'zod'
import { endpoint, json, result } from '@/lib/server/http'
import { enlaceInput, uuid } from '@/lib/contracts'
import { createToken, hashToken } from '@/lib/server/enlaces'
export const GET = endpoint(async (request, { db }) => {
  const id = uuid.parse(new URL(request.url).searchParams.get('analisis_id'))
  return json((await result(db.from('enlaces_compartidos').select('id,analisis_id,campos,creado_en,vence_en,revocado_en').eq('analisis_id', id).order('creado_en', { ascending: false }))).data)
})
export const POST = endpoint(async (request, { db }) => {
  const input = enlaceInput.parse(await request.json()), token = createToken()
  const { data } = await result(db.rpc('crear_enlace', { p_analisis: input.analisis_id, p_huella: hashToken(token), p_campos: input.campos, p_dias: input.dias }))
  // El fragmento no se envía al servidor ni queda en los registros de acceso HTTP.
  return json({ ...data, url: `${new URL(request.url).origin}/analisis/compartido#${token}` }, 201)
})
export const DELETE = endpoint(async (request, { db }) => {
  const { id } = z.object({ id: uuid }).strict().parse(await request.json())
  await result(db.rpc('revocar_enlace', { p_id: id }))
  return json({ revocado: true })
})

