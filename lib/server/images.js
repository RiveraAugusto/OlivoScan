import 'server-only'
import sharp from 'sharp'
import { HttpError } from './http'
export const MAX_INPUT_BYTES = 10 * 1024 * 1024
export const MAX_OUTPUT_BYTES = 2 * 1024 * 1024
export const MAX_SIDE = 2048
const formats = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
export async function boundedFormData(request) {
  const type = request.headers.get('content-type') || ''
  if (!type.startsWith('multipart/form-data;'))
    throw new HttpError(400, 'Seleccione una fotografía.')
  const limit = MAX_INPUT_BYTES + 65536
  if (Number(request.headers.get('content-length')) > limit)
    throw new HttpError(413, 'La fotografía supera el límite de 10 MiB.')
  if (!request.body) throw new HttpError(400, 'Seleccione una fotografía.')
  const reader = request.body.getReader(),
    chunks = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > limit) {
      await reader.cancel()
      throw new HttpError(413, 'La fotografía supera el límite de 10 MiB.')
    }
    chunks.push(value)
  }
  try {
    return await new Response(Buffer.concat(chunks), {
      headers: { 'Content-Type': type },
    }).formData()
  } catch {
    throw new HttpError(400, 'No se pudo leer el archivo. Selecciónelo nuevamente.')
  }
}
export async function processImage(buffer, declaredType) {
  if (!buffer.length || buffer.length > MAX_INPUT_BYTES)
    throw new HttpError(413, 'La imagen debe contener datos y pesar hasta 10 MiB.')
  let meta, base
  try {
    base = sharp(buffer, { limitInputPixels: 24000000, failOn: 'warning', animated: false })
    meta = await base.metadata()
  } catch {
    throw new HttpError(422, 'No se pudo decodificar la imagen. Seleccione otra fotografía.')
  }
  if (!formats[meta.format] || formats[meta.format] !== declaredType || (meta.pages || 1) !== 1)
    throw new HttpError(
      422,
      'El contenido debe ser una imagen JPEG, PNG o WebP de un solo fotograma.',
    )
  const warnings = []
  if (Math.min(meta.width, meta.height) < 512)
    warnings.push(
      'La resolución es reducida. Una fotografía de mayor detalle puede facilitar la revisión.',
    )
  let processed, info
  try {
    for (const quality of [95, 90, 85]) {
      const output = await base
        .clone()
        .rotate()
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#ffffff' })
        .jpeg({ quality })
        .toBuffer({ resolveWithObject: true })
      processed = output.data
      info = output.info
      if (processed.length <= MAX_OUTPUT_BYTES) break
    }
    if (processed.length > MAX_OUTPUT_BYTES)
      throw new HttpError(
        422,
        'No se pudo reducir el peso conservando calidad suficiente. Capture una imagen más cercana y vuelva a intentar.',
      )
    const stats = await sharp(processed).stats()
    const mean = stats.channels.slice(0, 3).reduce((a, c) => a + c.mean, 0) / 3
    if (mean < 35 || mean > 235)
      warnings.push('Revise la iluminación: hay zonas muy oscuras o claras.')
    const raw = await sharp(processed)
      .resize(128, 128, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer()
    let sum = 0,
      squares = 0,
      n = 0
    for (let y = 1; y < 127; y++)
      for (let x = 1; x < 127; x++) {
        const i = y * 128 + x,
          v = raw[i - 1] + raw[i + 1] + raw[i - 128] + raw[i + 128] - 4 * raw[i]
        sum += v
        squares += v * v
        n++
      }
    const focus = squares / n - (sum / n) ** 2
    if (focus < 35)
      warnings.push(
        'Compruebe el enfoque y que los síntomas se distingan. Esta comprobación es orientativa.',
      )
    return {
      buffer: processed,
      mimeType: 'image/jpeg',
      warnings,
      metrics: {
        original_bytes: buffer.length,
        bytes: processed.length,
        width: info.width,
        height: info.height,
        foco_orientativo: Math.round(focus),
      },
    }
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(
      422,
      'No se pudo preparar la imagen. Conserve la selección y vuelva a intentar.',
    )
  }
}
