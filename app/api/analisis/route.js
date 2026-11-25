import { endpoint, json, result, HttpError, adminClient } from '@/lib/server/http'
import { boundedFormData, processImage } from '@/lib/server/images'
import { uploadPrivateImage, removePrivateImage } from '@/lib/server/storage'
import { analizarImagenConGemini } from '@/lib/gemini'
import { uuid } from '@/lib/contracts'
import { readAnalysis } from '@/lib/server/analisis'
export const runtime = 'nodejs'
export const maxDuration = 180
export const POST = endpoint(async (request, { db, user }) => {
  const form = await boundedFormData(request),
    file = form.get('imagen')
  const parcelaId = uuid.parse(form.get('parcela_id')),
    olivoId = form.get('olivo_id') ? uuid.parse(form.get('olivo_id')) : null
  if (!(file instanceof File)) throw new HttpError(400, 'Seleccione una fotografía.')
  const { data: parcela } = await result(
    db
      .from('parcelas')
      .select('id')
      .eq('id', parcelaId)
      .eq('propietario_id', user.id)
      .eq('archivada', false)
      .maybeSingle(),
  )
  if (!parcela) throw new HttpError(422, 'Seleccione una parcela propia activa.')
  if (olivoId) {
    const { data: olivo } = await result(
      db
        .from('olivos')
        .select('id')
        .eq('id', olivoId)
        .eq('parcela_id', parcelaId)
        .eq('archivado', false)
        .maybeSingle(),
    )
    if (!olivo)
      throw new HttpError(422, 'El olivo no pertenece a la parcela seleccionada o está archivado.')
  }
  const image = await processImage(Buffer.from(await file.arrayBuffer()), file.type)
  const { data: catalogo } = await result(
    db.from('plagas_catalogo').select('nombre,sintomas').limit(100),
  )
  const diagnosis = await analizarImagenConGemini(image.buffer, image.mimeType, catalogo)
  const publicId = await uploadPrivateImage(image.buffer)
  let id
  try {
    const { data } = await result(
      adminClient()
        .from('analisis')
        .insert({
          ...diagnosis,
          usuario_id: user.id,
          parcela_id: parcelaId,
          olivo_id: olivoId,
          imagen_url: 'cloudinary://' + publicId,
          imagen_public_id: publicId,
          imagen_privada: true,
          advertencias_imagen: image.warnings,
        })
        .select('id')
        .single(),
    )
    id = data.id
  } catch (error) {
    await removePrivateImage(publicId)
    throw error
  }
  // La notificación es secundaria; un fallo no convierte un diagnóstico guardado en un error reintentable.
  try {
    await result(
      db.from('notificaciones').insert({
        usuario_id: user.id,
        mensaje: 'Análisis de muestra completado: ' + diagnosis.plaga_detectada + '.',
        tipo: diagnosis.severidad === 'grave' ? 'alerta' : 'analisis_completo',
      }),
    )
  } catch {
    console.error('[OlivoScan] Notificación de análisis pendiente')
  }
  return json(await readAnalysis(db, id), 201)
})
