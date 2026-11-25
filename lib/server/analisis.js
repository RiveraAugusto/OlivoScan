import 'server-only'
import { result, HttpError } from './http'
export const ANALISIS_SELECT =
  'id,usuario_id,parcela_id,olivo_id,imagen_privada,plaga_detectada,confianza,severidad,descripcion,recomendacion,modelo_version,estado_diagnostico,advertencias_imagen,procesamiento_imagen,plaga_corregida,notas,creado_en,parcela:parcelas!analisis_parcela_propietario_fk(id,codigo,nombre,archivada),olivo:olivos!analisis_olivo_parcela_fk(id,codigo,archivado),solicitudes:solicitudes_revision(id,estado,agronomo_id,creado_en,revisiones:revisiones_agronomicas(id,autor_nombre,conclusion,plaga_corregida,observaciones,version,revision_anterior_id,creado_en))'
export function serializeAnalysis(a) {
  return { ...a, imagen_url: a.imagen_privada ? `/api/analisis/${a.id}/imagen` : null }
}
export async function readAnalysis(db, id) {
  const { data } = await result(
    db.from('analisis').select(ANALISIS_SELECT).eq('id', id).is('eliminado_en', null).maybeSingle(),
  )
  if (!data) throw new HttpError(404, 'El análisis no está disponible.')
  return serializeAnalysis(data)
}
