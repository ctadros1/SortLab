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

async function setSandboxAmount(page: Page, amount: number) {
  const input = page.getByRole('spinbutton', { name: 'Amount' })
  await input.fill(String(amount))
  await input.press('Enter')
  await expect(input).toHaveValue(String(amount))
}

async function chooseVisualizeAlgorithm(page: Page, name: RegExp) {
  await page.getByRole('combobox', { name: 'Algorithm' }).click()
  await page.getByRole('option', { name }).click()
}

test('Header theme indicator slides accessibly and Sandbox is last', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#visualize')

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
  await expect(navigation.getByRole('button')).toHaveText([
    'Visualize',
    'Compare',
    'Learn',
    'Benchmark',
    'Sandbox',
  ])

  const themeControl = page.getByRole('group', { name: 'Color theme' })
  const indicator = themeControl.locator('.theme-control__indicator')
  await expect(themeControl).toHaveText('')
  await expect(themeControl.locator('[data-tooltip]')).toHaveCount(0)

  await page.getByRole('button', { name: 'Light theme' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Light theme' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.waitForTimeout(250)
  const lightTransform = await indicator.evaluate((element) => getComputedStyle(element).transform)

  await page.getByRole('button', { name: 'System theme' }).click()
  await page.waitForTimeout(250)
  const systemTransform = await indicator.evaluate((element) => getComputedStyle(element).transform)
  expect(systemTransform).not.toBe(lightTransform)

  await page.getByRole('button', { name: 'Dark theme' }).click()
  await expect(page.getByRole('button', { name: 'Dark theme' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.waitForTimeout(250)
  const darkTransform = await indicator.evaluate((element) => getComputedStyle(element).transform)
  expect(darkTransform).not.toBe(systemTransform)

  await page.getByRole('button', { name: 'System theme' }).click()
  await page.waitForTimeout(250)
  await expect(indicator).toHaveCSS('transform', systemTransform)
  await page.getByRole('button', { name: 'Light theme' }).click()
  await page.waitForTimeout(250)
  await expect(indicator).toHaveCSS('transform', lightTransform)

  await page.getByRole('button', { name: 'Sandbox' }).click()
  await expect(page.getByRole('button', { name: 'Sandbox' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  assertNoConsoleErrors()
})

test('Theme indicator disables motion when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#visualize')
  const duration = await page
    .locator('.theme-control__indicator')
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration))
  expect(duration).toBeLessThanOrEqual(0.001)
})

test('Learn opens each algorithm as a dedicated lesson and keeps the SortLab wordmark joined', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#learn')

  const wordmark = page.getByRole('banner').locator('.brand-wordmark')
  await expect(wordmark).toHaveText('SortLab')
  await expect(wordmark).toHaveCSS('gap', '0px')
  await expect(
    page.getByRole('heading', { name: 'Understand every sort, one idea at a time' }),
  ).toBeVisible()
  await expect(page.locator('.catalog-layout')).toHaveCount(0)
  await expect(page.locator('.algorithm-detail')).toHaveCount(0)
  await expect(page.locator('.learn-algorithm-row')).toHaveCount(49)

  const visibleFilters = page.locator('.learn-filters--desktop')
  await visibleFilters.getByLabel('Type').selectOption('distribution')
  await expect(page.getByText(/of 49 algorithms/)).toBeVisible()
  await visibleFilters.getByLabel('Type').selectOption('all')
  await page.getByRole('searchbox', { name: 'Search algorithms' }).fill('Quick Sort (Hoare)')
  await page.getByRole('button', { name: /^Quick Sort \(Hoare\)/ }).click()

  await expect(page).toHaveURL(/#learn\/quick-hoare$/)
  await expect(page.getByRole('heading', { name: 'Quick Sort (Hoare)', level: 1 })).toBeVisible()
  await expect(page.getByRole('article')).toContainText('Central idea')
  await expect(page.getByLabel('Quick Sort (Hoare) key facts')).toContainText('O(n log n)')
  await expect(page.locator('.learn-lesson__icon img')).toHaveJSProperty('complete', true)

  await page.reload()
  await expect(page).toHaveURL(/#learn\/quick-hoare$/)
  await expect(page.getByRole('heading', { name: 'Quick Sort (Hoare)', level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'Learn' }).click()
  await expect(page).toHaveURL(/#learn$/)
  await expect(
    page.getByRole('heading', { name: 'Understand every sort, one idea at a time' }),
  ).toBeVisible()
  assertNoConsoleErrors()
})

test('Learn uses a responsive mobile list and filter disclosure without horizontal overflow', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#learn')

  await expect(page.getByText('Filters', { exact: true })).toBeVisible()
  await page.getByText('Filters', { exact: true }).click()
  await expect(page.locator('.learn-filter-disclosure')).toHaveAttribute('open', '')
  await expect(page.locator('.learn-filters--mobile').getByLabel('Family')).toBeVisible()
  await expect(page.locator('.learn-index__header')).toBeHidden()
  await expect(page.locator('.learn-algorithm-row').first()).toHaveCSS('min-height', '138px')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)

  await page.getByText('Filters', { exact: true }).click()
  await page.getByRole('searchbox', { name: 'Search algorithms' }).fill('Quick Sort (Hoare)')
  await page.getByRole('button', { name: /^Quick Sort \(Hoare\)/ }).click()
  await expect(page.locator('.learn-facts')).toHaveCSS('grid-template-columns', /[\d.]+px [\d.]+px/)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBe(0)
  assertNoConsoleErrors()
})

test('Learn complexity chart uses one accurate shared scale with accessible source values', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#learn')

  const chart = page.getByRole('img', { name: 'Representative algorithm growth classes' })
  await expect(chart).toBeVisible()
  await expect(chart.locator('.growth-line')).toHaveCount(7)
  await expect(chart.locator('.growth-line').first()).toHaveAttribute('data-end-value', '1')
  await expect(page.getByText('Every curve uses the same log-scaled axis')).toBeVisible()
  await expect(page.getByText('n! = 3,628,800')).toBeVisible()

  const endpoints = await chart
    .locator('.growth-line')
    .evaluateAll((lines) => lines.map((line) => Number(line.getAttribute('data-end-value'))))
  expect(endpoints).toEqual([1, Math.log2(10), 10, 10 * Math.log2(10), 100, 1024, 3_628_800])
  expect(new Set(endpoints).size).toBe(7)
  assertNoConsoleErrors()
})

test('SEO metadata and generated brand assets are complete', async ({ page, request }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#visualize')

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://project.christiantadros.com/sortlab/',
  )
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://project.christiantadros.com/sortlab/social-share.png',
  )
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  )
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/site.webmanifest')

  for (const path of [
    '/favicon.ico',
    '/favicon.svg',
    '/apple-touch-icon.png',
    '/site.webmanifest',
    '/social-share.png',
    '/robots.txt',
    '/sitemap.xml',
  ]) {
    expect((await request.get(path)).ok(), path).toBe(true)
  }
  assertNoConsoleErrors()
})

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
  expect(await guide.evaluate((element) => element.getBoundingClientRect().top)).toBeCloseTo(72, 0)
  assertNoConsoleErrors()
})

test('Visualize keeps every bar the same width across one- and two-digit indices', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#visualize')

  const widths = await page
    .locator('.sort-bar')
    .evaluateAll((bars) => bars.map((bar) => bar.getBoundingClientRect().width))
  expect(widths.length).toBeGreaterThan(10)
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(0.1)
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
  const languages = ['Pseudocode', 'C / C++', 'Java', 'Python', 'TypeScript']
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

test('Visualize exposes complete reference code without crowding the guided view', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#visualize')

  await page.getByRole('button', { name: 'Full implementation' }).click()
  await expect(page.getByText('Complete reference implementation', { exact: true })).toBeVisible()

  const languageTrigger = page.getByRole('combobox', { name: 'Code language' })
  await languageTrigger.click()
  await page.getByRole('option', { name: 'TypeScript', exact: true }).click()

  const fullCode = page.getByRole('list', {
    name: 'Quick Sort typescript full implementation',
  })
  await expect(fullCode).toContainText('function quick')
  await expect(fullCode).not.toContainText('choose_pivot')
  expect(await fullCode.locator('li').count()).toBeGreaterThan(20)

  await page.getByRole('button', { name: 'Expand' }).click()
  await expect(page.locator('.code-panel')).toHaveClass(/is-code-expanded/)
  await page.setViewportSize({ width: 390, height: 844 })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
  await page.keyboard.press('Escape')
  await expect(page.locator('.code-panel')).not.toHaveClass(/is-code-expanded/)
  assertNoConsoleErrors()
})

test('Visualize, Compare, and Sandbox reuse the custom algorithm icon vocabulary', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#visualize')

  const assertCustomPickerIcons = async (label: string) => {
    await page.getByRole('combobox', { name: label }).click()
    const sources = await page
      .getByRole('listbox', { name: label })
      .locator('.algorithm-custom-icon')
      .evaluateAll((images) => images.map((image) => image.getAttribute('src') ?? ''))
    expect(sources.length).toBeGreaterThan(20)
    expect(sources.every((source) => source.includes('/learn-icons/'))).toBe(true)
    expect(new Set(sources).size).toBeLessThanOrEqual(16)
    await page.keyboard.press('Escape')
  }

  await assertCustomPickerIcons('Algorithm')
  await page.getByRole('button', { name: 'Compare' }).click()
  await assertCustomPickerIcons('First algorithm')
  await page.getByRole('button', { name: 'Sandbox' }).click()
  await assertCustomPickerIcons('Sandbox algorithm')
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
  await expect(page.locator('.complexity-grid > div')).toHaveCount(3)
  const complexitySurfaces = await page
    .locator('.complexity-grid > div')
    .evaluateAll((cards) => cards.map((card) => getComputedStyle(card).backgroundColor))
  expect(new Set(complexitySurfaces).size).toBe(1)
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

test('Visualize keeps its source scale stable and previews the selected dataset', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#visualize')

  const visualization = page.locator('.bar-visualizer').first()
  const initialMaximum = await visualization.evaluate((element) =>
    element.style.getPropertyValue('--visual-maximum'),
  )
  expect(initialMaximum).toBeTruthy()

  for (let step = 0; step < 40; step += 1) {
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(visualization).toHaveCSS('--visual-maximum', initialMaximum)
  }

  await page.getByRole('button', { name: 'Reset' }).click()
  const dataset = page.getByRole('combobox', { name: 'Dataset' })
  await expect(dataset.locator('.dataset-preview')).toBeVisible()
  await dataset.click()
  await page.getByRole('option', { name: /^Reversed/ }).click()
  await expect(dataset.locator('.dataset-preview')).toBeVisible()
  assertNoConsoleErrors()
})

test('Footer, About, and the protected bug-report flow form one compact product shell', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.addInitScript(() => {
    const scope = window as unknown as {
      turnstile: {
        render: (
          container: HTMLElement,
          options: { action: string; callback: (token: string) => void },
        ) => string
        remove: () => void
        reset: () => void
      }
    }
    scope.turnstile = {
      render: (container, options) => {
        container.textContent = 'Protected by Turnstile'
        container.dataset.renderedAction = options.action
        queueMicrotask(() => options.callback('browser-test-token'))
        return 'browser-test-widget'
      },
      remove: () => undefined,
      reset: () => undefined,
    }
  })

  let submitted: Record<string, unknown> | null = null
  await page.route('**/api/report-bug', async (route) => {
    submitted = (await route.request().postDataJSON()) as Record<string, unknown>
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
  })

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#visualize')
  await page.getByRole('button', { name: 'Light theme' }).click()
  const footer = page.locator('.app-footer')
  await footer.scrollIntoViewIfNeeded()
  const footerGeometry = await footer.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    return { left: bounds.left, right: bounds.right, height: bounds.height }
  })
  expect(footerGeometry.left).toBeCloseTo(288, 0)
  expect(footerGeometry.right).toBeCloseTo(1050, 0)
  expect(footerGeometry.height).toBeLessThanOrEqual(60)
  await expect(footer).toContainText('SortLab')

  await footer.getByRole('button', { name: 'About' }).click()
  await expect(page).toHaveURL(/#about$/)
  await expect(page.getByRole('heading', { name: 'About SortLab' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Open source and transparent' })).toBeVisible()
  await expect(page.getByText('local-first', { exact: false })).toHaveCount(0)

  await page.getByRole('button', { name: 'Report Bug' }).click()
  const dialog = page.getByRole('dialog', { name: 'Report a bug' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Page')).toHaveValue('about')
  await expect(dialog.locator('[data-rendered-action="turnstile-spin-v1"]')).toBeVisible()
  await dialog
    .getByLabel('What went wrong?')
    .fill('The selected algorithm panel did not update after I changed the dataset.')
  const sendReport = dialog.getByRole('button', { name: 'Send report' })
  const sendReportGeometry = await sendReport.evaluate((button) => {
    const icon = button.querySelector('svg')!.getBoundingClientRect()
    const textNode = [...button.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    )!
    const textRange = document.createRange()
    textRange.selectNodeContents(textNode)
    const text = textRange.getBoundingClientRect()
    const bounds = button.getBoundingClientRect()
    return {
      iconCenter: icon.top + icon.height / 2,
      textCenter: text.top + text.height / 2,
      gap: text.left - icon.right,
      topSpace: Math.min(icon.top, text.top) - bounds.top,
      bottomSpace: bounds.bottom - Math.max(icon.bottom, text.bottom),
    }
  })
  expect(
    Math.abs(sendReportGeometry.iconCenter - sendReportGeometry.textCenter),
  ).toBeLessThanOrEqual(1)
  expect(sendReportGeometry.gap).toBeGreaterThanOrEqual(8)
  expect(
    Math.abs(sendReportGeometry.topSpace - sendReportGeometry.bottomSpace),
  ).toBeLessThanOrEqual(1)
  await sendReport.click()
  await expect(dialog.getByRole('heading', { name: 'Report received' })).toBeVisible()
  expect(submitted).toMatchObject({ page: 'about', token: 'browser-test-token' })
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

test('Visualize sidebar pickers overlay the rail and stay inside the viewport', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#visualize')

  const controls = page.locator('.control-rail')
  const overlay = page.locator('body > .rich-select__popover--viewport')

  await page.getByRole('combobox', { name: 'Algorithm' }).click()
  await expect(overlay).toBeVisible()
  const algorithmGeometry = await page.evaluate(() => {
    const rail = document.querySelector<HTMLElement>('.control-rail')!
    const popover = document.querySelector<HTMLElement>('body > .rich-select__popover--viewport')!
    return {
      railRight: rail.getBoundingClientRect().right,
      popover: popover.getBoundingClientRect().toJSON(),
      viewportHeight: window.innerHeight,
    }
  })
  expect(algorithmGeometry.popover.right).toBeGreaterThan(algorithmGeometry.railRight)
  expect(algorithmGeometry.popover.left).toBeGreaterThanOrEqual(0)
  expect(algorithmGeometry.popover.bottom).toBeLessThanOrEqual(algorithmGeometry.viewportHeight)

  await page.keyboard.press('Escape')
  await page.getByRole('combobox', { name: 'Dataset' }).click()
  await expect(overlay).toBeVisible()
  const datasetGeometry = await page.evaluate(() => {
    const rail = document.querySelector<HTMLElement>('.control-rail')!
    const popover = document.querySelector<HTMLElement>('body > .rich-select__popover--viewport')!
    const list = popover.querySelector<HTMLElement>('.rich-select__list')!
    return {
      railRight: rail.getBoundingClientRect().right,
      popover: popover.getBoundingClientRect().toJSON(),
      viewportHeight: window.innerHeight,
      listScrollHeight: list.scrollHeight,
      listClientHeight: list.clientHeight,
    }
  })
  expect(datasetGeometry.popover.right).toBeGreaterThan(datasetGeometry.railRight)
  expect(datasetGeometry.popover.bottom).toBeLessThanOrEqual(datasetGeometry.viewportHeight)
  expect(datasetGeometry.listScrollHeight).toBeGreaterThan(datasetGeometry.listClientHeight)

  await page.getByRole('option', { name: /^Nearly sorted/ }).click()
  await expect(page.getByRole('combobox', { name: 'Dataset' })).toContainText('Nearly sorted')
  await expect(controls).toHaveCSS('overflow-y', 'auto')
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

test('Compare keeps synchronized playback moving and supports pause and resume', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#compare')

  await expect(page.getByRole('combobox', { name: 'First algorithm' })).toContainText(
    'Optimized Bubble Sort',
  )
  await expect(page.getByRole('combobox', { name: 'Second algorithm' })).toContainText(
    'Quick Sort (Hoare)',
  )

  await page.getByRole('combobox', { name: 'First algorithm' }).click()
  const algorithmSearch = page.getByPlaceholder('Search name, alias, or family')
  await algorithmSearch.pressSequentially('parallel merge')
  const simulatedOption = page.getByRole('option', { name: /Parallel Merge Sort — Simulated/ })
  const caution = simulatedOption.locator('.algorithm-option__caution')
  await expect(caution).not.toHaveAttribute('title')
  await caution.hover()
  const cautionTooltip = page.getByRole('tooltip')
  await expect(cautionTooltip).toHaveText(
    'Conceptual worker lanes are animated deterministically; this mode does not report real parallel speedup.',
  )
  const cautionGeometry = await cautionTooltip.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    return { top: bounds.top, right: bounds.right, bottom: bounds.bottom, left: bounds.left }
  })
  expect(cautionGeometry.top).toBeGreaterThanOrEqual(0)
  expect(cautionGeometry.left).toBeGreaterThanOrEqual(0)
  expect(cautionGeometry.right).toBeLessThanOrEqual(1440)
  expect(cautionGeometry.bottom).toBeLessThanOrEqual(1000)
  await algorithmSearch.press('Escape')

  const soundFader = page.getByRole('slider', { name: 'Sound crossfader' })
  const soundMixer = page.getByRole('group', { name: 'Comparison sound mixer' })
  await expect(soundFader).toHaveValue('50')
  await expect(soundFader).toHaveAttribute('aria-valuetext', 'Balanced')
  await expect(soundMixer).toHaveAttribute('data-first-gain', '0.707')
  await expect(soundMixer).toHaveAttribute('data-second-gain', '0.707')
  await soundFader.fill('0')
  await expect(soundFader).toHaveAttribute('aria-valuetext', 'First algorithm only')
  await expect(soundMixer).toHaveAttribute('data-first-gain', '1.000')
  await expect(soundMixer).toHaveAttribute('data-second-gain', '0.000')
  await soundFader.fill('100')
  await expect(soundFader).toHaveAttribute('aria-valuetext', 'Second algorithm only')
  await soundFader.fill('50')

  const geometry = await page.evaluate(() => {
    const setup = document.querySelector<HTMLElement>('.compare-setup')!.getBoundingClientRect()
    const note = document.querySelector<HTMLElement>('.compare-note')!.getBoundingClientRect()
    const controlHeights = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.compare-setup__fields .rich-select__trigger, .compare-setup__fields input',
      ),
    ).map((control) => control.getBoundingClientRect().height)
    const panels = Array.from(document.querySelectorAll<HTMLElement>('.compare-panel')).map(
      (panel) => panel.getBoundingClientRect(),
    )
    const switchArea = document
      .querySelector<HTMLElement>('.compare-setup__actions .switch-control')!
      .getBoundingClientRect()
    const mixer = document.querySelector<HTMLElement>('.compare-mixer')!.getBoundingClientRect()
    const actions = document.querySelector<HTMLElement>('.compare-actions')!.getBoundingClientRect()
    return {
      controlHeights,
      noteLeft: note.left,
      noteWidth: note.width,
      setupLeft: setup.left,
      setupWidth: setup.width,
      panelWidths: panels.map(({ width }) => width),
      actionOrder: [switchArea.left, mixer.left, actions.left],
    }
  })
  expect(Math.max(...geometry.controlHeights) - Math.min(...geometry.controlHeights)).toBeLessThan(
    1,
  )
  expect(Math.abs(geometry.panelWidths[0] - geometry.panelWidths[1])).toBeLessThan(1)
  expect(geometry.noteLeft).toBeCloseTo(geometry.setupLeft, 0)
  expect(geometry.noteWidth).toBeCloseTo(geometry.setupWidth, 0)
  expect(geometry.actionOrder[0]).toBeLessThan(geometry.actionOrder[1])
  expect(geometry.actionOrder[1]).toBeLessThan(geometry.actionOrder[2])

  await page.getByLabel('Shared speed', { exact: true }).fill('120')
  await page.getByRole('button', { name: 'Start comparison' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.waitForTimeout(350)
  const progressBefore = Number(
    await page.locator('.compare-panel').first().getAttribute('data-progress'),
  )
  await expect
    .poll(async () =>
      Number(await page.locator('.compare-panel').first().getAttribute('data-progress')),
    )
    .toBeGreaterThan(progressBefore)
  const synchronizedProgress = await page
    .locator('.compare-panel')
    .evaluateAll((panels) => panels.map((panel) => panel.getAttribute('data-progress')))
  expect(new Set(synchronizedProgress).size).toBe(1)

  await page.getByRole('button', { name: 'Pause' }).click()
  const pausedProgress = await page
    .locator('.compare-panel')
    .evaluateAll((panels) => panels.map((panel) => panel.getAttribute('data-progress')))
  await page.waitForTimeout(350)
  await expect(page.locator('.compare-panel').first()).toHaveAttribute(
    'data-progress',
    pausedProgress[0]!,
  )

  await page.getByRole('button', { name: 'Resume' }).click()
  await expect
    .poll(async () =>
      Number(await page.locator('.compare-panel').first().getAttribute('data-progress')),
    )
    .toBeGreaterThan(Number(pausedProgress[0]))
  assertNoConsoleErrors()
})

test('Compare collapses into a clear single-column mobile workflow', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#compare')

  const geometry = await page.evaluate(() => {
    const algorithms = Array.from(
      document.querySelectorAll<HTMLElement>('.compare-algorithm-field'),
    ).map((field) => field.getBoundingClientRect())
    const numbers = Array.from(document.querySelectorAll<HTMLElement>('.compare-number-field')).map(
      (field) => field.getBoundingClientRect(),
    )
    const panels = Array.from(document.querySelectorAll<HTMLElement>('.compare-panel')).map(
      (panel) => panel.getBoundingClientRect(),
    )
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      algorithmWidths: algorithms.map(({ width }) => width),
      algorithmTops: algorithms.map(({ top }) => top),
      numberTops: numbers.map(({ top }) => top),
      panelTops: panels.map(({ top }) => top),
    }
  })

  expect(geometry.overflow).toBeLessThanOrEqual(1)
  expect(Math.abs(geometry.algorithmWidths[0] - geometry.algorithmWidths[1])).toBeLessThan(1)
  expect(geometry.algorithmTops[1]).toBeGreaterThan(geometry.algorithmTops[0])
  expect(geometry.numberTops[1]).toBeCloseTo(geometry.numberTops[0], 0)
  expect(geometry.panelTops[1]).toBeGreaterThan(geometry.panelTops[0])
  await expect(page.getByRole('slider', { name: 'Sound crossfader' })).toBeVisible()
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

  await setSandboxAmount(page, 4096)
  await chooseSandboxAlgorithm(page, /^Merge Sort/)
  await page.getByLabel('Animation pace').selectOption('maximum')

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
  const activePixels = await canvas.evaluate((element: HTMLCanvasElement) => {
    const context = element.getContext('2d')!
    const pixels = context.getImageData(0, 0, element.width, element.height).data
    let count = 0
    for (let index = 0; index < pixels.length; index += 16) {
      const red = pixels[index]
      const green = pixels[index + 1]
      const blue = pixels[index + 2]
      const darkThemeActive = red > 235 && green > 145 && green < 215 && blue < 120
      const lightThemeActive = red > 175 && red < 220 && green > 80 && green < 135 && blue < 50
      if (darkThemeActive || lightThemeActive) count += 1
    }
    return count
  })
  expect(activePixels).toBe(0)
  assertNoConsoleErrors()
})

test('Sandbox gives write-heavy Radix Sort an audible operation stream', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#sandbox')
  await setSandboxAmount(page, 16)
  await chooseSandboxAlgorithm(page, /^Radix Sort \(LSD\)/)
  await page.getByLabel('Animation pace').selectOption('realtime')

  await page.getByRole('button', { name: 'Start' }).click()
  await expect
    .poll(
      async () =>
        Number((await page.locator('.sandbox-page').getAttribute('data-audio-voices')) ?? 0),
      { timeout: 3_000 },
    )
    .toBeGreaterThan(0)
  await expect(page.locator('.sandbox-page')).toHaveAttribute('data-status', 'complete')
  await expect(page.locator('.sandbox-stats')).toContainText('Writes')
  assertNoConsoleErrors()
})

test('Sandbox light mode uses light panels, dark-blue bars, and clipped dataset previews', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#sandbox')
  await page.getByRole('button', { name: 'Light theme' }).click()
  await page.waitForTimeout(250)

  const pace = page.getByLabel('Animation pace')
  await expect(pace.locator('option')).toHaveText([
    'Detailed (recommended)',
    'Fast (quicker)',
    'Maximum (fastest)',
  ])
  await expect(pace).toHaveValue('realtime')
  await pace.selectOption('realtime')
  await expect(page.locator('#sandbox-speed-help')).toHaveText(
    'Small batches show the most sorting detail.',
  )
  await pace.selectOption('maximum')
  await expect(page.locator('#sandbox-speed-help')).toHaveText(
    'Largest batches prioritize the quickest finish.',
  )

  const colors = await page.evaluate(() => {
    const channels = (selector: string) => {
      const value = getComputedStyle(document.querySelector(selector)!).backgroundColor
      return (
        value
          .match(/[\d.]+/g)
          ?.slice(0, 3)
          .map(Number) ?? []
      )
    }
    const canvas = document.querySelector<HTMLCanvasElement>('.sandbox-canvas')!
    const context = canvas.getContext('2d')!
    const background = [...context.getImageData(Math.floor(canvas.width / 2), 1, 1, 1).data]
    const bar = [
      ...context.getImageData(Math.floor(canvas.width / 2), canvas.height - 2, 1, 1).data,
    ]
    return {
      controls: channels('.sandbox-controls'),
      stats: channels('.sandbox-stats'),
      background,
      bar,
    }
  })

  expect(Math.min(...colors.controls)).toBeGreaterThan(230)
  expect(Math.min(...colors.stats)).toBeGreaterThan(230)
  expect(Math.min(...colors.background.slice(0, 3))).toBeGreaterThan(215)
  expect(Math.max(...colors.bar.slice(0, 3))).toBeLessThan(180)
  expect(colors.bar[2]).toBeGreaterThan(colors.bar[0])

  await page.getByRole('combobox', { name: 'Dataset' }).click()
  const previewOverflow = await page
    .locator('.rich-select__popover--viewport .dataset-preview')
    .evaluateAll((previews) =>
      Math.max(
        ...previews.map((preview) => {
          const container = preview.getBoundingClientRect()
          const bars = [...preview.querySelectorAll('i')].map((bar) => bar.getBoundingClientRect())
          return Math.max(...bars.map((bar) => bar.right)) - container.right
        }),
      ),
    )
  expect(previewOverflow).toBeLessThanOrEqual(0)
  assertNoConsoleErrors()
})

test('Sandbox playback and quick settings stay aligned at desktop and phone widths', async ({
  page,
}) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  const readAlignment = () =>
    page.evaluate(() => {
      const rect = (selector: string) => {
        const bounds = document.querySelector(selector)!.getBoundingClientRect()
        return {
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
          left: bounds.left,
          width: bounds.width,
          height: bounds.height,
          centerY: bounds.top + bounds.height / 2,
        }
      }
      return {
        pace: rect('[name="sandbox-speed-mode"]'),
        start: rect('.sandbox-playback-primary .sandbox-button--primary'),
        labels: [
          rect('.sandbox-quick-settings .switch-control__copy'),
          rect('.sandbox-quick-settings .sandbox-range > span'),
          rect('.sandbox-quick-settings .sandbox-field > span'),
        ],
        controls: [
          rect('.sandbox-quick-settings .switch-control__button'),
          rect('[name="sandbox-volume"]'),
          rect('[name="sandbox-visual-preset"]'),
        ],
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }
    })

  await page.goto('/#sandbox')
  const desktop = await readAlignment()
  expect(Math.abs(desktop.pace.top - desktop.start.top)).toBeLessThanOrEqual(1)
  expect(Math.abs(desktop.pace.height - desktop.start.height)).toBeLessThanOrEqual(1)
  expect(Math.max(...desktop.labels.map(({ top }) => top))).toBeCloseTo(
    Math.min(...desktop.labels.map(({ top }) => top)),
    0,
  )
  expect(Math.max(...desktop.controls.map(({ centerY }) => centerY))).toBeCloseTo(
    Math.min(...desktop.controls.map(({ centerY }) => centerY)),
    0,
  )
  expect(desktop.overflow).toBe(0)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  const pace = page.getByLabel('Animation pace')
  await pace.selectOption('fast')
  await expect(page.locator('#sandbox-speed-help')).toHaveText(
    'Larger batches balance clarity and finish time.',
  )

  const phone = await readAlignment()
  expect(Math.abs(phone.pace.left - phone.start.left)).toBeLessThanOrEqual(1)
  expect(Math.abs(phone.pace.width - phone.start.width)).toBeLessThanOrEqual(1)
  expect(phone.start.top).toBeGreaterThan(phone.pace.bottom)
  expect(Math.abs(phone.labels[0].top - phone.labels[1].top)).toBeLessThanOrEqual(1)
  expect(Math.abs(phone.controls[0].centerY - phone.controls[1].centerY)).toBeLessThanOrEqual(1)
  expect(phone.overflow).toBe(0)
  assertNoConsoleErrors()
})

test('Sandbox centers one algorithm limit on desktop and hides it on mobile', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  const readAlignment = () =>
    page.getByRole('combobox', { name: 'Sandbox algorithm' }).evaluate((trigger) => {
      const triggerBounds = trigger.getBoundingClientRect()
      const limit = trigger.querySelector('.sandbox-picker-selection__limit')!
      const limitBounds = limit.getBoundingClientRect()
      return {
        triggerCenter: triggerBounds.top + triggerBounds.height / 2,
        limitCenter: limitBounds.top + limitBounds.height / 2,
      }
    })

  await page.goto('/#sandbox')
  const desktop = await readAlignment()
  expect(Math.abs(desktop.triggerCenter - desktop.limitCenter)).toBeLessThanOrEqual(1)
  await expect(page.locator('.sandbox-amount__heading')).toHaveText('Amount')
  await expect(page.locator('.sandbox-picker-selection__limit')).toHaveCount(1)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.locator('.sandbox-picker-selection__limit')).toBeHidden()
  await page.getByRole('combobox', { name: 'Sandbox algorithm' }).click()
  const phoneOverflow = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    popover:
      document.querySelector('.rich-select__popover--viewport')!.getBoundingClientRect().right -
      window.innerWidth,
  }))
  expect(phoneOverflow.page).toBe(0)
  expect(phoneOverflow.popover).toBeLessThanOrEqual(0)
  assertNoConsoleErrors()
})

test('Dropdowns stay inside the mobile viewport across the site', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const expectVisibleNativeSelectsInViewport = async () => {
    const geometries = await page.locator('select:visible').evaluateAll((selects) =>
      selects.map((select) => {
        const bounds = select.getBoundingClientRect()
        return { left: bounds.left, right: bounds.right, viewportWidth: window.innerWidth }
      }),
    )
    for (const geometry of geometries) {
      expect(geometry.left).toBeGreaterThanOrEqual(0)
      expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth)
    }
  }

  const routes = [
    { hash: 'visualize', labels: ['Mobile algorithm', 'Dataset', 'Code language'] },
    { hash: 'compare', labels: ['First algorithm', 'Second algorithm'] },
    { hash: 'sandbox', labels: ['Sandbox algorithm', 'Dataset'] },
  ]

  for (const route of routes) {
    await page.goto(`/#${route.hash}`)
    await expectVisibleNativeSelectsInViewport()
    for (const label of route.labels) {
      const trigger = page.getByRole('combobox', { name: label, exact: true })
      await trigger.scrollIntoViewIfNeeded()
      await trigger.click()
      const popover = page.locator('.rich-select__popover:visible')
      await expect(popover).toBeVisible()
      const geometry = await popover.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return {
          left: bounds.left,
          right: bounds.right,
          viewportWidth: window.innerWidth,
          pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        }
      })
      expect(geometry.left).toBeGreaterThanOrEqual(0)
      expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth)
      expect(geometry.pageOverflow).toBeLessThanOrEqual(1)
      await page.keyboard.press('Escape')
    }
  }

  await page.goto('/#learn')
  await page.locator('.learn-filter-disclosure summary').click()
  await expectVisibleNativeSelectsInViewport()

  assertNoConsoleErrors()
})

test('Sandbox pauses, resumes, stops quickly, and cancels on route change', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#sandbox')
  await setSandboxAmount(page, 512)
  await chooseSandboxAlgorithm(page, /^Optimized Bubble Sort/)
  await page.getByLabel('Animation pace').selectOption('realtime')

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

test('Sandbox warns before automatically lowering an unsupported amount', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#sandbox')

  await setSandboxAmount(page, 4096)

  await page.getByRole('combobox', { name: 'Sandbox algorithm' }).click()
  const restricted = page.getByRole('option', { name: /^Optimized Bubble Sort/ })
  await expect(restricted).toBeEnabled()
  await expect(restricted).toContainText('Max 1,280')
  await restricted.click()
  const warning = page.getByRole('alertdialog')
  await expect(warning).toContainText('supports up to 1,280 values')
  await expect(warning).toContainText('lower Amount from 4,096 to 1,280')
  await expect(page.getByRole('spinbutton', { name: 'Amount' })).toHaveValue('4096')
  await page.getByRole('button', { name: 'Use 1,280 values' }).click()
  await expect(page.getByRole('spinbutton', { name: 'Amount' })).toHaveValue('1280')
  await expect(page.getByRole('combobox', { name: 'Sandbox algorithm' })).toContainText(
    'Optimized Bubble Sort',
  )

  await page.getByRole('combobox', { name: 'Sandbox algorithm' }).click()
  await page.getByRole('searchbox', { name: 'Search sandbox algorithm' }).fill('Minimum-Comparator')
  await page.getByRole('option', { name: /^Minimum-Comparator Networks/ }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    'uses a fixed schedule for exactly 16 values',
  )
  await page.getByRole('button', { name: 'Use 16 values' }).click()
  await expect(page.getByRole('spinbutton', { name: 'Amount' })).toHaveValue('16')
  await expect(page.getByRole('combobox', { name: 'Sandbox algorithm' })).toContainText(
    'Exactly 16',
  )

  await page.getByRole('button', { name: 'Hide interface' }).click()
  await expect(page.locator('.sandbox-page')).toHaveClass(/is-interface-hidden/)
  const restore = page.getByRole('button', { name: 'Restore Sandbox controls' })
  await expect(restore).toBeVisible()
  await restore.hover()
  const restoreTooltip = page.getByRole('tooltip', { name: 'Restore controls (H)' })
  await expect(restoreTooltip).toBeVisible()
  expect(
    await restoreTooltip.evaluate((element) => element.getBoundingClientRect().top),
  ).toBeGreaterThanOrEqual(0)
  await page.keyboard.press('h')
  await expect(page.locator('.sandbox-controls')).toBeVisible()

  const shortcuts = page.getByRole('button', { name: 'Keyboard shortcuts' })
  await shortcuts.scrollIntoViewIfNeeded()
  await shortcuts.hover()
  await expect(page.getByRole('tooltip').filter({ hasText: 'Keyboard controls' })).toBeVisible()
  await expect(
    page.locator('details.sandbox-disclosure').filter({ hasText: 'Keyboard shortcuts' }),
  ).toHaveCount(0)

  await page.getByRole('button', { name: 'Enter fullscreen' }).click()
  const exitFullscreen = page.getByRole('button', { name: 'Exit fullscreen' })
  if (await exitFullscreen.isVisible()) {
    await expect(exitFullscreen.locator('svg')).toHaveClass(/lucide-minimize-2/)
    await exitFullscreen.hover()
    await expect(page.getByRole('tooltip', { name: 'Exit fullscreen (F)' })).toBeVisible()
    await exitFullscreen.click()
  }
  assertNoConsoleErrors()
})

test('Sandbox exposes the complete searchable catalog and expanded datasets', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#sandbox')

  await page.getByRole('combobox', { name: 'Sandbox algorithm' }).click()
  await page.getByPlaceholder('Search Sandbox algorithms').pressSequentially('pattern defeating')
  const conceptual = page.getByRole('option', { name: /Pattern-Defeating Quicksort/ })
  await expect(conceptual).toContainText('Conceptual')
  await conceptual.click()
  await expect(page.getByRole('combobox', { name: 'Sandbox algorithm' })).toContainText(
    'Pattern-Defeating Quicksort',
  )

  await page.getByRole('combobox', { name: 'Dataset' }).click()
  const normalDataset = page.getByRole('option', { name: /Normal Distribution/ })
  await expect(normalDataset.locator('.dataset-preview')).toBeVisible()
  await normalDataset.click()
  await expect(page.getByRole('combobox', { name: 'Dataset' })).toContainText('Normal Distribution')

  await page.getByRole('combobox', { name: 'Dataset' }).click()
  await page.getByPlaceholder('Search Sandbox datasets').pressSequentially('median-of-three')
  await page.getByRole('option', { name: /Median-of-Three Killer/ }).click()
  await expect(page.getByRole('combobox', { name: 'Dataset' })).toContainText(
    'Median-of-Three Killer',
  )

  await page.getByRole('combobox', { name: 'Sandbox algorithm' }).click()
  await page.getByPlaceholder('Search Sandbox algorithms').fill('bogobogosort')
  const pathological = page.getByRole('option', { name: /Bogobogosort/ })
  await expect(pathological).toBeEnabled()
  await expect(pathological).toContainText('Max 12')
  assertNoConsoleErrors()
})

test('Sandbox renders All Equal values at half height', async ({ page }) => {
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/#sandbox')

  await page.getByRole('combobox', { name: 'Dataset' }).click()
  await page.getByPlaceholder('Search Sandbox datasets').pressSequentially('all equal')
  await page.getByRole('option', { name: /All Equal/ }).click()
  await page.waitForTimeout(250)

  const firstBarRatio = await page
    .locator('.sandbox-canvas')
    .evaluate((element: HTMLCanvasElement) => {
      const context = element.getContext('2d')!
      const x = Math.floor(element.width / 2)
      const pixels = context.getImageData(x, 0, 1, element.height).data
      let strongestEdge = { y: 0, difference: 0 }
      for (let y = 1; y < element.height; y += 1) {
        const offset = y * 4
        const previous = offset - 4
        const difference =
          Math.abs(pixels[offset] - pixels[previous]) +
          Math.abs(pixels[offset + 1] - pixels[previous + 1]) +
          Math.abs(pixels[offset + 2] - pixels[previous + 2])
        if (difference > strongestEdge.difference) strongestEdge = { y, difference }
      }
      return strongestEdge.y / element.height
    })

  expect(firstBarRatio).toBeGreaterThan(0.45)
  expect(firstBarRatio).toBeLessThan(0.55)
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
  await expect(page.getByRole('button', { name: 'Start' })).toHaveCSS('min-height', '46px')
  await expect(page.getByRole('combobox', { name: 'Dataset' }).locator('svg').last()).toBeVisible()
  await expect(
    page
      .locator('details.sandbox-disclosure')
      .filter({ hasText: 'Audio settings' })
      .locator('summary .sandbox-disclosure__chevron'),
  ).toBeVisible()
  assertNoConsoleErrors()
})
