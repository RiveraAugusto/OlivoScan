export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Seleccione una imagen JPEG, PNG o WebP.')
  if (!file.size || file.size > MAX_IMAGE_BYTES)
    throw new Error('La fotografía debe pesar como máximo 10 MiB y no estar vacía.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode().catch(() => {
      throw new Error('La imagen no se pudo abrir. Pruebe con otra fotografía.')
    })
    if (image.naturalWidth * image.naturalHeight > 24000000)
      throw new Error(
        'La fotografía supera 24 megapíxeles. Reduzca su resolución antes de cargarla.',
      )
    const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight)),
      canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * scale)
    canvas.height = Math.round(image.naturalHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo preparar la imagen en este navegador.')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    let blob
    for (const quality of [0.95, 0.9, 0.85]) {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (!blob) throw new Error('No se pudo comprimir la imagen.')
      if (blob.size <= 2 * 1024 * 1024) break
    }
    if (blob.size > MAX_IMAGE_BYTES)
      throw new Error('La imagen preparada sigue superando el límite permitido.')
    return {
      file: new File([blob], 'muestra.jpg', { type: 'image/jpeg' }),
      width: canvas.width,
      height: canvas.height,
      originalSize: file.size,
      warning:
        Math.min(canvas.width, canvas.height) < 512
          ? 'La resolución es baja. Acerque la cámara al síntoma y revise el enfoque.'
          : blob.size > 2 * 1024 * 1024
            ? 'Se conserva más detalle; la fotografía supera el objetivo de 2 MiB.'
            : null,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
