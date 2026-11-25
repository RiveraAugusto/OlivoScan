'use client'
import { useState } from 'react'
import HistoryBrowser from '@/components/historial/HistoryBrowser'
import AnalysisForm from '@/components/analisis/AnalysisForm'
import Comparison from '@/components/comparar/Comparison'
import { PageHeader, Button, Notice, ActionLink } from '@/components/ui/kit'
export default function Page() {
  const [reference, setReference] = useState(null),
    [fresh, setFresh] = useState(null)
  return (
    <div className="page">
      <PageHeader
        eyebrow="LECTURA CON CONTEXTO"
        title="Comparar muestras"
        description="Elija una muestra del historial y capture una nueva. Ambas quedarán guardadas."
        action={
          <ActionLink href="/historial" variant="secondary">
            Comparar dos del historial
          </ActionLink>
        }
      />
      {!reference ? (
        <HistoryBrowser onSelect={setReference} />
      ) : fresh ? (
        <>
          <Comparison a={reference} b={fresh} />
          <Button
            onClick={() => {
              setReference(null)
              setFresh(null)
            }}
          >
            Iniciar otra comparación
          </Button>
        </>
      ) : (
        <>
          <Notice>
            Referencia: {reference.plaga_detectada} ·{' '}
            {reference.parcela?.nombre || 'Histórico sin parcela'}. Identifique el mismo olivo solo
            si está seguro de que las fotos pertenecen al mismo árbol.
          </Notice>
          <Button variant="secondary" onClick={() => setReference(null)}>
            Cambiar referencia
          </Button>
          <AnalysisForm
            key={reference.id}
            initialParcela={reference.parcela?.archivada ? '' : reference.parcela_id || ''}
            initialOlivo={reference.olivo?.archivado ? '' : reference.olivo_id || ''}
            onComplete={setFresh}
          />
        </>
      )}
    </div>
  )
}
