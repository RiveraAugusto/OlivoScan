import sharp from 'sharp'
import { describe,it,expect } from 'vitest'
import { processImage,MAX_INPUT_BYTES } from '../lib/server/images'
describe('Validación real de fotografías',()=>{
 it('rechaza datos corruptos y MIME falsificado',async()=>{await expect(processImage(Buffer.from('not an image'),'image/jpeg')).rejects.toThrow();const png=await sharp({create:{width:32,height:32,channels:3,background:'#789466'}}).png().toBuffer();await expect(processImage(png,'image/jpeg')).rejects.toThrow()})
 it('rechaza imágenes vacías o mayores de 10 MiB',async()=>{await expect(processImage(Buffer.alloc(0),'image/jpeg')).rejects.toThrow();await expect(processImage(Buffer.alloc(MAX_INPUT_BYTES+1),'image/png')).rejects.toThrow()})
 it('optimiza proporciones, quita EXIF y no amplía imágenes pequeñas',async()=>{
  const jpeg=await sharp({create:{width:3000,height:1500,channels:3,background:'#789466'}}).withMetadata({orientation:1}).jpeg().toBuffer()
  const out=await processImage(jpeg,'image/jpeg'),m=await sharp(out.buffer).metadata()
  expect([m.width,m.height]).toEqual([2048,1024]);expect(m.exif).toBeUndefined();expect(out.buffer.length).toBeLessThanOrEqual(2*1024*1024)
  const small=await sharp({create:{width:160,height:80,channels:3,background:'#444'}}).webp().toBuffer()
  const o=await processImage(small,'image/webp');expect(o.metrics.width).toBe(160);expect(o.warnings.length).toBeGreaterThan(0)
 })
})
