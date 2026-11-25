import { endpoint, HttpError } from '@/lib/server/http'
import { readShared } from '@/lib/server/enlaces'
import { deliverPrivateImage } from '@/lib/server/storage'
export const GET = endpoint(async request => {
  const data = await readShared(request)
  if (!data._imagen_public_id) throw new HttpError(404, 'La imagen no fue compartida o el acceso ya no está disponible.')
  return deliverPrivateImage(data._imagen_public_id)
}, { publicAccess:true })
