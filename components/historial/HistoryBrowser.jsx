'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useResource } from '@/hooks/useResource'
import PrivateImage from '@/components/ui/PrivateImage'
import { estadoRevision } from '@/lib/contracts'
import { Button, Notice, Loading, Empty, StatusTag, fecha } from '@/components/ui/kit'
export default function HistoryBrowser({ onSelect, selected = [], multiple = false }) {
  const [filter, setFilter] = useState({}),
    [page, setPage] = useState(1)
  const parcels = useResource('/api/parcelas'),
    olives = useResource(filter.parcela_id ? '/api/olivos?parcela_id=' + filter.parcela_id : null)
  const query = new URLSearchParams({ ...filter, pagina: String(page), limite: '12' }).toString(),
    resource = useResource('/api/historial?' + query)
  function change(k, v) {
    setPage(1)
    setFilter((f) => {
      const next = { ...f }
      if (v) next[k] = v
      else delete next[k]
      if (k === 'parcela_id') delete next.olivo_id
      return next
    })
  }
  return (
    <div className="stack">
      <form
        className="panel stack"
        onSubmit={(e) => {
          e.preventDefault()
          change('q', new FormData(e.currentTarget).get('q').trim())
        }}
      >
        <div className="form-grid">
          <label htmlFor="history-search">
            Buscar hallazgo o nota
            <input
              id="history-search"
              name="q"
              maxLength={120}
              type="search"
              placeholder="Escriba y pulse buscar"
            />
          </label>
          <div className="actions" style={{ alignSelf: 'end' }}>
            <Button variant="secondary">Buscar</Button>
          </div>
          <label htmlFor="history-parcel">
            Parcela
            <select
              id="history-parcel"
              value={filter.parcela_id || ''}
              onChange={(e) => change('parcela_id', e.target.value)}
            >
              <option value="">Todas las parcelas</option>
              {(parcels.data || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} · {p.nombre}
                  {p.archivada ? ' (archivada)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="history-olive">
            Olivo identificado
            <select
              id="history-olive"
              value={filter.olivo_id || ''}
              onChange={(e) => change('olivo_id', e.target.value)}
              disabled={!filter.parcela_id}
            >
              <option value="">Todos / no identificado</option>
              {(olives.data || []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.codigo}
                  {o.archivado ? ' (archivado)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="history-severity">
            Severidad
            <select
              id="history-severity"
              value={filter.severidad || ''}
              onChange={(e) => change('severidad', e.target.value)}
            >
              <option value="">Todas</option>
              <option value="leve">Leve</option>
              <option value="moderado">Moderado</option>
              <option value="grave">Grave</option>
              <option value="no_aplica">No aplica</option>
            </select>
          </label>
          <label htmlFor="history-state">
            Estado de revisión
            <select
              id="history-state"
              value={filter.estado || ''}
              onChange={(e) => change('estado', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="sin_solicitud">Sin solicitud activa</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En revisión</option>
              <option value="revisada">Revisión emitida</option>
            </select>
          </label>
          <label htmlFor="history-from">
            Desde
            <input
              type="date"
              id="history-from"
              value={filter.desde || ''}
              onChange={(e) => change('desde', e.target.value)}
            />
          </label>
          <label htmlFor="history-to">
            Hasta
            <input
              type="date"
              id="history-to"
              value={filter.hasta || ''}
              min={filter.desde || undefined}
              onChange={(e) => change('hasta', e.target.value)}
            />
          </label>
        </div>
        {Object.keys(filter).length > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setFilter({})
              setPage(1)
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </form>
      {(resource.error || parcels.error || olives.error) && (
        <Notice type="error">{resource.error || parcels.error || olives.error}</Notice>
      )}
      {resource.loading ? (
        <Loading />
      ) : resource.data?.length ? (
        <>
          <p className="muted">
            {resource.total} muestras coinciden · Página {page} de{' '}
            {Math.max(1, Math.ceil(resource.total / 12))}
          </p>
          <div className="grid-cards">
            {resource.data.map((a) => (
              <article key={a.id} className="panel history-card stack">
                <div className="history-photo">
                  <PrivateImage src={a.imagen_url} alt="Muestra de olivo del historial" />
                </div>
                <div className="actions">
                  <StatusTag state={a.estado_diagnostico} />
                  <StatusTag state={a.severidad} />
                </div>
                <h2>
                  {a.plaga_detectada === 'Hoja Sana' ? 'Sin signos visibles' : a.plaga_detectada}
                </h2>
                <p>
                  {a.parcela
                    ? a.parcela.codigo + ' · ' + a.parcela.nombre
                    : 'Histórico sin parcela'}
                  {a.olivo ? ' · Olivo ' + a.olivo.codigo : ' · Olivo no identificado'}
                </p>
                <p className="muted">{fecha(a.creado_en)}</p>
                <StatusTag state={estadoRevision(a)} />
                <div className="actions">
                  <Link className="btn btn-secondary" href={'/analisis/' + a.id}>
                    Ver muestra
                  </Link>
                  {onSelect && (
                    <Button
                      variant={selected.includes(a.id) ? 'primary' : 'secondary'}
                      onClick={() => onSelect(a)}
                      aria-pressed={selected.includes(a.id)}
                    >
                      {selected.includes(a.id)
                        ? 'Quitar selección'
                        : multiple
                          ? 'Añadir a comparación'
                          : 'Elegir como referencia'}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="actions">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              variant="secondary"
              disabled={page * 12 >= resource.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </>
      ) : (
        <div className="panel">
          <Empty title="No hay muestras que coincidan">
            Pruebe otros filtros o registre un nuevo análisis.
          </Empty>
        </div>
      )}
    </div>
  )
}
