import { z } from 'zod'
import { endpoint, json, result } from '@/lib/server/http'
import { uuid, optionalUuid, revisionInput } from '@/lib/contracts'
export const GET = endpoint(async (_, { db }) => json((await result(db.from('solicitudes_revision').select('*,revisiones:revisiones_agronomicas(*)').order('actualizado_en', { ascending: false }))).data))
export const POST = endpoint(async (request, { db }) => {
  const { analisis_id } = z.object({ analisis_id: uuid }).strict().parse(await request.json())
  return json((await result(db.rpc('solicitar_revision', { p_analisis: analisis_id }))).data, 201)
})
export const PATCH = endpoint(async (request, { db }) => {
  const input = z.object({ id: uuid, accion: z.enum(['asignar','iniciar','cancelar']), agronomo_id: optionalUuid }).strict().parse(await request.json())
  return json((await result(db.rpc('gestionar_solicitud', { p_id: input.id, p_accion: input.accion, p_agronomo: input.agronomo_id }))).data)
})
export const PUT = endpoint(async (request, { db }) => {
  const input = revisionInput.parse(await request.json())
  return json((await result(db.rpc('emitir_revision', { p_solicitud: input.solicitud_id, p_conclusion: input.conclusion, p_observaciones: input.observaciones, p_plaga_corregida: input.plaga_corregida || null, p_anterior: input.anterior_id }))).data, 201)
})

