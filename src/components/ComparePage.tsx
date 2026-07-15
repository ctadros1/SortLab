import { useEffect, useMemo, useRef, useState } from 'react'
import { materializeEvents } from '../algorithms/engine'
import { algorithmById, validateAlgorithmInput } from '../algorithms/registry'
import type { SortEvent } from '../types'
import { generateArray } from '../utils/array'
import { BarVisualizer } from './BarVisualizer'
import { AlgorithmPicker } from './AlgorithmPicker'
import { AppIcon } from './Icon'
import { Switch } from './Switch'

interface Run {
  id: string
  events: SortEvent[]
  index: number
  executionMs: number
  error?: string
}

export function ComparePage() {
  const [first, setFirst] = useState('bubble-optimized')
  const [second, setSecond] = useState('quick-hoare')
  const [size, setSize] = useState(32)
  const [seed, setSeed] = useState(42)
  const [speed, setSpeed] = useState(30)
  const [running, setRunning] = useState(false)
  const [synchronized, setSynchronized] = useState(true)
  const [runs, setRuns] = useState<Run[]>([])
  const accumulator = useRef(0)
  const source = useMemo(() => generateArray('random', size, seed), [seed, size])

  const prepare = () => {
    const nextRuns = [first, second].map((id) => {
      const validation = validateAlgorithmInput(id, source)
      if (validation) return { id, events: [], index: -1, executionMs: 0, error: validation }
      const start = performance.now()
      const result = materializeEvents(id, source)
      return { id, events: result.events, index: -1, executionMs: performance.now() - start }
    })
    setRuns(nextRuns)
    setRunning(nextRuns.every((run) => !run.error))
  }

  useEffect(() => {
    if (!running) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      accumulator.current += now - last
      last = now
      const interval = 1000 / speed
      const advance = Math.max(0, Math.min(16, Math.floor(accumulator.current / interval)))
      if (advance > 0) {
        accumulator.current -= advance * interval
        setRuns((current) => {
          const longest = Math.max(1, ...current.map((run) => run.events.length))
          const sharedIndex = Math.max(0, ...current.map((run) => run.index)) + advance
          return current.map((run) => ({
            ...run,
            index: synchronized
              ? Math.min(
                  run.events.length - 1,
                  Math.floor((sharedIndex / longest) * run.events.length),
                )
              : Math.min(run.events.length - 1, run.index + advance),
          }))
        })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, speed, synchronized])

  useEffect(() => {
    if (!running || runs.length === 0 || !runs.every((run) => run.index >= run.events.length - 1))
      return
    const timer = window.setTimeout(() => setRunning(false), 0)
    return () => window.clearTimeout(timer)
  }, [running, runs])

  const completed = runs.length > 0 && runs.every((run) => run.index >= run.events.length - 1)
  const winner = completed ? [...runs].sort((a, b) => a.executionMs - b.executionMs)[0] : undefined

  return (
    <main className="page-shell compare-page" id="main-content">
      <header className="page-intro">
        <div>
          <span className="section-label">Same input, different strategy</span>
          <h1>Compare algorithms side by side</h1>
        </div>
        <p>
          Synchronized visuals show operation patterns. The winner uses measured JavaScript
          execution time—not animation duration.
        </p>
      </header>
      <section className="compare-controls" aria-label="Comparison configuration">
        <div className="control-field">
          <span>First algorithm</span>
          <AlgorithmPicker
            label="First algorithm"
            value={first}
            values={source}
            onChange={setFirst}
            disabled={running}
            prominent={false}
          />
        </div>
        <div className="control-field">
          <span>Second algorithm</span>
          <AlgorithmPicker
            label="Second algorithm"
            value={second}
            values={source}
            onChange={setSecond}
            disabled={running}
            prominent={false}
          />
        </div>
        <label>
          <span>Array size</span>
          <input
            type="number"
            min="8"
            max="80"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
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
        <label className="range-label">
          <span>
            Shared speed <strong>{speed}/s</strong>
          </span>
          <input
            type="range"
            min="1"
            max="120"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
        </label>
        <Switch
          checked={synchronized}
          onChange={setSynchronized}
          label="Synchronized playback"
          description="Keep both panels at the same relative progress"
          icon={<AppIcon name="compare" />}
          disabled={running}
        />
        <button
          className="button button--primary button--with-icon"
          onClick={prepare}
          disabled={running}
        >
          <AppIcon name="play" aria-hidden="true" /> Start together
        </button>
        <button
          className="button button--secondary button--with-icon"
          onClick={() => {
            setRuns([])
            setRunning(false)
          }}
        >
          <AppIcon name="reset" aria-hidden="true" /> Reset both
        </button>
      </section>
      <section className="compare-grid">
        {[first, second].map((id, panel) => {
          const run = runs[panel]
          const event = run?.events[run.index]
          const meta = algorithmById.get(id)
          return (
            <article className="compare-panel" key={`${panel}-${id}`}>
              <header>
                <div>
                  <span>{meta?.family}</span>
                  <h2>{meta?.name}</h2>
                </div>
                <strong>{run ? `${run.executionMs.toFixed(2)} ms` : 'Ready'}</strong>
              </header>
              {run?.error ? (
                <div className="error-message">{run.error}</div>
              ) : (
                <BarVisualizer
                  values={event?.array ?? source}
                  event={event}
                  compact
                  label={`${meta?.name} comparison panel`}
                />
              )}
              <dl className="mini-stats">
                <div>
                  <dt>Comparisons</dt>
                  <dd>{event?.stats.comparisons ?? 0}</dd>
                </div>
                <div>
                  <dt>Swaps</dt>
                  <dd>{event?.stats.swaps ?? 0}</dd>
                </div>
                <div>
                  <dt>Writes</dt>
                  <dd>{event?.stats.writes ?? 0}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    {run && run.index >= run.events.length - 1
                      ? 'Complete'
                      : (event?.phase ?? 'Ready')}
                  </dd>
                </div>
              </dl>
            </article>
          )
        })}
      </section>
      {winner ? (
        <div className="winner-summary" role="status">
          <strong>Measured execution winner: {algorithmById.get(winner.id)?.name}</strong>
          <span>
            {winner.executionMs.toFixed(2)} ms to generate its complete event stream on this device.
          </span>
        </div>
      ) : null}
      <p className="timing-note">
        A visualizer rewards fewer animation events. It does not reproduce engine-optimized library
        sorts, cache behavior, or production workloads.
      </p>
    </main>
  )
}
