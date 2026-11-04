// ============================================================
// ARCHIVO: components/comparar/CompararResultado.jsx
// MODULO: Comparar
// DESCRIPCION: Componente que visualiza lado a lado el analisis
//              historico (base) y el nuevo diagnostico de IA,
//              permitiendo agregar notas y validar el nuevo resultado.
// SPRINT: Adicional (Comparador Evolutivo)
// RF: RF-003, RF-005
// ============================================================

import React, { useState } from 'react'
import { Calendar, AlertTriangle, ArrowRight, Save, RefreshCw, CheckCircle, Info, HelpCircle } from 'lucide-react'

// Colores asociados a severidad para pintar insignias (Badges)
const COLORES_SEVERIDAD = {
  leve: 'bg-green-50 text-green-700 border-green-200',
  moderado: 'bg-amber-50 text-amber-700 border-amber-200',
  grave: 'bg-red-50 text-red-700 border-red-200'
}

// Catalogo predefinido de plagas para que el usuario pueda corregir el diagnostico de IA
const OPCIONES_PLAGAS = [
  'Mosca del olivo',
  'Prays del olivo (Polilla)',
  'Cochinilla tiznada (Saissetia oleae)',
  'Repilo del olivo (Spilocaea oleagina)',
  'Hoja Sana',
  'Otra plaga no identificada'
]

function ClsCompararResultado({
  objAnalisisOriginal,
  objAnalisisNuevo,
  alGuardarNotas,
  cargandoGuardado,
  alReiniciar
}) {
  // Estados para gestionar la edicion de la retroalimentacion y notas del nuevo analisis
  const [diagnosticoCorrecto, setDiagnosticoCorrecto] = useState(null) // null = sin elegir, true = si, false = no
  const [plagaCorregida, setPlagaCorregida] = useState('')
  const [notas, setNotas] = useState('')

  // Estado local para controlar la visualizacion del modal de confirmacion
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)

  // Asegurarnos de ordenar cronologicamente para determinar cuál es el punto inicial
  const fechaOriginal = new Date(objAnalisisOriginal.creado_en)
  const fechaNueva = new Date(objAnalisisNuevo.creado_en)

  const strFechaOriginal = fechaOriginal.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
  const strFechaNueva = fechaNueva.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  // Determinar la evolucion de severidad
  const nivelesSeveridad = { leve: 1, moderado: 2, grave: 3 }
  const nivelOriginal = nivelesSeveridad[objAnalisisOriginal.severidad] || 0
  const nivelNuevo = nivelesSeveridad[objAnalisisNuevo.severidad] || 0

  let mensajeEvolucion = ''
  if (objAnalisisOriginal.plaga_detectada === objAnalisisNuevo.plaga_detectada) {
    if (nivelNuevo < nivelOriginal) {
      mensajeEvolucion = 'Se observa una mejoría en el estado del cultivo. El nivel de severidad ha disminuido.'
    } else if (nivelNuevo > nivelOriginal) {
      mensajeEvolucion = 'Se observa un empeoramiento en la severidad de la plaga. Se recomienda reforzar el tratamiento.'
    } else {
      mensajeEvolucion = 'El estado de la plaga se mantiene estable sin cambios en la severidad.'
    }
  } else {
    mensajeEvolucion = `Se detecta una transición en el diagnóstico de la planta. Pasó de "${objAnalisisOriginal.plaga_detectada}" a "${objAnalisisNuevo.plaga_detectada}".`
  }

  // Confirmar el guardado y llamar al callback
  async function confirmarGuardado() {
    setMostrarConfirmacion(false)
    try {
      await alGuardarNotas(null, null)
      setMostrarExito(true)
    } catch (error) {
      console.error('Error al confirmar guardado en CompararResultado:', error)
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn w-full">
      {/* Cabecera del Comparador */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-olive-100 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-olive-950">
            Comparativa Evolutiva y Diagnóstico
          </h3>
          <p className="text-xs text-olive-600">
            Evaluando el estado de la hoja de referencia contra la nueva muestra procesada.
          </p>
        </div>
        <button
          type="button"
          onClick={alReiniciar}
          className="px-4 py-2 text-xs font-bold text-olive-750 hover:bg-olive-50 rounded-xl border border-olive-200 flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Nueva Comparación
        </button>
      </div>

      {/* Grid de Comparacion Lado a Lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Panel 1: Analisis Historico (Punto Inicial) */}
        <div className="bg-white rounded-2xl border border-olive-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-olive-650 bg-olive-50 px-2 py-0.5 rounded border border-olive-150">
                Punto Inicial (Referencia)
              </span>
              <span className="text-xs font-bold text-olive-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {strFechaOriginal}
              </span>
            </div>

            <div className="aspect-[4/3] w-full rounded-xl bg-olive-50 border border-olive-150 overflow-hidden shadow-sm">
              <img
                src={objAnalisisOriginal.imagen_url}
                alt="Estado Anterior"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-olive-400 uppercase tracking-widest block">Diagnóstico de la referencia</span>
              <h4 className="text-base font-bold text-olive-950">
                {objAnalisisOriginal.plaga_corregida || objAnalisisOriginal.plaga_detectada}
              </h4>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                  COLORES_SEVERIDAD[objAnalisisOriginal.severidad]
                }`}>
                  Severidad {objAnalisisOriginal.severidad}
                </span>
                <span className="text-[11px] text-olive-600 font-semibold">
                  Confianza: {Number(objAnalisisOriginal.confianza).toFixed(1)}%
                </span>
              </div>
            </div>

            <hr className="border-olive-50" />

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-olive-400 uppercase tracking-widest block">Notas de campo anteriores</span>
              <p className="text-xs text-olive-750 leading-relaxed italic bg-olive-50/20 p-3 rounded-lg border border-olive-50">
                {objAnalisisOriginal.notas || 'Sin notas registradas en este diagnóstico.'}
              </p>
            </div>
          </div>
        </div>

        {/* Panel 2: Nuevo Analisis (Seguimiento / En Tiempo Real) */}
        <div className="bg-white rounded-2xl border border-olive-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                Seguimiento (Actual)
              </span>
              <span className="text-xs font-bold text-olive-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {strFechaNueva}
              </span>
            </div>

            <div className="aspect-[4/3] w-full rounded-xl bg-olive-50 border border-olive-150 overflow-hidden shadow-sm">
              <img
                src={objAnalisisNuevo.imagen_url}
                alt="Nuevo Estado"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-olive-400 uppercase tracking-widest block">Resultado de la IA</span>
              <h4 className="text-base font-bold text-olive-950">
                {objAnalisisNuevo.plaga_detectada}
              </h4>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                  COLORES_SEVERIDAD[objAnalisisNuevo.severidad]
                }`}>
                  Severidad {objAnalisisNuevo.severidad}
                </span>
                <span className="text-[11px] text-olive-600 font-semibold">
                  Confianza: {Number(objAnalisisNuevo.confianza).toFixed(1)}%
                </span>
              </div>
            </div>

            <hr className="border-olive-50" />

            {/* Descripcion de la Plaga */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-olive-400 uppercase tracking-widest block">Detalle y síntomas</span>
              <p className="text-xs text-olive-750 leading-relaxed bg-olive-50/20 p-3 rounded-lg border border-olive-50">
                {objAnalisisNuevo.descripcion || 'No hay descripción adicional disponible.'}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Franja de conclusión comparativa */}
      <div className="bg-olive-50/40 p-5 border border-olive-100 rounded-2xl flex items-start gap-3.5 text-xs text-olive-800">
        <AlertTriangle className="w-5 h-5 text-olive-650 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-olive-900 block uppercase tracking-wide text-[10px]">Conclusión Comparativa</span>
          <p className="leading-relaxed">
            Evaluando desde el punto inicial ({strFechaOriginal}) hasta el seguimiento actual:
            <strong className="block mt-1 font-semibold text-olive-950">{mensajeEvolucion}</strong>
          </p>
        </div>
      </div>

      {/* Seccion del boton de confirmacion de guardado directo */}
      <div className="bg-white p-6 rounded-2xl border border-olive-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-left space-y-1">
          <h4 className="text-sm font-bold text-olive-950">
            Confirmar y finalizar comparación
          </h4>
          <p className="text-[11px] text-olive-650">
            Haga clic en Guardar para registrar este análisis de seguimiento en su historial de diagnósticos y finalizar el proceso.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMostrarConfirmacion(true)}
          disabled={cargandoGuardado}
          className="px-6 py-3 bg-olive-500 hover:bg-olive-600 disabled:bg-olive-300 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
        >
          <Save className="w-4 h-4" />
          {cargandoGuardado ? 'Guardando...' : 'Guardar y Finalizar'}
        </button>
      </div>

      {/* ============================================================ */}
      {/* MODAL POPUP: CONFIRMACIÓN DE GUARDADO (Estilo premium sin emojis) */}
      {/* ============================================================ */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 w-full max-w-sm p-6 bg-white border border-olive-100 rounded-2xl shadow-xl animate-scaleUp">
            <div className="flex items-center justify-center w-14 h-14 bg-olive-50 text-olive-600 rounded-full border border-olive-100 shadow-sm">
              <Info className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-olive-950">
                Guardar Diagnóstico
              </h3>
              <p className="text-xs text-olive-750 leading-relaxed">
                ¿Está seguro de que desea guardar este nuevo diagnóstico evolutivo en su historial?
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 py-2 bg-white hover:bg-olive-50 text-olive-700 text-xs font-bold rounded-lg border border-olive-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarGuardado}
                className="flex-1 py-2 bg-olive-500 hover:bg-olive-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL POPUP: ÉXITO DEL GUARDADO (Estilo premium sin emojis) */}
      {/* ============================================================ */}
      {mostrarExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 w-full max-w-sm p-6 bg-white border border-olive-100 rounded-2xl shadow-xl animate-scaleUp text-center">
            <div className="flex items-center justify-center w-14 h-14 bg-green-50 text-green-600 rounded-full border border-green-150 shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-olive-950">
                Registro Exitoso
              </h3>
              <p className="text-xs text-olive-750 leading-relaxed">
                El análisis de seguimiento ha sido guardado exitosamente en su historial de diagnósticos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMostrarExito(false)
                // Redirigir al historial para ver los resultados
                window.location.href = '/historial'
              }}
              className="w-full py-2.5 bg-olive-500 hover:bg-olive-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Aceptar y Ver Historial
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClsCompararResultado
