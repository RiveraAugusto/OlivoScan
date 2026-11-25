import { z } from 'zod'
import { endpoint, json, result, HttpError } from '@/lib/server/http'
import { uuid } from '@/lib/contracts'
const text = z.string().trim().min(1).max(8000)
const ficha = z
  .object({
    nombre: z.string().trim().min(1).max(200),
    descripcion: text,
    sintomas: text,
    condiciones: text,
    tratamiento_quimico: text,
    tratamiento_organico: text,
    meses_riesgo: z.array(z.string().max(20)).max(12).default([]),
    imagen_referencia_url: z
      .string()
      .max(500)
      .refine(
        (v) => !v || /^\/images\/[a-zA-Z0-9_.-]+$/.test(v),
        'Use una imagen de referencia del catálogo local.',
      )
      .nullable()
      .default(null),
  })
  .strict()
function authorize(perfil) {
  if (perfil.rol !== 'admin' && !(perfil.rol === 'agronomo' && perfil.gestionar_catalogo))
    throw new HttpError(403, 'No tiene permiso para gestionar el catálogo.')
}
export const GET = endpoint(async (_, { db }) =>
  json((await result(db.from('plagas_catalogo').select('*').order('nombre'))).data, 200, {
    mes: new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: 'America/Lima' }).format(
      new Date(),
    ),
  }),
)
export const POST = endpoint(async (request, { db, perfil }) => {
  authorize(perfil)
  return json(
    (
      await result(
        db
          .from('plagas_catalogo')
          .insert(ficha.parse(await request.json()))
          .select()
          .single(),
      )
    ).data,
    201,
  )
})
export const PUT = endpoint(async (request, { db, perfil }) => {
  authorize(perfil)
  const { id, ...input } = ficha.extend({ id: uuid }).parse(await request.json())
  return json(
    (await result(db.from('plagas_catalogo').update(input).eq('id', id).select().single())).data,
  )
})
export const DELETE = endpoint(async (request, { db, perfil }) => {
  authorize(perfil)
  const id = uuid.parse(new URL(request.url).searchParams.get('id'))
  await result(db.from('plagas_catalogo').delete().eq('id', id))
  return json({ id })
})
