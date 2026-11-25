import 'server-only'
import { v2 as cloudinary } from 'cloudinary'
import { randomUUID } from 'node:crypto'
import { HttpError, noStore } from './http'
function client() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw new HttpError(503, 'El almacenamiento privado no está configurado.')
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true })
  return cloudinary
}
export async function uploadPrivateImage(buffer) {
  const result = await client().uploader.upload('data:image/jpeg;base64,'+buffer.toString('base64'), { resource_type: 'image', type: 'authenticated', public_id: 'olivoscan/privadas/'+randomUUID(), overwrite: false })
  if (result.type !== 'authenticated') throw new HttpError(503, 'No se pudo confirmar la protección de la imagen.')
  return result.public_id
}
export async function removePrivateImage(publicId) {
  try { await client().uploader.destroy(publicId, { resource_type:'image', type:'authenticated', invalidate:true }) }
  catch { console.error('[OlivoScan] Limpieza de almacenamiento pendiente') }
}
export async function deliverPrivateImage(publicId) {
  if (!publicId || !publicId.startsWith('olivoscan/')) throw new HttpError(404, 'La imagen no está disponible.')
  const url = client().utils.private_download_url(publicId, 'jpg', { resource_type:'image', type:'authenticated', expires_at: Math.floor(Date.now()/1000)+60, attachment:false })
  let response
  try { response = await fetch(url, { cache:'no-store', signal:AbortSignal.timeout(15000) }) }
  catch { throw new HttpError(503, 'La imagen no está disponible temporalmente.') }
  if (!response.ok) throw new HttpError(404, 'La imagen no está disponible.')
  const blob = await response.arrayBuffer()
  if (blob.byteLength > 10*1024*1024) throw new HttpError(413, 'La imagen excede el tamaño admitido.')
  return new Response(blob, { headers: { ...noStore, 'Content-Type':'image/jpeg', 'Content-Disposition':'inline' } })
}
