// ============================================================
// NOMBRE OBJETO: components/analisis/AnalisisResultado.jsx
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-03 (Diagnóstico completo y feedback del usuario)
// DESCRIPCION: Componente para visualizar el resultado del diagnóstico,
//              métricas de confianza, severidad y formulario para
//              ingresar notas de campo y retroalimentación del agricultor.
// ============================================================

import React, { useState } from 'react'
import { CheckCircle2, AlertCircle, Save, ArrowLeft, Info, HelpCircle } from 'lucide-react'
import AnalisisNivelConfianza from './AnalisisNivelConfianza'
import AnalisisNivelSeveridad from './AnalisisNivelSeveridad'
import AnalisisRecomendacionTratamiento from './AnalisisRecomendacionTratamiento'

// Constantes de configuración
const LONGITUD_ID_CORTO = 8

export const OPCIONES_PLAGAS = [
  'Mosca del olivo',
  'Prays del olivo (Polilla)',
  'Cochinilla tiznada (Saissetia oleae)',
  'Repilo del olivo (Spilocaea oleagina)',
  'Hoja Sana',
  'Otra plaga no identificada'
]

/**
 * Componente principal para visualizar el diagnóstico detallado de la hoja de olivo,
 * métricas de confianza, severidad, tratamientos y formulario de retroalimentación de campo.
 *
 * @param {Object} props
 * @param {Object} [props.analisis] - Objeto con los datos del análisis registrado.
 * @param {Object} [props.objAnalisis] - Prop retrocompatible con datos del análisis.
 * @param {() => void} props.onReiniciar - Callback para regresar y analizar una nueva hoja.
 * @param {(id: string, plagaCorregida: string|null, notas: string) => Promise<any>} [props.onGuardarFeedback] - Función de persistencia.
 * @param {(id: string, plagaCorregida: string|null, notas: string) => Promise<any>} [props.guardarFeedbackHook] - Prop retrocompatible de persistencia.
 */
export default function AnalisisResultado({
  analisis,
  objAnalisis,
  onReiniciar,
  onGuardarFeedback,
  guardarFeedbackHook
}) {
  const datosAnalisis = analisis || objAnalisis
  const guardarFeedbackFn = onGuardarFeedback || guardarFeedbackHook

  const [diagnosticoCorrecto, setDiagnosticoCorrecto] = useState(null)
  const [plagaCorregida, setPlagaCorregida] = useState('')
  const [notas, setNotas] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null)

  // Fail Fast: Asegurar existencia de datos antes de renderizar
  if (!datosAnalisis?.id) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 border border-red-100 rounded-xl text-sm font-medium">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
        <span>No se encontraron datos válidos del diagnóstico.</span>
      </div>
    )
  }

  const idCorto = datosAnalisis.id.substring(0, LONGITUD_ID_CORTO)

  async function manejarGuardarFeedback(evento) {
    evento.preventDefault()

    // Fail Fast: Validar selección de plaga si se marcó como incorrecto
    if (diagnosticoCorrecto === false && !plagaCorregida.trim()) {
      setErrorEnvio('Por favor, seleccione la plaga observada antes de guardar.')
      return
    }

    setGuardando(true)
    setErrorEnvio(null)
    setGuardadoExitoso(false)

    try {
      const valorPlagaCorregida = diagnosticoCorrecto === false ? plagaCorregida : null
      if (guardarFeedbackFn) {
        await guardarFeedbackFn(datosAnalisis.id, valorPlagaCorregida, notas)
      }
      setGuardadoExitoso(true)
    } catch {
      setErrorEnvio('No se pudo guardar la información. Por favor intente nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between w-full">
        <button
          type="button"
          onClick={onReiniciar}
          className="inline-flex items-center gap-2 text-sm font-semibold text-olive-700 hover:text-olive-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Analizar otra imagen
        </button>
        <span className="text-xs text-olive-600 bg-olive-100/60 px-3 py-1 rounded-full font-medium">
          ID: {idCorto}...
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <div className="flex flex-col gap-4 w-full">
          <div className="relative aspect-square w-full bg-olive-50 rounded-2xl overflow-hidden border border-olive-200 shadow-sm">
            <img
              src={datosAnalisis.imagen_url}
              alt="Hoja de olivo analizada"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2 p-4 bg-olive-50 text-olive-700 border border-olive-100 rounded-xl text-xs leading-relaxed">
            <Info className="w-4 h-4 flex-shrink-0 text-olive-600" />
            <span>
              La imagen ha sido procesada exitosamente. Modelo utilizado: <strong>{datosAnalisis.modelo_version}</strong>.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full bg-white p-6 rounded-2xl border border-olive-100 shadow-glass">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-olive-400">
              Resultado Detectado
            </span>
            <h3 className="text-2xl font-bold text-olive-950">
              {datosAnalisis.plaga_detectada}
            </h3>
          </div>

          <hr className="border-olive-100" />
          <AnalisisNivelConfianza confianza={Number(datosAnalisis.confianza)} />

          <hr className="border-olive-100" />
          <AnalisisNivelSeveridad severidad={datosAnalisis.severidad} />

          <hr className="border-olive-100" />
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-olive-800">
              Detalle y Síntomas del diagnóstico
            </h4>
            <p className="text-sm text-olive-750 leading-relaxed bg-olive-50/50 p-4 rounded-xl border border-olive-100/50">
              {datosAnalisis.descripcion || 'Sin síntomas observados o diagnóstico de hoja sana.'}
            </p>
          </div>
        </div>
      </div>

      {datosAnalisis.recomendacion && (
        <AnalisisRecomendacionTratamiento recomendacionRaw={datosAnalisis.recomendacion} />
      )}

      <div className="w-full bg-white p-6 rounded-2xl border border-olive-100 shadow-glass">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-5 h-5 text-olive-600" />
          <h3 className="text-lg font-bold text-olive-950">
            Retroalimentación y Notas de Campo (Opcional)
          </h3>
        </div>

        {guardadoExitoso && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 text-green-800 border border-green-100 rounded-xl text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600" />
            <span>Se ha guardado tu retroalimentación y notas de campo correctamente.</span>
          </div>
        )}

        {errorEnvio && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 text-red-800 border border-red-100 rounded-xl text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{errorEnvio}</span>
          </div>
        )}

        <form onSubmit={manejarGuardarFeedback} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-olive-900">
              ¿Consideras que el diagnóstico de la IA fue correcto? (Opcional)
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setDiagnosticoCorrecto(true)
                  setPlagaCorregida('')
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                  diagnosticoCorrecto === true
                    ? 'bg-olive-500 text-white border-olive-600 shadow-sm'
                    : 'bg-white text-olive-750 border-olive-200 hover:bg-olive-50/50'
                }`}
              >
                Sí, es correcto
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiagnosticoCorrecto(false)
                  if (!plagaCorregida) {
                    setPlagaCorregida(OPCIONES_PLAGAS[0])
                  }
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                  diagnosticoCorrecto === false
                    ? 'bg-earth-500 text-white border-earth-600 shadow-sm'
                    : 'bg-white text-olive-750 border-olive-200 hover:bg-olive-50/50'
                }`}
              >
                No, es incorrecto
              </button>
            </div>
          </div>

          {diagnosticoCorrecto === false && (
            <div className="space-y-2 animate-fadeIn">
              <label htmlFor="plagaCorregida" className="block text-xs font-bold uppercase tracking-wider text-olive-800">
                Selecciona la plaga real que identificas
              </label>
              <select
                id="plagaCorregida"
                value={plagaCorregida}
                onChange={(e) => setPlagaCorregida(e.target.value)}
                className="block w-full p-3 bg-white text-olive-900 text-sm rounded-lg border border-olive-200 shadow-sm focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none"
              >
                {OPCIONES_PLAGAS.map((plaga) => (
                  <option key={plaga} value={plaga}>
                    {plaga}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="notasCampo" className="block text-xs font-bold uppercase tracking-wider text-olive-800">
              Notas de campo del cultivo
            </label>
            <textarea
              id="notasCampo"
              rows={4}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Escribe detalles adicionales relevantes (clima, estado general del olivo, observaciones de la finca)..."
              className="block w-full p-3 bg-white text-olive-900 text-sm rounded-lg border border-olive-200 shadow-sm focus:border-olive-500 focus:ring-1 focus:ring-olive-500 focus:outline-none placeholder-olive-400"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-olive-500 hover:bg-olive-600 disabled:bg-olive-300 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
            >
              {guardando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Diagnóstico y Notas
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {guardadoExitoso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="flex flex-col items-center gap-5 w-full max-w-sm p-6 bg-white border border-olive-150 rounded-2xl shadow-xl">
            <div className="flex items-center justify-center w-14 h-14 bg-olive-50 text-olive-500 rounded-full border border-olive-100 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-olive-950">
                Guardado Exitoso
              </h3>
              <p className="text-sm text-olive-750 leading-relaxed">
                El diagnóstico y tus notas de campo han sido registrados correctamente en el historial.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setGuardadoExitoso(false)
                onReiniciar()
              }}
              className="w-full py-3 bg-olive-500 hover:bg-olive-600 active:bg-olive-750 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
