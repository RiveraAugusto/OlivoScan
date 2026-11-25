/**
 * Offline operator utility. Read-only unless --apply is explicitly supplied.
 * Run against a backed-up review environment first. Never run from a web route.
 */
import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
const apply = process.argv.includes('--apply'),
  cloud = process.env.CLOUDINARY_CLOUD_NAME
for (const name of [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]) {
  if (!process.env[name])
    throw new Error('Falta configurar ' + name + '. No se ha modificado ningún recurso.')
}
cloudinary.config({
  cloud_name: cloud,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const directory = path.resolve('.migration-local'),
  journalPath = path.join(directory, 'imagenes.json')
let journal = {}
try {
  journal = JSON.parse(await readFile(journalPath, 'utf8'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
async function checkpoint() {
  await mkdir(directory, { recursive: true, mode: 0o700 })
  await writeFile(journalPath, JSON.stringify(journal, null, 2), { mode: 0o600 })
}
function sourceId(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    return null
  }
  const prefix = '/' + cloud + '/image/upload/'
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'res.cloudinary.com' ||
    !url.pathname.startsWith(prefix)
  )
    return null
  // Only versioned, original upload URLs are inferred automatically.
  const match = url.pathname.slice(prefix.length).match(/^v[0-9]+\/(.+)\.(jpg|jpeg|png|webp)$/i)
  return match ? decodeURIComponent(match[1]) : null
}
async function boundedDownload(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: 'error' })
  if (!response.ok) throw new Error('No se pudo descargar el original del proveedor.')
  const reader = response.body.getReader(),
    parts = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > 10 * 1024 * 1024) {
        await reader.cancel()
        throw new Error('Original superior a 10 MiB: requiere revisión manual.')
      }
      parts.push(Buffer.from(value))
    }
  } finally {
    reader.releaseLock()
  }
  return Buffer.concat(parts)
}
let offset = 0,
  pending = 0,
  migrated = 0,
  inventory = 0
while (true) {
  const { data, error } = await db
    .from('analisis')
    .select('id,imagen_url,imagen_privada')
    .eq('imagen_privada', false)
    .order('id')
    .range(offset, offset + 99)
  if (error) throw new Error('No se pudo leer el inventario de análisis.')
  if (!data.length) break
  for (const analysis of data) {
    inventory++
    const oldId = sourceId(analysis.imagen_url)
    if (!oldId) {
      pending++
      console.log(analysis.id + ': requiere inventario manual del recurso original.')
      continue
    }
    if (!apply) {
      console.log(analysis.id + ': candidato Cloudinary; sin cambios.')
      continue
    }
    try {
      let record = journal[analysis.id]
      if (record && record.oldId !== oldId)
        throw new Error('El origen cambió; revise el diario local.')
      if (!record) {
        const resource = await cloudinary.api.resource(oldId, {
          resource_type: 'image',
          type: 'upload',
        })
        const original = new URL(resource.secure_url)
        if (
          original.hostname !== 'res.cloudinary.com' ||
          !original.pathname.startsWith('/' + cloud + '/image/upload/')
        )
          throw new Error('Origen no permitido.')
        const bytes = await boundedDownload(original.href)
        const metadata = await sharp(bytes, {
          limitInputPixels: 24000000,
          failOn: 'error',
        }).metadata()
        if (!['jpeg', 'png', 'webp'].includes(metadata.format) || metadata.pages > 1)
          throw new Error('Formato original no admitido.')
        const processed = await sharp(bytes, { limitInputPixels: 24000000 })
          .rotate()
          .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
          .flatten({ background: '#ffffff' })
          .jpeg({ quality: 95 })
          .toBuffer()
        const uploaded = await cloudinary.uploader.upload(
          'data:image/jpeg;base64,' + processed.toString('base64'),
          {
            type: 'authenticated',
            resource_type: 'image',
            public_id: 'olivoscan/privadas/' + randomUUID(),
            overwrite: false,
          },
        )
        if (uploaded.type !== 'authenticated')
          throw new Error('No se confirmó el almacenamiento privado.')
        record = { oldId, newId: uploaded.public_id, originalRemoved: false }
        journal[analysis.id] = record
        await checkpoint()
      }
      const verified = await cloudinary.api.resource(record.newId, {
        resource_type: 'image',
        type: 'authenticated',
      })
      if (verified.type !== 'authenticated') throw new Error('No se confirmó el recurso privado.')
      if (!record.originalRemoved) {
        const removal = await cloudinary.uploader.destroy(record.oldId, {
          resource_type: 'image',
          type: 'upload',
          invalidate: true,
        })
        if (!['ok', 'not found'].includes(removal.result))
          throw new Error('No se pudo retirar la copia pública.')
        record.originalRemoved = true
        await checkpoint()
      }
      const previous = await fetch(analysis.imagen_url, {
        method: 'HEAD',
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      })
      if (![401, 403, 404, 410].includes(previous.status))
        throw new Error('La copia pública o su caché todavía requieren verificación.')
      const { error: updateError } = await db
        .from('analisis')
        .update({
          imagen_public_id: record.newId,
          imagen_url: 'cloudinary://' + record.newId,
          imagen_privada: true,
        })
        .eq('id', analysis.id)
        .eq('imagen_privada', false)
      if (updateError) throw new Error('No se pudo actualizar la referencia privada.')
      record.completed = true
      await checkpoint()
      migrated++
      console.log(analysis.id + ': migrado a copia privada.')
    } catch {
      // Do not print provider errors, URLs or credentials.
      pending++
      console.error(
        analysis.id + ': pendiente; revise el diario local y el proveedor antes de reintentar.',
      )
    }
  }
  // Updating rows changes the filtered set; skip only the rows left pending in this batch.
  offset += data.length - (apply ? data.filter((a) => journal[a.id]?.completed).length : 0)
}
console.log(
  JSON.stringify({
    modo: apply ? 'aplicar' : 'inventario',
    inventariados: inventory,
    migrados: migrated,
    pendientes: pending,
  }),
)
if (pending) process.exitCode = 2
