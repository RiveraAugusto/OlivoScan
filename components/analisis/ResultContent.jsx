'use client'
import PrivateImage from '@/components/ui/PrivateImage'
import { Notice, StatusTag, fecha } from '@/components/ui/kit'
export function ReviewVersions({ revisions = [] }) {
  if (!revisions.length)
    return <p className="muted">Todavía no se ha emitido una revisión profesional.</p>
  const labels = {
    confirmada: 'Diagnóstico confirmado',
    corregida: 'Diagnóstico corregido',
    no_concluyente: 'Resultado no concluyente',
  }
  return (
    <div className="stack">
      {[...revisions]
        .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
        .map((r) => (
          <article key={r.id} className="review-version stack">
            <div className="actions">
              <strong>{labels[r.conclusion]}</strong>
              <span className="tag">Versión {r.version}</span>
            </div>
            <p>
              {r.autor_nombre} · {fecha(r.creado_en)}
            </p>
            {r.plaga_corregida && (
              <p>
                <strong>Conclusión corregida:</strong> {r.plaga_corregida}
              </p>
            )}
            <p className="prewrap">{r.observaciones}</p>
            {r.revision_anterior_id && (
              <p className="muted">
                Rectifica una versión anterior, que permanece en el historial.
              </p>
            )}
          </article>
        ))}
    </div>
  )
}
export default function ResultContent({ analysis: a, shareToken, shared = false }) {
  const revisions = shared ? a.revisiones : (a.solicitudes || []).flatMap((s) => s.revisiones || [])
  return (
    <div className="stack">
      {(a.imagen_url || a.tiene_imagen) && (
        <div className="panel result-photo">
          <PrivateImage
            src={shared ? '/api/compartido/imagen' : a.imagen_url}
            shareToken={shareToken}
            alt="Fotografía analizada de la muestra de olivo"
          />
        </div>
      )}
      {!shared && !a.imagen_url && (
        <Notice>
          La imagen histórica requiere migración a almacenamiento privado para volver a mostrarse.
        </Notice>
      )}
      {a.parcela && (
        <p>
          <strong>Parcela:</strong> {a.parcela.codigo} · {a.parcela.nombre}
          {a.olivo && (
            <>
              {' '}
              · <strong>Olivo:</strong> {a.olivo.codigo}
            </>
          )}
        </p>
      )}
      {!shared && !a.parcela && (
        <Notice>
          Registro histórico sin parcela asignada. Puede asociarlo sin alterar el diagnóstico
          original.
        </Notice>
      )}
      {a.plaga_detectada !== undefined && (
        <section className="panel stack">
          <div className="kicker">DIAGNÓSTICO ORIGINAL · IA</div>
          <div className="actions">
            <StatusTag state={a.estado_diagnostico} />
            <StatusTag state={a.severidad} />
          </div>
          <h2>
            {a.plaga_detectada === 'Hoja Sana'
              ? 'Sin signos visibles de afección'
              : a.plaga_detectada}
          </h2>
          {a.estado_diagnostico === 'no_reconocido' && (
            <Notice>
              La imagen no permite una conclusión. Esto no significa que el olivo esté sano. Tome
              otra fotografía o solicite revisión agronómica.
            </Notice>
          )}
          <p className="prewrap">{a.descripcion}</p>
          {a.estado_diagnostico !== 'no_reconocido' && (
            <p>
              <strong>Confianza declarada por el modelo:</strong> {Number(a.confianza).toFixed(1)}{' '}
              %. No equivale a precisión medida ni a confirmación profesional.
            </p>
          )}
          <p className="muted">
            Modelo: {a.modelo_version || 'No registrado'} · {fecha(a.creado_en)}
          </p>
        </section>
      )}
      {!shared && a.procesamiento_imagen?.width && (
        <p className="muted">
          Copia procesada: {a.procesamiento_imagen.width} × {a.procesamiento_imagen.height} píxeles
          · {(a.procesamiento_imagen.bytes / 1024 / 1024).toFixed(2)} MiB. Entrada recibida por el
          servidor: {a.procesamiento_imagen.original_width} ×{' '}
          {a.procesamiento_imagen.original_height} píxeles.
        </p>
      )}
      {a.advertencias_imagen?.length > 0 && <Notice>{a.advertencias_imagen.join(' ')}</Notice>}
      {a.recomendacion !== undefined && (
        <section className="panel stack">
          <h2>Orientaciones preliminares</h2>
          <p className="prewrap">{a.recomendacion.replaceAll('#### ', '')}</p>
          <p className="muted">
            Consulte con un especialista antes de aplicar productos o tratamientos.
          </p>
        </section>
      )}
      {a.notas !== undefined && (shared || a.notas || a.plaga_corregida) && (
        <section className="panel stack">
          <h2>Observaciones del agricultor</h2>
          {a.notas && <p className="prewrap">{a.notas}</p>}
          {a.plaga_corregida && (
            <p>
              <strong>Corrección comunicada por el agricultor:</strong> {a.plaga_corregida}
            </p>
          )}
          <p className="muted">
            Estas observaciones no modifican el diagnóstico de IA ni constituyen una revisión
            profesional.
          </p>
        </section>
      )}
      {(!shared || a.revisiones !== undefined) && (
        <section className="panel stack">
          <div className="kicker">AUTORÍA Y TRAZABILIDAD</div>
          <h2>Revisión agronómica</h2>
          <ReviewVersions revisions={revisions || []} />
        </section>
      )}
    </div>
  )
}
