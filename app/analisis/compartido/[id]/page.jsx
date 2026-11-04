// ============================================================
// ARCHIVO: app/analisis/compartido/[id]/page.jsx
// MODULO: Analisis
// DESCRIPCION: Pagina publica para la visualizacion de un diagnostico
//              compartido. No requiere autenticacion.
// SPRINT: 4
// RF: RF-006
// ============================================================

'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Sprout, AlertCircle, Info, ShieldAlert, Sparkles } from 'lucide-react'

// Importaciones de componentes de UI compartidos
import ClsAnalisisNivelConfianza from '@/components/analisis/AnalisisNivelConfianza'
import ClsAnalisisNivelSeveridad from '@/components/analisis/AnalisisNivelSeveridad'
import ClsAnalisisRecomendacionTratamiento from '@/components/analisis/AnalisisRecomendacionTratamiento'

function ClsCompartidoPage({ params }) {
  // Desempaquetar la promesa de params requerida en Next.js 15+
  const { id } = use(params)

  // Estados locales para el diagnostico compartido
  const [objAnalisis, setObjAnalisis] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [strError, setStrError] = useState(null)

  // Cargar la informacion publica del analisis desde la API
  useEffect(() => {
    async function cargarDiagnosticoPublico() {
      if (!id) return
      
      try {
        setCargando(true)
        setStrError(null)

        const res = await fetch(`/api/analisis/compartido/${id}`, {
          method: 'GET'
        })

        const resJson = await res.json()

        if (!res.ok || resJson.error) {
          throw new Error(resJson.error || 'No se pudo recuperar el reporte.')
        }

        setObjAnalisis(resJson.datos)
      } catch (error) {
        console.error('Error al cargar reporte compartido:', error)
        setStrError(error.message || 'Error de red al conectar con el servidor.')
      } finally {
        setCargando(false)
      }
    }

    cargarDiagnosticoPublico()
  }, [id])

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Sprout className="w-12 h-12 text-olive-500 animate-bounce" />
        <p className="mt-4 text-sm font-medium text-olive-750">
          Cargando diagnóstico compartido...
        </p>
      </div>
    )
  }

  if (strError || !objAnalisis) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-red-50 p-8 rounded-2xl border border-red-150 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-650 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-red-950">Reporte no disponible</h3>
          <p className="text-xs text-red-750 leading-relaxed">
            {strError || 'El diagnóstico solicitado no existe o ha sido retirado por su propietario.'}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-olive-500 hover:bg-olive-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              Registrarse en OlivoScan
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] bg-olive-50/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Banner de Aviso de Reporte Público */}
        <div className="flex items-center gap-3 p-4 bg-olive-50 text-olive-900 border border-olive-200 rounded-xl text-xs sm:text-sm font-medium">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-olive-700" />
          <span>
            Estás visualizando un **Reporte Fitosanitario Compartido**. Este enlace es público y está optimizado para consulta de especialistas y agrónomos.
          </span>
        </div>

        {/* Encabezado Principal */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-olive-950 sm:text-4xl">
            Diagnóstico Fitosanitario
          </h1>
          <p className="text-xs sm:text-sm text-olive-650">
            Identificación de plaga mediante Inteligencia Artificial y recomendaciones de tratamiento.
          </p>
        </div>

        {/* Contenido del Diagnostico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          
          {/* Lado Izquierdo: Visualización de Hoja */}
          <div className="flex flex-col gap-4 w-full">
            <div className="relative aspect-square w-full bg-white rounded-2xl overflow-hidden border border-olive-200 shadow-sm">
              <img
                src={objAnalisis.imagen_url}
                alt="Hoja de olivo analizada"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2 p-4 bg-white text-olive-700 border border-olive-150 rounded-xl text-xs leading-relaxed shadow-sm">
              <Info className="w-4 h-4 flex-shrink-0 text-olive-650" />
              <span>
                Análisis realizado utilizando el modelo de clasificación <strong>{objAnalisis.modelo_version}</strong>.
              </span>
            </div>
          </div>

          {/* Lado Derecho: Indicadores de Salud */}
          <div className="flex flex-col gap-6 w-full bg-white p-6 rounded-2xl border border-olive-100 shadow-glass">
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-olive-400">
                Resultado Detectado
              </span>
              <h3 className="text-2xl font-bold text-olive-950">
                {objAnalisis.plaga_corregida || objAnalisis.plaga_detectada}
              </h3>
              {objAnalisis.plaga_corregida && (
                <span className="inline-block text-[9px] font-bold bg-earth-50 text-earth-700 border border-earth-150 px-2 py-0.5 rounded-full mt-1">
                  Plaga corregida por el agricultor
                </span>
              )}
            </div>

            <hr className="border-olive-100" />

            {/* Confianza */}
            <ClsAnalisisNivelConfianza confianza={Number(objAnalisis.confianza)} />

            <hr className="border-olive-100" />

            {/* Severidad */}
            <ClsAnalisisNivelSeveridad severidad={objAnalisis.severidad} />

            <hr className="border-olive-100" />

            {/* Descripción */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-olive-850">
                Detalle y Síntomas
              </h4>
              <p className="text-xs text-olive-750 leading-relaxed bg-olive-50/30 p-3 rounded-lg border border-olive-100/50">
                {objAnalisis.descripcion || 'Sin descripción adicional disponible.'}
              </p>
            </div>

            {/* Notas del Agricultor */}
            {objAnalisis.notas && (
              <>
                <hr className="border-olive-100" />
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-olive-850">
                    Notas de Campo Adjuntas
                  </h4>
                  <p className="text-xs text-olive-750 leading-relaxed italic bg-olive-50/30 p-3 rounded-lg border border-olive-100/50">
                    {objAnalisis.notas}
                  </p>
                </div>
              </>
            )}

          </div>

        </div>

        {/* Recomendación de Tratamiento */}
        {objAnalisis.recomendacion && (
          <ClsAnalisisRecomendacionTratamiento recomendacionRaw={objAnalisis.recomendacion} />
        )}

        {/* Bloque CTA para invitar a usar la plataforma */}
        <div className="bg-white p-6 rounded-2xl border border-olive-100 shadow-glass text-center space-y-4 max-w-2xl mx-auto">
          <div className="flex justify-center">
            <div className="p-2.5 bg-olive-50 text-olive-650 rounded-xl border border-olive-100">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-olive-950">
              ¿Quieres diagnosticar la salud de tus propios olivos?
            </h3>
            <p className="text-xs text-olive-650 max-w-md mx-auto">
              Regístrate gratis en OlivoScan para subir fotos de tus cultivos, almacenar un historial completo de análisis y recibir alertas estacionales personalizadas.
            </p>
          </div>
          <div>
            <Link
              href="/login"
              className="inline-flex px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Comenzar Ahora Gratis
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ClsCompartidoPage
