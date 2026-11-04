// ============================================================
// NOMBRE OBJETO: components/catalogo/CatalogoFichaPlaga.jsx
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-04 (Recomendación de tratamiento y catálogo fitosanitario)
// DESCRIPCION: Ficha técnica interactiva con pestañas de información,
//              síntomas, condiciones y tratamientos con calendario de riesgo.
// ============================================================

import React, { useState } from 'react'
import { Info, AlertTriangle, Activity, FlaskConical, Leaf, Pencil, Trash2 } from 'lucide-react'

const LONGITUD_ABREVIATURA_MES = 3

export const MESES_DEL_ANIO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

/**
 * Ficha técnica interactiva para explorar una plaga o afección fitosanitaria del olivar.
 *
 * @param {Object} props
 * @param {Object} props.plaga - Datos técnicos de la plaga.
 * @param {boolean} [props.esAdmin=false] - Habilita controles administrativos de edición y borrado.
 * @param {(plaga: Object) => void} [props.onEditar] - Manejador para editar la ficha.
 * @param {(plaga: Object) => void} [props.onEliminar] - Manejador para eliminar la ficha.
 */
export default function CatalogoFichaPlaga({ plaga, esAdmin = false, onEditar, onEliminar }) {
  const [pestañaActiva, setPestañaActiva] = useState('info')

  const {
    nombre,
    descripcion,
    sintomas,
    condiciones,
    tratamiento_quimico: tratamientoQuimico,
    tratamiento_organico: tratamientoOrganico,
    imagen_referencia_url: imagenReferenciaUrl,
    meses_riesgo: mesesRiesgo = []
  } = plaga

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-olive-100 overflow-hidden shadow-glass hover:shadow-md transition-all duration-300">
      <div className="relative h-48 bg-olive-50 overflow-hidden">
        {esAdmin && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => onEditar && onEditar(plaga)}
              className="p-2 bg-white/95 hover:bg-white text-olive-800 hover:text-olive-650 rounded-lg shadow-sm border border-olive-150 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              title="Editar ficha técnica"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEliminar && onEliminar(plaga)}
              className="p-2 bg-red-500/90 hover:bg-red-650 text-white rounded-lg shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center border border-red-600"
              title="Eliminar ficha técnica"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {imagenReferenciaUrl ? (
          <img
            src={imagenReferenciaUrl}
            alt={nombre}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-olive-350">
            <Info className="w-12 h-12" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex flex-col justify-end p-5">
          <h4 className="text-lg font-bold text-white leading-tight">
            {nombre}
          </h4>
        </div>
      </div>

      <div className="flex border-b border-olive-100 bg-olive-50/50">
        <button
          type="button"
          onClick={() => setPestañaActiva('info')}
          className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
            pestañaActiva === 'info'
              ? 'border-olive-500 text-olive-950 bg-white font-bold'
              : 'border-transparent text-olive-600 hover:text-olive-850 hover:bg-olive-50/20'
          }`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setPestañaActiva('sintomas')}
          className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
            pestañaActiva === 'sintomas'
              ? 'border-olive-500 text-olive-950 bg-white font-bold'
              : 'border-transparent text-olive-600 hover:text-olive-850 hover:bg-olive-50/20'
          }`}
        >
          Síntomas y Entorno
        </button>
        <button
          type="button"
          onClick={() => setPestañaActiva('tratamientos')}
          className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
            pestañaActiva === 'tratamientos'
              ? 'border-olive-500 text-olive-950 bg-white font-bold'
              : 'border-transparent text-olive-600 hover:text-olive-850 hover:bg-olive-50/20'
          }`}
        >
          Tratamiento
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4 min-h-[180px]">
        {pestañaActiva === 'info' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <p className="text-xs text-olive-750 leading-relaxed">
              {descripcion}
            </p>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-olive-400 block">
                Meses de mayor riesgo de infección
              </span>
              <div className="grid grid-cols-6 gap-1">
                {MESES_DEL_ANIO.map((mes) => {
                  const tieneRiesgo = mesesRiesgo.includes(mes)
                  const abreviatura = mes.substring(0, LONGITUD_ABREVIATURA_MES)
                  return (
                    <div
                      key={mes}
                      title={`${mes}: ${tieneRiesgo ? 'Riesgo Alto' : 'Riesgo Bajo'}`}
                      className={`text-[9px] font-bold text-center py-1.5 rounded transition-colors ${
                        tieneRiesgo
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'bg-olive-50/50 text-olive-400 border border-olive-100/30'
                      }`}
                    >
                      {abreviatura}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {pestañaActiva === 'sintomas' && (
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-olive-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-olive-600" />
                Síntomas característicos
              </span>
              <p className="text-xs text-olive-850 leading-relaxed bg-olive-50/40 p-3 rounded-lg border border-olive-100/50">
                {sintomas}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-olive-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-olive-600" />
                Condiciones de desarrollo
              </span>
              <p className="text-xs text-olive-850 leading-relaxed bg-olive-50/40 p-3 rounded-lg border border-olive-100/50">
                {condiciones}
              </p>
            </div>
          </div>
        )}

        {pestañaActiva === 'tratamientos' && (
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 flex items-center gap-1 font-semibold">
                <Leaf className="w-3.5 h-3.5" />
                Medidas Orgánicas / Preventivas
              </span>
              <p className="text-xs text-olive-850 leading-relaxed bg-green-50/10 p-3 rounded-lg border border-green-100/30">
                {tratamientoOrganico}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1 font-semibold">
                <FlaskConical className="w-3.5 h-3.5" />
                Medidas Químicas
              </span>
              <p className="text-xs text-olive-850 leading-relaxed bg-blue-50/10 p-3 rounded-lg border border-blue-100/35">
                {tratamientoQuimico}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
