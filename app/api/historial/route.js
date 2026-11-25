import { z } from 'zod'
import { endpoint, json, result, HttpError } from '@/lib/server/http'
import { uuid } from '@/lib/contracts'
import { ANALISIS_SELECT, serializeAnalysis } from '@/lib/server/analisis'
export const GET = endpoint(async (request, { db }) => {
  const params = new URL(request.url).searchParams
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .parse(params.get('pagina') || 1)
  const size = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .parse(params.get('limite') || 20)
  const parcela = params.get('parcela_id') ? uuid.parse(params.get('parcela_id')) : null
  const olivo = params.get('olivo_id') ? uuid.parse(params.get('olivo_id')) : null
  const severity = z
    .enum(['leve', 'moderado', 'grave', 'no_aplica'])
    .nullable()
    .parse(params.get('severidad'))
  const estado = z
    .enum(['pendiente', 'en_revision', 'revisada', 'sin_solicitud'])
    .nullable()
    .parse(params.get('estado'))
  const search = z
    .string()
    .max(120)
    .parse(params.get('q') || '')
  function date(name, end) {
    const value = params.get(name)
    if (!value) return null
    z.iso.date().parse(value)
    const time = new Date(value + 'T00:00:00-05:00')
    if (end) time.setUTCDate(time.getUTCDate() + 1)
    return time.toISOString()
  }
  const desde = date('desde'),
    hasta = date('hasta', true)
  if (desde && hasta && desde >= hasta) throw new HttpError(400, 'Revise el rango de fechas.')
  const { data: filtro } = await result(
    db.rpc('listar_analisis_filtrados', {
      p_parcela: parcela,
      p_olivo: olivo,
      p_severidad: severity,
      p_estado: estado,
      p_busqueda: search,
      p_desde: desde,
      p_hasta: hasta,
      p_offset: (page - 1) * size,
      p_limite: size,
    }),
  )
  let rows = []
  if (filtro.ids.length)
    rows = (
      await result(
        db
          .from('analisis')
          .select(ANALISIS_SELECT)
          .in('id', filtro.ids)
          .order('creado_en', { ascending: false }),
      )
    ).data
  return json(rows.map(serializeAnalysis), 200, { total: filtro.total, pagina: page, limite: size })
})
export const DELETE = endpoint(async (request, { db }) => {
  const id = uuid.parse(new URL(request.url).searchParams.get('id'))
  await result(db.rpc('eliminar_analisis_seguro', { p_id: id }))
  return json({ id })
})
