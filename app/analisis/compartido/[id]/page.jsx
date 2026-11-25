import { PageHeader, Notice, ActionLink } from '@/components/ui/kit'
export default function Page() {
  return (
    <div className="page">
      <PageHeader title="Este enlace ya no está disponible" />
      <Notice>
        Los antiguos enlaces basados en el identificador del análisis han sido retirados. Solicite
        al propietario un enlace autorizado con vencimiento.
      </Notice>
      <ActionLink href="/">Ir a OlivoScan</ActionLink>
    </div>
  )
}
