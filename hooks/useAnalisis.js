// ============================================================
// NOMBRE OBJETO: hooks/useAnalisis.js
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-01, RF-02, RF-03
// DESCRIPCION: Hook personalizado de React para encapsular las peticiones
//              al endpoint de análisis (/api/analisis) y la gestión
//              de retroalimentación (feedback) del diagnóstico.
// ============================================================

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook personalizado para orquestar la inferencia foliar y la retroalimentación.
 */
export function useAnalisis() {
  const [cargando, setCargando] = useState(false)
  const [errorAnalisis, setErrorAnalisis] = useState(null)

  /**
   * Envía el archivo de imagen de la hoja de olivo al backend para su diagnóstico.
   * @param {File} archivoImagen - Archivo de imagen seleccionado.
   * @returns {Promise<Object>} Datos del análisis registrado en Supabase.
   */
  async function crearAnalisis(archivoImagen) {
    // Fail Fast: Validación temprana de tipo y presencia
    if (!archivoImagen || !(archivoImagen instanceof File)) {
      const errorMsg = 'Debe proporcionar un archivo de imagen válido para realizar el análisis.'
      setErrorAnalisis(errorMsg)
      throw new Error(errorMsg)
    }

    setCargando(true)
    setErrorAnalisis(null)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Debe iniciar sesión para realizar un diagnóstico.')
      }

      const formData = new FormData()
      formData.append('imagen', archivoImagen)

      const response = await fetch('/api/analisis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      const resJson = await response.json()

      if (!response.ok || resJson.error) {
        throw new Error(resJson.error || 'Ocurrió un error inesperado al analizar la imagen.')
      }

      return resJson.datos
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error inesperado durante el análisis.'
      setErrorAnalisis(mensaje)
      throw new Error(mensaje)
    } finally {
      setCargando(false)
    }
  }

  /**
   * Persiste la retroalimentación del diagnóstico y las notas de campo en Supabase.
   * @param {string} idAnalisis - Identificador único UUID del análisis.
   * @param {string|null} plagaCorregida - Nombre de la plaga seleccionada si hubo corrección.
   * @param {string} [notas] - Observaciones textuales del cultivo.
   * @returns {Promise<Object>} Registro actualizado del análisis.
   */
  async function guardarFeedback(idAnalisis, plagaCorregida, notas) {
    // Fail Fast: Validación temprana de identificador
    if (!idAnalisis || typeof idAnalisis !== 'string') {
      const errorMsg = 'Identificador de análisis inválido o no proporcionado.'
      setErrorAnalisis(errorMsg)
      throw new Error(errorMsg)
    }

    setCargando(true)
    setErrorAnalisis(null)

    try {
      const { data, error } = await supabase
        .from('analisis')
        .update({
          plaga_corregida: plagaCorregida ? plagaCorregida.trim() : null,
          notas: notas ? notas.trim() : null,
        })
        .eq('id', idAnalisis)
        .select()
        .single()

      if (error) {
        throw new Error('No se pudo guardar la retroalimentación en el servidor.')
      }

      return data
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al persistir la retroalimentación.'
      setErrorAnalisis(mensaje)
      throw new Error(mensaje)
    } finally {
      setCargando(false)
    }
  }

  return {
    cargando,
    errorAnalisis,
    crearAnalisis,
    guardarFeedback,
  }
}

export default useAnalisis
