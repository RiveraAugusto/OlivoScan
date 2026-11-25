import { supabase } from './supabase'
export async function api(path, { method = 'GET', body, signal } = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Su sesión ha vencido. Inicie sesión nuevamente.')
  const form = typeof FormData !== 'undefined' && body instanceof FormData
  const response = await fetch(path, { method, signal, cache: 'no-store', headers: { Authorization: 'Bearer '+session.access_token, ...(!form && body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? form ? body : JSON.stringify(body) : undefined })
  const payload = await response.json().catch(() => ({ error: 'El servidor no pudo completar la solicitud. Reintente sin cerrar la pantalla.' }))
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la operación.')
  return payload
}
export async function imageBlob(path, shareToken) {
  const headers = {}
  if (shareToken) headers.Authorization = 'Enlace '+shareToken
  else { const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error('Inicie sesión para ver la imagen.'); headers.Authorization = 'Bearer '+session.access_token }
  const response = await fetch(path, { headers, cache: 'no-store' })
  if (!response.ok) throw new Error('La imagen no está disponible o no tiene permiso.')
  return response.blob()
}
