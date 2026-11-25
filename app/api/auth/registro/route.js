import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { endpoint, json, HttpError } from '@/lib/server/http'
export const POST = endpoint(
  async (request) => {
    const input = z
      .object({
        email: z.email(),
        password: z.string().min(8).max(200),
        nombre: z.string().trim().min(1).max(120),
        zonaGeografica: z.string().trim().max(120).default(''),
      })
      .strict()
      .parse(await request.json())
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new HttpError(503, 'El registro no está configurado.')
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await db.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { nombre: input.nombre, zona_geografica: input.zonaGeografica } },
    })
    if (error)
      throw new HttpError(
        400,
        'No se pudo completar el registro. Revise su correo o vuelva a intentarlo más tarde.',
      )
    return json(data, 201)
  },
  { publicAccess: true },
)
