/* eslint-disable @next/next/no-img-element -- Private blobs must not pass through a public image optimizer. */
'use client'
import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { imageBlob } from '@/lib/client-api'
import { useAuth } from '@/hooks/useAuth'
export default function PrivateImage({
  src,
  alt = 'Fotografía de la muestra de olivo',
  shareToken,
  className = '',
}) {
  const { objUsuario } = useAuth(),
    [image, setImage] = useState(null)
  const identity = src + '|' + (shareToken || objUsuario?.id || '')
  useEffect(() => {
    if (!src) return
    let active = true,
      url
    imageBlob(src, shareToken)
      .then((blob) => {
        url = URL.createObjectURL(blob)
        if (active) setImage({ identity, url })
      })
      .catch(() => {
        if (active) setImage({ identity, error: true })
      })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [src, shareToken, identity])
  if (!src || image?.identity !== identity || image.error)
    return (
      <div className={'photo-placeholder ' + className}>
        <div className="stack" style={{ alignItems: 'center' }}>
          <ImageOff size={28} />
          <span>
            {!src
              ? 'Fotografía histórica pendiente de protección'
              : image?.error
                ? 'La imagen no está disponible.'
                : 'Cargando fotografía…'}
          </span>
        </div>
      </div>
    )
  return <img src={image.url} alt={alt} className={'private-photo ' + className} />
}
