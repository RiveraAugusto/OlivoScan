import { noStore } from '@/lib/server/http'
export function GET() {
  return Response.json(
    {
      datos: null,
      error: 'Este enlace anterior ya no concede acceso. Solicite al propietario un enlace nuevo.',
    },
    { status: 410, headers: noStore },
  )
}
