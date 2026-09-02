import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  algorithmIconAssignments,
  algorithmRegistry,
  groupAlgorithms,
  searchAlgorithms,
  visualizeAlgorithmRegistry,
} from '../algorithms/registry'
import { AlgorithmPicker } from '../components/AlgorithmPicker'
import { AboutPage } from '../components/AboutPage'
import { AlgorithmCautionTooltip } from '../components/AlgorithmCautionTooltip'
import { AppFooter } from '../components/AppFooter'
import { DatasetPicker } from '../components/DatasetPicker'
import { SandboxDatasetPicker } from '../components/SandboxDatasetPicker'
import { MathNotation } from '../components/MathNotation'
import { RichCombobox } from '../components/RichCombobox'
import { Switch } from '../components/Switch'
import { datasetRegistry, searchDatasets } from '../data/datasets'
import {
  compatibleSandboxAmount,
  sandboxAlgorithmById,
  sandboxAmountRestriction,
} from '../sandbox/config'
import { generateSandboxArray } from '../sandbox/datasets'
import { filterRichOptions, nextEnabledIndex, type RichOption } from '../ui/combobox'
import { complexityLabel, complexityParts } from '../ui/math'
import {
  getAlgorithmOptions,
  getCompareAlgorithmOptions,
  getDatasetOptions,
} from '../ui/pickerOptions'
import {
  advanceSharedStep,
  compareCrossfadeLabel,
  compareCrossfadeLevels,
  synchronizedEventIndex,
} from '../ui/compare'
import { getBarDisplayRules, markerKindForEvent, nextSwitchState } from '../ui/visualizer'

describe('picker metadata and search', () => {
  it('groups every algorithm into a labeled family', () => {
    const groups = groupAlgorithms(algorithmRegistry)
    expect(groups.flatMap((group) => group.items)).toHaveLength(algorithmRegistry.length)
    expect(
      groups.find((group) => group.id === 'Exchange')?.items.some(({ id }) => id === 'bubble'),
    ).toBe(true)
    expect(
      groups.find((group) => group.id === 'Novelty')?.items.some(({ id }) => id === 'bogo'),
    ).toBe(true)
  })

  it('finds algorithms by name, alias, and family', () => {
    expect(searchAlgorithms('Bubble Sort').map(({ id }) => id)).toContain('bubble')
    expect(searchAlgorithms('sinking sort').map(({ id }) => id)).toContain('bubble')
    expect(searchAlgorithms('Network').map(({ family }) => family)).toContain('Network')
  })

  it('assigns a valid icon, option description, and search text to all algorithms', () => {
    const options = getAlgorithmOptions([4, 2, 3, 1])
    expect(options).toHaveLength(44)
    expect(options).toHaveLength(visualizeAlgorithmRegistry.length)
    for (const option of options) {
      expect(algorithmIconAssignments[option.id]).toBeTruthy()
      expect(option.algorithm.icon).toBe(algorithmIconAssignments[option.id])
      expect(option.algorithm.optionDescription.length).toBeGreaterThan(10)
      expect(option.searchText).toContain(option.algorithm.name)
    }
  })

  it('includes comparison-only implementations in the Compare picker catalog', () => {
    const options = getCompareAlgorithmOptions([4, 2, 3, 1])
    expect(options.map(({ id }) => id)).toContain('bubble-optimized')
    expect(options.map(({ id }) => id)).toContain('quick-hoare')
  })

  it('preserves pathological warnings in algorithm options', () => {
    const bogo = getAlgorithmOptions([3, 2, 1]).find((option) => option.id === 'bogo')
    expect(bogo?.algorithm.caution).toBe('pathological')
    expect(bogo?.algorithm.warning).toMatch(/attempt limit/i)
  })

  it('defines complete visual metadata for every dataset', () => {
    expect(datasetRegistry).toHaveLength(9)
    for (const dataset of datasetRegistry) {
      expect(dataset.description.length).toBeGreaterThan(10)
      expect(dataset.preview).toHaveLength(6)
      expect(dataset.icon).toBeTruthy()
      expect(dataset.searchTerms.length).toBeGreaterThan(0)
    }
    expect(getDatasetOptions().find((option) => option.id === 'custom')?.group).toBe('Your data')
    expect(searchDatasets('ascending').map(({ id }) => id)).toContain('sorted')
  })

  it('gives every Random Sandbox bar its own rank at high density', () => {
    const values = generateSandboxArray('random', 4096, 42)
    expect(values).toHaveLength(4096)
    expect(new Set(values).size).toBe(4096)
    expect(Math.min(...values)).toBe(1)
    expect(Math.max(...values)).toBe(4096)
  })

  it('uses relaxed ceilings and derives compatible automatic adjustments', () => {
    expect(sandboxAlgorithmById.get('quick-hoare')?.maximum).toBe(10240)
    expect(sandboxAlgorithmById.get('bubble-optimized')?.maximum).toBe(1280)
    expect(sandboxAmountRestriction('bubble-optimized', 2048)).toMatch(/1,280 values/)
    expect(compatibleSandboxAmount('bubble-optimized', 4096)).toBe(1280)
    expect(compatibleSandboxAmount('bitonic', 5000)).toBe(4096)
  })
})

describe('accessible interaction utilities', () => {
  const options: RichOption[] = [
    { id: 'a', name: 'Alpha', group: 'One', searchText: 'alpha first' },
    { id: 'b', name: 'Beta', group: 'One', searchText: 'beta second', disabled: true },
    { id: 'c', name: 'Gamma', group: 'Two', searchText: 'gamma third' },
  ]

  it('supports cyclic Arrow Up and Arrow Down navigation while skipping disabled options', () => {
    expect(nextEnabledIndex(options, 0, 1)).toBe(2)
    expect(nextEnabledIndex(options, 2, 1)).toBe(0)
    expect(nextEnabledIndex(options, 0, -1)).toBe(2)
  })

  it('filters grouped options using their complete search text', () => {
    expect(filterRichOptions(options, 'third').map(({ id }) => id)).toEqual(['c'])
    expect(filterRichOptions(options, '  ALPHA ').map(({ id }) => id)).toEqual(['a'])
  })

  it('renders the selected option through an ARIA combobox trigger', () => {
    const html = renderToStaticMarkup(
      <RichCombobox
        label="Example"
        value="c"
        options={options}
        onChange={() => undefined}
        renderSelected={(option) => option.name}
        renderOption={(option) => option.name}
        searchPlaceholder="Search examples"
      />,
    )
    expect(html).toContain('role="combobox"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('Gamma')
  })

  it('renders a picker selection and toggles binary state deterministically', () => {
    const html = renderToStaticMarkup(
      <AlgorithmPicker value="bubble" values={[4, 2, 3, 1]} onChange={() => undefined} />,
    )
    expect(html).toContain('Bubble Sort')
    expect(html).toContain('Exchange sorts')
    expect(nextSwitchState(false)).toBe(true)
    expect(nextSwitchState(true)).toBe(false)
  })

  it('renders the selected dataset with its distribution preview', () => {
    const html = renderToStaticMarkup(
      <DatasetPicker value="nearly-sorted" onChange={() => undefined} />,
    )
    expect(html).toContain('Nearly sorted')
    expect(html).toContain('picker-selection--dataset')
    expect(html).toContain('dataset-preview')
  })

  it('renders the Sandbox dataset picker with a distribution preview', () => {
    const html = renderToStaticMarkup(
      <SandboxDatasetPicker value="normal-distribution" onChange={() => undefined} />,
    )
    expect(html).toContain('Normal Distribution')
    expect(html).toContain('dataset-preview')
    expect(html).toContain('role="combobox"')
  })

  it('renders a plain switch without reserving an empty icon column', () => {
    const html = renderToStaticMarkup(
      <Switch
        checked
        onChange={() => undefined}
        label="Use same array"
        description="Keep the seed fixed"
      />,
    )
    expect(html).toContain('switch-control--plain')
    expect(html).not.toContain('switch-control__icon')
    expect(html).toContain('role="switch"')
  })

  it('keeps caution copy in one custom tooltip rather than a native title', () => {
    const html = renderToStaticMarkup(
      <AlgorithmCautionTooltip message="This implementation is educational." />,
    )
    expect(html).toContain('aria-label="Important: This implementation is educational."')
    expect(html).not.toContain('title=')
  })

  it('presents the open-source About page and compact product footer', () => {
    const about = renderToStaticMarkup(<AboutPage />)
    const footer = renderToStaticMarkup(
      <AppFooter
        currentRoute="about"
        onAbout={() => undefined}
        onHome={() => undefined}
        onReportBug={() => undefined}
      />,
    )
    expect(about).toContain('Open source and transparent')
    expect(about).not.toContain('local-first')
    expect(about).not.toContain('Built for understanding')
    expect(about).not.toContain('An educational model, clearly labeled')
    expect(footer).toContain('Sort<span>Lab</span>')
    expect(footer).toContain('Report Bug')
    expect(footer).toContain('https://github.com/ctadros1/sort-lab')
  })
})

describe('Compare sound crossfader', () => {
  it('uses an equal-power midpoint and fully isolates either algorithm at the ends', () => {
    expect(compareCrossfadeLevels(0)).toEqual({ first: 1, second: 0 })
    expect(compareCrossfadeLevels(50).first).toBeCloseTo(Math.SQRT1_2)
    expect(compareCrossfadeLevels(50).second).toBeCloseTo(Math.SQRT1_2)
    expect(compareCrossfadeLevels(100).first).toBeCloseTo(0)
    expect(compareCrossfadeLevels(100).second).toBe(1)
    expect(compareCrossfadeLabel(0)).toBe('First algorithm only')
    expect(compareCrossfadeLabel(50)).toBe('Balanced')
    expect(compareCrossfadeLabel(100)).toBe('Second algorithm only')
  })
})

describe('comparison playback', () => {
  it('advances synchronized runs monotonically without rounding stalls', () => {
    const longestEventCount = 1_379
    let sharedStep = -1
    let previousLongIndex = -1

    for (let frame = 0; frame < 300; frame += 1) {
      sharedStep = advanceSharedStep(sharedStep, 1, longestEventCount)
      const longIndex = synchronizedEventIndex(sharedStep, longestEventCount, longestEventCount)
      const shortIndex = synchronizedEventIndex(sharedStep, 241, longestEventCount)

      expect(longIndex).toBeGreaterThan(previousLongIndex)
      expect(shortIndex).toBeGreaterThanOrEqual(-1)
      previousLongIndex = longIndex
    }
  })

  it('maps every run to completion at the final shared step', () => {
    const longestEventCount = 1_379
    const finalStep = longestEventCount - 1

    expect(synchronizedEventIndex(finalStep, 1_379, longestEventCount)).toBe(1_378)
    expect(synchronizedEventIndex(finalStep, 241, longestEventCount)).toBe(240)
  })
})

describe('notation and marker layout', () => {
  it('renders known complexity formulas with semantic variables and superscripts', () => {
    expect(complexityParts('O(n²)')).toContainEqual({ kind: 'sup', value: '2' })
    expect(complexityLabel('O(2ⁿ)')).toContain('to the n')
    const html = renderToStaticMarkup(<MathNotation value="O(d(n + b))" />)
    expect(html).toContain('<var>d</var>')
    expect(html).toContain('aria-label="Big O of d(n  plus  b)"')
  })

  it('maps sorting events to distinct non-color markers', () => {
    expect(markerKindForEvent('compare')).toBe('compare')
    expect(markerKindForEvent('swap')).toBe('swap')
    expect(markerKindForEvent('pivot')).toBe('pivot')
    expect(markerKindForEvent('write')).toBe('write')
    expect(markerKindForEvent('range')).toBeNull()
  })

  it('reserves marker and value headroom and hides labels at dense widths', () => {
    expect(getBarDisplayRules(12, false, 390)).toMatchObject({
      showValues: true,
      markerHeadroom: 26,
      valueHeadroom: 18,
    })
    expect(getBarDisplayRules(64, false, 390)).toMatchObject({
      showValues: false,
      showIndices: false,
      markerHeadroom: 26,
    })
  })
})
