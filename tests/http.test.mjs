import { describe, it, expect, vi, afterEach } from 'vitest'
import { endpoint, HttpError, dbError } from '../lib/server/http'
import { GET as legacy } from '../app/api/analisis/compartido/[id]/route'
import { createToken, hashToken, readShared } from '../lib/server/enlaces'
afterEach(() => vi.restoreAllMocks())
describe('Límites HTTP y acceso público', () => {
  it('requiere una sesión antes de leer o mutar contenido', async () => {
    const handler = vi.fn()
    const response = await endpoint(handler)(new Request('https://example.test/api/parcelas'))
    expect(response.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
  it('no publica detalles de proveedores o credenciales en errores inesperados', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await endpoint(
      () => {
        throw new Error('SECRET_PROVIDER_KEY')
      },
      { publicAccess: true },
    )(new Request('https://example.test/api/compartido'))
    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('SECRET_PROVIDER_KEY')
    expect(JSON.stringify(log.mock.calls)).not.toContain('SECRET_PROVIDER_KEY')
  })
  it('explica errores controlados y conflictos de concurrencia', async () => {
    const response = await endpoint(
      () => {
        throw new HttpError(409, 'Recargue la revisión.')
      },
      { publicAccess: true },
    )(new Request('https://example.test/api/revisiones'))
    expect(response.status).toBe(409)
    expect((await response.json()).error).toBe('Recargue la revisión.')
    expect(dbError({ code: '40001' }).status).toBe(409)
  })
  it('el antiguo UUID público ya no concede acceso', async () => {
    const response = legacy()
    expect(response.status).toBe(410)
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
  it('crea secretos distintos del UUID y almacena su huella', () => {
    const token = createToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(hashToken(token)).toMatch(/^[a-f0-9]{64}$/)
    expect(createToken()).not.toBe(token)
  })
  it('rechaza secretos en la URL sin la cabecera de autorización', async () => {
    await expect(
      readShared(new Request('https://example.test/api/compartido?token=' + 'a'.repeat(43))),
    ).rejects.toMatchObject({ status: 404 })
  })
})
