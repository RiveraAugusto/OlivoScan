import Image from 'next/image'
import { ArrowUpRight, MapPin, ScanLine, ClipboardCheck, ShieldCheck } from 'lucide-react'
import { ActionLink } from '@/components/ui/kit'
export default function Home() {
  return (
    <div className="page landing">
      <section className="hero-grid">
        <div className="stack">
          <div className="kicker">DEL OLIVAR A UNA DECISIÓN INFORMADA</div>
          <h1>
            Una mirada más clara
            <br />a sus olivos.
          </h1>
          <p className="hero-description">
            Fotografíe los síntomas, organice las muestras por parcela y solicite la mirada de un
            especialista. Su olivar, con contexto.
          </p>
          <div className="actions">
            <ActionLink href="/analisis">
              Analizar una muestra <ArrowUpRight size={20} />
            </ActionLink>
            <ActionLink href="/parcelas" variant="secondary">
              Organizar mis parcelas
            </ActionLink>
          </div>
          <p className="muted">Diseñado para el trabajo en campo · Ilo, Moquegua</p>
        </div>
        <div className="hero-photo">
          <Image
            src="/images/mosca_olivo.png"
            alt="Detalle de una aceituna para observar posibles síntomas"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
          <div className="hero-caption">
            <ShieldCheck size={24} />
            <div>
              <strong>Una muestra, con su historia</strong>
              <p>Diagnóstico original y revisión profesional diferenciados.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="stack" aria-labelledby="como">
        <div className="page-header">
          <div>
            <div className="kicker">UN FLUJO SENCILLO</div>
            <h2 id="como">Del síntoma al siguiente paso</h2>
          </div>
        </div>
        <div className="grid-cards">
          {[
            [
              MapPin,
              '01',
              'Ubique la muestra',
              'Elija una parcela. Si lo necesita, añada el identificador del olivo.',
            ],
            [
              ScanLine,
              '02',
              'Observe con ayuda de IA',
              'Reciba una orientación preliminar. Una foto insuficiente puede producir un resultado no reconocido.',
            ],
            [
              ClipboardCheck,
              '03',
              'Solicite revisión',
              'Un agrónomo asignado puede confirmar, corregir o declarar el resultado no concluyente.',
            ],
          ].map(([Icon, n, title, text]) => (
            <article key={n} className="panel stack">
              <div className="actions">
                <Icon size={28} />
                <span className="muted">{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <aside className="notice">
        <ShieldCheck size={24} />
        <p>
          OlivoScan ofrece apoyo preliminar. La confianza del modelo no representa una precisión
          validada en campo y no sustituye la evaluación agronómica.
        </p>
      </aside>
    </div>
  )
}
