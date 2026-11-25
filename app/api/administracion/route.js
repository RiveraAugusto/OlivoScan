import { z } from 'zod'
import { endpoint, json, result, HttpError } from '@/lib/server/http'
import { uuid } from '@/lib/contracts'
export const GET = endpoint(async (_, { db, perfil }) => {
  if (perfil.rol !== 'admin') throw new HttpError(403, 'Esta operación requiere un administrador.')
  return json((await result(db.rpc('listar_perfiles_admin'))).data)
})
export const PATCH = endpoint(async (request, { db, perfil }) => {
  if (perfil.rol !== 'admin') throw new HttpError(403, 'Esta operación requiere un administrador.')
  const input = z
    .object({
      usuario_id: uuid,
      rol: z.enum(['agricultor', 'agronomo']),
      gestionar_catalogo: z.boolean().default(false),
    })
    .strict()
    .parse(await request.json())
  await result(
    db.rpc('gestionar_perfil_profesional', {
      p_usuario: input.usuario_id,
      p_rol: input.rol,
      p_catalogo: input.gestionar_catalogo,
    }),
  )
  return json({ actualizado: true })
})
