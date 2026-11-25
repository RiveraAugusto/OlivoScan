'use client'
import { useEffect, useState } from 'react'
import ResultContent from '@/components/analisis/ResultContent'
import { PageHeader, Notice, Loading, fecha } from '@/components/ui/kit'
export default function Page() {
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    let alive = true
    const token = window.location.hash.slice(1)
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      queueMicrotask(() => {
        if (alive) setState({ error: 'Este enlace está incompleto o no es válido.' })
      })
      return
    }
    fetch('/api/compartido', { headers: { Authorization: 'Enlace ' + token }, cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'El enlace ha vencido o fue revocado.')
        if (alive) setState({ data: payload.datos, token })
      })
      .catch((e) => {
        if (alive) setState({ error: e.message })
      })
    return () => {
      alive = false
    }
  }, [])
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <PageHeader
        eyebrow="ACCESO AUTORIZADO TEMPORAL"
        title="Muestra compartida"
        description="Solo se muestran los datos autorizados por su propietario."
      />
      {state.loading ? (
        <Loading />
      ) : state.error ? (
        <Notice type="error">{state.error}</Notice>
      ) : (
        <>
          <Notice>
            Acceso válido hasta {fecha(state.data.vence_en)}. El propietario puede revocarlo antes.
          </Notice>
          <ResultContent analysis={state.data} shareToken={state.token} shared />
        </>
      )}
    </div>
  )
}
