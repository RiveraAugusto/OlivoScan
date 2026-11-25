'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/client-api'
export function useResource(path) {
  const [snapshot, setSnapshot] = useState({ path: null, data: null, error: null, loading: true })
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    async function load() {
      if (!path) return
      await Promise.resolve()
      if (!active) return
      setSnapshot((prev) => ({ ...prev, path, loading: true, error: null }))
      try {
        const response = await api(path, { signal: controller.signal })
        if (active)
          setSnapshot({ path, ...response, data: response.datos, loading: false, error: null })
      } catch (error) {
        if (active && error.name !== 'AbortError')
          setSnapshot({ path, data: null, loading: false, error: error.message })
      }
    }
    load()
    return () => {
      active = false
      controller.abort()
    }
  }, [path, version])
  return {
    ...(snapshot.path === path ? snapshot : { data: null, loading: !!path, error: null }),
    reload,
  }
}
