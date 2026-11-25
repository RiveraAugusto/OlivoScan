'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useResource } from '@/hooks/useResource'
import { api } from '@/lib/client-api'
import { PageHeader, Button, Modal, Notice, Loading, Empty } from '@/components/ui/kit'
const fields = {
  nombre: 'Nombre de la afección',
  descripcion: 'Descripción',
  sintomas: 'Síntomas',
  condiciones: 'Condiciones favorables',
  tratamiento_organico: 'Orientación cultural y biológica',
  tratamiento_quimico: 'Consideraciones de manejo químico',
}
function Editor({ initial, onSave }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null)
  async function submit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const f = new FormData(e.currentTarget)
    try {
      await onSave({
        ...Object.fromEntries(Object.keys(fields).map((k) => [k, f.get(k)])),
        imagen_referencia_url: initial.imagen_referencia_url?.startsWith('/images/')
          ? initial.imagen_referencia_url
          : null,
        meses_riesgo: (f.get('meses') || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
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
      {Object.entries(fields).map(([name, label]) => (
        <label key={name} htmlFor={'catalog-' + name}>
          {label}
          {name === 'nombre' ? (
            <input
              id={'catalog-' + name}
              name={name}
              defaultValue={initial[name] || ''}
              maxLength={200}
              required
            />
          ) : (
            <textarea
              id={'catalog-' + name}
              name={name}
              defaultValue={initial[name] || ''}
              maxLength={8000}
              required
            />
          )}
        </label>
      ))}
      <label htmlFor="catalog-months">
        Meses de riesgo (separados por comas)
        <input
          id="catalog-months"
          name="meses"
          defaultValue={(initial.meses_riesgo || []).join(', ')}
          maxLength={250}
        />
      </label>
      <Button disabled={busy}>{busy ? 'Guardando…' : 'Guardar ficha'}</Button>
    </form>
  )
}
export default function Page() {
  const { objPerfil } = useAuth(),
    resource = useResource('/api/catalogo'),
    [search, setSearch] = useState(''),
    [edit, setEdit] = useState(null),
    [remove, setRemove] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false)
  const canEdit =
    objPerfil?.rol === 'admin' || (objPerfil?.rol === 'agronomo' && objPerfil?.gestionar_catalogo)
  async function save(input) {
    await api('/api/catalogo', {
      method: edit.id ? 'PUT' : 'POST',
      body: { ...input, ...(edit.id ? { id: edit.id } : {}) },
    })
    setEdit(null)
    resource.reload()
  }
  async function erase() {
    setBusy(true)
    try {
      await api('/api/catalogo?id=' + remove.id, { method: 'DELETE' })
      setRemove(null)
      resource.reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const month = resource.mes || '',
    seasonal = (resource.data || []).filter((p) =>
      (p.meses_riesgo || []).some(
        (m) => m.toLocaleLowerCase('es') === month.toLocaleLowerCase('es'),
      ),
    )
  const rows = (resource.data || []).filter((p) =>
    (p.nombre + ' ' + p.sintomas).toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <div className="page">
      <PageHeader
        eyebrow="BIBLIOTECA DEL OLIVAR"
        title="Catálogo fitosanitario"
        description="Material de consulta. Los periodos de riesgo requieren interpretación local y las opciones de manejo deben revisarse con un especialista."
        action={canEdit && <Button onClick={() => setEdit({})}>Crear ficha</Button>}
      />
      <Notice>
        Las fichas existentes son información de referencia. Verifique la autorización vigente del
        producto, su etiqueta y la recomendación profesional antes de cualquier aplicación.
      </Notice>
      {month && (
        <section className="panel stack">
          <h2>Recordatorios del mes · {month}</h2>
          <p>Zona registrada: {objPerfil?.zona_geografica || 'No indicada en el perfil'}.</p>
          <p>
            {seasonal.length
              ? 'Fichas con meses de referencia coincidentes: ' +
                seasonal.map((p) => p.nombre).join(', ') +
                '.'
              : 'No hay fichas con un mes de referencia coincidente. Esto no significa ausencia de plagas.'}
          </p>
          <p className="muted">
            Este recordatorio usa los meses del catálogo; no incorpora clima observado ni predice el
            riesgo de su zona. Confirme la pertinencia del calendario con un especialista local.
          </p>
        </section>
      )}
      {(error || resource.error) && <Notice type="error">{error || resource.error}</Notice>}
      <label htmlFor="catalog-search">
        Buscar por nombre o síntoma
        <input
          type="search"
          id="catalog-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {resource.loading ? (
        <Loading />
      ) : rows.length ? (
        <div className="grid-cards">
          {rows.map((p) => (
            <article key={p.id} className="panel stack">
              <h2>{p.nombre}</h2>
              <p>{p.descripcion}</p>
              <h3>Síntomas a observar</h3>
              <p className="prewrap">{p.sintomas}</p>
              <details>
                <summary>Ver condiciones y orientaciones</summary>
                <div className="stack">
                  <h3>Condiciones favorables</h3>
                  <p>{p.condiciones}</p>
                  <h3>Orientación cultural y biológica</h3>
                  <p>{p.tratamiento_organico}</p>
                  <h3>Consideraciones de manejo químico</h3>
                  <p>{p.tratamiento_quimico}</p>
                  <p className="muted">
                    Meses de referencia: {(p.meses_riesgo || []).join(', ') || 'No indicados'}. No
                    constituyen una alerta meteorológica local.
                  </p>
                </div>
              </details>
              {canEdit && (
                <div className="actions">
                  <Button variant="secondary" onClick={() => setEdit(p)}>
                    Editar ficha
                  </Button>
                  <Button variant="danger" onClick={() => setRemove(p)}>
                    Eliminar ficha
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty title="Sin fichas que coincidan">Revise la búsqueda o consulte más adelante.</Empty>
      )}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Editar ficha' : 'Crear ficha'}
      >
        {edit && <Editor key={edit.id || 'new'} initial={edit} onSave={save} />}
      </Modal>
      <Modal open={!!remove} onClose={() => setRemove(null)} title="Eliminar ficha">
        <div className="stack">
          <p>
            Se eliminará la ficha «{remove?.nombre}». Los diagnósticos ya guardados se conservarán.
          </p>
          <Button variant="danger" disabled={busy} onClick={erase}>
            Confirmar eliminación
          </Button>
        </div>
      </Modal>
    </div>
  )
}
