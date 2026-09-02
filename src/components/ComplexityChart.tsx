import { complexityCurves, complexityInputs } from '../data/complexity'

const plot = { left: 72, right: 632, top: 34, bottom: 344 }
const highestWork = Math.max(
  ...complexityCurves.flatMap((curve) => complexityInputs.map((n) => curve.work(n))),
)
const highestPower = Math.ceil(Math.log10(highestWork))
const yTicks = Array.from({ length: highestPower + 1 }, (_, exponent) => 10 ** exponent)

const xPosition = (n: number) =>
  plot.left +
  ((n - complexityInputs[0]) / (complexityInputs.at(-1)! - complexityInputs[0])) *
    (plot.right - plot.left)

const yPosition = (work: number) =>
  plot.bottom - (Math.log10(Math.max(1, work)) / highestPower) * (plot.bottom - plot.top)

const tickLabel = (value: number) => {
  if (value >= 1_000_000) return `${value / 1_000_000}M`
  if (value >= 1_000) return `${value / 1_000}K`
  return value.toLocaleString()
}

export function ComplexityChart() {
  const paths = complexityCurves.map((curve) => ({
    ...curve,
    path: complexityInputs
      .map(
        (n, index) =>
          `${index === 0 ? 'M' : 'L'} ${xPosition(n).toFixed(2)} ${yPosition(curve.work(n)).toFixed(2)}`,
      )
      .join(' '),
    endValue: curve.work(complexityInputs.at(-1)!),
  }))

  return (
    <section className="complexity-chart-section">
      <div className="chart-heading">
        <div>
          <span className="section-label">One scale, honest growth</span>
          <h2>How work changes as input grows</h2>
        </div>
        <p>Every curve uses the same log-scaled axis. One vertical step means 10× more work.</p>
      </div>
      <div className="complexity-chart-wrap">
        <p className="chart-mobile-hint">Swipe horizontally to inspect every label.</p>
        <div className="complexity-chart-scroll">
          <svg
            className="complexity-chart"
            viewBox="0 0 820 400"
            role="img"
            aria-labelledby="complexity-title complexity-desc"
          >
            <title id="complexity-title">Representative algorithm growth classes</title>
            <desc id="complexity-desc">
              Seven functions share one logarithmic work axis for input sizes two through ten. At
              input ten, constant work is one, quadratic work is one hundred, exponential work is
              one thousand twenty-four, and factorial work is three million six hundred twenty-eight
              thousand eight hundred.
            </desc>

            <rect
              className="complexity-plot-background"
              x={plot.left}
              y={plot.top}
              width={plot.right - plot.left}
              height={plot.bottom - plot.top}
              rx="12"
            />

            {yTicks.map((tick) => {
              const y = yPosition(tick)
              return (
                <g key={tick}>
                  <line className="chart-grid-line" x1={plot.left} x2={plot.right} y1={y} y2={y} />
                  <text className="chart-tick-label" x={plot.left - 13} y={y + 4} textAnchor="end">
                    {tickLabel(tick)}
                  </text>
                </g>
              )
            })}

            {[2, 4, 6, 8, 10].map((n) => {
              const x = xPosition(n)
              return (
                <g key={n}>
                  <line
                    className="chart-grid-line chart-grid-line--vertical"
                    x1={x}
                    x2={x}
                    y1={plot.top}
                    y2={plot.bottom}
                  />
                  <text className="chart-tick-label" x={x} y={plot.bottom + 25} textAnchor="middle">
                    {n}
                  </text>
                </g>
              )
            })}

            <text className="chart-axis-title" x={plot.left} y="19">
              Representative work · logarithmic scale
            </text>
            <text className="chart-axis-title" x={plot.right} y={plot.bottom + 47} textAnchor="end">
              Input size n
            </text>

            {paths.map((curve) => {
              const endpointY = yPosition(curve.endValue)
              return (
                <g className={curve.color} data-series={curve.id} key={curve.id}>
                  <path className="growth-line" d={curve.path} data-end-value={curve.endValue} />
                  <circle className="growth-endpoint" cx={plot.right} cy={endpointY} r="4" />
                  <line
                    className="growth-label-rule"
                    x1={plot.right + 7}
                    x2={plot.right + 18}
                    y1={endpointY}
                    y2={endpointY}
                  />
                  <text className="growth-label" x={plot.right + 24} y={endpointY + 4}>
                    {curve.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div className="complexity-chart-proof" aria-label="Representative work at input ten">
          <strong>At n = 10</strong>
          <span>
            <b>n log₂ n</b> ≈ 33
          </span>
          <span>
            <b>n²</b> = 100
          </span>
          <span>
            <b>2ⁿ</b> = 1,024
          </span>
          <span>
            <b>n!</b> = 3,628,800
          </span>
        </div>
      </div>

      <div className="sr-only">
        <table>
          <caption>Representative work by complexity class and input size</caption>
          <thead>
            <tr>
              <th scope="col">Complexity</th>
              {complexityInputs.map((n) => (
                <th scope="col" key={n}>
                  n = {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {complexityCurves.map((curve) => (
              <tr key={curve.id}>
                <th scope="row">{curve.label}</th>
                {complexityInputs.map((n) => (
                  <td key={n}>
                    {curve.work(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="complexity-chart-note">
        Representative functions use coefficient 1 and log₂ n. Big-O omits constants and lower-order
        terms, so these values explain growth—not runtime predictions.
      </p>
    </section>
  )
}
