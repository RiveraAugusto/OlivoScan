import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { adminClient, result, HttpError } from './http'
export function hashToken(token) { return createHash('sha256').update(token).digest('hex') }
export function createToken() { return randomBytes(32).toString('base64url') }
export async function readShared(request) {
  const token = request.headers.get('authorization')?.match(/^Enlace ([A-Za-z0-9_-]{43})$/)?.[1]
  if (!token) throw new HttpError(404, 'El enlace no está disponible o ha vencido.')
  const { data } = await result(adminClient().rpc('consultar_enlace', { p_huella: hashToken(token) }))
  if (!data) throw new HttpError(404, 'El enlace no está disponible o ha vencido.')
  return data
}

