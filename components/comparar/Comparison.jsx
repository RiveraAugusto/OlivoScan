'use client'
import { conclusionComparacion } from '@/lib/contracts'
import ResultContent from '@/components/analisis/ResultContent'
import { Notice, ActionLink } from '@/components/ui/kit'
export default function Comparison({ a, b }) {
  return (
    <section className="stack">
      <h2>Comparación de muestras</h2>
      <Notice>{conclusionComparacion(a, b)}</Notice>
      <div className="comparison-grid">
        {[a, b].map((value, i) => (
          <div key={value.id} className="stack">
            <h3>{i === 0 ? 'Muestra de referencia' : 'Muestra a comparar'}</h3>
            <ActionLink href={'/analisis/' + value.id} variant="secondary">
              Abrir detalle
            </ActionLink>
            <ResultContent analysis={value} />
          </div>
        ))}
      </div>
    </section>
  )
}
