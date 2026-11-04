// ============================================================
// NOMBRE OBJETO: components/historial/HistorialFiltros.jsx
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-05 (Historial de análisis con filtros y comparación)
// DESCRIPCION: Barra de herramientas con filtros reactivos para refinar
//              el historial por texto, severidad, tipo de plaga y fechas.
// ============================================================

import React from 'react'
import { Search, Calendar, SlidersHorizontal, RefreshCw } from 'lucide-react'

export const OPCIONES_PLAGAS_FILTRO = [
  { id: 'todos', etiqueta: 'Todas las plagas' },
  { id: 'Mosca del olivo', etiqueta: 'Mosca del olivo' },
  { id: 'Prays del olivo (Polilla)', etiqueta: 'Prays del olivo' },
  { id: 'Cochinilla tiznada (Saissetia oleae)', etiqueta: 'Cochinilla tiznada' },
  { id: 'Repilo del olivo (Spilocaea oleagina)', etiqueta: 'Repilo del olivo' },
  { id: 'Hoja Sana', etiqueta: 'Hojas Sanas' }
]

/**
 * Barra de herramientas y filtros reactivos para refinar el historial de diagnósticos.
 *
 * @param {Object} props
 * @param {string} [props.busqueda] - Texto actual del buscador.
 * @param {string} [props.strBusqueda] - Prop retrocompatible de búsqueda.
 * @param {(valor: string) => void} [props.onCambiarBusqueda] - Manejador de cambio de texto.
 * @param {(valor: string) => void} [props.setStrBusqueda] - Prop retrocompatible de setter de búsqueda.
 * @param {string} [props.filtroSeveridad] - Severidad seleccionada.
 * @param {string} [props.strFiltroSeveridad] - Prop retrocompatible de severidad.
 * @param {(valor: string) => void} [props.onCambiarFiltroSeveridad] - Manejador de severidad.
 * @param {(valor: string) => void} [props.setStrFiltroSeveridad] - Prop retrocompatible de setter de severidad.
 * @param {string} [props.filtroPlaga] - Plaga seleccionada.
 * @param {string} [props.strFiltroPlaga] - Prop retrocompatible de plaga.
 * @param {(valor: string) => void} [props.onCambiarFiltroPlaga] - Manejador de plaga.
 * @param {(valor: string) => void} [props.setStrFiltroPlaga] - Prop retrocompatible de setter de plaga.
 * @param {string} [props.fechaInicio] - Fecha de inicio en formato YYYY-MM-DD.
 * @param {string} [props.strFechaInicio] - Prop retrocompatible de fecha inicio.
 * @param {(valor: string) => void} [props.onCambiarFechaInicio] - Manejador de fecha de inicio.
 * @param {(valor: string) => void} [props.setStrFechaInicio] - Prop retrocompatible de setter fecha inicio.
 * @param {string} [props.fechaFin] - Fecha de término en formato YYYY-MM-DD.
 * @param {string} [props.strFechaFin] - Prop retrocompatible de fecha término.
 * @param {(valor: string) => void} [props.onCambiarFechaFin] - Manejador de fecha de término.
 * @param {(valor: string) => void} [props.setStrFechaFin] - Prop retrocompatible de setter fecha término.
 * @param {() => void} [props.onLimpiarFiltros] - Manejador para restablecer todos los filtros.
 * @param {() => void} [props.alLimpiarFiltros] - Prop retrocompatible para resetear filtros.
 */
export default function HistorialFiltros({
  busqueda,
  strBusqueda,
  onCambiarBusqueda,
  setStrBusqueda,
  filtroSeveridad,
  strFiltroSeveridad,
  onCambiarFiltroSeveridad,
  setStrFiltroSeveridad,
  filtroPlaga,
  strFiltroPlaga,
  onCambiarFiltroPlaga,
  setStrFiltroPlaga,
  fechaInicio,
  strFechaInicio,
  onCambiarFechaInicio,
  setStrFechaInicio,
  fechaFin,
  strFechaFin,
  onCambiarFechaFin,
  setStrFechaFin,
  onLimpiarFiltros,
  alLimpiarFiltros
}) {
  const valorBusqueda = busqueda !== undefined ? busqueda : (strBusqueda || '')
  const fnCambiarBusqueda = onCambiarBusqueda || setStrBusqueda

  const valorSeveridad = filtroSeveridad !== undefined ? filtroSeveridad : (strFiltroSeveridad || 'todos')
  const fnCambiarSeveridad = onCambiarFiltroSeveridad || setStrFiltroSeveridad

  const valorPlaga = filtroPlaga !== undefined ? filtroPlaga : (strFiltroPlaga || 'todos')
  const fnCambiarPlaga = onCambiarFiltroPlaga || setStrFiltroPlaga

  const valorFechaInicio = fechaInicio !== undefined ? fechaInicio : (strFechaInicio || '')
  const fnCambiarFechaInicio = onCambiarFechaInicio || setStrFechaInicio

  const valorFechaFin = fechaFin !== undefined ? fechaFin : (strFechaFin || '')
  const fnCambiarFechaFin = onCambiarFechaFin || setStrFechaFin

  const fnLimpiar = onLimpiarFiltros || alLimpiarFiltros

  return (
    <div className="bg-white p-5 rounded-2xl border border-olive-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-olive-950">
          <SlidersHorizontal className="w-4 h-4 text-olive-650" />
          <h3 className="text-sm font-bold">Herramientas de Filtrado</h3>
        </div>
        <button
          type="button"
          onClick={fnLimpiar}
          className="flex items-center gap-1.5 text-xs font-semibold text-olive-600 hover:text-olive-800 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <label htmlFor="busquedaInput" className="sr-only">Buscar por plaga o notas</label>
          <Search className="absolute left-3 top-3 w-4 h-4 text-olive-400" />
          <input
            id="busquedaInput"
            type="text"
            placeholder="Buscar por notas o plaga..."
            value={valorBusqueda}
            onChange={(e) => fnCambiarBusqueda && fnCambiarBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-olive-50/20 text-olive-900 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none placeholder-olive-450"
          />
        </div>

        <div>
          <label htmlFor="severidadSelect" className="sr-only">Nivel de Severidad</label>
          <select
            id="severidadSelect"
            value={valorSeveridad}
            onChange={(e) => fnCambiarSeveridad && fnCambiarSeveridad(e.target.value)}
            className="w-full p-2.5 text-xs bg-white text-olive-900 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none"
          >
            <option value="todos">Cualquier severidad</option>
            <option value="leve">Leve</option>
            <option value="moderado">Moderado</option>
            <option value="grave">Grave</option>
          </select>
        </div>

        <div>
          <label htmlFor="plagaSelect" className="sr-only">Tipo de Plaga</label>
          <select
            id="plagaSelect"
            value={valorPlaga}
            onChange={(e) => fnCambiarPlaga && fnCambiarPlaga(e.target.value)}
            className="w-full p-2.5 text-xs bg-white text-olive-900 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none"
          >
            {OPCIONES_PLAGAS_FILTRO.map((plaga) => (
              <option key={plaga.id} value={plaga.id}>
                {plaga.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label htmlFor="fechaInicioInput" className="sr-only">Fecha Inicio</label>
          <Calendar className="absolute left-3 top-3 w-4 h-4 text-olive-400 pointer-events-none" />
          <input
            id="fechaInicioInput"
            type="date"
            placeholder="Fecha de inicio"
            value={valorFechaInicio}
            onChange={(e) => fnCambiarFechaInicio && fnCambiarFechaInicio(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-olive-50/20 text-olive-900 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none"
          />
        </div>

        <div className="relative">
          <label htmlFor="fechaFinInput" className="sr-only">Fecha Fin</label>
          <Calendar className="absolute left-3 top-3 w-4 h-4 text-olive-400 pointer-events-none" />
          <input
            id="fechaFinInput"
            type="date"
            placeholder="Fecha de término"
            value={valorFechaFin}
            onChange={(e) => fnCambiarFechaFin && fnCambiarFechaFin(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-olive-50/20 text-olive-900 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
