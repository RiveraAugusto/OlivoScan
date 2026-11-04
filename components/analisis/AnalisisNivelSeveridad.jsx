// ============================================================
// NOMBRE OBJETO: components/analisis/AnalisisNivelSeveridad.jsx
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-03 (Diagnóstico completo y feedback del usuario)
// DESCRIPCION: Badge interactivo para visualizar el grado de severidad
//              fitosanitaria (leve, moderado, grave) de la hoja de olivo.
// ============================================================

import React from 'react'

const CONFIGURACION_SEVERIDAD = {
  grave: {
    etiqueta: 'Grave',
    clasesBadge: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
    clasePunto: 'bg-red-600',
  },
  moderado: {
    etiqueta: 'Moderado',
    clasesBadge: 'bg-gold-100 text-earth-600 border-gold-200',
    clasePunto: 'bg-earth-500',
  },
  leve: {
    etiqueta: 'Leve',
    clasesBadge: 'bg-olive-100 text-olive-800 border-olive-200',
    clasePunto: 'bg-olive-600',
  },
}

/**
 * Badge dinámico para representar el grado de severidad fitosanitaria detectada.
 *
 * @param {Object} props
 * @param {('leve'|'moderado'|'grave')} [props.severidad='leve'] - Nivel de severidad registrado.
 */
export default function AnalisisNivelSeveridad({ severidad = 'leve' }) {
  const clave = severidad?.toLowerCase() || 'leve'
  const config = CONFIGURACION_SEVERIDAD[clave] || CONFIGURACION_SEVERIDAD.leve

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-olive-800">
        Nivel de Severidad:
      </span>
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-semibold ${config.clasesBadge}`}>
        <span className={`w-2 h-2 rounded-full ${config.clasePunto}`} />
        {config.etiqueta}
      </span>
    </div>
  )
}
