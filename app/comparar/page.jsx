// ============================================================
// ARCHIVO: app/comparar/page.jsx
// MODULO: Comparar
// DESCRIPCION: Pagina principal del modulo de comparacion.
//              Orquesta la seleccion de un analisis previo
//              y la captura/subida de una foto en tiempo real,
//              calculando el nuevo diagnostico e integrando el
//              analisis de evolucion.
// SPRINT: Adicional (Comparador Evolutivo)
// RF: RF-001, RF-002, RF-003, RF-005
// ============================================================

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout, Activity, AlertCircle, Loader2 } from 'lucide-react'

// Hooks de negocio
import { useAuth } from '@/hooks/useAuth'
import { useHistorial } from '@/hooks/useHistorial'
import { useAnalisis } from '@/hooks/useAnalisis'

// Componentes del modulo
import ClsCompararSeleccion from '@/components/comparar/CompararSeleccion'
import ClsCompararResultado from '@/components/comparar/CompararResultado'
import ClsAnalisisSubirImagen from '@/components/analisis/AnalisisSubirImagen'

function ClsCompararPage() {
  const { objUsuario, cargando: cargandoUsuario } = useAuth()
  const router = useRouter()

  // Cargar lista de analisis previos
  const { cargando: cargandoHistorial, errorHistorial, objAnalisisLista, cargarHistorial } = useHistorial()

  // Procesamiento del nuevo analisis
  const { cargando: analizando, errorAnalisis, crearAnalisis, guardarFeedback } = useAnalisis()

  // Estados locales para la orquestacion de etapas
  // Etapas validas: 'seleccionar_historial', 'subir_nueva', 'analizando', 'resultado'
  const [etapa, setEtapa] = useState('seleccionar_historial')
  const [objAnalisisReferencia, setObjAnalisisReferencia] = useState(null)
  const [objAnalisisNuevo, setObjAnalisisNuevo] = useState(null)
  const [errorLocal, setErrorLocal] = useState(null)

  // Proteger la ruta redireccionando si no existe sesion
  useEffect(() => {
    if (!cargandoUsuario && !objUsuario) {
      router.push('/login')
    }
  }, [objUsuario, cargandoUsuario, router])

  // Cargar el historial tras verificar autenticacion
  useEffect(() => {
    if (objUsuario) {
      cargarHistorial().catch(() => {})
    }
  }, [objUsuario, cargarHistorial])

  // Manejar seleccion de analisis de referencia
  function alSeleccionarReferencia(objAnalisis) {
    setObjAnalisisReferencia(objAnalisis)
    setEtapa('subir_nueva')
    setErrorLocal(null)
  }

  // Enviar la nueva imagen capturada para diagnostico
  async function alSeleccionarNuevaImagen(objArchivo) {
    setErrorLocal(null)
    setEtapa('analizando')

    try {
      // Disparar la creacion del analisis (subida y modelo de IA)
      const objResultado = await crearAnalisis(objArchivo)

      if (objResultado) {
        setObjAnalisisNuevo(objResultado)
        setEtapa('resultado')
      } else {
        throw new Error('No se recibieron datos validos del diagnostico de seguimiento.')
      }
    } catch (error) {
      console.error('Error al realizar analisis comparativo:', error)
      setErrorLocal(error.message || 'No se pudo analizar la imagen. Intente de nuevo.')
      setEtapa('subir_nueva')
    }
  }

  // Guardar las notas/feedback en el nuevo analisis
  async function alGuardarFeedbackSeguimiento(plagaCorregida, notas) {
    setErrorLocal(null)
    try {
      if (!objAnalisisNuevo) return
      await guardarFeedback(objAnalisisNuevo.id, plagaCorregida, notas)
    } catch (error) {
      console.error('Error al guardar notas de seguimiento:', error)
      setErrorLocal('No se pudieron guardar las notas. Intente nuevamente en el historial.')
      throw error;
    }
  }

  // Reiniciar flujo completo para otra comparacion
  function alReiniciarComparacion() {
    setObjAnalisisReferencia(null)
    setObjAnalisisNuevo(null)
    setErrorLocal(null)
    setEtapa('seleccionar_historial')
  }

  // Spinner de carga de sesion
  if (cargandoUsuario || !objUsuario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Sprout className="w-12 h-12 text-olive-500 animate-bounce" />
        <p className="mt-4 text-sm font-medium text-olive-750">
          Cargando módulo de comparación...
        </p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] bg-olive-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Encabezado Dinamico */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-olive-950 sm:text-4xl flex items-center justify-center gap-3">
            <Activity className="w-8 h-8 text-olive-600 animate-pulse" />
            Comparador de Evolución
          </h1>
          <p className="text-sm sm:text-base text-olive-700 max-w-xl mx-auto">
            Evalúe el progreso de sus olivos comparando diagnósticos anteriores con fotografías tomadas en tiempo real.
          </p>
        </div>

        {/* Visualizacion de Errores */}
        {(errorLocal || errorHistorial || errorAnalisis) && (
          <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 border border-red-100 rounded-xl text-sm font-medium max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-650" />
            <span>{errorLocal || errorHistorial || errorAnalisis}</span>
          </div>
        )}

        {/* ========================================== */}
        {/* RENDERIZADO DE ETAPAS DEL FLUJO           */}
        {/* ========================================== */}

        {/* Etapa 1: Seleccionar Referencia (Historial) */}
        {etapa === 'seleccionar_historial' && (
          <div className="space-y-4">
            <div className="text-left space-y-1 max-w-2xl">
              <h3 className="text-lg font-bold text-olive-950">
                Paso 1: Seleccione una muestra del historial
              </h3>
              <p className="text-xs text-olive-650">
                Esta muestra servirá como la base inicial de comparación para medir la recuperación o evolución.
              </p>
            </div>
            {cargandoHistorial ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white border border-olive-100 rounded-2xl shadow-glass">
                <Loader2 className="w-8 h-8 text-olive-500 animate-spin" />
                <p className="mt-3 text-xs font-semibold text-olive-650">
                  Cargando registros históricos...
                </p>
              </div>
            ) : (
              <ClsCompararSeleccion
                objAnalisisLista={objAnalisisLista}
                alSeleccionarReferencia={alSeleccionarReferencia}
              />
            )}
          </div>
        )}

        {/* Etapa 2: Subir Nueva Imagen (Seguimiento) */}
        {etapa === 'subir_nueva' && objAnalisisReferencia && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="text-left space-y-1">
                <h3 className="text-lg font-bold text-olive-950">
                  Paso 2: Suba o capture la nueva muestra
                </h3>
                <p className="text-xs text-olive-650">
                  Compare el estado actual contra la muestra tomada el {new Date(objAnalisisReferencia.creado_en).toLocaleDateString('es-ES')}.
                </p>
              </div>
              <button
                type="button"
                onClick={alReiniciarComparacion}
                className="text-xs font-bold text-olive-600 hover:text-olive-800 transition-colors cursor-pointer"
              >
                Cambiar referencia
              </button>
            </div>

            {/* Vista previa compacta de la referencia seleccionada a un lado */}
            <div className="bg-white p-4 rounded-2xl border border-olive-100 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-olive-50 overflow-hidden border border-olive-150 flex-shrink-0">
                <img
                  src={objAnalisisReferencia.imagen_url}
                  alt="Referencia"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-olive-400 block">Referencia Seleccionada</span>
                <h4 className="text-xs font-bold text-olive-950 truncate">
                  {objAnalisisReferencia.plaga_corregida || objAnalisisReferencia.plaga_detectada}
                </h4>
                <p className="text-[10px] text-olive-600">
                  Severidad: {objAnalisisReferencia.severidad.toUpperCase()} - {new Date(objAnalisisReferencia.creado_en).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            <ClsAnalisisSubirImagen onImagenSeleccionada={alSeleccionarNuevaImagen} />
          </div>
        )}

        {/* Etapa 3: Procesando Diagnóstico de Seguimiento */}
        {etapa === 'analizando' && (
          <div className="flex flex-col items-center justify-center gap-6 w-full max-w-2xl mx-auto h-80 bg-white rounded-2xl border border-olive-100 shadow-glass">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-olive-600 animate-spin" />
              <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-olive-500" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-olive-950">
                Analizando nueva muestra...
              </h3>
              <p className="text-xs text-olive-600 max-w-xs mx-auto leading-relaxed">
                Subiendo la fotografía a Cloudinary y ejecutando la detección del modelo de IA. Esto puede tardar unos segundos.
              </p>
            </div>
          </div>
        )}

        {/* Etapa 4: Resultado Comparativo Lado a Lado */}
        {etapa === 'resultado' && objAnalisisReferencia && objAnalisisNuevo && (
          <ClsCompararResultado
            objAnalisisOriginal={objAnalisisReferencia}
            objAnalisisNuevo={objAnalisisNuevo}
            alGuardarNotas={alGuardarFeedbackSeguimiento}
            cargandoGuardado={analizando}
            alReiniciar={alReiniciarComparacion}
          />
        )}

      </div>
    </div>
  )
}

export default ClsCompararPage
