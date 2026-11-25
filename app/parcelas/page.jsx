'use client'
import { useId, useState } from 'react'
import { MapPin, Plus, TreeDeciduous } from 'lucide-react'
import { useResource } from '@/hooks/useResource'
import { api } from '@/lib/client-api'
import { PageHeader, Button, Modal, Notice, Loading, Empty } from '@/components/ui/kit'
function Editor({ initial, onSave, tree = false }) {
  const id = useId(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null)
  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const f = new FormData(e.currentTarget)
    try {
      await onSave({ codigo: f.get('codigo'), ...(!tree ? { nombre: f.get('nombre') } : {}) })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="stack" onSubmit={submit}>
      {error && <Notice type="error">{error}</Notice>}
      <label htmlFor={id + 'c'}>
        Código {tree ? 'del olivo' : 'de parcela'}
        <input
          id={id + 'c'}
          name="codigo"
          defaultValue={initial?.codigo || ''}
          maxLength={40}
          required
          autoFocus
        />
      </label>
      {!tree && (
        <label htmlFor={id + 'n'}>
          Nombre de la parcela
          <input
            id={id + 'n'}
            name="nombre"
            defaultValue={initial?.nombre || ''}
            maxLength={120}
            required
          />
        </label>
      )}
      <Button disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  )
}
function Trees({ parcel }) {
  const resource = useResource('/api/olivos?parcela_id=' + parcel.id),
    [edit, setEdit] = useState(null),
    [confirm, setConfirm] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false)
  async function save(input) {
    await api('/api/olivos', {
      method: edit.id ? 'PATCH' : 'POST',
      body: { ...input, ...(edit.id ? { id: edit.id } : { parcela_id: parcel.id }) },
    })
    setEdit(null)
    resource.reload()
  }
  async function archive() {
    setBusy(true)
    try {
      await api('/api/olivos', {
        method: 'PATCH',
        body: { id: confirm.id, archivado: !confirm.archivado },
      })
      setConfirm(null)
      resource.reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="stack">
      <Notice>
        Identificar cada olivo es opcional. Solo las muestras con el mismo identificador y parcela
        permiten comparar un mismo árbol.
      </Notice>
      {error && <Notice type="error">{error}</Notice>}
      {resource.error && <Notice type="error">{resource.error}</Notice>}
      <Button disabled={parcel.archivada} onClick={() => setEdit({})}>
        <Plus size={20} />
        Identificar un olivo
      </Button>
      {resource.loading ? (
        <Loading />
      ) : resource.data?.length ? (
        resource.data.map((t) => (
          <article className="panel actions" key={t.id}>
            <TreeDeciduous size={22} />
            <strong>{t.codigo}</strong>
            {t.archivado && <span className="tag">Archivado</span>}
            <Button variant="secondary" disabled={parcel.archivada} onClick={() => setEdit(t)}>
              Editar {t.codigo}
            </Button>
            <Button variant="secondary" disabled={parcel.archivada} onClick={() => setConfirm(t)}>
              {t.archivado ? 'Reactivar' : 'Archivar'} {t.codigo}
            </Button>
          </article>
        ))
      ) : (
        <Empty title="Sin olivos identificados">
          Puede analizar muestras usando únicamente la parcela.
        </Empty>
      )}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Editar identificador' : 'Identificar olivo'}
      >
        <Editor key={edit?.id || 'new'} initial={edit} tree onSave={save} />
      </Modal>
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.archivado ? 'Reactivar olivo' : 'Archivar olivo'}
      >
        <div className="stack">
          <p>
            Los análisis anteriores se conservarán. Un olivo archivado no estará disponible para
            nuevas muestras.
          </p>
          <Button disabled={busy} onClick={archive}>
            Confirmar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
export default function Page() {
  const resource = useResource('/api/parcelas'),
    [edit, setEdit] = useState(null),
    [trees, setTrees] = useState(null),
    [confirm, setConfirm] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false)
  async function save(input) {
    await api('/api/parcelas', {
      method: edit.id ? 'PATCH' : 'POST',
      body: { ...input, ...(edit.id ? { id: edit.id } : {}) },
    })
    setEdit(null)
    resource.reload()
  }
  async function archive() {
    setBusy(true)
    try {
      await api('/api/parcelas', {
        method: 'PATCH',
        body: { id: confirm.id, archivada: !confirm.archivada },
      })
      setConfirm(null)
      resource.reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page">
      <PageHeader
        eyebrow="CONTEXTO DE CADA MUESTRA"
        title="Mis parcelas"
        description="Organice el olivar por parcelas. El identificador de cada olivo es opcional."
        action={
          <Button onClick={() => setEdit({})}>
            <Plus size={20} />
            Crear parcela
          </Button>
        }
      />
      {(error || resource.error) && <Notice type="error">{error || resource.error}</Notice>}
      {resource.loading ? (
        <Loading />
      ) : resource.data?.length ? (
        <div className="grid-cards">
          {resource.data.map((p) => (
            <article className="panel stack" key={p.id}>
              <div className="actions">
                <MapPin size={26} />
                <span className="tag">{p.codigo}</span>
                {p.archivada && <span className="tag tag-warning">Archivada</span>}
              </div>
              <h2>{p.nombre}</h2>
              <p className="muted">
                {p.archivada
                  ? 'Conserva su historial; no admite nuevas muestras.'
                  : 'Disponible para nuevos análisis.'}
              </p>
              <div className="actions">
                <Button variant="secondary" onClick={() => setTrees(p)}>
                  Olivos de {p.codigo}
                </Button>
                <Button variant="secondary" onClick={() => setEdit(p)}>
                  Editar {p.codigo}
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(p)}>
                  {p.archivada ? 'Reactivar' : 'Archivar'} {p.codigo}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel">
          <Empty
            title="Su olivar comienza aquí"
            action={<Button onClick={() => setEdit({})}>Crear mi primera parcela</Button>}
          >
            Cree una parcela antes de analizar su primera muestra.
          </Empty>
        </div>
      )}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Editar parcela' : 'Crear parcela'}
      >
        <Editor key={edit?.id || 'new'} initial={edit} onSave={save} />
      </Modal>
      <Modal
        open={!!trees}
        onClose={() => setTrees(null)}
        title={'Olivos · ' + (trees?.nombre || '')}
      >
        <Trees key={trees?.id} parcel={trees || {}} />
      </Modal>
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.archivada ? 'Reactivar parcela' : 'Archivar parcela'}
      >
        <div className="stack">
          <p>
            Los análisis y revisiones existentes se conservarán. La parcela archivada y sus olivos
            no admitirán nuevas muestras.
          </p>
          <Button disabled={busy} onClick={archive}>
            Confirmar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
