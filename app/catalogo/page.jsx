// ============================================================
// NOMBRE OBJETO: app/catalogo/page.jsx
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-04 (Recomendación de tratamiento y catálogo fitosanitario)
// DESCRIPCION: Página del catálogo interactivo de plagas y alertas estacionales,
//              con búsqueda, filtrado por categorías y panel CRUD para administradores.
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Sprout, BookOpen, Search, Filter, AlertCircle, X, Save, CheckCircle, Plus, Trash2 } from 'lucide-react'
import CatalogoFichaPlaga, { MESES_DEL_ANIO } from '@/components/catalogo/CatalogoFichaPlaga'
import CatalogoAlertaEstacional from '@/components/catalogo/CatalogoAlertaEstacional'

const TIEMPO_ESPERA_NOTIFICACION_MS = 1200

function desplazarAlInicioFormulario(idElemento = 'form-edicion-plaga') {
  const elemento = document.getElementById(idElemento)
  if (elemento) {
    elemento.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

/**
 * Página principal del catálogo técnico de plagas del olivo.
 */
export default function CatalogoPage() {
  const { objUsuario, objPerfil, cargando } = useAuth()
  const router = useRouter()

  const [plagas, setPlagas] = useState([])
  const [cargandoPlagas, setCargandoPlagas] = useState(true)
  const [errorPlagas, setErrorPlagas] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todos')

  const [plagaEditando, setPlagaEditando] = useState(null)
  const [creandoNuevaPlaga, setCreandoNuevaPlaga] = useState(false)
  const [nombreEdit, setNombreEdit] = useState('')
  const [descripcionEdit, setDescripcionEdit] = useState('')
  const [sintomasEdit, setSintomasEdit] = useState('')
  const [condicionesEdit, setCondicionesEdit] = useState('')
  const [quimicoEdit, setQuimicoEdit] = useState('')
  const [organicoEdit, setOrganicoEdit] = useState('')
  const [mesesRiesgoEdit, setMesesRiesgoEdit] = useState([])
  const [imagenEdit, setImagenEdit] = useState('')
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [mensajeErrorEdicion, setMensajeErrorEdicion] = useState(null)
  const [mensajeExitoEdicion, setMensajeExitoEdicion] = useState(null)

  const [plagaAEliminar, setPlagaAEliminar] = useState(null)
  const [eliminandoPlaga, setEliminandoPlaga] = useState(false)
  const [mensajeErrorEliminacion, setMensajeErrorEliminacion] = useState(null)
  const [mostrarConfirmarGuardar, setMostrarConfirmarGuardar] = useState(false)

  function manejarEditarPlaga(plaga) {
    setPlagaEditando(plaga)
    setCreandoNuevaPlaga(false)
    setNombreEdit(plaga.nombre)
    setDescripcionEdit(plaga.descripcion)
    setSintomasEdit(plaga.sintomas)
    setCondicionesEdit(plaga.condiciones)
    setQuimicoEdit(plaga.tratamiento_quimico)
    setOrganicoEdit(plaga.tratamiento_organico)
    setMesesRiesgoEdit(plaga.meses_riesgo || [])
    setImagenEdit(plaga.imagen_referencia_url || '')
    setMensajeErrorEdicion(null)
    setMensajeExitoEdicion(null)
    setMostrarConfirmarGuardar(false)
  }

  function manejarAgregarPlaga() {
    setPlagaEditando({ id: 'nuevo' })
    setCreandoNuevaPlaga(true)
    setNombreEdit('')
    setDescripcionEdit('')
    setSintomasEdit('')
    setCondicionesEdit('')
    setQuimicoEdit('')
    setOrganicoEdit('')
    setMesesRiesgoEdit([])
    setImagenEdit('')
    setMensajeErrorEdicion(null)
    setMensajeExitoEdicion(null)
    setMostrarConfirmarGuardar(false)
  }

  function manejarConfirmarEliminar(plaga) {
    setPlagaAEliminar(plaga)
    setMensajeErrorEliminacion(null)
  }

  async function manejarEliminarPlaga() {
    if (!plagaAEliminar) return
    try {
      setEliminandoPlaga(true)
      setMensajeErrorEliminacion(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMensajeErrorEliminacion('Sesión no válida. Por favor vuelva a ingresar.')
        return
      }

      const res = await fetch(`/api/catalogo?id=${plagaAEliminar.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await res.json()
      if (res.ok && data.datos) {
        await cargarCatalogo()
        setPlagaAEliminar(null)
      } else {
        setMensajeErrorEliminacion(data.error || 'No se pudo eliminar la plaga del catálogo.')
      }
    } catch {
      setMensajeErrorEliminacion('Error de red al conectar con el servidor.')
    } finally {
      setEliminandoPlaga(false)
    }
  }

  function manejarToggleMes(mes) {
    setMesesRiesgoEdit((listaAnterior) =>
      listaAnterior.includes(mes) ? listaAnterior.filter((m) => m !== mes) : [...listaAnterior, mes]
    )
  }

  async function manejarGuardarEdicion(evento) {
    if (evento) evento.preventDefault()
    setMensajeErrorEdicion(null)
    setMensajeExitoEdicion(null)

    // Fail Fast: Validación de campos obligatorios
    if (!nombreEdit.trim() || !descripcionEdit.trim() || !sintomasEdit.trim() || !condicionesEdit.trim() || !quimicoEdit.trim() || !organicoEdit.trim()) {
      setMensajeErrorEdicion('Por favor, complete todos los campos obligatorios.')
      return
    }

    try {
      setGuardandoEdicion(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMensajeErrorEdicion('Sesión no válida. Por favor vuelva a ingresar.')
        return
      }

      const metodo = creandoNuevaPlaga ? 'POST' : 'PUT'
      const payload = {
        nombre: nombreEdit,
        descripcion: descripcionEdit,
        sintomas: sintomasEdit,
        condiciones: condicionesEdit,
        tratamiento_quimico: quimicoEdit,
        tratamiento_organico: organicoEdit,
        meses_riesgo: mesesRiesgoEdit,
        imagen_referencia_url: imagenEdit || null
      }

      if (!creandoNuevaPlaga) {
        payload.id = plagaEditando.id
      }

      const res = await fetch('/api/catalogo', {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.datos) {
        setMensajeExitoEdicion(
          creandoNuevaPlaga
            ? 'La nueva plaga se ha registrado correctamente.'
            : 'La ficha técnica se ha actualizado correctamente.'
        )
        desplazarAlInicioFormulario()
        
        await cargarCatalogo()
        setTimeout(() => {
          setPlagaEditando(null)
          setCreandoNuevaPlaga(false)
        }, TIEMPO_ESPERA_NOTIFICACION_MS)
      } else {
        setMensajeErrorEdicion(`Error ${res.status}: ${data.error || 'No se pudo guardar la información.'}`)
        desplazarAlInicioFormulario()
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error de conexión.'
      setMensajeErrorEdicion(`Error de red al conectar con el servidor: ${mensaje}`)
      desplazarAlInicioFormulario()
    } finally {
      setGuardandoEdicion(false)
    }
  }

  useEffect(() => {
    if (!cargando && !objUsuario) {
      router.push('/login')
    }
  }, [objUsuario, cargando, router])

  async function cargarCatalogo() {
    try {
      setCargandoPlagas(true)
      setErrorPlagas(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/catalogo', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await res.json()
      if (res.ok && data.datos) {
        setPlagas(data.datos)
      } else {
        setErrorPlagas(data.error || 'No se pudo cargar el catálogo de plagas.')
      }
    } catch {
      setErrorPlagas('Error de red al conectar con el servidor.')
    } finally {
      setCargandoPlagas(false)
    }
  }

  useEffect(() => {
    if (objUsuario) {
      cargarCatalogo()
    }
  }, [objUsuario])

  const plagasFiltradas = plagas.filter((plaga) => {
    const coincideBusqueda =
      plaga.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      plaga.descripcion.toLowerCase().includes(busqueda.toLowerCase())

    if (!coincideBusqueda) return false

    const nombreNormalizado = plaga.nombre.toLowerCase()
    if (filtroCategoria === 'insectos') {
      return (
        nombreNormalizado.includes('mosca') ||
        nombreNormalizado.includes('prays') ||
        nombreNormalizado.includes('polilla') ||
        nombreNormalizado.includes('cochinilla')
      )
    }
    if (filtroCategoria === 'hongos') {
      return nombreNormalizado.includes('repilo') || nombreNormalizado.includes('hongo')
    }
    if (filtroCategoria === 'sano') {
      return nombreNormalizado.includes('sana') || nombreNormalizado.includes('sano')
    }

    return true
  })

  if (cargando || !objUsuario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Sprout className="w-12 h-12 text-olive-500 animate-bounce" />
        <p className="mt-4 text-sm font-medium text-olive-750">
          Cargando sesión...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-olive-950 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-olive-650" />
            Catálogo Técnico de Plagas
          </h2>
          <p className="text-xs text-olive-600">
            Fichas técnicas de prevención, síntomas y tratamientos para tu olivar.
          </p>
        </div>
        {objPerfil?.rol === 'admin' && (
          <button
            type="button"
            onClick={manejarAgregarPlaga}
            className="flex items-center gap-2 px-4 py-2.5 bg-olive-500 hover:bg-olive-600 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Nueva Plaga</span>
          </button>
        )}
      </div>

      {!cargandoPlagas && !errorPlagas && plagas.length > 0 && (
        <CatalogoAlertaEstacional
          plagas={plagas}
          zonaUsuario={objPerfil?.zona_geografica}
        />
      )}

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-olive-100 shadow-sm justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-olive-400" />
          <input
            type="text"
            placeholder="Buscar plaga, síntomas o tratamientos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-olive-50/20 text-olive-900 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none placeholder-olive-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-olive-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filtrar:
          </span>
          {[
            { id: 'todos', etiqueta: 'Todos' },
            { id: 'insectos', etiqueta: 'Insectos' },
            { id: 'hongos', etiqueta: 'Hongos' },
            { id: 'sano', etiqueta: 'Hojas Sanas' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFiltroCategoria(cat.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer border ${
                filtroCategoria === cat.id
                  ? 'bg-olive-500 text-white border-olive-600 shadow-sm'
                  : 'bg-white text-olive-750 border-olive-200 hover:bg-olive-50/50'
              }`}
            >
              {cat.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {cargandoPlagas ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-olive-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-xs font-semibold text-olive-600">
            Cargando fichas técnicas...
          </p>
        </div>
      ) : errorPlagas ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 border border-red-150 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-red-650 flex-shrink-0" />
          <span>{errorPlagas}</span>
        </div>
      ) : plagasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white border border-olive-100 rounded-2xl">
          <p className="text-sm font-semibold text-olive-500">
            No se encontraron fichas técnicas que coincidan con los filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plagasFiltradas.map((plaga) => (
            <CatalogoFichaPlaga
              key={plaga.id}
              plaga={plaga}
              esAdmin={objPerfil?.rol === 'admin'}
              onEditar={manejarEditarPlaga}
              onEliminar={manejarConfirmarEliminar}
            />
          ))}
        </div>
      )}

      {plagaEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
          <form
            id="form-edicion-plaga"
            onSubmit={(e) => {
              e.preventDefault()
              setMostrarConfirmarGuardar(true)
            }}
            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-olive-100 overflow-hidden flex flex-col max-h-[90vh] transition-all transform scale-100 duration-300"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-olive-100 bg-olive-50/50">
              <div>
                <h3 className="text-lg font-bold text-olive-950">
                  {creandoNuevaPlaga ? 'Registrar Nueva Plaga' : 'Editar Ficha Técnica'}
                </h3>
                <p className="text-xs text-olive-600">
                  {creandoNuevaPlaga ? 'Añadiendo una nueva ficha técnica al catálogo' : `Modificando la información de: ${plagaEditando.nombre}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlagaEditando(null)}
                className="p-1.5 hover:bg-olive-100 text-olive-500 hover:text-olive-750 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {mensajeErrorEdicion && (
                <div className="flex items-start gap-2.5 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p>{mensajeErrorEdicion}</p>
                </div>
              )}
              {mensajeExitoEdicion && (
                <div className="flex items-start gap-2.5 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <p>{mensajeExitoEdicion}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-olive-650 mb-1">
                      Nombre de la Plaga
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreEdit}
                      onChange={(e) => setNombreEdit(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-olive-50/20 text-olive-950 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-olive-650 mb-1">
                      Descripción General
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={descripcionEdit}
                      onChange={(e) => setDescripcionEdit(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-olive-50/20 text-olive-950 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-olive-650 mb-1">
                      URL de la Imagen de Referencia
                    </label>
                    <input
                      type="text"
                      value={imagenEdit}
                      onChange={(e) => setImagenEdit(e.target.value)}
                      placeholder="/images/ejemplo.png"
                      className="w-full px-3 py-2.5 text-sm bg-olive-50/20 text-olive-950 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-olive-650 mb-1">
                      Síntomas Visuales
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={sintomasEdit}
                      onChange={(e) => setSintomasEdit(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-olive-50/20 text-olive-950 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-olive-650 mb-1">
                      Condiciones de Aparición
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={condicionesEdit}
                      onChange={(e) => setCondicionesEdit(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-olive-50/20 text-olive-950 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-green-700 mb-1">
                      Tratamiento Orgánico / Preventivo
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={organicoEdit}
                      onChange={(e) => setOrganicoEdit(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-olive-50/20 text-olive-950 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
                      Tratamiento Químico
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={quimicoEdit}
                      onChange={(e) => setQuimicoEdit(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-olive-50/20 text-olive-950 border border-olive-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-olive-650 mb-2">
                  Meses de Mayor Riesgo de Infección
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 bg-olive-50/30 p-4 rounded-xl border border-olive-100">
                  {MESES_DEL_ANIO.map((mes) => {
                    const seleccionado = mesesRiesgoEdit.includes(mes)
                    return (
                      <label
                        key={mes}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer select-none ${
                          seleccionado
                            ? 'bg-red-50 text-red-700 border-red-200 shadow-sm'
                            : 'bg-white text-olive-750 border-olive-200 hover:bg-olive-50/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => manejarToggleMes(mes)}
                          className="sr-only"
                        />
                        <span>{mes}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-olive-100 bg-olive-50/50">
              <button
                type="button"
                disabled={guardandoEdicion}
                onClick={() => setPlagaEditando(null)}
                className="px-4 py-2 text-xs font-semibold text-olive-750 bg-white hover:bg-olive-50 border border-olive-200 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoEdicion}
                className="px-4 py-2 text-xs font-semibold text-white bg-olive-500 hover:bg-olive-600 rounded-lg transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {plagaAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
          <div className="flex flex-col items-center gap-5 w-full max-w-sm p-6 bg-white border border-olive-100 rounded-2xl shadow-xl transform scale-100 transition-all duration-300">
            <div className="flex items-center justify-center w-14 h-14 bg-red-50 text-red-600 rounded-full border border-red-100 shadow-sm">
              <Trash2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-olive-950">
                Eliminar Plaga
              </h3>
              <p className="text-sm text-olive-750 leading-relaxed">
                ¿Está seguro de que desea eliminar permanentemente la plaga <strong className="text-olive-950 font-bold">&quot;{plagaAEliminar.nombre}&quot;</strong>? Esta acción no se puede deshacer y se borrará de la base de datos para todos los usuarios.
              </p>
            </div>

            {mensajeErrorEliminacion && (
              <div className="w-full flex items-start gap-2 p-3 bg-red-50 text-red-800 border border-red-150 rounded-lg text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{mensajeErrorEliminacion}</span>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                type="button"
                disabled={eliminandoPlaga}
                onClick={() => setPlagaAEliminar(null)}
                className="flex-1 py-2.5 bg-white hover:bg-olive-50 text-olive-750 text-sm font-semibold rounded-xl border border-olive-200 transition-colors cursor-pointer disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminandoPlaga}
                onClick={manejarEliminarPlaga}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-650 active:bg-red-750 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-60"
              >
                {eliminandoPlaga ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarConfirmarGuardar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
          <div className="flex flex-col items-center gap-5 w-full max-w-sm p-6 bg-white border border-olive-100 rounded-2xl shadow-xl transform scale-100 transition-all duration-300">
            <div className="flex items-center justify-center w-14 h-14 bg-olive-50 text-olive-650 rounded-full border border-olive-100 shadow-sm">
              <Save className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-olive-950">
                {creandoNuevaPlaga ? 'Registrar Plaga' : 'Guardar Cambios'}
              </h3>
              <p className="text-sm text-olive-750 leading-relaxed">
                {creandoNuevaPlaga
                  ? '¿Está seguro de que desea registrar esta nueva plaga en el catálogo?'
                  : `¿Está seguro de que desea guardar los cambios en la ficha técnica de "${nombreEdit}"?`
                }
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setMostrarConfirmarGuardar(false)}
                className="flex-1 py-2.5 bg-white hover:bg-olive-50 text-olive-750 text-sm font-semibold rounded-xl border border-olive-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarConfirmarGuardar(false)
                  manejarGuardarEdicion()
                }}
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
