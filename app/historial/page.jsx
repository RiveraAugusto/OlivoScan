// ============================================================
// NOMBRE OBJETO: app/historial/page.jsx
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-05 (Historial de análisis con filtros y comparación)
// DESCRIPCION: Página principal del módulo de historial fitosanitario,
//              con filtros combinados, exportación de reportes y comparación evolutiva.
// ============================================================

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout, History, AlertCircle, Loader2 } from 'lucide-react'

// Hooks de negocio
import { useAuth } from '@/hooks/useAuth'
import { useHistorial } from '@/hooks/useHistorial'

// Componentes del módulo
import HistorialFiltros from '@/components/historial/HistorialFiltros'
import HistorialLista from '@/components/historial/HistorialLista'
import HistorialComparacion, { LIMITE_MAXIMO_COMPARACION } from '@/components/historial/HistorialComparacion'

/**
 * Página de historial de diagnósticos foliares y comparación evolutiva.
 */
export default function HistorialPage() {
  const { objUsuario, objPerfil, cargando: cargandoUsuario } = useAuth()
  const router = useRouter()

  const { cargando: cargandoHistorial, errorHistorial, listaAnalisis, cargarHistorial, eliminarAnalisis } = useHistorial()

  const [busqueda, setBusqueda] = useState('')
  const [filtroSeveridad, setFiltroSeveridad] = useState('todos')
  const [filtroPlaga, setFiltroPlaga] = useState('todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const [idsSeleccionados, setIdsSeleccionados] = useState([])

  // Fail Fast: Proteger ruta redireccionando si no existe sesión
  useEffect(() => {
    if (!cargandoUsuario && !objUsuario) {
      router.push('/login')
    }
  }, [objUsuario, cargandoUsuario, router])

  useEffect(() => {
    if (objUsuario) {
      cargarHistorial().catch(() => {})
    }
  }, [objUsuario, cargarHistorial])

  function manejarLimpiarFiltros() {
    setBusqueda('')
    setFiltroSeveridad('todos')
    setFiltroPlaga('todos')
    setFechaInicio('')
    setFechaFin('')
  }

  const listadoFiltrado = (listaAnalisis || []).filter((item) => {
    const coincideBusqueda = busqueda
      ? (item.plaga_detectada.toLowerCase().includes(busqueda.toLowerCase()) ||
         (item.plaga_corregida && item.plaga_corregida.toLowerCase().includes(busqueda.toLowerCase())) ||
         (item.notas && item.notas.toLowerCase().includes(busqueda.toLowerCase())))
      : true

    const coincideSeveridad = filtroSeveridad === 'todos' || item.severidad === filtroSeveridad

    const coincidePlaga = filtroPlaga === 'todos' ||
      item.plaga_detectada === filtroPlaga ||
      item.plaga_corregida === filtroPlaga

    const fechaCreado = new Date(item.creado_en)
    fechaCreado.setHours(0, 0, 0, 0)

    let coincideFechaInicio = true
    if (fechaInicio) {
      const fInicio = new Date(`${fechaInicio}T00:00:00`)
      coincideFechaInicio = fechaCreado >= fInicio
    }

    let coincideFechaFin = true
    if (fechaFin) {
      const fFin = new Date(`${fechaFin}T23:59:59.999`)
      coincideFechaFin = fechaCreado <= fFin
    }

    return coincideBusqueda && coincideSeveridad && coincidePlaga && coincideFechaInicio && coincideFechaFin
  })

  const analisisAComparar1 = idsSeleccionados[0]
    ? listaAnalisis.find((item) => item.id === idsSeleccionados[0])
    : null

  const analisisAComparar2 = idsSeleccionados[1]
    ? listaAnalisis.find((item) => item.id === idsSeleccionados[1])
    : null

  if (cargandoUsuario || !objUsuario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Sprout className="w-12 h-12 text-olive-500 animate-bounce" />
        <p className="mt-4 text-sm font-medium text-olive-700">
          Cargando historial de análisis...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-olive-950 flex items-center gap-2">
            <History className="w-6 h-6 text-olive-650" />
            Historial de Diagnósticos
          </h2>
          <p className="text-xs text-olive-600">
            Consulte y administre todas las evaluaciones fitosanitarias de sus hojas de olivo.
          </p>
        </div>
      </div>

      {errorHistorial && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 border border-red-100 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-red-650 flex-shrink-0" />
          <span>{errorHistorial}</span>
        </div>
      )}

      {/* Módulo de Comparación (Visible al marcar exactamente 2 análisis) */}
      {analisisAComparar1 && analisisAComparar2 && (
        <HistorialComparacion
          primerAnalisis={analisisAComparar1}
          segundoAnalisis={analisisAComparar2}
          onCerrar={() => setIdsSeleccionados([])}
        />
      )}

      <HistorialFiltros
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        filtroSeveridad={filtroSeveridad}
        onCambiarFiltroSeveridad={setFiltroSeveridad}
        filtroPlaga={filtroPlaga}
        onCambiarFiltroPlaga={setFiltroPlaga}
        fechaInicio={fechaInicio}
        onCambiarFechaInicio={setFechaInicio}
        fechaFin={fechaFin}
        onCambiarFechaFin={setFechaFin}
        onLimpiarFiltros={manejarLimpiarFiltros}
      />

      {cargandoHistorial ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-olive-100 rounded-2xl shadow-glass">
          <Loader2 className="w-8 h-8 text-olive-500 animate-spin" />
          <p className="mt-3 text-xs font-semibold text-olive-650">
            Recuperando registros...
          </p>
        </div>
      ) : (
        <HistorialLista
          listaAnalisis={listadoFiltrado}
          idsSeleccionados={idsSeleccionados}
          onCambiarSeleccionComparar={setIdsSeleccionados}
          onEliminar={eliminarAnalisis}
          nombreUsuario={objPerfil?.nombre || 'Agricultor'}
        />
      )}
    </div>
  )
}
