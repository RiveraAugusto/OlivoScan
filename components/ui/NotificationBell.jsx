'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useResource } from '@/hooks/useResource'
import { api } from '@/lib/client-api'
import { Modal, Button, Loading, Notice, Empty, fecha } from './kit'
export default function NotificationBell() {
  const [open, setOpen] = useState(false),
    [error, setError] = useState(null)
  const resource = useResource(open ? '/api/notificaciones' : null)
  async function read(id) {
    try {
      await api('/api/notificaciones', { method: 'PUT', body: { id } })
      resource.reload()
    } catch (e) {
      setError(e.message)
    }
  }
  return (
    <>
      <Button
        variant="secondary"
        className="btn-icon"
        aria-label="Abrir notificaciones"
        onClick={() => setOpen(true)}
      >
        <Bell size={22} />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Notificaciones">
        <div className="stack">
          {(error || resource.error) && <Notice type="error">{error || resource.error}</Notice>}
          {resource.loading ? (
            <Loading />
          ) : resource.data?.length ? (
            resource.data.map((n) => (
              <article className="panel stack" key={n.id}>
                <p>{n.mensaje}</p>
                <span className="muted">{fecha(n.creado_en)}</span>
                <div className="actions">
                  {n.solicitud_id && (
                    <Link
                      className="btn btn-secondary"
                      href="/revisiones"
                      onClick={() => setOpen(false)}
                    >
                      Ver revisiones
                    </Link>
                  )}
                  {!n.leida && (
                    <Button variant="secondary" onClick={() => read(n.id)}>
                      Marcar como leída
                    </Button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <Empty title="Está al día">
              Aquí aparecerán los avisos de sus análisis y revisiones.
            </Empty>
          )}
        </div>
      </Modal>
    </>
  )
}
