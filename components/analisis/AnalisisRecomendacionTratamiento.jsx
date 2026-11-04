// ============================================================
// NOMBRE OBJETO: components/analisis/AnalisisRecomendacionTratamiento.jsx
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-04 (Recomendación de tratamiento y catálogo fitosanitario)
// DESCRIPCION: Componente para parsear y renderizar recomendaciones
//              agronómicas generadas por IA divididas en control
//              orgánico/preventivo, químico y precauciones de seguridad.
// ============================================================

import React from 'react'
import { Leaf, ShieldAlert, FlaskConical } from 'lucide-react'
import RecomendacionFormateada from './RecomendacionFormateada'

const MINIMO_BLOQUES_RECOMENDACION = 2

/**
 * Parsea el texto Markdown generado por la IA en bloques estructurados de tratamiento.
 *
 * @param {string} texto - Contenido en formato Markdown con las recomendaciones.
 * @returns {{ organico: Array<{titulo: string, detalle: string}>, quimico: Array<{titulo: string, detalle: string}>, advertencias: Array<{titulo: string, detalle: string}> } | null}
 */
function parsearRecomendacion(texto) {
  if (!texto || typeof texto !== 'string') {
    return null
  }

  const partes = texto.split('####')
  if (partes.length < MINIMO_BLOQUES_RECOMENDACION) {
    return null
  }

  let organico = []
  let quimico = []
  let advertencias = []

  partes.forEach((parte) => {
    const lineas = parte.trim().split('\n')
    const cabecera = lineas[0].replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '').trim().toLowerCase()

    const items = lineas
      .slice(1)
      .map((linea) => linea.trim())
      .filter((linea) => linea.startsWith('-') || linea.startsWith('*'))
      .map((linea) => {
        const coincidencia = linea.match(/^[*-]\s+\*\*(.*?)\*\*[:\s]+(.*)/)
        if (coincidencia) {
          return {
            titulo: coincidencia[1].trim(),
            detalle: coincidencia[2].trim()
          }
        }
        return {
          titulo: '',
          detalle: linea.replace(/^[*-]\s+/, '').trim()
        }
      })

    if (items.length > 0) {
      if (
        cabecera.includes('organico') ||
        cabecera.includes('orgánico') ||
        cabecera.includes('preventivo') ||
        cabecera.includes('mantenimiento')
      ) {
        organico = items
      } else if (
        cabecera.includes('quimico') ||
        cabecera.includes('químico') ||
        cabecera.includes('manejo')
      ) {
        quimico = items
      } else if (
        cabecera.includes('advertencia') ||
        cabecera.includes('precaucion') ||
        cabecera.includes('precaución') ||
        cabecera.includes('seguridad')
      ) {
        advertencias = items
      }
    }
  })

  return { organico, quimico, advertencias }
}

/**
 * Componente para renderizar las sugerencias agronómicas y tratamientos
 * emitidos por la Inteligencia Artificial.
 *
 * @param {Object} props
 * @param {string} props.recomendacionRaw - Cadena con el reporte de recomendaciones.
 * @returns {JSX.Element|null}
 */
export default function AnalisisRecomendacionTratamiento({ recomendacionRaw }) {
  if (!recomendacionRaw) return null

  const datosParseados = parsearRecomendacion(recomendacionRaw)

  if (!datosParseados || (datosParseados.organico.length === 0 && datosParseados.quimico.length === 0)) {
    return (
      <div className="w-full bg-white p-6 rounded-2xl border border-olive-100 shadow-glass">
        <h3 className="text-lg font-bold text-olive-950 mb-4 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-olive-600" />
          Recomendaciones de Tratamiento
        </h3>
        <div className="prose prose-olive max-w-none text-sm text-olive-800 space-y-4 whitespace-pre-line">
          <RecomendacionFormateada texto={recomendacionRaw} />
        </div>
      </div>
    )
  }

  const { organico, quimico, advertencias } = datosParseados

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-olive-950">
          Plan de Tratamiento Sugerido por IA
        </h3>
        <p className="text-xs text-olive-500">
          Sugerencias agronómicas generadas en base a la plaga y nivel de severidad detectado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col bg-green-50/30 p-6 rounded-2xl border border-green-100/60 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 text-green-800 font-bold text-base">
            <span className="p-1.5 bg-green-100 text-green-700 rounded-lg">
              <Leaf className="w-5 h-5" />
            </span>
            Tratamiento Orgánico y Preventivo
          </div>
          {organico.length > 0 ? (
            <ul className="space-y-3.5 flex-1">
              {organico.map((item, indice) => (
                <li key={indice} className="flex gap-2 text-sm text-olive-850">
                  <span className="text-green-600 mt-1 select-none font-bold">&#8226;</span>
                  <div>
                    {item.titulo && <strong className="text-green-950 block md:inline mr-1">{item.titulo}:</strong>}
                    <span className="text-olive-750">{item.detalle}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-olive-500 italic flex-1 flex items-center">
              No se especifican medidas biológicas específicas para este estado.
            </p>
          )}
        </div>

        <div className="flex flex-col bg-blue-50/20 p-6 rounded-2xl border border-blue-100/40 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 text-blue-800 font-bold text-base">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <FlaskConical className="w-5 h-5" />
            </span>
            Tratamiento Químico (Control Sintético)
          </div>
          {quimico.length > 0 ? (
            <ul className="space-y-3.5 flex-1">
              {quimico.map((item, indice) => (
                <li key={indice} className="flex gap-2 text-sm text-olive-850">
                  <span className="text-blue-600 mt-1 select-none font-bold">&#8226;</span>
                  <div>
                    {item.titulo && <strong className="text-blue-950 block md:inline mr-1">{item.titulo}:</strong>}
                    <span className="text-olive-750">{item.detalle}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-olive-500 italic flex-1 flex items-center">
              No se justifica el uso de químicos sintéticos en este nivel de severidad.
            </p>
          )}
        </div>
      </div>

      {advertencias.length > 0 && (
        <div className="bg-red-50/40 border border-red-100 p-5 rounded-2xl flex gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-bold text-red-950 text-sm">
              Advertencias y Precauciones de Seguridad
            </h4>
            <ul className="space-y-1.5">
              {advertencias.map((item, indice) => (
                <li key={indice} className="text-xs text-red-900 leading-relaxed">
                  {item.titulo && <strong>{item.titulo}: </strong>}
                  {item.detalle}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
