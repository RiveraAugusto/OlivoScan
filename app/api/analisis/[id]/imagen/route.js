import { endpoint, result, HttpError } from '@/lib/server/http'
import { deliverPrivateImage } from '@/lib/server/storage'
import { uuid } from '@/lib/contracts'
export const GET = endpoint(async (_, { db, params }) => {
  const id = uuid.parse(params.id)
  const { data } = await result(db.from('analisis').select('imagen_public_id,imagen_privada').eq('id',id).is('eliminado_en',null).maybeSingle())
  if (!data?.imagen_privada) throw new HttpError(404, 'La fotografía histórica necesita migración a almacenamiento privado.')
  return deliverPrivateImage(data.imagen_public_id)
})
