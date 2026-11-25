'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useResource } from '@/hooks/useResource'
import { api } from '@/lib/client-api'
import {
  PageHeader,
  Button,
  Modal,
  Notice,
  Loading,
  Empty,
  StatusTag,
  fecha,
} from '@/components/ui/kit'
import { ReviewVersions } from '@/components/analisis/ResultContent'
function EmitForm({ request, onSave }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [conclusion, setConclusion] = useState('confirmada')
  const previous = [...(request.revisiones || [])].sort((a, b) => b.version - a.version)[0]
  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const f = new FormData(e.currentTarget)
    try {
      await onSave({
        solicitud_id: request.id,
        conclusion,
        observaciones: f.get('observaciones'),
        plaga_corregida: conclusion === 'corregida' ? f.get('correccion') : null,
        anterior_id: previous?.id || null,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="stack" onSubmit={submit}>
      {error && <Notice type="error">{error}</Notice>}
      {previous && (
        <Notice>
          Creará la versión {previous.version + 1}. La versión anterior se conservará con su
          autoría.
        </Notice>
      )}
      <label htmlFor="review-conclusion">
        Conclusión
        <select
          id="review-conclusion"
          value={conclusion}
          onChange={(e) => setConclusion(e.target.value)}
        >
          <option value="confirmada">Confirmar diagnóstico original</option>
          <option value="corregida">Corregir diagnóstico</option>
          <option value="no_concluyente">Resultado no concluyente</option>
        </select>
      </label>
      {conclusion === 'corregida' && (
        <label htmlFor="review-correction">
          Diagnóstico corregido
          <input id="review-correction" name="correccion" maxLength={200} required />
        </label>
      )}
      <label htmlFor="review-notes">
        Fundamento y observaciones
        <textarea id="review-notes" name="observaciones" maxLength={4000} required />
      </label>
      <p className="muted">
        La conclusión quedará registrada con su nombre, fecha y número de versión. No modificará el
        diagnóstico original de IA.
      </p>
      <Button disabled={busy}>
        {busy ? 'Registrando…' : 'Emitir revisión firmada con mi cuenta'}
      </Button>
    </form>
  )
}
export default function Page() {
  const { objPerfil, objUsuario } = useAuth(),
    resource = useResource('/api/revisiones'),
    profiles = useResource(objPerfil?.rol === 'admin' ? '/api/administracion' : null)
  const [edit, setEdit] = useState(null),
    [error, setError] = useState(null),
    [message, setMessage] = useState(null),
    [busy, setBusy] = useState(false)
  async function action(body, text) {
    setBusy(true)
    setError(null)
    try {
      await api('/api/revisiones', { method: 'PATCH', body })
      setMessage(text)
      resource.reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const agro = (profiles.data || []).filter((p) => p.rol === 'agronomo')
  return (
    <div className="page">
      <PageHeader
        eyebrow="CRITERIO PROFESIONAL"
        title="Revisión agronómica"
        description={
          objPerfil?.rol === 'admin'
            ? 'Asigne solicitudes a especialistas autorizados. La administración por sí sola no da acceso a las fotografías o al contenido del diagnóstico.'
            : 'Solicitudes y conclusiones con autoría, fecha y versiones conservadas.'
        }
      />
      {(error || resource.error || profiles.error) && (
        <Notice type="error">{error || resource.error || profiles.error}</Notice>
      )}
      {message && <Notice type="success">{message}</Notice>}
      {resource.loading ? (
        <Loading />
      ) : resource.data?.length ? (
        <div className="stack">
          {resource.data.map((s) => {
            const specialist = objPerfil?.rol === 'agronomo' && s.agronomo_id === objUsuario?.id,
              owner = s.propietario_id === objUsuario?.id
            return (
              <article key={s.id} className="panel stack">
                <div className="actions">
                  <h2>Solicitud {s.id.slice(0, 8)}</h2>
                  <StatusTag state={s.estado} />
                </div>
                <p className="muted">
                  Solicitada: {fecha(s.creado_en)} · Actualizada: {fecha(s.actualizado_en)}
                </p>
                <p>{s.agronomo_id ? 'Especialista asignado' : 'A la espera de asignación'}</p>
                <div className="actions">
                  {(owner || specialist) && s.estado !== 'cancelada' && (
                    <Link className="btn btn-secondary" href={'/analisis/' + s.analisis_id}>
                      Ver muestra y diagnóstico
                    </Link>
                  )}
                  {specialist && s.estado === 'pendiente' && (
                    <Button
                      disabled={busy}
                      onClick={() => action({ id: s.id, accion: 'iniciar' }, 'Revisión iniciada.')}
                    >
                      Iniciar revisión
                    </Button>
                  )}
                  {specialist && ['en_revision', 'revisada'].includes(s.estado) && (
                    <Button onClick={() => setEdit(s)}>
                      {s.estado === 'revisada' ? 'Rectificar con nueva versión' : 'Emitir revisión'}
                    </Button>
                  )}
                  {(owner || objPerfil?.rol === 'admin') &&
                    ['pendiente', 'en_revision'].includes(s.estado) && (
                      <Button
                        variant="danger"
                        disabled={busy}
                        onClick={() =>
                          action({ id: s.id, accion: 'cancelar' }, 'Solicitud cancelada.')
                        }
                      >
                        Cancelar solicitud
                      </Button>
                    )}
                </div>
                {objPerfil?.rol === 'admin' && ['pendiente', 'en_revision'].includes(s.estado) && (
                  <form
                    className="actions"
                    onSubmit={(e) => {
                      e.preventDefault()
                      action(
                        {
                          id: s.id,
                          accion: 'asignar',
                          agronomo_id: new FormData(e.currentTarget).get('agronomo'),
                        },
                        'Especialista asignado; se notificó la solicitud.',
                      )
                    }}
                  >
                    <label htmlFor={'assign-' + s.id}>
                      Especialista autorizado
                      <select
                        id={'assign-' + s.id}
                        name="agronomo"
                        defaultValue={s.agronomo_id || ''}
                        required
                      >
                        <option value="">Seleccione un agrónomo</option>
                        {agro.map((p) => (
                          <option value={p.id} key={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button disabled={busy || !agro.length}>Guardar asignación</Button>
                    {!agro.length && (
                      <p className="muted">Autorice primero un agrónomo desde Administración.</p>
                    )}
                  </form>
                )}
                {(owner || specialist) && <ReviewVersions revisions={s.revisiones} />}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="panel">
          <Empty title="Sin solicitudes disponibles">
            El propietario puede solicitar una revisión desde el detalle de cualquier muestra. El
            especialista verá únicamente las solicitudes que tenga asignadas.
          </Empty>
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Emitir revisión agronómica">
        {edit && (
          <EmitForm
            key={edit.id}
            request={edit}
            onSave={async (body) => {
              await api('/api/revisiones', { method: 'PUT', body })
              setEdit(null)
              setMessage('Revisión emitida y conservada en el historial.')
              resource.reload()
            }}
          />
        )}
      </Modal>
    </div>
  )
}
