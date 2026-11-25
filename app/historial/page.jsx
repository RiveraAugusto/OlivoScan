'use client'
import { useState } from 'react'
import HistoryBrowser from '@/components/historial/HistoryBrowser'
import Comparison from '@/components/comparar/Comparison'
import { PageHeader, ActionLink, Button, Notice } from '@/components/ui/kit'
export default function Page() {
  const [selected, setSelected] = useState([]),
    [error, setError] = useState(null)
  function select(a) {
    setError(null)
    if (selected.some((s) => s.id === a.id)) setSelected((v) => v.filter((s) => s.id !== a.id))
    else if (selected.length < 2) setSelected((v) => [...v, a])
    else
      setError('Quite una muestra antes de seleccionar otra. La comparación admite dos muestras.')
  }
  return (
    <div className="page">
      <PageHeader
        eyebrow="REGISTRO DE MUESTRAS"
        title="Mi historial"
        description="Filtre por parcela, olivo, fecha, severidad y revisión. Las muestras antiguas se conservan."
        action={<ActionLink href="/analisis">Nuevo análisis</ActionLink>}
      />
      {error && <Notice type="error">{error}</Notice>}
      {selected.length > 0 && (
        <div className="panel actions">
          <strong>{selected.length} de 2 muestras seleccionadas</strong>
          <Button variant="secondary" onClick={() => setSelected([])}>
            Limpiar selección
          </Button>
          <p className="muted">La selección se mantiene al cambiar de página.</p>
        </div>
      )}
      {selected.length === 2 && <Comparison a={selected[0]} b={selected[1]} />}
      <HistoryBrowser onSelect={select} selected={selected.map((a) => a.id)} multiple />
    </div>
  )
}
