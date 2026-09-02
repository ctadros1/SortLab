import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ComplexityChart } from '../components/ComplexityChart'
import { complexityCurves, complexityInputs } from '../data/complexity'

describe('ComplexityChart', () => {
  it('uses the real representative functions on one shared input domain', () => {
    const workAtTen = Object.fromEntries(
      complexityCurves.map((curve) => [curve.id, curve.work(10)]),
    )

    expect(complexityInputs).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(workAtTen.constant).toBe(1)
    expect(workAtTen.logarithmic).toBeCloseTo(Math.log2(10))
    expect(workAtTen.linear).toBe(10)
    expect(workAtTen.linearithmic).toBeCloseTo(10 * Math.log2(10))
    expect(workAtTen.quadratic).toBe(100)
    expect(workAtTen.exponential).toBe(1024)
    expect(workAtTen.factorial).toBe(3_628_800)
  })

  it('keeps curve endpoints distinct instead of normalizing each series independently', () => {
    const markup = renderToStaticMarkup(<ComplexityChart />)
    const endpoints = [...markup.matchAll(/data-end-value="([^"]+)"/g)].map((match) =>
      Number(match[1]),
    )

    expect(endpoints).toHaveLength(complexityCurves.length)
    expect(new Set(endpoints).size).toBe(complexityCurves.length)
    expect(markup).toContain('Every curve uses the same log-scaled axis')
    expect(markup).toContain('Representative work by complexity class and input size')
  })
})
