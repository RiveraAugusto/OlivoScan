import { endpoint, json } from '@/lib/server/http'
import { readShared } from '@/lib/server/enlaces'
export const GET = endpoint(
  async (request) => {
    const { _imagen_public_id, ...data } = await readShared(request)
    return json({ ...data, tiene_imagen: !!_imagen_public_id })
  },
  { publicAccess: true },
)
