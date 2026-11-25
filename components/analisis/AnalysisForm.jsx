/* eslint-disable @next/next/no-img-element -- Local object URLs preserve private image access and avoid the public optimizer. */
'use client'
import { useEffect, useRef, useState } from 'react'
import { Camera, Upload, ScanLine } from 'lucide-react'
import { api } from '@/lib/client-api'
import { preparePhoto } from '@/lib/client-images'
import SelectorParcela from '@/components/parcelas/SelectorParcela'
import { Button, Notice } from '@/components/ui/kit'
export default function AnalysisForm({ initialParcela = '', initialOlivo = '', onComplete }) {
  const [parcela, setParcela] = useState(initialParcela),
    [olivo, setOlivo] = useState(initialOlivo),
    [photo, setPhoto] = useState(null),
    [busy, setBusy] = useState(false),
    [preparing, setPreparing] = useState(false),
    [error, setError] = useState(null),
    [needsSession, setNeedsSession] = useState(false)
  const sequence = useRef(0)
  const preview = photo?.preview
  useEffect(
    () => () => {
      if (photo?.preview) URL.revokeObjectURL(photo.preview)
    },
    [photo],
  )
  async function select(file) {
    const seq = ++sequence.current
    setError(null)
    setPhoto(null)
    if (!file) return
    setPreparing(true)
    try {
      const value = await preparePhoto(file)
      if (seq === sequence.current) setPhoto({ ...value, preview: URL.createObjectURL(value.file) })
    } catch (e) {
      if (seq === sequence.current) setError(e.message)
    } finally {
      if (seq === sequence.current) setPreparing(false)
    }
  }
  async function submit(e) {
    e.preventDefault()
    if (!photo || !parcela) return
    setBusy(true)
    setError(null)
    setNeedsSession(false)
    try {
      const body = new FormData()
      body.set('imagen', photo.file)
      body.set('parcela_id', parcela)
      if (olivo) body.set('olivo_id', olivo)
      const response = await api('/api/analisis', { method: 'POST', body })
      onComplete(response.datos)
    } catch (e) {
      setError(e.message)
      setNeedsSession(e.status === 401)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="stack" onSubmit={submit} aria-busy={busy || preparing}>
      <div className="panel stack">
        <h2>1. Ubicación de la muestra</h2>
        <SelectorParcela
          parcela={parcela}
          olivo={olivo}
          onChange={(p, o) => {
            setParcela(p)
            setOlivo(o)
          }}
          disabled={busy}
        />
      </div>
      <div className="panel stack">
        <div className="actions">
          <Camera size={26} />
          <h2>2. Fotografía del síntoma</h2>
        </div>
        <p className="muted">
          Busque luz natural uniforme, evite sombras y enfoque una hoja, fruto o rama de olivo.
          Incluya el síntoma completo y revise el detalle.
        </p>
        <div className="form-grid">
          <label className="upload-target">
            <Camera size={26} />
            Tomar una foto
            <input
              aria-label="Tomar una foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              disabled={busy || preparing}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                select(file)
              }}
            />
          </label>
          <label className="upload-target">
            <Upload size={26} />
            Elegir de la galería
            <input
              aria-label="Elegir de la galería"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy || preparing}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                select(file)
              }}
            />
          </label>
        </div>
        <p className="muted">
          JPEG, PNG o WebP · Máximo 10 MiB y 24 megapíxeles. Preparamos una copia sin metadatos EXIF
          y con proporciones conservadas.
        </p>
        {preparing && <Notice>Preparando y comprobando la fotografía…</Notice>}
        {photo && preview && (
          <div className="stack">
            <div className="preview-photo">
              <img src={preview} alt="Vista previa de la muestra que se enviará a analizar" />
            </div>
            <p>
              {photo.originalWidth} × {photo.originalHeight} originales → {photo.width} ×{' '}
              {photo.height} píxeles preparados · {(photo.file.size / 1024 / 1024).toFixed(2)} MiB
              preparados de {(photo.originalSize / 1024 / 1024).toFixed(2)} MiB
            </p>
            {photo.warning && <Notice>{photo.warning}</Notice>}
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                sequence.current++
                setPhoto(null)
              }}
            >
              Quitar fotografía
            </Button>
          </div>
        )}
      </div>
      {error && (
        <Notice type="error">
          {error}{' '}
          {photo
            ? 'La foto permanece disponible para volver a intentarlo.'
            : 'Seleccione otra fotografía.'}
          {needsSession && (
            <a className="inline-link" href="/login" target="_blank" rel="noopener noreferrer">
              Restablecer sesión en otra pestaña
            </a>
          )}
        </Notice>
      )}
      {busy && (
        <Notice>
          Analizando la muestra y guardando el resultado. Mantenga esta pantalla abierta; puede
          tardar aproximadamente un minuto.
        </Notice>
      )}
      <div className="panel stack">
        <h2>3. Enviar a analizar</h2>
        <p>
          La copia de la imagen se procesará con el servicio de IA y se guardará de forma privada.
          El resultado es preliminar y puede ser incierto.
        </p>
        <Button disabled={!photo || !parcela || busy || preparing}>
          <ScanLine size={20} />
          {busy ? 'Analizando…' : 'Analizar y guardar muestra'}
        </Button>
      </div>
    </form>
  )
}
