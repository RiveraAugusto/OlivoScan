import { z } from 'zod'
export const uuid = z.uuid('El identificador no es válido.')
export const optionalUuid = uuid.nullish().transform(value => value || null)
export const parcelaInput = z.object({ codigo: z.string().trim().min(1, 'Ingrese un código.').max(40), nombre: z.string().trim().min(1, 'Ingrese el nombre.').max(120) }).strict()
export const olivoInput = z.object({ parcela_id: uuid, codigo: z.string().trim().min(1, 'Ingrese el código del olivo.').max(40) }).strict()
export const CAMPOS_COMPARTIDOS = ['imagen', 'diagnostico', 'recomendacion', 'notas', 'ubicacion', 'revision']
export const enlaceInput = z.object({ analisis_id: uuid, dias: z.number().int().min(1).max(30).default(7), campos: z.array(z.enum(CAMPOS_COMPARTIDOS)).min(1, 'Seleccione al menos un dato para compartir.').transform(v => [...new Set(v)]) }).strict()
export const revisionInput = z.object({ solicitud_id: uuid, conclusion: z.enum(['confirmada','corregida','no_concluyente']), observaciones: z.string().trim().min(1, 'Explique su conclusión.').max(4000), plaga_corregida: z.string().trim().max(200).nullish(), anterior_id: optionalUuid }).strict().refine(v => v.conclusion !== 'corregida' || !!v.plaga_corregida, { message: 'Indique el diagnóstico corregido.', path: ['plaga_corregida'] })
export const feedbackInput = z.object({ notas: z.string().trim().max(4000).default(''), plaga_corregida: z.string().trim().max(200).nullish() }).strict()
export function mismaUnidad(a, b) { return !!a?.olivo_id && a.olivo_id === b?.olivo_id && !!a.parcela_id && a.parcela_id === b.parcela_id }
export function conclusionComparacion(a, b) {
  if (!mismaUnidad(a,b)) return 'Son muestras diferentes o sin olivo identificado. La comparación por parcela no acredita la evolución de un mismo árbol.'
  return 'Ambas muestras pertenecen al mismo olivo. Compare los hallazgos y las revisiones; las imágenes por sí solas no demuestran la eficacia de un tratamiento.'
}
export function ultimaRevision(analisis) {
  return (analisis?.solicitudes || []).flatMap(s => s.revisiones || []).sort((a,b) => new Date(b.creado_en) - new Date(a.creado_en))[0] || null
}
export function estadoRevision(analisis) {
  const solicitudes = analisis?.solicitudes || []
  const activa = solicitudes.find(s => ['pendiente','en_revision'].includes(s.estado))
  return activa?.estado || (ultimaRevision(analisis) ? 'revisada' : 'sin_solicitud')
}

