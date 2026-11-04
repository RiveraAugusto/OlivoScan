// ============================================================
// NOMBRE OBJETO: app/api/analisis/route.js
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-01, RF-02, RF-03
// DESCRIPCION: Controlador API Route (POST) que recibe el archivo binario
//              de imagen de la hoja de olivo, valida autenticación y tipo
//              MIME, sube a Cloudinary/local, invoca modelo de IA y
//              persiste el resultado en Supabase.
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { subirImagen, eliminarImagen } from '@/lib/cloudinary'
import { analizarImagenConGemini } from '@/lib/gemini'

const CODIGOS_HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500,
}

const MODELO_VERSION_DEFECTO = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
const TIPOS_IMAGEN = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAXIMO_IMAGEN_BYTES = 10 * 1024 * 1024

function crearRespuestaError(mensaje, status = CODIGOS_HTTP.BAD_REQUEST) {
  return Response.json({ datos: null, error: mensaje }, { status })
}

function crearRespuestaExitosa(datos, status = CODIGOS_HTTP.OK) {
  return Response.json({ datos, error: null }, { status })
}

/**
 * Procesa la imagen foliar enviada por el agricultor, ejecuta inferencia de IA y almacena el análisis.
 * @param {Request} request - Petición HTTP entrante multipart/form-data con token Bearer.
 * @returns {Promise<Response>} Respuesta JSON con el registro del diagnóstico creado.
 */
export async function POST(request) {
  try {
    // Fail Fast: Validación de cabecera de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return crearRespuestaError('No autorizado. Se requiere token Bearer.', CODIGOS_HTTP.UNAUTHORIZED)
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
      return crearRespuestaError('Token inválido o sesión expirada.', CODIGOS_HTTP.UNAUTHORIZED)
    }

    // Fail Fast: Validación de archivo en FormData
    const formData = await request.formData()
    const archivoImagen = formData.get('imagen')

    if (!archivoImagen || !(archivoImagen instanceof File)) {
      return crearRespuestaError('No se subió ninguna imagen válida.', CODIGOS_HTTP.BAD_REQUEST)
    }

    if (!TIPOS_IMAGEN.has(archivoImagen.type)) {
      return crearRespuestaError('Seleccione una imagen JPEG, PNG o WebP.', CODIGOS_HTTP.BAD_REQUEST)
    }
    if (!archivoImagen.size || archivoImagen.size > MAXIMO_IMAGEN_BYTES) {
      return crearRespuestaError('La imagen debe contener datos y pesar como máximo 10 MB.', CODIGOS_HTTP.BAD_REQUEST)
    }

    const arrayBuffer = await archivoImagen.arrayBuffer()
    const bufferArchivo = Buffer.from(arrayBuffer)
    const tipoMime = archivoImagen.type

    // Analizar la imagen con Gemini IA
    const diagnosticoIA = await analizarImagenConGemini(bufferArchivo, tipoMime)

    // Fail Fast: Verificar si la imagen pertenece a la especie olivo
    if (!diagnosticoIA.es_olivo) {
      return crearRespuestaError(
        diagnosticoIA.mensaje_error || 'La imagen no corresponde a una hoja, rama o fruto de olivo.',
        CODIGOS_HTTP.BAD_REQUEST
      )
    }

    // Guardar la imagen solo despues de validar que corresponde a un olivo.
    const urlImagen = await subirImagen(bufferArchivo, tipoMime)

    const plagaDetectada = diagnosticoIA.tiene_plaga && diagnosticoIA.diagnostico?.plaga_nombre_comun
      ? diagnosticoIA.diagnostico.plaga_nombre_comun
      : 'Hoja Sana'

    const confianzaVal = diagnosticoIA.diagnostico?.porcentaje_certeza !== undefined
      ? diagnosticoIA.diagnostico.porcentaje_certeza
      : 0

    let severidadMapeada = 'leve'
    const nivelSeveridad = diagnosticoIA.diagnostico?.nivel_severidad
    if (nivelSeveridad === 'Moderado') {
      severidadMapeada = 'moderado'
    } else if (nivelSeveridad === 'Severo') {
      severidadMapeada = 'grave'
    }

    const descripcionVal = diagnosticoIA.diagnostico?.sintomas_observados || 'Sin síntomas observados o diagnóstico de hoja sana.'

    const cultural = diagnosticoIA.recomendaciones?.cultural_mecanico || 'No se detallan controles culturales específicos.'
    const biologico = diagnosticoIA.recomendaciones?.biologico_ecologico || 'No se detallan controles biológicos específicos.'
    const quimico = diagnosticoIA.recomendaciones?.quimico_senasa || 'No se justifica control químico sintético.'

    const recomendacionMarkdown = `#### Tratamiento Organico y Preventivo
- **Control Cultural y Mecánico**: ${cultural}
- **Control Biológico y Ecológico**: ${biologico}

#### Tratamiento Quimico
- **Control Químico (SENASA)**: ${quimico}

#### Advertencias y Seguridad
- **Regulaciones y Seguridad**: Aplicar bajo supervisión de un agrónomo colegiado. Respetar los periodos de carencia e intervalos de seguridad vigentes establecidos por el Servicio Nacional de Sanidad Agraria (SENASA) de Perú. Usar equipo de protección.`

    const { data: nuevoAnalisis, error: dbError } = await userSupabase
      .from('analisis')
      .insert({
        usuario_id: user.id,
        imagen_url: urlImagen,
        plaga_detectada: plagaDetectada,
        confianza: confianzaVal,
        severidad: severidadMapeada,
        descripcion: descripcionVal,
        recomendacion: recomendacionMarkdown,
        modelo_version: MODELO_VERSION_DEFECTO,
      })
      .select()
      .single()

    if (dbError) {
      await eliminarImagen(urlImagen)
      return crearRespuestaError('No se pudo registrar el análisis en la base de datos.', CODIGOS_HTTP.INTERNAL_ERROR)
    }

    // Insertar notificaciones asociadas
    const notificaciones = [
      {
        usuario_id: user.id,
        mensaje: `Análisis de salud foliar completado: se ha detectado ${plagaDetectada} con nivel de severidad ${severidadMapeada}.`,
        tipo: 'analisis_completo',
        leida: false,
      },
    ]

    if (severidadMapeada === 'grave') {
      notificaciones.push({
        usuario_id: user.id,
        mensaje: `Alerta de riesgo: se ha detectado la plaga ${plagaDetectada} con nivel de severidad grave. Tome medidas inmediatas.`,
        tipo: 'alerta',
        leida: false,
      })
    }

    // Insertar notificaciones asociadas sin bloquear el resultado en caso de advertencia
    try {
      const { error: errorNotificacion } = await userSupabase.from('notificaciones').insert(notificaciones)
      if (errorNotificacion) console.warn('No se pudieron registrar las notificaciones:', errorNotificacion.code)
    } catch (errNotif) {
      console.warn('Advertencia no bloqueante al registrar notificaciones:', errNotif)
    }

    return crearRespuestaExitosa(nuevoAnalisis)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Ocurrió un error inesperado al procesar el análisis.'
    return crearRespuestaError(mensaje, CODIGOS_HTTP.INTERNAL_ERROR)
  }
}
