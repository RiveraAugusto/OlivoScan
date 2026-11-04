// ============================================================
// ARCHIVO: components/comparar/CompararSeleccion.jsx
// MODULO: Comparar
// DESCRIPCION: Componente que visualiza el listado de analisis
//              anteriores para seleccionar uno como punto inicial
//              de comparacion.
// SPRINT: Adicional (Comparador Evolutivo)
// RF: RF-005
// ============================================================

import React, { useState } from 'react'
import { Search, Calendar, Shield, Activity, Sprout } from 'lucide-react'

// Colores asociados a severidad para pintar insignias (Badges)
const COLORES_SEVERIDAD = {
  leve: 'bg-green-50 text-green-700 border-green-200',
  moderado: 'bg-amber-50 text-amber-700 border-amber-200',
  grave: 'bg-red-50 text-red-700 border-red-200'
}

function ClsCompararSeleccion({
  objAnalisisLista,
  alSeleccionarReferencia
}) {
  // Estados locales para los filtros dentro de la seleccion
  const [strBusqueda, setStrBusqueda] = useState('')
  const [strFiltroSeveridad, setStrFiltroSeveridad] = useState('todos')

  // Filtrado de analisis aplicable para la seleccion
  const listadoFiltrado = objAnalisisLista.filter((item) => {
    // 1. Coincidencia por texto (plaga detectada, plaga corregida o notas de campo)
    const coincideBusqueda = strBusqueda
      ? (item.plaga_detectada.toLowerCase().includes(strBusqueda.toLowerCase()) ||
         (item.plaga_corregida && item.plaga_corregida.toLowerCase().includes(strBusqueda.toLowerCase())) ||
         (item.notas && item.notas.toLowerCase().includes(strBusqueda.toLowerCase())))
      : true

    // 2. Coincidencia por severidad
    const coincideSeveridad = strFiltroSeveridad === 'todos' || item.severidad === strFiltroSeveridad

    return coincideBusqueda && coincideSeveridad
  })

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Barra de Filtros Interna */}
      <div className="bg-white p-5 rounded-2xl border border-olive-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Campo de Busqueda Textual */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-400" />
          <input
            type="text"
            value={strBusqueda}
            onChange={(e) => setStrBusqueda(e.target.value)}
            placeholder="Buscar por plaga o notas de campo..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-olive-50/20 border border-olive-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/25 transition-all text-olive-950 font-medium placeholder-olive-400"
          />
        </div>

        {/* Filtro Rapido de Severidad */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-olive-650 uppercase tracking-wider mr-2 whitespace-nowrap">
            Severidad:
          </span>
          {['todos', 'leve', 'moderado', 'grave'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setStrFiltroSeveridad(sev)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all cursor-pointer whitespace-nowrap ${
                strFiltroSeveridad === sev
                  ? 'bg-olive-600 text-white border-olive-600 shadow-sm'
                  : 'bg-white text-olive-700 border-olive-200 hover:bg-olive-50'
              }`}
            >
              {sev === 'todos' ? 'Todos' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Grid del Historial Disponible */}
      {listadoFiltrado.length === 0 ? (
        <div className="text-center py-16 bg-white border border-olive-100 rounded-2xl shadow-glass space-y-3">
          <p className="text-sm font-semibold text-olive-500">
            No se encontraron análisis que coincidan con los filtros.
          </p>
          <p className="text-xs text-olive-400">
            Asegúrate de buscar una plaga registrada o modifica los filtros superiores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listadoFiltrado.map((objAnalisis) => {
            const plagaNombre = objAnalisis.plaga_corregida || objAnalisis.plaga_detectada
            const strFecha = new Date(objAnalisis.creado_en).toLocaleDateString('es-ES', {
              year: 'numeric', month: 'short', day: '2-digit'
            })

            return (
              <div
                key={objAnalisis.id}
                className="bg-white rounded-2xl border border-olive-100 overflow-hidden shadow-sm hover:shadow-md hover:border-olive-200 flex flex-col justify-between transition-all"
              >
                {/* Cabecera / Imagen */}
                <div className="relative aspect-[4/3] w-full bg-olive-50 overflow-hidden border-b border-olive-50">
                  <img
                    src={objAnalisis.imagen_url}
                    alt={plagaNombre}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider shadow-sm ${
                      COLORES_SEVERIDAD[objAnalisis.severidad]
                    }`}>
                      {objAnalisis.severidad}
                    </span>
                  </div>
                </div>

                {/* Info del Analisis */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-olive-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {strFecha}
                      </span>
                      <span>
                        Confianza: {Number(objAnalisis.confianza).toFixed(1)}%
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-olive-950 truncate" title={plagaNombre}>
                      {plagaNombre}
                    </h4>

                    {objAnalisis.notas && (
                      <p className="text-[11px] text-olive-650 line-clamp-2 italic leading-relaxed">
                        &ldquo;{objAnalisis.notas}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Accion Seleccionar */}
                  <button
                    type="button"
                    onClick={() => alSeleccionarReferencia(objAnalisis)}
                    className="w-full py-2 bg-olive-50 hover:bg-olive-100 text-olive-750 text-xs font-bold rounded-xl border border-olive-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Seleccionar de Referencia
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ClsCompararSeleccion
