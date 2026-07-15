import { MathNotation } from './MathNotation'

const curves = [
  { label: 'O(1)', color: 'curve-1', values: () => 1 },
  { label: 'O(log n)', color: 'curve-2', values: (n: number) => Math.log2(n) },
  { label: 'O(n)', color: 'curve-3', values: (n: number) => n },
  { label: 'O(n log n)', color: 'curve-4', values: (n: number) => n * Math.log2(n) },
  { label: 'O(n²)', color: 'curve-5', values: (n: number) => n * n },
  { label: 'O(2ⁿ)', color: 'curve-6', values: (n: number) => Math.pow(2, n) },
  { label: 'O(n!)', color: 'curve-7', values: (n: number) => factorial(Math.min(n, 10)) },
]

function factorial(value: number): number {
  return value <= 1 ? 1 : value * factorial(value - 1)
}

export function ComplexityChart() {
  const points = Array.from({ length: 10 }, (_, index) => index + 1)
  const paths = curves.map((curve) => {
    const transformed = points.map((n) => Math.log10(curve.values(n) + 1))
    const max = Math.max(1, ...transformed)
    return transformed
      .map(
        (value, index) =>
          `${index === 0 ? 'M' : 'L'} ${45 + index * 55} ${250 - (value / max) * 205}`,
      )
      .join(' ')
  })
  return (
    <section className="complexity-chart-section">
      <div className="chart-heading">
        <div>
          <span className="section-label">Growth, not a stopwatch</span>
          <h2>How work grows as n increases</h2>
        </div>
        <p>Log-scaled teaching view. Curves show growth shape, not predicted seconds.</p>
      </div>
      <div className="complexity-chart-wrap">
        <svg viewBox="0 0 590 290" role="img" aria-labelledby="complexity-title complexity-desc">
          <title id="complexity-title">Approximate growth classes from constant to factorial</title>
          <desc id="complexity-desc">
            Seven labeled curves rise at increasingly steep rates on a log-scaled teaching axis as
            input size grows from one to ten.
          </desc>
          <line x1="45" y1="250" x2="560" y2="250" className="axis" />
          <line x1="45" y1="35" x2="45" y2="250" className="axis" />
          {[1, 3, 5, 7, 9].map((n) => (
            <text x={45 + (n - 1) * 55} y="274" key={n}>
              {n}
            </text>
          ))}
          <text x="520" y="286">
            input n
          </text>
          <text x="10" y="28">
            relative work (log scale)
          </text>
          {paths.map((path, index) => (
            <path
              key={curves[index].label}
              d={path}
              className={`growth-line ${curves[index].color}`}
            />
          ))}
        </svg>
        <div className="chart-legend">
          {curves.map((curve) => (
            <span key={curve.label}>
              <i className={curve.color} />
              <MathNotation value={curve.label} />
            </span>
          ))}
        </div>
      </div>
      <p>
        Variables: <strong>n</strong> = input items, <strong>k</strong> = value range,{' '}
        <strong>d</strong> = digit count, and <strong>b</strong> = radix or bucket count. Big-O
        describes growth; constants, data shape, cache behavior, and implementation details still
        matter.
      </p>
    </section>
  )
}
