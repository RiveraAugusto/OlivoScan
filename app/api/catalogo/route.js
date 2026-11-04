// ============================================================
// NOMBRE OBJETO: app/api/catalogo/route.js
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-04 (Recomendación de tratamiento y catálogo fitosanitario)
// DESCRIPCION: API Route REST (GET, POST, PUT, DELETE) para consultar y
//              administrar el catálogo fitosanitario con soporte de auto-seeding.
// ============================================================

import { createClient } from '@supabase/supabase-js'

const CODIGOS_HTTP = {
  OK: 200,
  CREADO: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INTERNAL_ERROR: 500,
}

const PLAGAS_PREDEFINIDAS = [
  {
    nombre: 'Mosca del olivo',
    descripcion: 'Bactrocera oleae. Es la plaga más importante del olivar. La larva se alimenta de la pulpa de la aceituna, reduciendo el rendimiento y la calidad del aceite.',
    sintomas: 'Picaduras de puesta en la superficie del fruto, galerías internas en la pulpa excavadas por las larvas, caída prematura de aceitunas.',
    condiciones: 'Temperaturas moderadas (20-25°C) y humedad relativa alta. Se detiene su actividad con temperaturas mayores a 35°C.',
    tratamiento_quimico: 'Aplicaciones de cebo con Deltametrina o Lambda-cihalotrina al 1-2% mezclados con proteínas hidrolizadas, o tratamientos sistémicos con Fosmet en pulverización total.',
    tratamiento_organico: 'Trampeo masivo con fosfato diamónico al 4%, aplicación de caolín como barrera física y uso de Spinosad ecológico.',
    imagen_referencia_url: '/images/mosca_olivo.png',
    meses_riesgo: ['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'],
  },
  {
    nombre: 'Prays del olivo (Polilla)',
    descripcion: 'Prays oleae. Polilla que ataca al olivo en tres generaciones distintas: filófaga (hojas), antófaga (flores) y carpófaga (frutos).',
    sintomas: 'Galerías sinuosas en las hojas, caída de capullos florales secos, caída prematura de frutos en verano (caída de San Juan).',
    condiciones: 'Primaveras suaves para la generación de la flor, y principios de verano para el ataque al fruto.',
    tratamiento_quimico: 'Tratamientos preventivos en generación antófaga con Deltametrina antes de floración, o insecticidas penetrantes como Fosmet al inicio de la tercera generación.',
    tratamiento_organico: 'Tratamientos foliares con Bacillus thuringiensis subespecie kurstaki durante el inicio de la floración, y fomento de crisopas depredadoras.',
    imagen_referencia_url: '/images/prays_olivo.png',
    meses_riesgo: ['Abril', 'Mayo', 'Junio', 'Septiembre', 'Octubre'],
  },
  {
    nombre: 'Cochinilla tiznada (Saissetia oleae)',
    descripcion: 'Saissetia oleae. Insecto chupador que succiona la savia del olivo y excreta una melaza pegajosa sobre la cual se desarrolla la negrilla o tiznado.',
    sintomas: 'Escudos oscuros con forma de H en ramas y hojas, presencia de melaza brillante y pegajosa, y una capa de polvo negro (negrilla) que cubre las hojas.',
    condiciones: 'Copas densas y sombrías, alta humedad ambiental y temperaturas templadas. Es sensible al calor seco del verano extremo.',
    tratamiento_quimico: 'Tratamientos localizados con Piriproxifen o Spirotetramat durante la máxima eclosión de larvas móviles en verano.',
    tratamiento_organico: 'Podas de ventilación para facilitar la entrada de luz solar, lavados de melaza con jabón potásico al 1-2%, y protección de mariquitas depredadoras.',
    imagen_referencia_url: '/images/cochinilla_tiznada.png',
    meses_riesgo: ['Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre'],
  },
  {
    nombre: 'Repilo del olivo (Spilocaea oleagina)',
    descripcion: 'Spilocaea oleagina. Hongo fitopatógeno muy extendido que ataca principalmente a las hojas del olivo, provocando una severa defoliación y debilitamiento del árbol.',
    sintomas: 'Manchas circulares oscuras rodeadas por una aureola amarilla en el haz de las hojas, desecación foliar y posterior caída masiva de hojas.',
    condiciones: 'Humedad relativa muy alta (lluvias) y temperaturas suaves (15-20°C). Típico de otoño y primavera.',
    tratamiento_quimico: 'Aplicación de fungicidas de síntesis como Difenoconazol, Tebuconazol o Kresoxim-metil durante periodos de alta presión de infección.',
    tratamiento_organico: 'Tratamientos preventivos con compuestos de cobre (oxicloruro o hidróxido de cobre) antes de lluvias persistentes, y eliminación de hojas caídas del suelo.',
    imagen_referencia_url: '/images/repilo_olivo.png',
    meses_riesgo: ['Febrero', 'Marzo', 'Abril', 'Octubre', 'Noviembre', 'Diciembre'],
  },
  {
    nombre: 'Hoja Sana',
    descripcion: 'Estado óptimo del follaje del olivo. El color verde brillante y la turgencia indican un equilibrio nutricional y la ausencia de fitopatógenos o insectos plaga.',
    sintomas: 'Hojas limpias, sin manchas ni picaduras, color verde uniforme y correcto desarrollo de brotes nuevos.',
    condiciones: 'Buenas prácticas culturales, riego adecuado y equilibrado, podas regulares de aclareo y nutrición óptima del suelo.',
    tratamiento_quimico: 'No se requiere ningún tratamiento químico ni fitosanitario.',
    tratamiento_organico: 'Mantenimiento del abonado orgánico, riego sin encharcar y monitoreo regular preventivo cada 15 días.',
    imagen_referencia_url: '/images/hoja_sana.png',
    meses_riesgo: [],
  },
]

function crearRespuestaError(mensaje, status = CODIGOS_HTTP.BAD_REQUEST) {
  return Response.json({ datos: null, error: mensaje }, { status })
}

function crearRespuestaExitosa(datos, status = CODIGOS_HTTP.OK) {
  return Response.json({ datos, error: null }, { status })
}

async function inicializarClienteAutenticado(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No autorizado. Se requiere token Bearer.', status: CODIGOS_HTTP.UNAUTHORIZED }
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

  const { data: { user }, error: authError } = await userSupabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Token inválido o sesión expirada.', status: CODIGOS_HTTP.UNAUTHORIZED }
  }

  return { userSupabase, user }
}

async function verificarRolAdmin(userSupabase, userId) {
  const { data: perfil, error: errorPerfil } = await userSupabase
    .from('usuarios')
    .select('rol')
    .eq('id', userId)
    .single()

  return !errorPerfil && perfil && perfil.rol === 'admin'
}

/**
 * Consulta y devuelve el catálogo completo de plagas con siembra automática.
 */
export async function GET(request) {
  try {
    const authResult = await inicializarClienteAutenticado(request)
    if (authResult.error) {
      return crearRespuestaError(authResult.error, authResult.status)
    }

    const { userSupabase } = authResult

    const { data: plagasExistentes, error: selectError } = await userSupabase
      .from('plagas_catalogo')
      .select('*')

    if (selectError) {
      return crearRespuestaError('No se pudieron recuperar los datos del catálogo.', CODIGOS_HTTP.INTERNAL_ERROR)
    }

    if ((!plagasExistentes || plagasExistentes.length === 0) && await verificarRolAdmin(userSupabase, authResult.user.id)) {
      const { data: plagasInsertadas, error: insertError } = await userSupabase
        .from('plagas_catalogo')
        .insert(PLAGAS_PREDEFINIDAS)
        .select()

      if (insertError) {
        return crearRespuestaError('Error al inicializar el catálogo de plagas.', CODIGOS_HTTP.INTERNAL_ERROR)
      }

      return crearRespuestaExitosa(plagasInsertadas)
    }

    return crearRespuestaExitosa(plagasExistentes)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error inesperado al procesar el catálogo.'
    return crearRespuestaError(mensaje, CODIGOS_HTTP.INTERNAL_ERROR)
  }
}

/**
 * Actualiza una ficha técnica de plaga (Solo administradores).
 */
export async function PUT(request) {
  try {
    const authResult = await inicializarClienteAutenticado(request)
    if (authResult.error) {
      return crearRespuestaError(authResult.error, authResult.status)
    }

    const { userSupabase, user } = authResult

    const esAdmin = await verificarRolAdmin(userSupabase, user.id)
    if (!esAdmin) {
      return crearRespuestaError('No autorizado. Se requiere rol de administrador para modificar el catálogo.', CODIGOS_HTTP.FORBIDDEN)
    }

    const body = await request.json()
    const {
      id,
      nombre,
      descripcion,
      sintomas,
      condiciones,
      tratamiento_quimico,
      tratamiento_organico,
      meses_riesgo,
      imagen_referencia_url,
    } = body

    if (!id || !nombre || !descripcion || !sintomas || !condiciones || !tratamiento_quimico || !tratamiento_organico) {
      return crearRespuestaError('Todos los campos básicos son obligatorios para actualizar la plaga.', CODIGOS_HTTP.BAD_REQUEST)
    }

    const { data: plagaActualizada, error: updateError } = await userSupabase
      .from('plagas_catalogo')
      .update({
        nombre,
        descripcion,
        sintomas,
        condiciones,
        tratamiento_quimico,
        tratamiento_organico,
        meses_riesgo: meses_riesgo || [],
        imagen_referencia_url,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return crearRespuestaError('No se pudo guardar la información actualizada en el catálogo.', CODIGOS_HTTP.INTERNAL_ERROR)
    }

    return crearRespuestaExitosa(plagaActualizada)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error inesperado al actualizar el catálogo.'
    return crearRespuestaError(mensaje, CODIGOS_HTTP.INTERNAL_ERROR)
  }
}

/**
 * Inserta una nueva ficha técnica de plaga (Solo administradores).
 */
export async function POST(request) {
  try {
    const authResult = await inicializarClienteAutenticado(request)
    if (authResult.error) {
      return crearRespuestaError(authResult.error, authResult.status)
    }

    const { userSupabase, user } = authResult

    const esAdmin = await verificarRolAdmin(userSupabase, user.id)
    if (!esAdmin) {
      return crearRespuestaError('No autorizado. Se requiere rol de administrador para insertar en el catálogo.', CODIGOS_HTTP.FORBIDDEN)
    }

    const body = await request.json()
    const {
      nombre,
      descripcion,
      sintomas,
      condiciones,
      tratamiento_quimico,
      tratamiento_organico,
      meses_riesgo,
      imagen_referencia_url,
    } = body

    if (!nombre || !descripcion || !sintomas || !condiciones || !tratamiento_quimico || !tratamiento_organico) {
      return crearRespuestaError('Todos los campos básicos son obligatorios para crear la plaga.', CODIGOS_HTTP.BAD_REQUEST)
    }

    const { data: plagaInsertada, error: insertError } = await userSupabase
      .from('plagas_catalogo')
      .insert({
        nombre,
        descripcion,
        sintomas,
        condiciones,
        tratamiento_quimico,
        tratamiento_organico,
        meses_riesgo: meses_riesgo || [],
        imagen_referencia_url: imagen_referencia_url || null,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.message && insertError.message.includes('duplicate key')) {
        return crearRespuestaError('Ya existe una plaga registrada con ese nombre en el catálogo.', CODIGOS_HTTP.BAD_REQUEST)
      }
      return crearRespuestaError('No se pudo guardar la nueva plaga en el catálogo.', CODIGOS_HTTP.INTERNAL_ERROR)
    }

    return crearRespuestaExitosa(plagaInsertada, CODIGOS_HTTP.CREADO)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error inesperado al registrar la plaga.'
    return crearRespuestaError(mensaje, CODIGOS_HTTP.INTERNAL_ERROR)
  }
}

/**
 * Elimina una ficha técnica de plaga del catálogo (Solo administradores).
 */
export async function DELETE(request) {
  try {
    const authResult = await inicializarClienteAutenticado(request)
    if (authResult.error) {
      return crearRespuestaError(authResult.error, authResult.status)
    }

    const { userSupabase, user } = authResult

    const esAdmin = await verificarRolAdmin(userSupabase, user.id)
    if (!esAdmin) {
      return crearRespuestaError('No autorizado. Se requiere rol de administrador para eliminar del catálogo.', CODIGOS_HTTP.FORBIDDEN)
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return crearRespuestaError('Falta el identificador de la plaga a eliminar.', CODIGOS_HTTP.BAD_REQUEST)
    }

    const { error: deleteError } = await userSupabase
      .from('plagas_catalogo')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return crearRespuestaError('No se pudo eliminar la plaga seleccionada del catálogo.', CODIGOS_HTTP.INTERNAL_ERROR)
    }

    return crearRespuestaExitosa({ id })
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error inesperado al eliminar la plaga del catálogo.'
    return crearRespuestaError(mensaje, CODIGOS_HTTP.INTERNAL_ERROR)
  }
}
