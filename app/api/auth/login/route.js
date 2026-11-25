import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { endpoint, json, HttpError } from '@/lib/server/http'
export const POST = endpoint(
  async (request) => {
    const input = z
      .object({ email: z.email(), password: z.string().min(1).max(200) })
      .strict()
      .parse(await request.json())
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new HttpError(503, 'El acceso no está configurado.')
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await db.auth.signInWithPassword(input)
    if (error)
      throw new HttpError(
        401,
        'Correo o contraseña incorrectos, o cuenta pendiente de confirmación.',
      )
    return json(data)
  },
  { publicAccess: true },
)
