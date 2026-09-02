import { useEffect, useMemo, useRef, useState } from 'react'
import { materializeEvents } from '../algorithms/engine'
import { algorithmById, validateAlgorithmInput } from '../algorithms/registry'
import { sortingAudioEngine } from '../audio/AudioEngine'
import { createAudioSettings } from '../audio/presets'
import type { SortEvent } from '../types'
import {
  advanceSharedStep,
  compareCrossfadeLabel,
  compareCrossfadeLevels,
  synchronizedEventIndex,
} from '../ui/compare'
import { generateArray } from '../utils/array'
import { AlgorithmPicker } from './AlgorithmPicker'
import { BarVisualizer } from './BarVisualizer'
import { AppIcon, type AppIconName } from './Icon'
import { Switch } from './Switch'

interface Run {
  id: string
  events: SortEvent[]
  index: number
  executionMs: number
  error?: string
}

type PlaybackState = 'idle' | 'running' | 'paused'

const audibleEventTypes = new Set(['compare', 'swap', 'write', 'pivot'])

function runProgress(run?: Run) {
  if (!run || run.events.length === 0 || run.index < 0) return 0
  return Math.min(100, Math.round(((run.index + 1) / run.events.length) * 100))
}

function runState(run: Run | undefined, playback: PlaybackState) {
  if (!run) return { icon: 'monitor' as AppIconName, label: 'Ready' }
  if (run.error) return { icon: 'warning' as AppIconName, label: 'Needs attention' }
  if (run.index >= run.events.length - 1) return { icon: 'check' as AppIconName, label: 'Complete' }
  if (playback === 'paused') return { icon: 'pause' as AppIconName, label: 'Paused' }
  if (playback === 'running') return { icon: 'play' as AppIconName, label: 'Running' }
  return { icon: 'monitor' as AppIconName, label: 'Ready' }
}

export function ComparePage() {
  const [first, setFirst] = useState('bubble-optimized')
  const [second, setSecond] = useState('quick-hoare')
  const [size, setSize] = useState(32)
  const [seed, setSeed] = useState(42)
  const [speed, setSpeed] = useState(30)
  const [playback, setPlayback] = useState<PlaybackState>('idle')
  const [synchronized, setSynchronized] = useState(true)
  const [soundMix, setSoundMix] = useState(50)
  const [runs, setRuns] = useState<Run[]>([])
  const accumulator = useRef(0)
  const sharedStep = useRef(-1)
  const lastSoundedIndices = useRef([-1, -1])
  const completionSounded = useRef(false)
  const source = useMemo(() => generateArray('random', size, seed), [seed, size])
  const soundLevels = compareCrossfadeLevels(soundMix)
  const soundMixLabel = compareCrossfadeLabel(soundMix)

  const resetPlayback = () => {
    sortingAudioEngine.stopAll()
    accumulator.current = 0
    sharedStep.current = -1
    lastSoundedIndices.current = [-1, -1]
    completionSounded.current = false
    setRuns([])
    setPlayback('idle')
  }

  const prepare = () => {
    sortingAudioEngine.stopAll()
    accumulator.current = 0
    sharedStep.current = -1
    lastSoundedIndices.current = [-1, -1]
    completionSounded.current = false
    const nextRuns = [first, second].map((id) => {
      const validation = validateAlgorithmInput(id, source)
      if (validation) return { id, events: [], index: -1, executionMs: 0, error: validation }
      const start = performance.now()
      const result = materializeEvents(id, source)
      return { id, events: result.events, index: -1, executionMs: performance.now() - start }
    })
    setRuns(nextRuns)
    setPlayback(nextRuns.every((run) => !run.error) ? 'running' : 'idle')
  }

  const handlePrimaryAction = () => {
    if (playback === 'running') {
      sortingAudioEngine.stopAll()
      accumulator.current = 0
      setPlayback('paused')
      return
    }
    if (playback === 'paused') {
      void sortingAudioEngine.resume()
      accumulator.current = 0
      setPlayback('running')
      return
    }
    void sortingAudioEngine.resume()
    prepare()
  }

  useEffect(() => {
    sortingAudioEngine.configure(createAudioSettings('classic', { enabled: true, volume: 0.24 }))
    return () => sortingAudioEngine.stopAll()
  }, [])

  useEffect(() => {
    sortingAudioEngine.setOutputMix('first', soundLevels.first, -0.72)
    sortingAudioEngine.setOutputMix('second', soundLevels.second, 0.72)
  }, [soundLevels.first, soundLevels.second])

  useEffect(() => {
    if (playback !== 'running') return
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
          if (!synchronized) {
            return current.map((run) => ({
              ...run,
              index: Math.min(run.events.length - 1, run.index + advance),
            }))
          }

          const longestEventCount = Math.max(1, ...current.map((run) => run.events.length))
          sharedStep.current = advanceSharedStep(sharedStep.current, advance, longestEventCount)
          return current.map((run) => ({
            ...run,
            index: synchronizedEventIndex(sharedStep.current, run.events.length, longestEventCount),
          }))
        })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playback, speed, synchronized])

  useEffect(() => {
    if (playback !== 'running') return
    runs.forEach((run, panel) => {
      if (run.index < 0 || run.index === lastSoundedIndices.current[panel]) return
      lastSoundedIndices.current[panel] = run.index
      const event = run.events[run.index]
      if (!event || !audibleEventTypes.has(event.type)) return
      const values = event.indices
        .slice(0, 2)
        .map((index) => event.array[index])
        .filter((value): value is number => Number.isFinite(value))
      if (values.length === 0) return
      void sortingAudioEngine.play(
        {
          type: event.type,
          values,
          dataset: event.array,
          speed,
          sequence: run.index,
        },
        panel === 0 ? 'first' : 'second',
      )
    })
  }, [playback, runs, speed])

  useEffect(() => {
    if (
      playback !== 'running' ||
      runs.length === 0 ||
      !runs.every((run) => run.index >= run.events.length - 1)
    )
      return
    const timer = window.setTimeout(() => setPlayback('idle'), 0)
    return () => window.clearTimeout(timer)
  }, [playback, runs])

  const completed =
    runs.length > 0 &&
    runs.every((run) => !run.error && run.events.length > 0 && run.index >= run.events.length - 1)
  const winner = completed ? [...runs].sort((a, b) => a.executionMs - b.executionMs)[0] : undefined

  useEffect(() => {
    if (!completed || completionSounded.current) return
    completionSounded.current = true
    runs.forEach((run, panel) => {
      const finalArray = run.events.at(-1)?.array
      if (finalArray)
        void sortingAudioEngine.playCompletion(finalArray, speed, panel === 0 ? 'first' : 'second')
    })
  }, [completed, runs, speed])

  const configurationLocked = playback !== 'idle'
  const longestRun = runs.reduce<Run | undefined>(
    (longest, run) => (!longest || run.events.length > longest.events.length ? run : longest),
    undefined,
  )
  const synchronizedProgress = runProgress(longestRun)
  const primaryAction =
    playback === 'running'
      ? { icon: 'pause' as AppIconName, label: 'Pause' }
      : playback === 'paused'
        ? { icon: 'play' as AppIconName, label: 'Resume' }
        : { icon: 'play' as AppIconName, label: completed ? 'Run again' : 'Start comparison' }

  return (
    <main className="page-shell compare-page" id="main-content">
      <header className="compare-intro">
        <h1>Compare algorithms</h1>
        <p>Run two algorithms on the same array and compare how they work.</p>
      </header>

      <section className="compare-setup" aria-label="Comparison configuration">
        <div className="compare-setup__fields">
          <div className="control-field compare-algorithm-field">
            <span>First algorithm</span>
            <AlgorithmPicker
              label="First algorithm"
              value={first}
              values={source}
              onChange={(value) => {
                setFirst(value)
                resetPlayback()
              }}
              disabled={configurationLocked}
              prominent={false}
              catalog="all"
            />
          </div>
          <div className="control-field compare-algorithm-field">
            <span>Second algorithm</span>
            <AlgorithmPicker
              label="Second algorithm"
              value={second}
              values={source}
              onChange={(value) => {
                setSecond(value)
                resetPlayback()
              }}
              disabled={configurationLocked}
              prominent={false}
              catalog="all"
            />
          </div>
          <label className="control-field compare-number-field">
            <span>Array size</span>
            <input
              type="number"
              min="8"
              max="80"
              value={size}
              onChange={(event) => {
                setSize(Number(event.target.value))
                resetPlayback()
              }}
              disabled={configurationLocked}
            />
          </label>
          <label className="control-field compare-number-field">
            <span>Seed</span>
            <input
              type="number"
              value={seed}
              onChange={(event) => {
                setSeed(Number(event.target.value))
                resetPlayback()
              }}
              disabled={configurationLocked}
            />
          </label>
          <label className="control-field compare-speed-field">
            <span>
              Shared speed <strong>{speed} steps/s</strong>
            </span>
            <input
              type="range"
              min="1"
              max="120"
              value={speed}
              aria-label="Shared speed"
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="compare-setup__actions">
          <Switch
            checked={synchronized}
            onChange={(checked) => {
              setSynchronized(checked)
              resetPlayback()
            }}
            label="Synchronized playback"
            description="Keep both panels at the same relative progress"
            disabled={configurationLocked}
          />
          <div
            className="compare-mixer"
            role="group"
            aria-label="Comparison sound mixer"
            data-first-gain={soundLevels.first.toFixed(3)}
            data-second-gain={soundLevels.second.toFixed(3)}
          >
            <div className="compare-mixer__heading">
              <span>
                <AppIcon name="sound" aria-hidden="true" size={16} /> Sound mix
              </span>
              <strong>{soundMixLabel}</strong>
            </div>
            <div className="compare-mixer__fader">
              <input
                type="range"
                min="0"
                max="100"
                value={soundMix}
                aria-label="Sound crossfader"
                aria-valuetext={soundMixLabel}
                onChange={(event) => setSoundMix(Number(event.target.value))}
              />
            </div>
            <div className="compare-mixer__labels" aria-hidden="true">
              <span>First</span>
              <span>Second</span>
            </div>
          </div>
          <div className="compare-actions">
            <button
              className="button button--primary button--with-icon"
              onClick={handlePrimaryAction}
            >
              <AppIcon name={primaryAction.icon} aria-hidden="true" /> {primaryAction.label}
            </button>
            <button className="button button--secondary button--with-icon" onClick={resetPlayback}>
              <AppIcon name="reset" aria-hidden="true" /> Reset
            </button>
          </div>
        </div>
      </section>

      <section className="compare-grid" aria-label="Algorithm comparison">
        {[first, second].map((id, panel) => {
          const run = runs[panel]
          const event = run?.events[run.index]
          const meta = algorithmById.get(id)
          const progress =
            synchronized && run && !run.error ? synchronizedProgress : runProgress(run)
          const state = runState(run, playback)
          return (
            <article
              className="compare-panel"
              data-playback-state={state.label.toLowerCase().replace(' ', '-')}
              data-progress={progress}
              key={`${panel}-${id}`}
            >
              <header className="compare-panel__header">
                <div>
                  <span>{meta?.family}</span>
                  <h2>{meta?.name}</h2>
                </div>
                <strong
                  aria-label={run ? `Measured ${run.executionMs.toFixed(2)} milliseconds` : ''}
                >
                  {run ? `${run.executionMs.toFixed(2)} ms` : 'Ready'}
                </strong>
              </header>

              <div className="compare-panel__progress" aria-live="polite">
                <span className="compare-panel__state">
                  <AppIcon name={state.icon} aria-hidden="true" size={16} /> {state.label}
                </span>
                <span>{progress}% complete</span>
              </div>

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
                      : (event?.phase ?? state.label)}
                  </dd>
                </div>
              </dl>
            </article>
          )
        })}
      </section>

      {winner ? (
        <div className="winner-summary" role="status">
          <AppIcon name="benchmark" aria-hidden="true" />
          <span>
            <strong>Measured execution winner: {algorithmById.get(winner.id)?.name}</strong>
            <small>
              {winner.executionMs.toFixed(2)} ms to generate its event stream on this device.
            </small>
          </span>
        </div>
      ) : null}

      <aside className="timing-note compare-note">
        <AppIcon name="info" aria-hidden="true" />
        <p>
          Animation shows operation patterns. Execution time measures event generation on this
          device and does not represent production performance.
        </p>
      </aside>
    </main>
  )
}
