import { z } from 'zod'
import { endpoint, json, result } from '@/lib/server/http'
import { uuid } from '@/lib/contracts'
export const GET = endpoint(async (_, { db, user }) =>
  json(
    (
      await result(
        db
          .from('notificaciones')
          .select('*')
          .eq('usuario_id', user.id)
          .order('creado_en', { ascending: false })
          .limit(100),
      )
    ).data,
  ),
)
export const PUT = endpoint(async (request, { db, user }) => {
  const input = z
    .object({ id: uuid.optional(), marcarTodas: z.boolean().optional() })
    .strict()
    .refine((v) => v.id || v.marcarTodas)
    .parse(await request.json())
  let query = db.from('notificaciones').update({ leida: true }).eq('usuario_id', user.id)
  if (!input.marcarTodas) query = query.eq('id', input.id)
  return json((await result(query.select())).data)
})
