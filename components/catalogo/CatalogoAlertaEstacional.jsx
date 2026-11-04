// ============================================================
// NOMBRE OBJETO: components/catalogo/CatalogoAlertaEstacional.jsx
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-04 (Recomendación de tratamiento y catálogo fitosanitario)
// DESCRIPCION: Panel dinámico de alerta fitosanitaria que evalúa la
//              ubicación del agricultor y el mes actual para avisar
//              sobre condiciones biológicamente favorables para plagas.
// ============================================================

import React from 'react'
import { Calendar, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react'
import { MESES_DEL_ANIO } from './CatalogoFichaPlaga'

/**
 * Tarjeta inteligente que evalúa la zona geográfica y el mes actual
 * para alertar sobre riesgos inminentes de plagas.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.plagas=[]] - Catálogo de plagas registradas.
 * @param {string} [props.zonaUsuario=''] - Ubicación geográfica del agricultor.
 */
export default function CatalogoAlertaEstacional({ plagas = [], zonaUsuario = '' }) {
  const indiceMesActual = new Date().getMonth()
  const mesActual = MESES_DEL_ANIO[indiceMesActual]

  const plagasConRiesgoActivo = plagas.filter(
    (plaga) => plaga.meses_riesgo && plaga.meses_riesgo.includes(mesActual)
  )

  const tieneRiesgoActivo = plagasConRiesgoActivo.length > 0

  return (
    <div className={`w-full p-6 rounded-2xl border transition-all duration-300 ${
      tieneRiesgoActivo
        ? 'bg-amber-50/40 border-amber-200 shadow-sm'
        : 'bg-green-50/20 border-green-200/50 shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg ${
              tieneRiesgoActivo ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
            }`}>
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-olive-950">
              Riesgo Estacional - {mesActual}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-olive-650 font-medium">
            <MapPin className="w-4 h-4 text-olive-500" />
            <span>Zona del Agricultor: </span>
            <strong className="text-olive-850">
              {zonaUsuario || 'No especificada en perfil'}
            </strong>
          </div>
        </div>

        <div>
          {tieneRiesgoActivo ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-sm">
              <AlertTriangle className="w-4 h-4" />
              Riesgo Activo
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold text-xs rounded-xl shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              Follaje Seguro
            </div>
          )}
        </div>
      </div>

      <hr className={`my-4 ${tieneRiesgoActivo ? 'border-amber-200/60' : 'border-green-200/40'}`} />

      {tieneRiesgoActivo ? (
        <div className="space-y-3">
          <p className="text-xs text-olive-750 leading-relaxed">
            Las condiciones climáticas de <strong className="text-olive-900">{mesActual}</strong> favorecen biológicamente el desarrollo de las siguientes amenazas en tu región:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {plagasConRiesgoActivo.map((plaga) => (
              <div
                key={plaga.id}
                className="flex items-start gap-2.5 p-3.5 bg-white rounded-xl border border-amber-200/60 shadow-sm"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-olive-900 mb-0.5">
                    {plaga.nombre}
                  </h4>
                  <p className="text-[11px] text-olive-600 line-clamp-2 leading-relaxed">
                    {plaga.sintomas}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-xs text-olive-750 leading-relaxed">
            Durante el mes de <strong className="text-olive-900">{mesActual}</strong>, no se registran amenazas estacionales críticas activas por defecto para tu cultivo.
          </p>
          <p className="text-[11px] text-olive-500">
            Sigue realizando inspecciones preventivas habituales de salud foliar en tu parcela.
          </p>
        </div>
      )}
    </div>
  )
}
