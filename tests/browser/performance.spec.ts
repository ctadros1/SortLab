import { expect, test, type Page } from '@playwright/test'

interface ProfileRow {
  algorithm: string
  amount: number
  wallMs: number
  animationMs: number
  operations: number
  operationsPerSecond: number
  fps: number
  maxQueue: number
  maxAudioVoices: number
  longTasks: number
  longestTaskMs: number
  heapDeltaMb: number | null
}

async function chooseAlgorithm(page: Page, name: RegExp) {
  await page.getByRole('combobox', { name: 'Sandbox algorithm' }).click()
  await page.getByRole('option', { name }).click()
}

async function setAmount(page: Page, amount: number) {
  const input = page.getByRole('spinbutton', { name: 'Amount' })
  await input.fill(String(amount))
  await input.press('Enter')
  await expect(input).toHaveValue(String(amount))
}

async function readStats(page: Page) {
  return page
    .locator('.sandbox-stats')
    .evaluate((element) =>
      Object.fromEntries(
        [...element.querySelectorAll('dl div')].map((item) => [
          item.querySelector('dt')?.textContent ?? '',
          item.querySelector('dd')?.textContent ?? '',
        ]),
      ),
    )
}

test('profile supported high-scale algorithms and queue bounds', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/#sandbox')
  await page.getByLabel('Speed mode').selectOption('maximum')
  await page.evaluate(() => {
    const state = { count: 0, longest: 0 }
    ;(window as unknown as { __sortlabLongTasks: typeof state }).__sortlabLongTasks = state
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          state.count += 1
          state.longest = Math.max(state.longest, entry.duration)
        }
      })
      try {
        observer.observe({ type: 'longtask' })
      } catch {
        // Browsers without Long Tasks support still provide the remaining measurements.
      }
    }
  })

  const algorithms = [
    { name: /^Quick Sort \(Hoare\)/, label: 'Quick Sort (Hoare)' },
    { name: /^Merge Sort/, label: 'Merge Sort' },
    { name: /^Heap Sort/, label: 'Heap Sort' },
    { name: /^Radix Sort \(LSD\)/, label: 'Radix Sort (LSD)' },
  ]
  const results: ProfileRow[] = []

  for (const algorithm of algorithms) {
    for (const amount of [256, 1024, 4096]) {
      await setAmount(page, amount)
      await chooseAlgorithm(page, algorithm.name)
      await page.evaluate(() => {
        const state = (
          window as unknown as {
            __sortlabLongTasks: { count: number; longest: number }
          }
        ).__sortlabLongTasks
        state.count = 0
        state.longest = 0
      })
      const before = await page.evaluate(() => ({
        heap:
          'memory' in performance
            ? (performance as Performance & { memory: { usedJSHeapSize: number } }).memory
                .usedJSHeapSize
            : null,
      }))
      let maxQueue = 0
      let maxAudioVoices = 0
      let peakHeap = before.heap
      const started = Date.now()
      await page.getByRole('button', { name: 'Start' }).click()
      while (true) {
        const sample = await page.evaluate(() => {
          const root = document.querySelector<HTMLElement>('.sandbox-page')
          return {
            status: root?.dataset.status,
            queue: Number(root?.dataset.queueSize ?? 0),
            voices: Number(root?.dataset.audioVoices ?? 0),
            heap:
              'memory' in performance
                ? (performance as Performance & { memory: { usedJSHeapSize: number } }).memory
                    .usedJSHeapSize
                : null,
          }
        })
        maxQueue = Math.max(maxQueue, sample.queue)
        maxAudioVoices = Math.max(maxAudioVoices, sample.voices)
        if (sample.heap !== null) peakHeap = Math.max(peakHeap ?? 0, sample.heap)
        if (sample.status === 'complete') break
        expect(Date.now() - started).toBeLessThan(20_000)
        await page.waitForTimeout(16)
      }
      const wallMs = Date.now() - started
      await page.waitForTimeout(220)
      const stats = await readStats(page)
      const completion = await page.locator('.sandbox-complete').innerText()
      const after = await page.evaluate(() => ({
        longTasks: (
          window as unknown as {
            __sortlabLongTasks: { count: number; longest: number }
          }
        ).__sortlabLongTasks,
      }))
      results.push({
        algorithm: algorithm.label,
        amount,
        wallMs,
        animationMs: Number.parseFloat(stats.Animation) * 1000,
        operations: Number(
          completion.match(/[\d,]+(?= streamed operations)/)?.[0].replaceAll(',', ''),
        ),
        operationsPerSecond: Number(stats['Ops/s'].replaceAll(',', '')),
        fps: Number(stats['Frame rate'].replace(' fps', '')),
        maxQueue,
        maxAudioVoices,
        longTasks: after.longTasks.count,
        longestTaskMs: Math.round(after.longTasks.longest),
        heapDeltaMb:
          before.heap === null || peakHeap === null
            ? null
            : Math.round(((peakHeap - before.heap) / 1_048_576) * 100) / 100,
      })
    }
  }

  await setAmount(page, 256)
  await chooseAlgorithm(page, /^Optimized Bubble Sort/)
  const quadraticStarted = Date.now()
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.locator('.sandbox-page')).toHaveAttribute('data-status', 'complete', {
    timeout: 20_000,
  })
  await page.waitForTimeout(220)
  const quadraticStats = await readStats(page)
  const quadraticCompletion = await page.locator('.sandbox-complete').innerText()
  results.push({
    algorithm: 'Optimized Bubble Sort',
    amount: 256,
    wallMs: Date.now() - quadraticStarted,
    animationMs: Number.parseFloat(quadraticStats.Animation) * 1000,
    operations: Number(
      quadraticCompletion.match(/[\d,]+(?= streamed operations)/)?.[0].replaceAll(',', ''),
    ),
    operationsPerSecond: Number(quadraticStats['Ops/s'].replaceAll(',', '')),
    fps: Number(quadraticStats['Frame rate'].replace(' fps', '')),
    maxQueue: 0,
    maxAudioVoices: Number(await page.locator('.sandbox-page').getAttribute('data-audio-voices')),
    longTasks: 0,
    longestTaskMs: 0,
    heapDeltaMb: null,
  })

  await setAmount(page, 512)
  await page.getByLabel('Speed mode').selectOption('realtime')
  await page.getByRole('button', { name: 'Start' }).click()
  const stopStarted = Date.now()
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.locator('.sandbox-page')).toHaveAttribute('data-status', 'idle')
  const stopLatencyMs = Date.now() - stopStarted
  expect(stopLatencyMs).toBeLessThan(750)

  console.log(`SORTLAB_PROFILE ${JSON.stringify({ results, stopLatencyMs })}`)
})
