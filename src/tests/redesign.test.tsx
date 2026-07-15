import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  algorithmIconAssignments,
  algorithmRegistry,
  groupAlgorithms,
  searchAlgorithms,
} from '../algorithms/registry'
import { AlgorithmPicker } from '../components/AlgorithmPicker'
import { MathNotation } from '../components/MathNotation'
import { RichCombobox } from '../components/RichCombobox'
import { datasetRegistry, searchDatasets } from '../data/datasets'
import { filterRichOptions, nextEnabledIndex, type RichOption } from '../ui/combobox'
import { complexityLabel, complexityParts } from '../ui/math'
import { getAlgorithmOptions, getDatasetOptions } from '../ui/pickerOptions'
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
    expect(options).toHaveLength(36)
    for (const option of options) {
      expect(algorithmIconAssignments[option.id]).toBeTruthy()
      expect(option.algorithm.icon).toBe(algorithmIconAssignments[option.id])
      expect(option.algorithm.optionDescription.length).toBeGreaterThan(10)
      expect(option.searchText).toContain(option.algorithm.name)
    }
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
    expect(markerKindForEvent('range')).toBe('range')
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
