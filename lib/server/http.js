import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
export const noStore = { 'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' }
export function json(datos, status = 200, extra = {}) { return Response.json({ datos, error: null, ...extra }, { status, headers: noStore }) }
export function dbError(error) {
  const codes = { '42501': 403, '23505': 409, '40001': 409, '23514': 422, '23503': 422, '22P02': 400 }
  const messages = { '42501': 'No tiene permiso para esta operación.', '23505': 'El registro ya existe o ya hay una solicitud activa.', '40001': 'El registro cambió. Recargue antes de continuar.', '23514': 'Los datos no cumplen las condiciones de la operación.', '23503': 'La parcela, el olivo o la revisión no son compatibles.' }
  return new HttpError(codes[error?.code] || 500, messages[error?.code] || 'No se pudo completar la operación. Inténtelo nuevamente.')
}
export async function result(query) { const { data, error, count } = await query; if (error) throw dbError(error); return { data, count } }
function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url.includes('tu-proyecto')) throw new HttpError(503, 'El servicio no está configurado. Contacte al administrador.')
  return { url, key }
}
export function adminClient() {
  const { url } = config(), key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new HttpError(503, 'El servicio no está configurado. Contacte al administrador.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
export async function authenticate(request) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1]
  if (!token) throw new HttpError(401, 'Inicie sesión para continuar.')
  const { url, key } = config()
  const db = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Su sesión ha vencido. Inicie sesión nuevamente.')
  const { data: perfil } = await result(db.from('usuarios').select('id,nombre,rol,gestionar_catalogo').eq('id', data.user.id).single())
  return { db, user: data.user, perfil }
}
export function endpoint(handler, { publicAccess = false } = {}) {
  return async (request, context) => {
    try { return await handler(request, { ...(publicAccess ? {} : await authenticate(request)), params: await context?.params }) }
    catch (error) {
      const status = error instanceof ZodError ? 400 : error instanceof SyntaxError ? 400 : error.status || 500
      const message = error instanceof ZodError ? error.issues[0]?.message : error instanceof SyntaxError ? 'La solicitud no contiene datos válidos.' : status < 500 || error instanceof HttpError ? error.message : 'No se pudo completar la operación. Inténtelo nuevamente.'
      // Nunca registrar cabeceras, cuerpos, URLs de acceso o errores de proveedores con secretos.
      if (status >= 500) console.error('[OlivoScan] Operación fallida', { status })
      return Response.json({ datos: null, error: message }, { status, headers: noStore })
    }
  }
}

