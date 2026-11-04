// ============================================================
// NOMBRE OBJETO: components/historial/HistorialComparacion.jsx
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-05 (Historial de análisis con filtros y comparación)
// DESCRIPCION: Panel para comparar lado a lado dos diagnósticos
//              fitosanitarios organizados de forma cronológica.
// ============================================================

import React from 'react'
import { X, Calendar, Activity, AlertTriangle } from 'lucide-react'

export const ESTILOS_BADGE_SEVERIDAD = {
  leve: 'bg-green-100 text-green-800 border-green-200',
  moderado: 'bg-amber-100 text-amber-800 border-amber-200',
  grave: 'bg-red-100 text-red-800 border-red-200'
}

export const LIMITE_MAXIMO_COMPARACION = 2

/**
 * Formatea una fecha ISO a una representación localizada corta en español.
 *
 * @param {string} fechaIso - Cadena de fecha en formato ISO.
 * @returns {string} Fecha formateada (ej. 24 ago 2026).
 */
export function formatearFechaComparacion(fechaIso) {
  return new Date(fechaIso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Componente para comparar lado a lado dos diagnósticos fitosanitarios
 * ordenados cronológicamente para evaluar la evolución de la salud foliar.
 *
 * @param {Object} props
 * @param {Object} [props.primerAnalisis] - Primer diagnóstico seleccionado.
 * @param {Object} [props.objAnalisis1] - Prop retrocompatible con primer diagnóstico.
 * @param {Object} [props.segundoAnalisis] - Segundo diagnóstico seleccionado.
 * @param {Object} [props.objAnalisis2] - Prop retrocompatible con segundo diagnóstico.
 * @param {() => void} [props.onCerrar] - Callback para cerrar el panel de comparación.
 * @param {() => void} [props.alCerrar] - Prop retrocompatible de cierre.
 */
export default function HistorialComparacion({
  primerAnalisis,
  objAnalisis1,
  segundoAnalisis,
  objAnalisis2,
  onCerrar,
  alCerrar
}) {
  const analisis1 = primerAnalisis || objAnalisis1
  const analisis2 = segundoAnalisis || objAnalisis2
  const cerrarFn = onCerrar || alCerrar

  // Fail Fast: Asegurar existencia de ambos análisis
  if (!analisis1?.id || !analisis2?.id) return null

  const marcaTiempo1 = new Date(analisis1.creado_en).getTime()
  const marcaTiempo2 = new Date(analisis2.creado_en).getTime()

  const analisisInicial = marcaTiempo1 <= marcaTiempo2 ? analisis1 : analisis2
  const analisisSeguimiento = marcaTiempo1 <= marcaTiempo2 ? analisis2 : analisis1

  const fechaInicialFormateada = formatearFechaComparacion(analisisInicial.creado_en)
  const fechaSeguimientoFormateada = formatearFechaComparacion(analisisSeguimiento.creado_en)

  const plagaInicial = analisisInicial.plaga_corregida || analisisInicial.plaga_detectada
  const plagaSeguimiento = analisisSeguimiento.plaga_corregida || analisisSeguimiento.plaga_detectada

  return (
    <div className="bg-white rounded-2xl border border-olive-200 shadow-lg overflow-hidden animate-fadeIn">
      <div className="bg-olive-800 px-6 py-4 flex items-center justify-between text-white">
        <div className="space-y-0.5">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-olive-200" />
            Comparación Visual y Evolutiva
          </h3>
          <p className="text-[11px] text-olive-200">
            Analizando cambios foliares registrados en distintas fechas de evaluación.
          </p>
        </div>
        <button
          type="button"
          onClick={cerrarFn}
          className="p-1.5 hover:bg-olive-750 text-white rounded-lg transition-colors cursor-pointer"
          title="Cerrar comparación"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-olive-100">
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-olive-400 bg-olive-50 px-2 py-0.5 rounded border border-olive-100">
                Punto Inicial
              </span>
              <span className="text-xs font-bold text-olive-650 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {fechaInicialFormateada}
              </span>
            </div>

            <div className="aspect-square md:aspect-[4/3] max-h-72 w-full rounded-xl bg-olive-50 border border-olive-150 overflow-hidden shadow-sm">
              <img
                src={analisisInicial.imagen_url}
                alt="Estado Anterior"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-olive-400 uppercase tracking-widest block">
                Resultado
              </span>
              <h4 className="text-lg font-bold text-olive-950">
                {plagaInicial}
              </h4>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                  ESTILOS_BADGE_SEVERIDAD[analisisInicial.severidad] || 'bg-gray-100 text-gray-800'
                }`}>
                  Severidad {analisisInicial.severidad}
                </span>
                <span className="text-[11px] text-olive-600 font-semibold">
                  Confianza: {Number(analisisInicial.confianza).toFixed(1)}%
                </span>
              </div>
            </div>

            <hr className="border-olive-50" />

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-olive-400 uppercase tracking-widest block">
                Notas de campo
              </span>
              <p className="text-xs text-olive-750 leading-relaxed italic bg-olive-50/20 p-2.5 rounded-lg border border-olive-50">
                {analisisInicial.notas || 'Sin notas registradas.'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 md:pt-0 md:pl-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-150">
                Seguimiento
              </span>
              <span className="text-xs font-bold text-olive-650 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {fechaSeguimientoFormateada}
              </span>
            </div>

            <div className="aspect-square md:aspect-[4/3] max-h-72 w-full rounded-xl bg-olive-50 border border-olive-150 overflow-hidden shadow-sm">
              <img
                src={analisisSeguimiento.imagen_url}
                alt="Estado Reciente"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-olive-400 uppercase tracking-widest block">
                Resultado
              </span>
              <h4 className="text-lg font-bold text-olive-950">
                {plagaSeguimiento}
              </h4>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                  ESTILOS_BADGE_SEVERIDAD[analisisSeguimiento.severidad] || 'bg-gray-100 text-gray-800'
                }`}>
                  Severidad {analisisSeguimiento.severidad}
                </span>
                <span className="text-[11px] text-olive-600 font-semibold">
                  Confianza: {Number(analisisSeguimiento.confianza).toFixed(1)}%
                </span>
              </div>
            </div>

            <hr className="border-olive-50" />

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-olive-400 uppercase tracking-widest block">
                Notas de campo
              </span>
              <p className="text-xs text-olive-750 leading-relaxed italic bg-olive-50/20 p-2.5 rounded-lg border border-olive-50">
                {analisisSeguimiento.notas || 'Sin notas registradas.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-olive-50/50 px-6 py-4 border-t border-olive-100 flex items-center gap-3 text-xs text-olive-750">
        <AlertTriangle className="w-4 h-4 text-olive-650 flex-shrink-0" />
        <span>
          Evaluando del <strong>{fechaInicialFormateada}</strong> al <strong>{fechaSeguimientoFormateada}</strong>:
          {plagaInicial === plagaSeguimiento
            ? ` La condición fitosanitaria se mantiene (${plagaInicial}). Verifique el cambio de severidad de ${analisisInicial.severidad.toUpperCase()} a ${analisisSeguimiento.severidad.toUpperCase()} para determinar la efectividad del tratamiento.`
            : ` Se observa transición de diagnóstico: varió de ${plagaInicial} a ${plagaSeguimiento}.`}
        </span>
      </div>
    </div>
  )
}
