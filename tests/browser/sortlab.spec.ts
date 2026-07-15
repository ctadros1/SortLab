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

async function chooseVisualizeAlgorithm(page: Page, name: RegExp) {
  await page.getByRole('combobox', { name: 'Algorithm' }).click()
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

test('Visualize uses independent desktop rails and page-level guide scrolling', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#visualize')

  const controls = page.locator('.control-rail')
  const guide = page.locator('.code-panel')
  await expect(controls).toHaveCSS('overflow-y', 'auto')
  await expect(guide).toHaveCSS('overflow-y', 'visible')

  const layout = await page.evaluate(() => {
    const controls = document.querySelector<HTMLElement>('.control-rail')!
    const guide = document.querySelector<HTMLElement>('.code-panel')!
    return {
      controlsTop: controls.getBoundingClientRect().top,
      controlsBottom: controls.getBoundingClientRect().bottom,
      controlsScrollable: controls.scrollHeight > controls.clientHeight,
      guideTop: guide.getBoundingClientRect().top,
      guideBottom: guide.getBoundingClientRect().bottom,
      viewportHeight: window.innerHeight,
    }
  })
  expect(layout.controlsScrollable).toBe(true)
  expect(layout.controlsTop).toBeCloseTo(72, 0)
  expect(layout.controlsBottom).toBeCloseTo(layout.viewportHeight, 0)
  expect(layout.guideTop).toBeCloseTo(72, 0)
  expect(layout.guideBottom).toBeGreaterThanOrEqual(layout.viewportHeight - 1)

  await controls.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  expect(await page.evaluate(() => window.scrollY)).toBe(0)

  await guide.hover()
  await page.mouse.wheel(0, 500)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  expect(await controls.evaluate((element) => element.getBoundingClientRect().top)).toBeCloseTo(
    72,
    0,
  )
  assertNoConsoleErrors()
})

test('Visualize code languages preserve semantic highlighting and persist', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#visualize')

  await expect(page.getByRole('tab', { name: 'Code' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Pseudocode' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Next' }).click()
  const activeLine = page.locator('.pseudocode li.is-current')
  await expect(activeLine).toHaveCount(1)
  const semanticId = await activeLine.getAttribute('data-semantic-line')
  expect(semanticId).toBeTruthy()

  const languageTrigger = page.getByRole('combobox', { name: 'Code language' })
  const languages = ['Pseudocode', 'C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript']
  for (const language of languages) {
    await languageTrigger.click()
    await page.getByRole('option', { name: language, exact: true }).click()
    await expect(languageTrigger).toContainText(language)
    await expect(page.locator(`.pseudocode li[data-semantic-line="${semanticId}"]`)).toHaveClass(
      /is-current/,
    )
  }

  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Code language' })).toContainText('TypeScript')
  assertNoConsoleErrors()
})

test('Visualize refines progress, legend, statistics, and complexity', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#visualize')

  await expect(page.getByRole('progressbar')).toBeVisible()
  await expect(page.getByLabel('Animation timeline')).toHaveCount(0)
  await expect(page.getByText('Active boundary', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Animation duration reflects event count')).toHaveCount(0)
  await expect(page.locator('.complexity-grid dt')).toHaveText(['Worst', 'Average', 'Best'])
  await expect(page.locator('.complexity-summary').getByText('Space', { exact: true })).toHaveCount(
    0,
  )
  await expect(page.locator('[data-stat="current-phase"]')).toBeVisible()
  await expect(page.locator('[data-stat="js-execution"]')).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  await expect(page.locator('.event-progress__current')).toBeVisible()
  assertNoConsoleErrors()
})

test('Visualize highlights recursive, distribution, and network algorithms', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#visualize')

  for (const algorithm of [/^Merge Sort/, /^Counting Sort/, /^Bitonic Sort/]) {
    await chooseVisualizeAlgorithm(page, algorithm)
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.locator('.pseudocode li.is-current')).toHaveCount(1)
    await expect(page.locator('.line-explanation')).not.toContainText(
      'Start the algorithm to connect each visual operation',
    )
    await page.getByRole('button', { name: 'Reset' }).click()
  }

  assertNoConsoleErrors()
})

test('Visualize remains usable without horizontal page overflow on mobile', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#visualize')

  await expect(page.getByRole('tab', { name: 'Code' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Code language' })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(1)
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
