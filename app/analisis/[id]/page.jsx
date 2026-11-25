'use client'
import { useRouter } from 'next/navigation'
import { use, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useResource } from '@/hooks/useResource'
import { api } from '@/lib/client-api'
import { generarPDF } from '@/lib/pdf'
import { estadoRevision } from '@/lib/contracts'
import ResultContent from '@/components/analisis/ResultContent'
import ShareDialog from '@/components/analisis/ShareDialog'
import SelectorParcela from '@/components/parcelas/SelectorParcela'
import {
  PageHeader,
  Button,
  Notice,
  Loading,
  ActionLink,
  StatusTag,
  Modal,
} from '@/components/ui/kit'
export default function Page({ params }) {
  const router = useRouter()
  const { id } = use(params),
    resource = useResource('/api/analisis/' + id),
    { objUsuario, objPerfil } = useAuth()
  const [share, setShare] = useState(false),
    [error, setError] = useState(null),
    [message, setMessage] = useState(null),
    [busy, setBusy] = useState(false),
    [association, setAssociation] = useState(null),
    [retire, setRetire] = useState(false)
  const a = resource.data,
    owner = a?.usuario_id === objUsuario?.id
  async function action(fn, text) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await fn()
      if (text) setMessage(text)
      resource.reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  if (resource.loading)
    return (
      <div className="page">
        <Loading />
      </div>
    )
  if (!a)
    return (
      <div className="page">
        <Notice type="error">{resource.error || 'El análisis no está disponible.'}</Notice>
        <ActionLink href="/historial" variant="secondary">
          Volver al historial
        </ActionLink>
      </div>
    )
  return (
    <div className="page">
      <PageHeader
        eyebrow="MUESTRA DEL OLIVAR"
        title="Resultado del análisis"
        description="El diagnóstico original se conserva junto a las observaciones y versiones de revisión."
        action={
          <div className="actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => action(() => generarPDF(a, objPerfil?.nombre))}
            >
              Descargar PDF
            </Button>
            {owner && <Button onClick={() => setShare(true)}>Compartir</Button>}
          </div>
        }
      />
      {error && <Notice type="error">{error}</Notice>}
      {message && <Notice type="success">{message}</Notice>}
      <div className="actions">
        <StatusTag state={estadoRevision(a)} />
        <ActionLink href="/historial" variant="secondary">
          Volver al historial
        </ActionLink>
      </div>
      <ResultContent analysis={a} />
      {owner && (
        <>
          <section className="panel stack">
            <h2>Solicitar revisión profesional</h2>
            <p>
              Un administrador asignará un agrónomo autorizado. El especialista tendrá acceso a esta
              muestra y a sus observaciones mientras esté asignado.
            </p>
            {(a.solicitudes || []).some((s) => ['pendiente', 'en_revision'].includes(s.estado)) ? (
              <ActionLink href="/revisiones" variant="secondary">
                Consultar solicitud
              </ActionLink>
            ) : (
              <Button
                disabled={busy}
                onClick={() =>
                  action(
                    () => api('/api/revisiones', { method: 'POST', body: { analisis_id: a.id } }),
                    'Solicitud enviada para asignación.',
                  )
                }
              >
                Solicitar revisión agronómica
              </Button>
            )}
          </section>
          <section className="panel stack">
            <h2>Mis observaciones</h2>
            <form
              key={a.notas + '|' + a.plaga_corregida}
              className="stack"
              onSubmit={(e) => {
                e.preventDefault()
                const f = new FormData(e.currentTarget)
                action(
                  () =>
                    api('/api/analisis/' + id, {
                      method: 'PATCH',
                      body: { notas: f.get('notas'), plaga_corregida: f.get('correccion') || null },
                    }),
                  'Observaciones guardadas.',
                )
              }}
            >
              <label htmlFor="notes">
                Notas del agricultor
                <textarea id="notes" name="notas" maxLength={4000} defaultValue={a.notas || ''} />
              </label>
              <label htmlFor="farmer-correction">
                Corrección sugerida por el agricultor (opcional)
                <input
                  id="farmer-correction"
                  name="correccion"
                  maxLength={200}
                  defaultValue={a.plaga_corregida || ''}
                />
              </label>
              <p className="muted">
                Se guardan como información del agricultor y no reemplazan el resultado de IA ni la
                revisión agronómica.
              </p>
              <Button disabled={busy}>Guardar observaciones</Button>
            </form>
          </section>
          <section className="panel stack">
            <h2>Asociación de parcela y olivo</h2>
            <p>Asignar o corregir esta asociación no modifica los hallazgos originales.</p>
            {association ? (
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault()
                  action(async () => {
                    await api('/api/analisis/' + id, {
                      method: 'PATCH',
                      body: {
                        asociacion: true,
                        parcela_id: association.parcela,
                        olivo_id: association.olivo || null,
                      },
                    })
                    setAssociation(null)
                  }, 'Asociación actualizada.')
                }}
              >
                <SelectorParcela
                  {...association}
                  onChange={(parcela, olivo) => setAssociation({ parcela, olivo })}
                />
                <div className="actions">
                  <Button disabled={busy}>Guardar asociación</Button>
                  <Button type="button" variant="secondary" onClick={() => setAssociation(null)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="secondary"
                onClick={() =>
                  setAssociation({ parcela: a.parcela_id || '', olivo: a.olivo_id || '' })
                }
              >
                {a.parcela_id ? 'Cambiar asociación' : 'Asignar parcela al registro histórico'}
              </Button>
            )}
          </section>
          <section className="panel stack">
            <h2>Retirar esta muestra</h2>
            <p>
              Se ocultará del historial, se revocarán sus enlaces y se cancelará el acceso de las
              asignaciones. Se conservarán los datos y las revisiones para trazabilidad.
            </p>
            <Button variant="danger" disabled={busy} onClick={() => setRetire(true)}>
              Retirar muestra
            </Button>
          </section>
          <Modal open={retire} onClose={() => setRetire(false)} title="Confirmar retirada">
            <div className="stack">
              <p>
                Las consultas compartidas y asignadas quedarán bloqueadas. Esta acción no es un
                borrado físico de los registros.
              </p>
              <Button
                variant="danger"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  setError(null)
                  try {
                    await api('/api/historial?id=' + id, { method: 'DELETE' })
                    router.replace('/historial')
                  } catch (e) {
                    setError(e.message)
                    setRetire(false)
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                Confirmar retirada de muestra
              </Button>
            </div>
          </Modal>
          <ShareDialog analysis={a} open={share} onClose={() => setShare(false)} />
        </>
      )}
    </div>
  )
}
