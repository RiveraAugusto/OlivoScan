import { test, expect, id } from './fixtures.mjs'
import AxeBuilder from '@axe-core/playwright'
test('parcela sin ID de olivo: captura, incertidumbre, revisión y PDF', async ({ page, setup }) => {
  await setup()
  await page.goto('/analisis')
  await page.getByLabel('Parcela obligatoria').selectOption({ label: 'NORTE · Parcela Norte' })
  await expect(page.getByLabel('ID del olivo (opcional)')).toHaveValue('')
  await page.getByLabel('Elegir de la galería').setInputFiles('public/images/hoja_sana.png')
  await expect(
    page.getByAltText('Vista previa de la muestra que se enviará a analizar'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Analizar y guardar muestra' }).click()
  await expect(page).toHaveURL('/analisis/' + id)
  await expect(page.getByRole('heading', { name: 'No reconocido', exact: true })).toBeVisible()
  await expect(
    page.getByText('Esto no significa que el olivo esté sano.', { exact: false }),
  ).toBeVisible()
  await page.getByLabel('Notas del agricultor').fill('Observar de nuevo en campo')
  await page
    .getByLabel('Corrección sugerida por el agricultor (opcional)')
    .fill('Pendiente de confirmar')
  await page.getByRole('button', { name: 'Guardar observaciones' }).click()
  await expect(page.getByText('Observaciones guardadas.', { exact: true })).toBeVisible()
  await expect(page.getByText('Sin revisión profesional', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Solicitar revisión agronómica' }).click()
  await expect(page.getByText('Solicitud enviada para asignación.', { exact: true })).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar PDF' }).click()
  expect((await download).suggestedFilename()).toMatch(/OlivoScan_muestra_.*\.pdf/)
})
test('parcelas: creación y archivo conservan el registro', async ({ page, setup }) => {
  await setup()
  await page.goto('/parcelas')
  await page.getByRole('button', { name: 'Crear parcela', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Crear parcela' })
  await dialog.getByLabel('Código de parcela').fill('ESTE')
  await dialog.getByLabel('Nombre de la parcela').fill('Parcela Este')
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Parcela Este', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Archivar ESTE', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Archivar parcela' })
    .getByRole('button', { name: 'Confirmar' })
    .click()
  await expect(page.getByText('Archivada', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Parcela Este', exact: true })).toBeVisible()
})
test('compartir: consentimiento, selección de campos, fragmento y revocación', async ({
  page,
  setup,
}) => {
  await setup()
  await page.goto('/analisis/' + id)
  await page.getByRole('button', { name: 'Compartir', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Compartir con autorización' })
  await expect(dialog.getByLabel('Notas y corrección del agricultor')).not.toBeChecked()
  await expect(dialog.getByLabel('Parcela e identificador del olivo')).not.toBeChecked()
  await dialog.getByLabel('Autorizo explícitamente compartir los datos marcados.').check()
  await dialog.getByRole('button', { name: 'Crear enlace autorizado' }).click()
  const url = await dialog.getByLabel('Enlace creado (cópielo ahora)').inputValue()
  expect(url).toContain('/analisis/compartido#')
  expect(new URL(url).search).toBe('')
  await dialog.getByRole('button', { name: /Revocar enlace del/ }).click()
  await expect(dialog.getByText('Revocado', { exact: true })).toBeVisible()
  await page.goto(url)
  await expect(page.getByRole('alert').filter({ hasText: 'revocado' })).toContainText('revocado')
})
test('navegación, foco, contraste y tamaños en pantallas principales', async ({
  page,
  setup,
}, testInfo) => {
  test.setTimeout(90000)
  await setup()
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of [
      '/dashboard',
      '/analisis',
      '/parcelas',
      '/historial',
      '/revisiones',
      '/comparar',
      '/catalogo',
      '/perfil',
    ]) {
      await page.goto(route)
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.getByText('Cargando información…', { exact: true })).toHaveCount(0)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
      expect.soft(overflow, route + ' ' + width + 'px overflow').toBe(false)
      const small = await page
        .locator(
          'button:visible, select:visible, input:not([type="checkbox"]):not([type="radio"]):visible, a.btn:visible',
        )
        .evaluateAll((els) =>
          els
            .filter((e) => {
              const r = e.getBoundingClientRect()
              return r.height < 47.9 || r.width < 47.9
            })
            .map((e) => ({
              text: e.textContent || e.getAttribute('aria-label'),
              width: e.getBoundingClientRect().width,
              height: e.getBoundingClientRect().height,
            })),
        )
      expect.soft(small, route + ' ' + width + 'px targets').toEqual([])
      if (width === 390) {
        const a11y = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
        expect.soft(a11y.violations, route + ' accessibility').toEqual([])
      }
    }
  }
  await page.goto('/parcelas')
  await page.getByRole('button', { name: 'Crear parcela', exact: true }).click()
  await expect(page.getByLabel('Código de parcela')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Crear parcela', exact: true })).toBeFocused()
  await testInfo.attach('browser-matrix', {
    body: JSON.stringify(
      {
        project: testInfo.project.name,
        version: page.context().browser().version(),
        platform: process.platform,
        widths: [360, 390, 768, 1024, 1440],
        device: 'desktop engines with emulated viewport; not real camera',
      },
      null,
      2,
    ),
    contentType: 'application/json',
  })
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/dashboard', '/analisis']) {
      await page.goto(route)
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.getByText('Cargando información…', { exact: true })).toHaveCount(0)
      await testInfo.attach(route.slice(1) + '-' + width, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      })
    }
  }
})
test('acceso público y enlace anterior sin diagnóstico expuesto', async ({ page, request }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Correo electrónico')).toBeVisible()
  const legacy = await request.get('/api/analisis/compartido/' + id)
  expect(legacy.status()).toBe(410)
  for (const path of [
    '/api/parcelas',
    '/api/revisiones',
    '/api/historial',
    '/api/analisis/' + id,
    '/api/analisis/' + id + '/imagen',
  ]) {
    const response = await request.get(path)
    expect(response.status()).toBe(401)
    expect(response.headers()['cache-control']).toContain('no-store')
  }
  await page.goto('/analisis/compartido/' + id)
  await expect(
    page.getByRole('heading', { name: 'Este enlace ya no está disponible' }),
  ).toBeVisible()
})

test('agrónomo: iniciar, emitir y rectificar sin sobrescribir versiones', async ({
  page,
  setup,
}) => {
  await setup('agronomo')
  await page.goto('/revisiones')
  await page.getByRole('button', { name: 'Iniciar revisión', exact: true }).click()
  await expect(page.getByText('Revisión iniciada.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Emitir revisión', exact: true }).click()
  let dialog = page.getByRole('dialog', { name: 'Emitir revisión agronómica' })
  await dialog
    .getByRole('combobox', { name: 'Conclusión', exact: true })
    .selectOption('no_concluyente')
  await dialog.getByLabel('Fundamento y observaciones').fill('Se requiere una visita al campo.')
  await dialog.getByRole('button', { name: 'Emitir revisión firmada con mi cuenta' }).click()
  await expect(page.getByText('Versión 1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Rectificar con nueva versión' }).click()
  dialog = page.getByRole('dialog', { name: 'Emitir revisión agronómica' })
  await dialog.getByRole('combobox', { name: 'Conclusión', exact: true }).selectOption('corregida')
  await dialog.getByLabel('Diagnóstico corregido', { exact: true }).fill('Repilo')
  await dialog.getByLabel('Fundamento y observaciones').fill('Nueva evidencia revisada.')
  await dialog.getByRole('button', { name: 'Emitir revisión firmada con mi cuenta' }).click()
  await expect(page.getByText('Versión 1', { exact: true })).toBeVisible()
  await expect(page.getByText('Versión 2', { exact: true })).toBeVisible()
  await expect(page.getByText('Victoria Campo ·', { exact: false }).first()).toBeVisible()
})
test('administración: asignar sin acceso al contenido de la muestra', async ({ page, setup }) => {
  await setup('admin')
  await page.goto('/revisiones')
  await expect(page.getByRole('link', { name: 'Ver muestra y diagnóstico' })).toHaveCount(0)
  await page
    .getByRole('combobox', { name: 'Especialista autorizado', exact: true })
    .selectOption({ label: 'Especialista Campo' })
  await page.getByRole('button', { name: 'Guardar asignación' }).click()
  await expect(
    page.getByText('Especialista asignado; se notificó la solicitud.', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Especialista asignado', { exact: true })).toBeVisible()
})
test('fallo de red conserva foto y permite reintentar sin afirmar guardado', async ({
  page,
  setup,
}) => {
  await setup()
  let fail = true
  await page.route('**/api/analisis', async (route) => {
    if (fail && route.request().method() === 'POST') {
      fail = false
      await route.abort('failed')
    } else await route.fallback()
  })
  await page.goto('/analisis')
  await page.getByLabel('Parcela obligatoria').selectOption({ label: 'NORTE · Parcela Norte' })
  await page.getByLabel('Elegir de la galería').setInputFiles('public/images/hoja_sana.png')
  await page.getByRole('button', { name: 'Analizar y guardar muestra' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'La foto permanece disponible' }),
  ).toBeVisible()
  await expect(
    page.getByAltText('Vista previa de la muestra que se enviará a analizar'),
  ).toBeVisible()
  await expect(page).toHaveURL('/analisis')
  await page.getByRole('button', { name: 'Analizar y guardar muestra' }).click()
  await expect(page).toHaveURL('/analisis/' + id)
})
