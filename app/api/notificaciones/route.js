// ============================================================
// ARCHIVO: app/api/notificaciones/route.js
// DESCRIPCION: Endpoints GET (listar notificaciones del usuario)
//              y PUT (marcar notificaciones como leidas).
// SPRINT: 3
// RF: RF-007, RF-008
// ============================================================

import { createClient } from '@supabase/supabase-js'

// GET /api/notificaciones
export async function GET(request) {
  try {
    // 1. Validar autenticacion mediante Token Bearer
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { datos: null, error: 'No autorizado. Se requiere token Bearer.' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
    const claveAnonimaSupabase = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const userSupabase = createClient(urlSupabase, claveAnonimaSupabase, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Validar token y obtener info del usuario
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    if (authError || !user) {
      return Response.json(
        { datos: null, error: 'Token invalido o sesion expirada.' },
        { status: 401 }
      )
    }

    // 2. Obtener notificaciones del usuario ordenadas por creacion descendente
    const { data: notificaciones, error: dbError } = await userSupabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', user.id)
      .order('creado_en', { ascending: false })

    if (dbError) {
      console.error('Error al obtener notificaciones:', dbError)
      return Response.json(
        { datos: null, error: 'Error al recuperar las notificaciones.' },
        { status: 500 }
      )
    }

    return Response.json({ datos: notificaciones, error: null })

  } catch (error) {
    console.error('Error critico en GET /api/notificaciones:', error)
    return Response.json(
      { datos: null, error: 'Ocurrio un error inesperado al procesar la solicitud.' },
      { status: 500 }
    )
  }
}

// PUT /api/notificaciones
export async function PUT(request) {
  try {
    // 1. Validar autenticacion mediante Token Bearer
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { datos: null, error: 'No autorizado. Se requiere token Bearer.' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
    const claveAnonimaSupabase = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const userSupabase = createClient(urlSupabase, claveAnonimaSupabase, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Validar token y obtener info del usuario
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    if (authError || !user) {
      return Response.json(
        { datos: null, error: 'Token invalido o sesion expirada.' },
        { status: 401 }
      )
    }

    // 2. Leer cuerpo de peticion
    const body = await request.json().catch(() => ({}))
    const { id, marcarTodas } = body

    if (marcarTodas) {
      // Marcar todas las notificaciones del usuario como leidas
      const { data: actualizadas, error: updateError } = await userSupabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('usuario_id', user.id)
        .select()

      if (updateError) {
        console.error('Error al marcar todas las notificaciones:', updateError)
        return Response.json(
          { datos: null, error: 'No se pudieron actualizar las notificaciones.' },
          { status: 500 }
        )
      }

      return Response.json({ datos: actualizadas, error: null })
    }

    if (!id) {
      return Response.json(
        { datos: null, error: 'Falta especificar el id de la notificacion o el flag marcarTodas.' },
        { status: 400 }
      )
    }

    // Marcar una notificacion especifica como leida
    const { data: actualizada, error: updateError } = await userSupabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id)
      .eq('usuario_id', user.id) // Asegurar propiedad para RLS y seguridad
      .select()
      .single()

    if (updateError) {
      console.error('Error al actualizar notificacion:', updateError)
      return Response.json(
        { datos: null, error: 'No se pudo actualizar la notificacion seleccionada.' },
        { status: 500 }
      )
    }

    return Response.json({ datos: actualizada, error: null })

  } catch (error) {
    console.error('Error critico en PUT /api/notificaciones:', error)
    return Response.json(
      { datos: null, error: 'Ocurrio un error inesperado al procesar la solicitud.' },
      { status: 500 }
    )
  }
}
