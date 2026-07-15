import { expect, test, type Page } from '@playwright/test'

function failOnConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return () => expect(errors, errors.join('\n')).toEqual([])
}

async function chooseSandboxAlgorithm(page: Page, name: RegExp) {
  await page.getByRole('combobox', { name: 'Sandbox algorithm' }).click()
  await page.getByRole('option', { name }).click()
}

test('Visualize keeps sound controls intentionally simple', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#visualize')

  await expect(page.getByRole('switch', { name: /^Sound:/ })).toBeVisible()
  await expect(page.getByLabel('Sound preset')).toHaveValue(/classic|soft|minimal/)
  await expect(page.getByText('Volume', { exact: true })).toBeVisible()
  await expect(page.getByText('Waveform', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Pitch mode', { exact: true })).toHaveCount(0)
  await page.getByLabel('Sound preset').selectOption('soft')
  await expect(page.getByLabel('Sound preset')).toHaveValue('soft')
  assertNoConsoleErrors()
})

test('Sandbox renders, completes a large Merge Sort, and exposes advanced audio', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#sandbox')
  const canvas = page.locator('.sandbox-canvas')
  await expect(canvas).toBeVisible()
  await expect(canvas).toHaveAttribute('width', /\d+/)

  await page.getByLabel('Amount').selectOption('4096')
  await chooseSandboxAlgorithm(page, /^Merge Sort/)
  await page.getByLabel('Speed mode').selectOption('maximum')

  await page.getByText('Audio settings', { exact: true }).click()
  await page.getByLabel('Waveform').selectOption('sine')
  await page.getByLabel('Pitch mode').selectOption('pentatonic')
  await page.getByLabel('Sound density').selectOption('sparse')
  await expect(page.getByLabel('Waveform')).toHaveValue('sine')

  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.locator('.sandbox-page')).toHaveAttribute('data-status', 'complete', {
    timeout: 20_000,
  })
  await expect(page.locator('.sandbox-complete')).toContainText('Sort complete')
  await expect(page.locator('.sandbox-page')).toHaveAttribute('data-queue-size', '0')
  assertNoConsoleErrors()
})

test('Sandbox pauses, resumes, stops quickly, and cancels on route change', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#sandbox')
  await page.getByLabel('Amount').selectOption('512')
  await chooseSandboxAlgorithm(page, /^Optimized Bubble Sort/)
  await page.getByLabel('Speed mode').selectOption('realtime')

  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()

  const stopStarted = Date.now()
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.locator('.sandbox-page')).toHaveAttribute('data-status', 'idle')
  expect(Date.now() - stopStarted).toBeLessThan(750)

  await page.getByRole('button', { name: 'Start' }).click()
  await page.getByRole('button', { name: 'Learn' }).click()
  await expect(page.locator('.sandbox-page')).toHaveCount(0)
  assertNoConsoleErrors()
})

test('Sandbox explains restrictions and keeps hidden controls recoverable', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#sandbox')

  await page.getByRole('combobox', { name: 'Sandbox algorithm' }).click()
  const restricted = page.getByRole('option', { name: /^Optimized Bubble Sort/ })
  await expect(restricted).toBeDisabled()
  await expect(restricted).toContainText('limited to 512 values')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Hide interface' }).click()
  await expect(page.locator('.sandbox-page')).toHaveClass(/is-interface-hidden/)
  await expect(page.getByRole('button', { name: 'Restore Sandbox controls' })).toBeVisible()
  await page.keyboard.press('h')
  await expect(page.locator('.sandbox-controls')).toBeVisible()
  await page.getByRole('button', { name: 'Enter fullscreen' }).click()
  const exitFullscreen = page.getByRole('button', { name: 'Exit fullscreen' })
  if (await exitFullscreen.isVisible()) await exitFullscreen.click()
  assertNoConsoleErrors()
})

test('Sandbox mobile controls have no horizontal overflow', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#sandbox')

  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    controls:
      document.querySelector<HTMLElement>('.sandbox-controls')!.scrollWidth -
      document.querySelector<HTMLElement>('.sandbox-controls')!.clientWidth,
  }))
  expect(overflow.document).toBeLessThanOrEqual(1)
  expect(overflow.controls).toBeLessThanOrEqual(1)
  await expect(page.getByRole('button', { name: 'Start' })).toHaveCSS('min-height', '44px')
  assertNoConsoleErrors()
})
