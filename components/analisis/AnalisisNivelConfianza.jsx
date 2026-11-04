// ============================================================
// NOMBRE OBJETO: components/analisis/AnalisisNivelConfianza.jsx
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-03 (Diagnóstico completo y feedback del usuario)
// DESCRIPCION: Componente para renderizar visualmente el porcentaje
//              de certeza del modelo de IA con barra de progreso y colores.
// ============================================================

import React from 'react'

// Constantes de umbrales y límites
const UMBRAL_CONFIANZA_ALTA = 85
const UMBRAL_CONFIANZA_MEDIA = 60
const LIMITE_INFERIOR_CONFIANZA = 0
const LIMITE_SUPERIOR_CONFIANZA = 100

/**
 * Muestra visualmente la barra de porcentaje de certeza del modelo.
 *
 * @param {Object} props
 * @param {number} [props.confianza=0] - Nivel de certeza de 0 a 100.
 */
export default function AnalisisNivelConfianza({ confianza = 0 }) {
  const confianzaAjustada = Math.min(
    Math.max(confianza, LIMITE_INFERIOR_CONFIANZA),
    LIMITE_SUPERIOR_CONFIANZA
  )

  let colorBarra = 'bg-olive-500'
  let colorTexto = 'text-olive-700'
  let mensajeDescripcion = 'El modelo cuenta con una alta precisión en este análisis.'

  if (confianzaAjustada < UMBRAL_CONFIANZA_MEDIA) {
    colorBarra = 'bg-red-500'
    colorTexto = 'text-red-700'
    mensajeDescripcion = 'La confianza es baja. Puede requerir otra captura de mejor calidad.'
  } else if (confianzaAjustada < UMBRAL_CONFIANZA_ALTA) {
    colorBarra = 'bg-gold-500'
    colorTexto = 'text-gold-700'
    mensajeDescripcion = 'El resultado es probable, pero se recomienda verificación de campo.'
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center w-full">
        <span className="text-xs font-semibold uppercase tracking-wider text-olive-800">
          Confianza del diagnóstico
        </span>
        <span className={`text-sm font-bold ${colorTexto}`}>
          {confianzaAjustada.toFixed(1)}%
        </span>
      </div>

      <div className="w-full h-3 bg-olive-100/50 rounded-full overflow-hidden border border-olive-200/50 shadow-inner">
        <div
          className={`h-full ${colorBarra} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${confianzaAjustada}%` }}
        />
      </div>

      <p className="text-xs text-olive-600">
        {mensajeDescripcion}
      </p>
    </div>
  )
}
