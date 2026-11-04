// ============================================================
// ARCHIVO: app/api/historial/route.js
// MODULO: Historial
// DESCRIPCION: Endpoints GET y DELETE para obtener y eliminar
//              el historial de analisis del usuario.
// SPRINT: 4
// RF: RF-005
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { eliminarImagen } from '@/lib/cloudinary'

// GET /api/historial
// Retorna la lista de diagnosticos del usuario autenticado ordenados por fecha descendente.
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

    // Inicializar cliente temporal de Supabase con el token del usuario para respetar politicas RLS
    const userSupabase = createClient(urlSupabase, claveAnonimaSupabase, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Validar token y obtener informacion del usuario activo
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    if (authError || !user) {
      return Response.json(
        { datos: null, error: 'Token invalido o sesion expirada.' },
        { status: 401 }
      )
    }

    // 2. Consultar el historial de analisis del usuario en Supabase
    // Filtramos por usuario_id (adicional a lo que RLS ya restringe) y ordenamos descendente para ver lo mas nuevo primero
    const { data: objAnalisisLista, error: dbError } = await userSupabase
      .from('analisis')
      .select('*')
      .eq('usuario_id', user.id)
      .order('creado_en', { ascending: false })

    if (dbError) {
      console.error('Error al obtener el historial de analisis:', dbError)
      return Response.json(
        { datos: null, error: 'Error al recuperar el historial de analisis de la base de datos.' },
        { status: 500 }
      )
    }

    // 3. Retornar respuesta estructurada exitosa
    return Response.json({ datos: objAnalisisLista, error: null })

  } catch (error) {
    console.error('Error critico en GET /api/historial:', error)
    return Response.json(
      { datos: null, error: 'Ocurrio un error inesperado al recuperar el historial.' },
      { status: 500 }
    )
  }
}

// DELETE /api/historial
// Elimina un diagnostico del historial si pertenece al usuario autenticado.
// Recibe el ID del analisis en los query params.
// Devuelve el objeto del analisis eliminado o un mensaje de error.
export async function DELETE(request) {
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
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      console.error('Error: SUPABASE_SERVICE_ROLE_KEY no esta configurada en el servidor.')
      return Response.json(
        { datos: null, error: 'Configuracion de seguridad incompleta en el servidor.' },
        { status: 500 }
      )
    }

    // Inicializar cliente temporal de Supabase con el token del usuario para validar su sesion
    const userSupabase = createClient(urlSupabase, claveAnonimaSupabase, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Validar token y obtener informacion del usuario activo
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    if (authError || !user) {
      return Response.json(
        { datos: null, error: 'Token invalido o sesion expirada.' },
        { status: 401 }
      )
    }

    // 2. Obtener el ID del analisis a eliminar desde los parametros de la URL
    const { searchParams } = new URL(request.url)
    const idAnalisis = searchParams.get('id')

    if (!idAnalisis) {
      return Response.json(
        { datos: null, error: 'Falta el identificador unico del analisis.' },
        { status: 400 }
      )
    }

    // Inicializar cliente administrativo de Supabase para saltarse las politicas RLS
    const supabaseAdmin = createClient(urlSupabase, serviceRoleKey)

    // 3. Consultar el registro antes de borrarlo para extraer la URL de la imagen en Cloudinary
    const { data: objAnalisis, error: selectError } = await supabaseAdmin
      .from('analisis')
      .select('imagen_url')
      .eq('id', idAnalisis)
      .eq('usuario_id', user.id)
      .single()

    if (selectError || !objAnalisis) {
      console.warn(`No se encontro el analisis con ID: ${idAnalisis} para eliminar.`)
      return Response.json(
        { datos: null, error: 'El diagnostico solicitado no existe o no pertenece al usuario.' },
        { status: 404 }
      )
    }

    // 4. Eliminar fisicamente la imagen de Cloudinary
    if (objAnalisis.imagen_url) {
      await eliminarImagen(objAnalisis.imagen_url)
    }

    // 5. Realizar la eliminacion del registro en la base de datos
    const { error: dbError } = await supabaseAdmin
      .from('analisis')
      .delete()
      .eq('id', idAnalisis)
      .eq('usuario_id', user.id)

    if (dbError) {
      console.error('Error al eliminar el analisis de la base de datos:', dbError)
      return Response.json(
        { datos: null, error: 'Error al eliminar el analisis de la base de datos.' },
        { status: 500 }
      )
    }

    // 3. Retornar respuesta exitosa con el id del analisis eliminado
    return Response.json({ datos: { id: idAnalisis }, error: null })

  } catch (error) {
    console.error('Error critico en DELETE /api/historial:', error)
    return Response.json(
      { datos: null, error: 'Ocurrio un error inesperado al eliminar el analisis.' },
      { status: 500 }
    )
  }
}
