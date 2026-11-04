// ============================================================
// ARCHIVO: components/perfil/PerfilFormulario.jsx
// MODULO: Perfil
// DESCRIPCION: Componente para modificar los datos personales
//              del agricultor (nombre y zona geografica).
// SPRINT: 1
// RF: RF-010
// ============================================================

'use client'

import { useState } from 'react'
import { User, MapPin, CheckCircle, AlertCircle } from 'lucide-react'

function ClsPerfilFormulario({ objPerfil, actualizarPerfil }) {
  // Estados locales para los campos del formulario
  const [nombreEditado, setNombre] = useState(null)
  const [zonaEditada, setZonaGeografica] = useState(null)
  const nombre = nombreEditado ?? objPerfil?.nombre ?? ''
  const zonaGeografica = zonaEditada ?? objPerfil?.zona_geografica ?? ''

  // Estados locales para mensajes y carga
  const [mensajeError, setMensajeError] = useState(null)
  const [mensajeExito, setMensajeExito] = useState(null)
  const [estaCargando, setEstaCargando] = useState(false)

  // Estado local para controlar la visibilidad del modal de confirmacion
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  // Manejar el envio del formulario de actualizacion (abre el popup de confirmacion)
  function manejarGuardarPerfil(evento) {
    evento.preventDefault()
    setMensajeError(null)
    setMensajeExito(null)

    // Validacion previa al guardado
    if (!nombre.trim()) {
      setMensajeError('El nombre no puede estar vacio.')
      return
    }

    // Abrir modal de confirmacion
    setMostrarConfirmacion(true)
  }

  // Ejecutar la actualizacion del perfil tras confirmar la accion en el popup
  async function confirmarYGuardarPerfil() {
    setMostrarConfirmacion(false)
    setEstaCargando(true)
    try {
      await actualizarPerfil(nombre, zonaGeografica)
      setMensajeExito('Perfil actualizado correctamente.')
    } catch (error) {
      setMensajeError(error.message || 'No se pudo guardar la informacion del perfil.')
    } finally {
      setEstaCargando(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-glass border border-olive-100">
      <h3 className="text-lg font-bold text-olive-950 mb-1">
        Datos del Agricultor
      </h3>
      <p className="text-sm text-olive-700 mb-6">
        Actualice su nombre y la ubicacion de sus cultivos para alertas estacionales
      </p>

      {/* Alertas */}
      {mensajeError && (
        <div className="flex items-start gap-2.5 p-4 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p>{mensajeError}</p>
        </div>
      )}

      {mensajeExito && (
        <div className="flex items-start gap-2.5 p-4 mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p>{mensajeExito}</p>
        </div>
      )}

      <form onSubmit={manejarGuardarPerfil} className="space-y-4">
        <div>
          <label htmlFor="perfil-nombre" className="block text-sm font-medium text-olive-800 mb-1">
            Nombre Completo
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-olive-400">
              <User className="w-5 h-5" />
            </span>
            <input
              id="perfil-nombre"
              type="text"
              required
              disabled={estaCargando}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-olive-50/50 border border-olive-200 rounded-lg text-sm text-olive-950 placeholder-olive-400 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 disabled:opacity-60 transition-all"
              placeholder="Nombre del agricultor"
            />
          </div>
        </div>

        <div>
          <label htmlFor="perfil-zona" className="block text-sm font-medium text-olive-800 mb-1">
            Zona Geográfica
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-olive-400">
              <MapPin className="w-5 h-5" />
            </span>
            <input
              id="perfil-zona"
              type="text"
              disabled={estaCargando}
              value={zonaGeografica}
              onChange={(e) => setZonaGeografica(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-olive-50/50 border border-olive-200 rounded-lg text-sm text-olive-950 placeholder-olive-400 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 disabled:opacity-60 transition-all"
              placeholder="Ej. Jaén, Andalucía"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={estaCargando}
            className="w-full sm:w-auto px-5 py-2.5 bg-olive-500 hover:bg-olive-600 text-white text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-olive-500 disabled:opacity-60 transition-all"
          >
            {estaCargando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      {/* Modal Popup de Confirmacion antes de Guardar */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="flex flex-col items-center gap-5 w-full max-w-sm p-6 bg-white border border-olive-150 rounded-2xl shadow-xl transform scale-100 transition-all duration-300">
            {/* Icono del Perfil sin emojis */}
            <div className="flex items-center justify-center w-14 h-14 bg-olive-50 text-olive-500 rounded-full border border-olive-100 shadow-sm">
              <User className="w-8 h-8" />
            </div>

            {/* Titulo y Mensaje */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-olive-950">
                Confirmar Cambios
              </h3>
              <p className="text-sm text-olive-750 leading-relaxed">
                ¿Esta seguro de que desea guardar las modificaciones realizadas en su perfil?
              </p>
            </div>

            {/* Botones de Accion */}
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 py-2.5 bg-white hover:bg-olive-50 text-olive-750 text-sm font-semibold rounded-xl border border-olive-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarYGuardarPerfil}
                className="flex-1 py-2.5 bg-olive-500 hover:bg-olive-600 active:bg-olive-750 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClsPerfilFormulario
