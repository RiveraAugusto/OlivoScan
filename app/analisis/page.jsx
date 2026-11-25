'use client'
import { useRouter } from 'next/navigation'
import AnalysisForm from '@/components/analisis/AnalysisForm'
import { PageHeader } from '@/components/ui/kit'
export default function Page() {
  const router = useRouter()
  return (
    <div className="page">
      <PageHeader
        eyebrow="CAPTURA EN CAMPO"
        title="Analizar una muestra"
        description="Asocie la fotografía a una parcela. Identificar el olivo es opcional."
      />
      <AnalysisForm onComplete={(a) => router.push('/analisis/' + a.id)} />
    </div>
  )
}
