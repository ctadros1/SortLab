import { useEffect, useMemo, useRef, useState } from 'react'
import { algorithmById, algorithmRegistry } from '../algorithms/registry'
import { generateArray } from '../utils/array'
import { AppIcon } from './Icon'

interface Result {
  id: string
  median: number
  samples: number[]
  skipped?: string
}

interface WorkerResponse {
  id: number
  type: 'progress' | 'complete' | 'canceled'
  completed?: number
  total?: number
  results?: Result[]
}

const defaults = ['bubble-optimized', 'insertion', 'merge', 'quick-hoare', 'heap', 'timsort']

export function BenchmarkPage() {
  const [selected, setSelected] = useState(defaults)
  const [size, setSize] = useState(5000)
  const [trials, setTrials] = useState(7)
  const [seed, setSeed] = useState(42)
  const [results, setResults] = useState<Result[]>([])
  const [progress, setProgress] = useState('Ready')
  const [running, setRunning] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)

  useEffect(() => () => workerRef.current?.terminate(), [])

  const run = () => {
    workerRef.current?.terminate()
    const worker = new Worker(new URL('../benchmark/benchmark.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker
    requestId.current += 1
    const id = requestId.current
    setRunning(true)
    setResults([])
    setProgress('Warming up…')
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.id !== id) return
      if (event.data.type === 'progress')
        setProgress(`${event.data.completed} of ${event.data.total} algorithms complete`)
      else {
        setResults(event.data.results ?? [])
        setProgress(event.data.type === 'canceled' ? 'Canceled safely' : 'Complete')
        setRunning(false)
      }
    }
    worker.onerror = () => {
      setProgress('The benchmark worker failed. Adjust the test and try again.')
      setRunning(false)
    }
    worker.postMessage({
      id,
      algorithms: selected,
      values: generateArray('random', size, seed),
      trials,
    })
  }

  const cancel = () => {
    workerRef.current?.postMessage({ cancel: true })
    window.setTimeout(() => workerRef.current?.terminate(), 50)
    setRunning(false)
    setProgress('Canceled safely')
  }

  const maximum = Math.max(
    0.01,
    ...results.filter((result) => !result.skipped).map((result) => result.median),
  )
  const ordered = useMemo(
    () => [...results].sort((a, b) => (a.skipped ? 1 : b.skipped ? -1 : a.median - b.median)),
    [results],
  )

  return (
    <main className="page-shell benchmark-page" id="main-content">
      <header className="page-intro">
        <div>
          <span className="section-label">Unanimated measurement</span>
          <h1>Benchmark identical arrays</h1>
        </div>
        <p>
          Each algorithm gets one warm-up and multiple copied trials in a Web Worker, keeping the
          interface responsive.
        </p>
      </header>
      <section className="benchmark-config">
        <fieldset>
          <legend>Algorithms</legend>
          <div className="algorithm-checks">
            {algorithmRegistry
              .filter(
                (item) =>
                  !['stooge', 'slow', 'bogo', 'bitonic', 'batcher-odd-even'].includes(item.id),
              )
              .map((algorithm) => (
                <label className="check-chip" key={algorithm.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(algorithm.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, algorithm.id]
                          : current.filter((id) => id !== algorithm.id),
                      )
                    }
                    disabled={running}
                  />
                  <span>{algorithm.name}</span>
                </label>
              ))}
          </div>
        </fieldset>
        <div className="benchmark-fields">
          <label>
            <span>Array size</span>
            <input
              type="number"
              min="100"
              max="50000"
              step="100"
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              disabled={running}
            />
          </label>
          <label>
            <span>Trials</span>
            <input
              type="number"
              min="3"
              max="21"
              step="2"
              value={trials}
              onChange={(event) => setTrials(Number(event.target.value))}
              disabled={running}
            />
          </label>
          <label>
            <span>Seed</span>
            <input
              type="number"
              value={seed}
              onChange={(event) => setSeed(Number(event.target.value))}
              disabled={running}
            />
          </label>
          {running ? (
            <button className="button button--danger button--with-icon" onClick={cancel}>
              <AppIcon name="stop" aria-hidden="true" /> Cancel benchmark
            </button>
          ) : (
            <button
              className="button button--primary button--with-icon"
              onClick={run}
              disabled={selected.length === 0}
            >
              <AppIcon name="benchmark" aria-hidden="true" /> Run benchmark
            </button>
          )}
        </div>
        <div className="benchmark-status" role="status">
          {progress}
        </div>
      </section>
      <section className="benchmark-results" aria-labelledby="benchmark-chart-title">
        <div className="chart-heading">
          <div>
            <span className="section-label">Category comparison</span>
            <h2 id="benchmark-chart-title">Median execution time by algorithm</h2>
          </div>
          <p>
            {size.toLocaleString()} integers · {trials} timed trials · lower is better
          </p>
        </div>
        {ordered.length === 0 ? (
          <div className="empty-state">
            Run a benchmark to compare measured medians on this browser and device.
          </div>
        ) : (
          <div className="benchmark-bars">
            {ordered.map((result) => (
              <div className="benchmark-row" key={result.id}>
                <span>{algorithmById.get(result.id)?.name}</span>
                {result.skipped ? (
                  <div className="skip-note">Skipped safely</div>
                ) : (
                  <div className="benchmark-track">
                    <i style={{ width: `${Math.max(2, (result.median / maximum) * 100)}%` }} />
                    <strong>{result.median.toFixed(2)} ms</strong>
                  </div>
                )}
                {result.skipped ? (
                  <small>{result.skipped}</small>
                ) : (
                  <small>
                    samples: {result.samples.map((sample) => sample.toFixed(1)).join(', ')} ms
                  </small>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="benchmark-caveat">
        <AppIcon name="warning" aria-hidden="true" /> <strong>Interpret carefully.</strong> Browser
        version, device load, JIT compilation, garbage collection, background activity, data
        distribution, and implementation details all affect these results. They are observations—not
        universal rankings.
      </div>
    </main>
  )
}
