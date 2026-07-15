import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { materializeEvents } from '../algorithms/engine'
import { algorithmRegistry } from '../algorithms/registry'
import {
  codeLanguages,
  getAlgorithmCodeSnippet,
  resolveActiveSemanticLine,
  semanticIdsByAlgorithm,
} from '../code/algorithmCode'
import { CodePanel } from '../components/CodePanel'
import { EventProgress } from '../components/EventProgress'
import { VisualLegend } from '../components/BarVisualizer'
import { StatsStrip } from '../components/StatsStrip'
import { calculateProgressMilestones } from '../ui/progress'

describe('Visualize code registry', () => {
  it('covers every algorithm and required language with the same semantic ids', () => {
    expect(codeLanguages.map((language) => language.id)).toEqual([
      'pseudocode',
      'c',
      'cpp',
      'java',
      'python',
      'javascript',
      'typescript',
    ])
    for (const algorithm of algorithmRegistry) {
      const expected = semanticIdsByAlgorithm[algorithm.id]
      expect(expected, algorithm.id).toBeDefined()
      for (const language of codeLanguages) {
        const snippet = getAlgorithmCodeSnippet(algorithm, language.id)
        expect(
          snippet.lines.map((line) => line.id),
          `${algorithm.id}/${language.id}`,
        ).toEqual(['structure.start', ...expected, 'structure.end'])
      }
    }
  })

  it('maps every emitted semantic id for all 36 algorithms', () => {
    for (const algorithm of algorithmRegistry) {
      const input = algorithm.id === 'bogo' ? [3, 1, 2] : [7, 2, 6, 1, 5, 3, 4, 0]
      const { events } = materializeEvents(algorithm.id, input)
      const mappedIds = new Set(semanticIdsByAlgorithm[algorithm.id])
      for (const event of events)
        expect(mappedIds.has(event.codeLine), `${algorithm.id}:${event.codeLine}`).toBe(true)
    }
  })

  it('preserves the active semantic id when the displayed language changes', () => {
    const algorithm = algorithmRegistry.find((item) => item.id === 'quick-hoare')!
    const active = resolveActiveSemanticLine(algorithm.id, 'scan-inward', 'Partitioning')
    for (const language of codeLanguages) {
      const snippet = getAlgorithmCodeSnippet(algorithm, language.id)
      expect(snippet.lines.some((line) => line.id === active)).toBe(true)
    }
  })
})

describe('Visualize presentation refinements', () => {
  it('bounds milestones and exposes progressbar values without a slider', () => {
    expect(calculateProgressMilestones(10_000)).toHaveLength(48)
    const markup = renderToStaticMarkup(<EventProgress current={186} total={512} />)
    expect(markup).toContain('role="progressbar"')
    expect(markup).toContain('aria-valuenow="186"')
    expect(markup).toContain('Step 186 / 512')
    expect(markup).toContain('36%')
    expect(markup).not.toContain('type="range"')
  })

  it('renders legend labels before icons and omits Active Boundary', () => {
    const markup = renderToStaticMarkup(<VisualLegend />)
    expect(markup).not.toContain('Active boundary')
    expect(markup.indexOf('Comparing')).toBeLessThan(markup.indexOf('bar-marker--compare'))
  })

  it('orders complexity Worst, Average, Best and omits Space', () => {
    const algorithm = algorithmRegistry[0]
    const markup = renderToStaticMarkup(<CodePanel algorithm={algorithm} />)
    expect(markup.indexOf('Worst')).toBeLessThan(markup.indexOf('Average'))
    expect(markup.indexOf('Average')).toBeLessThan(markup.indexOf('Best'))
    expect(markup).not.toContain('>Space<')
    expect(markup).toContain('Stable')
    expect(markup).toContain('In place')
    expect(markup).toContain('Adaptive')
  })

  it('renders consistent statistics boundaries and semantic icons', () => {
    const markup = renderToStaticMarkup(<StatsStrip executionMs={1.25} />)
    expect(markup).toContain('data-stat="current-phase"')
    expect(markup).toContain('data-stat="js-execution"')
    expect(markup).toContain('JS execution')
  })
})
