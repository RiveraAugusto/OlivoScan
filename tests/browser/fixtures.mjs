import { test as base, expect } from '@playwright/test'
const owner = '10000000-0000-4000-8000-000000000001',
  agronomo = '10000000-0000-4000-8000-000000000003',
  parcela = '20000000-0000-4000-8000-000000000001',
  id = '40000000-0000-4000-8000-000000000001',
  requestId = '50000000-0000-4000-8000-000000000001'
export const sample = {
  id,
  usuario_id: owner,
  parcela_id: parcela,
  olivo_id: null,
  imagen_privada: false,
  imagen_url: null,
  plaga_detectada: 'No reconocido',
  confianza: 0,
  severidad: 'no_aplica',
  estado_diagnostico: 'no_reconocido',
  descripcion: 'El síntoma no se distingue en esta fotografía.',
  recomendacion: 'Tome una nueva fotografía o solicite revisión agronómica.',
  notas: '',
  plaga_corregida: null,
  modelo_version: 'modelo-de-prueba',
  creado_en: '2026-11-25T12:00:00Z',
  parcela: { id: parcela, codigo: 'NORTE', nombre: 'Parcela Norte', archivada: false },
  olivo: null,
  solicitudes: [],
}
export const test = base.extend({
  setup: async ({ page }, provide) => {
    async function setup(role = 'agricultor') {
      const uid = role === 'agronomo' ? agronomo : owner
      const user = {
        id: uid,
        email: 'campo@example.test',
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        created_at: '2026-01-01T00:00:00Z',
      }
      const encode = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
      const token =
        encode({ alg: 'HS256', typ: 'JWT' }) +
        '.' +
        encode({
          sub: uid,
          exp: Math.floor(Date.now() / 1000) + 86400,
          aud: 'authenticated',
          role: 'authenticated',
        }) +
        '.localfixture'
      await page.addInitScript(
        ({ user, token }) =>
          localStorage.setItem(
            'sb-olivoscan-test-auth-token',
            JSON.stringify({
              access_token: token,
              refresh_token: 'local-refresh-token',
              expires_at: Math.floor(Date.now() / 1000) + 86400,
              expires_in: 86400,
              token_type: 'bearer',
              user,
            }),
          ),
        { user, token },
      )
      let parcels = [
          {
            id: parcela,
            propietario_id: owner,
            codigo: 'NORTE',
            nombre: 'Parcela Norte',
            archivada: false,
          },
        ],
        requests = [],
        links = [],
        notes = '',
        farmerCorrection = null,
        revoked = false
      await page.route('https://olivoscan-test.supabase.co/**', async (route) => {
        const url = new URL(route.request().url())
        if (url.pathname.includes('/usuarios'))
          return route.fulfill({
            json: {
              id: uid,
              nombre: 'Victoria Campo',
              zona_geografica: 'Ilo',
              rol: role,
              gestionar_catalogo: role === 'agronomo',
            },
          })
        if (url.pathname.includes('/auth/v1/user')) return route.fulfill({ json: user })
        return route.fulfill({ json: {} })
      })
      await page.route('**/api/**', async (route) => {
        const req = route.request(),
          url = new URL(req.url()),
          path = url.pathname,
          method = req.method()
        const body = () => {
          try {
            return req.postDataJSON()
          } catch {
            return {}
          }
        }
        let data = null,
          extra = {}
        if (path === '/api/parcelas') {
          if (method === 'POST') {
            const p = {
              ...body(),
              id: '20000000-0000-4000-8000-000000000002',
              propietario_id: owner,
              archivada: false,
            }
            parcels.push(p)
            data = p
          } else if (method === 'PATCH') {
            parcels = parcels.map((p) => (p.id === body().id ? { ...p, ...body() } : p))
            data = parcels.find((p) => p.id === body().id)
          } else data = parcels
        } else if (path === '/api/olivos') data = []
        else if (path === '/api/dashboard')
          data = {
            totalAnalisis: 1,
            parcelasAnalizadas: 1,
            parcelasActivas: 1,
            muestrasSinParcela: 0,
            muestrasGraves30d: 0,
            revisionesPendientes: requests.length,
            datosGrafico: [{ mes: '2026-11', sanas: 0, plagas: 0, inciertas: 1 }],
            plagasMasFrecuentes: [],
          }
        else if (path === '/api/notificaciones') data = []
        else if (path === '/api/catalogo') data = []
        else if (path === '/api/historial') {
          data = [{ ...sample, notas: notes, solicitudes: requests }]
          extra = { total: 1, pagina: 1, limite: 12 }
        } else if (path === '/api/analisis' && method === 'POST') {
          data = sample
        } else if (path === '/api/analisis/' + id) {
          if (method === 'PATCH') {
            notes = body().notas || ''
            farmerCorrection = body().plaga_corregida || null
          }
          data = {
            ...sample,
            notas: notes,
            plaga_corregida: farmerCorrection,
            solicitudes: requests,
          }
        } else if (path === '/api/revisiones') {
          if (method === 'POST')
            requests = [
              {
                id: requestId,
                analisis_id: id,
                propietario_id: owner,
                agronomo_id: null,
                estado: 'pendiente',
                creado_en: sample.creado_en,
                actualizado_en: sample.creado_en,
                revisiones: [],
              },
            ]
          data = requests
        } else if (path === '/api/enlaces') {
          if (method === 'POST') {
            const input = body()
            links.push({
              id: requestId,
              campos: input.campos,
              creado_en: sample.creado_en,
              vence_en: '2099-01-01T00:00:00Z',
              revocado_en: null,
            })
            data = {
              ...links[0],
              url: 'http://127.0.0.1:3100/analisis/compartido#' + 'A'.repeat(43),
            }
          } else if (method === 'DELETE') {
            revoked = true
            links = links.map((l) => ({ ...l, revocado_en: new Date().toISOString() }))
            data = { revocado: true }
          } else data = links
        } else if (path === '/api/compartido') {
          if (revoked)
            return route.fulfill({
              status: 404,
              json: { datos: null, error: 'El enlace ha vencido o fue revocado.' },
            })
          const selected = links[0]?.campos || ['diagnostico']
          data = {
            campos: selected,
            creado_en: sample.creado_en,
            vence_en: '2099-01-01T00:00:00Z',
            ...(selected.includes('diagnostico')
              ? {
                  plaga_detectada: sample.plaga_detectada,
                  estado_diagnostico: sample.estado_diagnostico,
                  severidad: sample.severidad,
                  descripcion: sample.descripcion,
                  confianza: sample.confianza,
                }
              : {}),
            ...(selected.includes('recomendacion') ? { recomendacion: sample.recomendacion } : {}),
            ...(selected.includes('notas') ? { notas: notes } : {}),
          }
        } else return route.continue()
        return route.fulfill({ status: 200, json: { datos: data, error: null, ...extra } })
      })
    }
    await provide(setup)
  },
})
export { expect, owner, parcela, id }
