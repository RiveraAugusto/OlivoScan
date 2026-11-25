'use client'
import { useId } from 'react'
import Link from 'next/link'
import { useResource } from '@/hooks/useResource'
import { Notice } from '@/components/ui/kit'
export default function SelectorParcela({ parcela = '', olivo = '', onChange, disabled = false }) {
  const uid = useId(),
    parcels = useResource('/api/parcelas'),
    olives = useResource(parcela ? '/api/olivos?parcela_id=' + parcela : null)
  const active = (parcels.data || []).filter((p) => !p.archivada)
  return (
    <div className="stack">
      {parcels.error && <Notice type="error">{parcels.error}</Notice>}
      <div className="form-grid">
        <label htmlFor={uid + 'p'}>
          Parcela obligatoria
          <select
            id={uid + 'p'}
            value={parcela}
            onChange={(e) => onChange(e.target.value, '')}
            required
            disabled={disabled || parcels.loading}
          >
            <option value="">
              {parcels.loading ? 'Cargando parcelas…' : 'Seleccione una parcela'}
            </option>
            {active.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={uid + 'o'}>
          ID del olivo (opcional)
          <select
            id={uid + 'o'}
            value={olivo}
            onChange={(e) => onChange(parcela, e.target.value)}
            disabled={disabled || !parcela || olives.loading}
          >
            <option value="">Olivo no identificado</option>
            {(olives.data || [])
              .filter((o) => !o.archivado)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.codigo}
                </option>
              ))}
          </select>
        </label>
      </div>
      {olives.error && (
        <Notice>
          Puede continuar sin identificar el olivo. No se pudieron cargar sus códigos.
        </Notice>
      )}
      {!parcels.loading && !parcels.error && active.length === 0 && (
        <p className="muted">
          Primero{' '}
          <Link href="/parcelas" className="inline-link">
            registre una parcela
          </Link>
          . No necesita registrar árboles.
        </p>
      )}
    </div>
  )
}
