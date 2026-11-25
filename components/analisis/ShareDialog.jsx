'use client'
import { useState } from 'react'
import { api } from '@/lib/client-api'
import { useResource } from '@/hooks/useResource'
import { Modal, Button, Notice, Loading, fecha } from '@/components/ui/kit'
const labels = {
  diagnostico: 'Diagnóstico original de IA',
  recomendacion: 'Orientaciones preliminares',
  imagen: 'Fotografía',
  revision: 'Revisiones y autoría profesional',
  notas: 'Notas y corrección del agricultor',
  ubicacion: 'Parcela e identificador del olivo',
}
export default function ShareDialog({ analysis, open, onClose }) {
  const resource = useResource(open ? '/api/enlaces?analisis_id=' + analysis.id : null),
    [fields, setFields] = useState(['diagnostico', 'recomendacion']),
    [url, setUrl] = useState(null),
    [error, setError] = useState(null),
    [message, setMessage] = useState(null),
    [busy, setBusy] = useState(false)
  async function create(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setUrl(null)
    try {
      const r = await api('/api/enlaces', {
        method: 'POST',
        body: {
          analisis_id: analysis.id,
          campos: fields,
          dias: Number(new FormData(e.currentTarget).get('dias')),
        },
      })
      setUrl(r.datos.url)
      resource.reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  async function revoke(id) {
    setBusy(true)
    setError(null)
    try {
      await api('/api/enlaces', { method: 'DELETE', body: { id } })
      setUrl(null)
      setMessage(
        'Enlace revocado. Las futuras solicitudes, incluida la imagen, quedarán bloqueadas.',
      )
      resource.reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open={open} onClose={onClose} title="Compartir con autorización">
      <div className="stack">
        <Notice>
          Quien posea el enlace podrá consultar únicamente los datos seleccionados hasta su
          vencimiento o revocación. La revocación impide nuevas consultas; una copia ya descargada
          no puede recuperarse.
        </Notice>
        {(error || resource.error) && <Notice type="error">{error || resource.error}</Notice>}
        {message && <Notice type="success">{message}</Notice>}
        <form onSubmit={create} className="stack">
          <fieldset>
            <legend>Datos que autoriza compartir</legend>
            {Object.entries(labels).map(([value, label]) => (
              <label className="checkbox-label" key={value}>
                <input
                  type="checkbox"
                  checked={fields.includes(value)}
                  disabled={value === 'imagen' && !analysis.imagen_privada}
                  onChange={(e) =>
                    setFields((v) =>
                      e.target.checked ? [...v, value] : v.filter((f) => f !== value),
                    )
                  }
                />
                {label}
                {value === 'imagen' && !analysis.imagen_privada
                  ? ' (requiere migración privada)'
                  : ''}
              </label>
            ))}
          </fieldset>
          <label htmlFor="share-days">
            Vencimiento en días
            <input
              id="share-days"
              name="dias"
              type="number"
              min={1}
              max={30}
              defaultValue={7}
              required
            />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" required />
            Autorizo explícitamente compartir los datos marcados.
          </label>
          <Button disabled={busy || !fields.length}>
            {busy ? 'Procesando…' : 'Crear enlace autorizado'}
          </Button>
        </form>
        {url && (
          <div className="panel stack">
            <label htmlFor="created-link">
              Enlace creado (cópielo ahora)
              <textarea id="created-link" readOnly value={url} />
            </label>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url)
                  setMessage('Enlace copiado.')
                } catch {
                  setMessage('Seleccione el enlace y cópielo manualmente.')
                }
              }}
            >
              Copiar enlace
            </Button>
          </div>
        )}
        <h3>Enlaces emitidos</h3>
        {resource.loading ? (
          <Loading />
        ) : resource.data?.length ? (
          resource.data.map((link) => (
            <article key={link.id} className="panel stack">
              <p>{link.campos.map((f) => labels[f]).join(' · ')}</p>
              <p>Vence: {fecha(link.vence_en)}</p>
              {link.revocado_en ? (
                <span className="tag">Revocado</span>
              ) : new Date(link.vence_en) <= new Date() ? (
                <span className="tag">Vencido</span>
              ) : (
                <Button variant="danger" disabled={busy} onClick={() => revoke(link.id)}>
                  Revocar enlace del {fecha(link.creado_en)}
                </Button>
              )}
            </article>
          ))
        ) : (
          <p className="muted">No ha creado enlaces para esta muestra.</p>
        )}
      </div>
    </Modal>
  )
}
