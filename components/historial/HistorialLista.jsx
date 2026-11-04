// ============================================================
// NOMBRE OBJETO: components/historial/HistorialLista.jsx
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-05 (Historial de análisis con filtros y comparación)
// DESCRIPCION: Cuadrícula interactiva de diagnósticos con expansión
//              de detalles, exportación a PDF, enlace compartido y selección.
// ============================================================

import React, { useState } from 'react'
import { FileText, Share2, Trash2, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react'
import { generarPDF } from '@/lib/pdf'
import RecomendacionFormateada from '@/components/analisis/RecomendacionFormateada'
import { ESTILOS_BADGE_SEVERIDAD, LIMITE_MAXIMO_COMPARACION } from './HistorialComparacion'

const TIEMPO_VISIBILIDAD_AVISO_COPIADO_MS = 2000

/**
 * Grilla interactiva de diagnósticos fitosanitarios históricos.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.listaAnalisis] - Colección de análisis registrados.
 * @param {Array<Object>} [props.objAnalisisLista] - Prop retrocompatible de análisis.
 * @param {Array<string>} [props.idsSeleccionados] - Identificadores marcados para comparación.
 * @param {Array<string>} [props.objIdsSeleccionados] - Prop retrocompatible de ids.
 * @param {(ids: Array<string>) => void} [props.onCambiarSeleccionComparar] - Manejador de selección.
 * @param {(ids: Array<string>) => void} [props.alCambiarSeleccionComparar] - Prop retrocompatible de selección.
 * @param {(id: string) => Promise<void>} [props.onEliminar] - Callback de eliminación.
 * @param {(id: string) => Promise<void>} [props.alEliminar] - Prop retrocompatible de eliminación.
 * @param {string} [props.nombreUsuario='Agricultor'] - Nombre del titular para reportes PDF.
 */
export default function HistorialLista({
  listaAnalisis,
  objAnalisisLista,
  idsSeleccionados,
  objIdsSeleccionados,
  onCambiarSeleccionComparar,
  alCambiarSeleccionComparar,
  onEliminar,
  alEliminar,
  nombreUsuario = 'Agricultor'
}) {
  const lista = listaAnalisis || objAnalisisLista || []
  const seleccionados = idsSeleccionados || objIdsSeleccionados || []
  const fnCambiarSeleccion = onCambiarSeleccionComparar || alCambiarSeleccionComparar
  const fnEliminar = onEliminar || alEliminar

  const [idExpandido, setIdExpandido] = useState(null)
  const [idCopiaExitosa, setIdCopiaExitosa] = useState(null)
  const [idAnalisisAEliminar, setIdAnalisisAEliminar] = useState(null)

  function alternarExpansion(id) {
    setIdExpandido((previo) => (previo === id ? null : id))
  }

  function copiarEnlaceCompartido(id) {
    if (typeof window === 'undefined') return

    const urlCompartido = `${window.location.origin}/analisis/compartido/${id}`
    navigator.clipboard
      .writeText(urlCompartido)
      .then(() => {
        setIdCopiaExitosa(id)
        setTimeout(() => setIdCopiaExitosa(null), TIEMPO_VISIBILIDAD_AVISO_COPIADO_MS)
      })
      .catch(() => {})
  }

  function manejarCheckboxComparacion(id, marcado) {
    if (marcado) {
      if (seleccionados.length >= LIMITE_MAXIMO_COMPARACION) {
        return
      }
      if (fnCambiarSeleccion) {
        fnCambiarSeleccion([...seleccionados, id])
      }
    } else {
      if (fnCambiarSeleccion) {
        fnCambiarSeleccion(seleccionados.filter((item) => item !== id))
      }
    }
  }

  if (lista.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-olive-100 rounded-2xl shadow-glass space-y-3">
        <p className="text-sm font-semibold text-olive-500">
          No se encontraron diagnósticos registrados en tu historial.
        </p>
        <p className="text-xs text-olive-400">
          Intenta ajustar los criterios de los filtros o realiza un nuevo análisis desde el panel.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 w-full">
      {lista.map((analisis) => {
        const plagaNombre = analisis.plaga_corregida || analisis.plaga_detectada
        const estaExpandido = idExpandido === analisis.id
        const estaSeleccionado = seleccionados.includes(analisis.id)
        const seleccionBloqueada = !estaSeleccionado && seleccionados.length >= LIMITE_MAXIMO_COMPARACION

        const fechaFormateada = new Date(analisis.creado_en).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })

        return (
          <div
            key={analisis.id}
            className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md ${
              estaExpandido ? 'border-olive-300 ring-1 ring-olive-100' : 'border-olive-100'
            }`}
          >
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={estaSeleccionado}
                    disabled={seleccionBloqueada}
                    onChange={(e) => manejarCheckboxComparacion(analisis.id, e.target.checked)}
                    className="w-4.5 h-4.5 text-olive-550 border-olive-350 rounded-sm focus:ring-olive-500 cursor-pointer disabled:cursor-not-allowed"
                    title={seleccionBloqueada ? 'Máximo 2 análisis para comparar' : 'Seleccionar para comparar'}
                  />
                </div>

                <div className="w-16 h-16 rounded-xl bg-olive-50 border border-olive-150 overflow-hidden flex-shrink-0">
                  <img
                    src={analisis.imagen_url}
                    alt="Miniatura análisis"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-olive-950 break-words whitespace-normal leading-snug">
                      {plagaNombre}
                    </h4>
                    {analisis.plaga_corregida && (
                      <span className="text-[9px] font-bold bg-earth-50 text-earth-700 border border-earth-150 px-2 py-0.5 rounded-full shrink-0">
                        Corregido
                      </span>
                    )}
                  </div>

                  <span className="block text-xs text-olive-400 font-medium">
                    {fechaFormateada}
                  </span>

                  <div className="flex items-center gap-2 mt-1 sm:hidden">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider shrink-0 ${
                      ESTILOS_BADGE_SEVERIDAD[analisis.severidad] || 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {analisis.severidad}
                    </span>
                    <span className="text-[10px] text-olive-650 font-bold bg-olive-50/80 px-2 py-0.5 rounded border border-olive-100/50">
                      {Number(analisis.confianza).toFixed(1)}% Confianza
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-olive-100/60 pt-3 sm:pt-0 sm:border-0">
                <div className="text-right hidden sm:block">
                  <span className="block text-xs font-bold text-olive-850">
                    {Number(analisis.confianza).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-olive-400 font-semibold uppercase tracking-wider">
                    Confianza
                  </span>
                </div>

                <span className={`hidden sm:inline-block px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider shrink-0 ${
                  ESTILOS_BADGE_SEVERIDAD[analisis.severidad] || 'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  {analisis.severidad}
                </span>

                <div className="flex items-center justify-between sm:justify-end gap-1 w-full sm:w-auto sm:border-l sm:border-olive-100 sm:pl-3">
                  <button
                    type="button"
                    onClick={() => alternarExpansion(analisis.id)}
                    className="p-2.5 sm:p-2 text-olive-600 hover:text-olive-900 hover:bg-olive-50 rounded-lg transition-colors cursor-pointer"
                    title={estaExpandido ? 'Ocultar detalles' : 'Ver recomendaciones y notas'}
                  >
                    {estaExpandido ? <EyeOff className="w-4.5 h-4.5 sm:w-4 sm:h-4" /> : <Eye className="w-4.5 h-4.5 sm:w-4 sm:h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => generarPDF(analisis, nombreUsuario)}
                    className="p-2.5 sm:p-2 text-olive-650 hover:text-olive-950 hover:bg-olive-50 rounded-lg transition-colors cursor-pointer"
                    title="Exportar a PDF"
                  >
                    <FileText className="w-4.5 h-4.5 sm:w-4 sm:h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => copiarEnlaceCompartido(analisis.id)}
                    className={`p-2.5 sm:p-2 rounded-lg transition-colors cursor-pointer relative ${
                      idCopiaExitosa === analisis.id
                        ? 'text-green-600 bg-green-50 hover:bg-green-100'
                        : 'text-olive-650 hover:text-olive-950 hover:bg-olive-50'
                    }`}
                    title="Copiar enlace para compartir"
                  >
                    {idCopiaExitosa === analisis.id ? <Check className="w-4.5 h-4.5 sm:w-4 sm:h-4" /> : <Share2 className="w-4.5 h-4.5 sm:w-4 sm:h-4" />}
                    {idCopiaExitosa === analisis.id && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[9px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-10 animate-bounce">
                        ¡Copiado!
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIdAnalisisAEliminar(analisis.id)}
                    className="p-2.5 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar del historial"
                  >
                    <Trash2 className="w-4.5 h-4.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>

            {estaExpandido && (
              <div className="px-6 pb-6 border-t border-olive-50/50 bg-olive-50/20 rounded-b-2xl space-y-4 pt-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-olive-800">
                      Descripción del Diagnóstico
                    </h5>
                    <p className="text-xs text-olive-750 leading-relaxed bg-white p-3 rounded-lg border border-olive-100 shadow-sm">
                      {analisis.descripcion || 'Sin información descriptiva provista.'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-olive-800">
                      Notas de Campo registradas
                    </h5>
                    <p className="text-xs text-olive-750 leading-relaxed bg-white p-3 rounded-lg border border-olive-100 shadow-sm italic">
                      {analisis.notas || 'No se registraron notas de campo para esta evaluación.'}
                    </p>
                  </div>
                </div>

                {analisis.recomendacion && (
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-olive-800">
                      Recomendaciones de Tratamiento Generadas por IA
                    </h5>
                    <div className="text-xs text-olive-750 leading-relaxed bg-white p-4 rounded-xl border border-olive-100 shadow-sm max-h-48 overflow-y-auto">
                      <RecomendacionFormateada texto={analisis.recomendacion} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {idAnalisisAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="flex flex-col items-center gap-5 w-full max-w-sm p-6 bg-white border border-red-100 rounded-2xl shadow-xl transform scale-100 transition-all duration-300">
            <div className="flex items-center justify-center w-14 h-14 bg-red-50 text-red-500 rounded-full border border-red-100 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-red-950">
                ¿Eliminar Diagnóstico?
              </h3>
              <p className="text-sm text-olive-750 leading-relaxed">
                ¿Está seguro de que desea eliminar este diagnóstico del historial? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setIdAnalisisAEliminar(null)}
                className="flex-1 py-2.5 bg-white hover:bg-olive-50 text-olive-750 text-sm font-semibold rounded-xl border border-olive-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (fnEliminar) {
                    fnEliminar(idAnalisisAEliminar)
                  }
                  setIdAnalisisAEliminar(null)
                }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-750 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
