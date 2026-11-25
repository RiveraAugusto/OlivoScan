'use client'
import { MapPin, ScanLine, ClipboardCheck, TriangleAlert } from 'lucide-react'
import { useResource } from '@/hooks/useResource'
import { PageHeader, Loading, Notice, ActionLink, Empty } from '@/components/ui/kit'
export default function Page() {
  const resource = useResource('/api/dashboard'),
    d = resource.data
  return (
    <div className="page">
      <PageHeader
        eyebrow="VISIÓN DEL OLIVAR"
        title="Mi panel"
        description="Cada análisis representa una muestra fotografiada, no necesariamente un árbol distinto."
        action={<ActionLink href="/analisis">Nuevo análisis</ActionLink>}
      />
      {resource.error && <Notice type="error">{resource.error}</Notice>}
      {resource.loading ? (
        <Loading />
      ) : (
        d && (
          <>
            <div className="grid-cards">
              {[
                [ScanLine, d.totalAnalisis, 'Muestras analizadas', 'Todo el historial disponible'],
                [
                  MapPin,
                  d.parcelasAnalizadas,
                  'Parcelas con muestras',
                  'Parcelas distintas del historial',
                ],
                [
                  TriangleAlert,
                  d.muestrasGraves30d,
                  'Muestras con afección grave',
                  'Últimos 30 días · orientación de IA',
                ],
                [
                  ClipboardCheck,
                  d.revisionesPendientes,
                  'Solicitudes por revisar',
                  'Pendientes o en revisión',
                ],
              ].map(([Icon, value, label, period]) => (
                <article key={label} className="panel metric">
                  <div className="actions">
                    <Icon size={24} />
                    <span className="muted">{label}</span>
                  </div>
                  <strong className="metric-value">{value || 0}</strong>
                  <p className="muted">{period}</p>
                </article>
              ))}
            </div>
            {d.muestrasSinParcela > 0 && (
              <Notice>
                Hay {d.muestrasSinParcela} muestras históricas sin parcela. Puede asociarlas desde
                el detalle de su historial.
              </Notice>
            )}
            {!d.totalAnalisis && (
              <div className="panel">
                <Empty
                  title="Empiece por su primera parcela"
                  action={<ActionLink href="/parcelas">Organizar parcelas</ActionLink>}
                >
                  Después podrá capturar una muestra y pedir revisión agronómica.
                </Empty>
              </div>
            )}
            <section className="panel stack">
              <div>
                <h2>Muestras de los últimos seis meses</h2>
                <p className="muted">
                  Cantidad mensual según el resultado original de IA. Los resultados inciertos se
                  cuentan por separado.
                </p>
              </div>
              <div
                className="chart"
                role="img"
                aria-label="Gráfico de muestras mensuales; consulte los valores en la tabla siguiente"
              >
                {(d.datosGrafico || []).map((m) => {
                  const max = Math.max(
                    1,
                    ...d.datosGrafico.map(
                      (v) => Number(v.sanas) + Number(v.plagas) + Number(v.inciertas),
                    ),
                  )
                  return (
                    <div className="chart-column" key={m.mes}>
                      <div className="chart-bars">
                        {[
                          ['sanas', 'Sin signos visibles'],
                          ['plagas', 'Posible afección'],
                          ['inciertas', 'No reconocido'],
                        ].map(([k, label]) => (
                          <div
                            key={k}
                            className={'bar bar-' + k}
                            title={label + ': ' + m[k]}
                            style={{ height: Math.max(2, (Number(m[k]) / max) * 150) }}
                          />
                        ))}
                      </div>
                      <span>{m.mes}</span>
                    </div>
                  )
                })}
              </div>
              <div className="data-scroll">
                <table>
                  <caption className="sr-only">Valores mensuales en cantidad de muestras</caption>
                  <thead>
                    <tr>
                      <th>Mes</th>
                      <th>Sin signos visibles</th>
                      <th>Posible afección</th>
                      <th>No reconocido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(d.datosGrafico || []).map((m) => (
                      <tr key={m.mes}>
                        <th scope="row">{m.mes}</th>
                        <td>{m.sanas}</td>
                        <td>{m.plagas}</td>
                        <td>{m.inciertas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="panel stack">
              <h2>Hallazgos preliminares más frecuentes</h2>
              <p className="muted">
                Se cuentan muestras con posible afección de todo el historial, sin interpretar estos
                datos como prevalencia del olivar.
              </p>
              {d.plagasMasFrecuentes?.length ? (
                <ul>
                  {d.plagasMasFrecuentes.map((p) => (
                    <li key={p.nombre}>
                      {p.nombre}: <strong>{p.cantidad} muestras</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Sin hallazgos de afección registrados.</p>
              )}
            </section>
          </>
        )
      )}
    </div>
  )
}
