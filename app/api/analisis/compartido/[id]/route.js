// ============================================================
// ARCHIVO: app/api/analisis/compartido/[id]/route.js
// MODULO: Analisis
// DESCRIPCION: Endpoint publico GET para obtener un diagnostico especifico
//              mediante su UUID de analisis, utilizando la clave
//              de rol de servicio para omitir las restricciones RLS
//              de forma controlada y segura para agronomos externos.
// SPRINT: 4
// RF: RF-006
// ============================================================

import { createClient } from '@supabase/supabase-js'

// GET /api/analisis/compartido/[id]
// Devuelve la informacion publica de un analisis por su UUID
export async function GET(request, { params }) {
  try {
    // Await params debido a los cambios en Next.js 15+ donde params es una Promesa
    const { id } = await params

    if (!id) {
      return Response.json(
        { datos: null, error: 'Falta el identificador unico del analisis.' },
        { status: 400 }
      )
    }

    const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      console.error('Error: SUPABASE_SERVICE_ROLE_KEY no esta configurada en el servidor.')
      return Response.json(
        { datos: null, error: 'Configuracion de seguridad incompleta en el servidor.' },
        { status: 500 }
      )
    }

    // Inicializar cliente administrativo de Supabase para saltarse las politicas RLS del usuario
    const supabaseAdmin = createClient(urlSupabase, serviceRoleKey)

    // Consultar el analisis extrayendo unicamente columnas de interes publico del diagnostico
    const { data: objAnalisis, error: dbError } = await supabaseAdmin
      .from('analisis')
      .select('id, imagen_url, plaga_detectada, confianza, severidad, descripcion, recomendacion, plaga_corregida, notas, modelo_version, creado_en')
      .eq('id', id)
      .single()

    if (dbError || !objAnalisis) {
      console.warn(`No se encontro el analisis con ID: ${id}. Error DB:`, dbError?.message)
      return Response.json(
        { datos: null, error: 'El diagnostico solicitado no existe o no esta disponible.' },
        { status: 404 }
      )
    }

    // Retornar el diagnostico
    return Response.json({ datos: objAnalisis, error: null })

  } catch (error) {
    console.error('Error critico en GET /api/analisis/compartido/[id]:', error)
    return Response.json(
      { datos: null, error: 'Ocurrio un error inesperado al recuperar el diagnostico compartido.' },
      { status: 500 }
    )
  }
}
