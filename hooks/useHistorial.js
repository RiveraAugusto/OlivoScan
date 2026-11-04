// ============================================================
// NOMBRE OBJETO: hooks/useHistorial.js
// FECHA CREACION: 2026-08-31
// PROPIETARIO: Equipo de Desarrollo OlivoScan
// REQUERIMIENTO: RF-05 (Historial de análisis con filtros y comparación)
// DESCRIPCION: Hook personalizado para consultar y gestionar el historial
//              de diagnósticos foliares del agricultor en Supabase.
// ============================================================

'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook personalizado para la gestión y consulta del historial de análisis fitosanitarios.
 */
export function useHistorial() {
  const [cargando, setCargando] = useState(false)
  const [errorHistorial, setErrorHistorial] = useState(null)
  const [listaAnalisis, setListaAnalisis] = useState([])

  /**
   * Consulta y recupera la lista completa de análisis del usuario activo.
   * @returns {Promise<Array<Object>>} Colección de análisis.
   */
  const cargarHistorial = useCallback(async () => {
    setCargando(true)
    setErrorHistorial(null)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Debe iniciar sesión para ver el historial de análisis.')
      }

      const response = await fetch('/api/historial', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const resJson = await response.json()

      if (!response.ok || resJson.error) {
        throw new Error(resJson.error || 'Ocurrió un error inesperado al cargar el historial.')
      }

      const datos = resJson.datos || []
      setListaAnalisis(datos)
      return datos
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error inesperado al cargar el historial.'
      setErrorHistorial(mensaje)
      throw new Error(mensaje)
    } finally {
      setCargando(false)
    }
  }, [])

  /**
   * Elimina un diagnóstico del historial por su identificador único UUID.
   * @param {string} idAnalisis - Identificador del análisis a eliminar.
   * @returns {Promise<void>}
   */
  async function eliminarAnalisis(idAnalisis) {
    // Fail Fast: Validación de argumento
    if (!idAnalisis || typeof idAnalisis !== 'string') {
      const errorMsg = 'Identificador de análisis inválido o no proporcionado.'
      setErrorHistorial(errorMsg)
      throw new Error(errorMsg)
    }

    setCargando(true)
    setErrorHistorial(null)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Debe iniciar sesión para realizar esta operación.')
      }

      const response = await fetch(`/api/historial?id=${idAnalisis}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const resJson = await response.json()

      if (!response.ok || resJson.error) {
        throw new Error(resJson.error || 'Ocurrió un error inesperado al eliminar el análisis.')
      }

      setListaAnalisis((listaAnterior) => listaAnterior.filter((item) => item.id !== idAnalisis))
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al eliminar el análisis.'
      setErrorHistorial(mensaje)
      throw new Error(mensaje)
    } finally {
      setCargando(false)
    }
  }

  return {
    cargando,
    errorHistorial,
    listaAnalisis,
    objAnalisisLista: listaAnalisis, // Soporte retrocompatible
    cargarHistorial,
    eliminarAnalisis,
  }
}

export default useHistorial
