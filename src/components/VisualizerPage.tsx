import { useCallback, useEffect, useState } from 'react'
import { algorithmById, algorithmRegistry, validateAlgorithmInput } from '../algorithms/registry'
import { useSortPlayer } from '../hooks/useSortPlayer'
import type { DatasetMode } from '../types'
import { generateArray, parseCustomInput } from '../utils/array'
import { BarVisualizer, VisualLegend } from './BarVisualizer'
import { CodePanel } from './CodePanel'
import { StatsStrip } from './StatsStrip'

const datasetLabels: Record<DatasetMode, string> = {
  random: 'Random',
  'nearly-sorted': 'Nearly sorted',
  reversed: 'Reversed',
  sorted: 'Already sorted',
  'few-unique': 'Few unique values',
  duplicates: 'Many duplicates',
  sawtooth: 'Sawtooth',
  groups: 'Shuffled groups',
  custom: 'Custom input',
}

export function VisualizerPage() {
  const [mode, setMode] = useState<DatasetMode>('random')
  const [seed, setSeed] = useState(42)
  const [size, setSize] = useState(32)
  const [custom, setCustom] = useState('42, 17, 73, 8, 55, 31, 89, 24')
  const [customError, setCustomError] = useState<string | null>(null)
  const [sameArray, setSameArray] = useState(true)
  const player = useSortPlayer(generateArray('random', 32, 42), 'quick-hoare')
  const algorithm = algorithmById.get(player.algorithmId) ?? algorithmRegistry[0]

  const regenerate = useCallback(
    (nextMode = mode, nextSize = size, nextSeed = seed) => {
      try {
        const values =
          nextMode === 'custom'
            ? parseCustomInput(custom)
            : generateArray(nextMode, nextSize, nextSeed)
        const validation = validateAlgorithmInput(player.algorithmId, values)
        if (validation) throw new Error(validation)
        player.replaceSource(values)
        setSize(values.length)
        setCustomError(null)
      } catch (caught) {
        setCustomError(caught instanceof Error ? caught.message : 'The dataset is not valid.')
      }
    },
    [custom, mode, player, seed, size],
  )

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return
      if (event.code === 'Space') {
        event.preventDefault()
        if (player.status === 'running') player.pause()
        else player.play()
      } else if (event.key === 'ArrowRight') player.step(1)
      else if (event.key === 'ArrowLeft') player.step(-1)
      else if (event.key.toLowerCase() === 'r') player.reset()
      else if (event.key.toLowerCase() === 's') regenerate()
      else if (event.key.toLowerCase() === 'm') player.setSound(!player.sound)
      else if (event.key === 'Escape') player.stop()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [player, regenerate])

  const chooseAlgorithm = (id: string) => {
    const validation = validateAlgorithmInput(id, player.source)
    if (validation) {
      setCustomError(validation)
      return
    }
    player.selectAlgorithm(id)
    setCustomError(null)
  }

  const narration =
    player.currentEvent?.narration ?? `Choose an algorithm, inspect its idea, then press Start.`

  return (
    <main className="visualize-layout">
      <aside className="control-rail" aria-label="Sorting controls">
        <div className="mobile-control-title">Controls</div>
        <label>
          <span>Algorithm</span>
          <select
            value={player.algorithmId}
            onChange={(event) => chooseAlgorithm(event.target.value)}
            disabled={player.controlsLocked}
          >
            {algorithmRegistry.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Dataset</span>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as DatasetMode)}
            disabled={player.controlsLocked}
          >
            {Object.entries(datasetLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {mode === 'custom' ? (
          <label>
            <span>Comma-separated integers</span>
            <textarea
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              disabled={player.controlsLocked}
              rows={3}
            />
          </label>
        ) : null}
        <div className="field-row">
          <label>
            <span>Seed</span>
            <input
              type="number"
              value={seed}
              onChange={(event) => setSeed(Number(event.target.value))}
              disabled={player.controlsLocked}
            />
          </label>
          <label>
            <span>Size</span>
            <input
              type="number"
              min="5"
              max="120"
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              disabled={player.controlsLocked || mode === 'custom'}
            />
          </label>
        </div>
        <button
          className="button button--secondary"
          onClick={() => regenerate()}
          disabled={player.controlsLocked}
        >
          Generate array
        </button>
        <label className="range-label">
          <span>
            Speed <strong>{player.speed} steps/s</strong>
          </span>
          <input
            type="range"
            min="1"
            max="120"
            value={player.speed}
            onChange={(event) => player.setSpeed(Number(event.target.value))}
          />
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={sameArray}
            onChange={(event) => setSameArray(event.target.checked)}
          />
          <span>Use same array</span>
        </label>
        <div className="playback-grid">
          <button className="button button--secondary" onClick={player.reset}>
            Reset
          </button>
          <button className="button button--secondary" onClick={() => player.jump('start')}>
            Beginning
          </button>
          <button className="button button--secondary" onClick={() => player.step(-1)}>
            Previous
          </button>
          {player.status === 'running' ? (
            <button className="button button--primary" onClick={player.pause}>
              Pause
            </button>
          ) : (
            <button className="button button--primary" onClick={player.play}>
              {player.status === 'paused' ? 'Resume' : 'Start'}
            </button>
          )}
          <button className="button button--secondary" onClick={() => player.step(1)}>
            Next
          </button>
          <button className="button button--secondary" onClick={() => player.jump('end')}>
            End
          </button>
          <button
            className="button button--danger"
            onClick={player.stop}
            disabled={player.status === 'idle'}
          >
            Stop
          </button>
          <button
            className="button button--secondary"
            onClick={() => regenerate(mode, size, sameArray ? seed : seed + 1)}
          >
            Shuffle
          </button>
        </div>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={player.sound}
            onChange={(event) => player.setSound(event.target.checked)}
          />
          <span>Sound</span>
        </label>
        <label className="range-label">
          <span>
            Volume <strong>{Math.round(player.volume * 100)}%</strong>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={player.volume}
            onChange={(event) => player.setVolume(Number(event.target.value))}
            disabled={!player.sound}
          />
        </label>
        <details className="shortcut-help">
          <summary>Keyboard shortcuts</summary>
          <p>Space play/pause · ←/→ step · R reset · S shuffle · M mute · Esc stop</p>
        </details>
      </aside>

      <section className="visual-stage" aria-live="polite">
        <label className="mobile-algorithm-select">
          <span>Algorithm</span>
          <select
            aria-label="Mobile algorithm"
            value={player.algorithmId}
            onChange={(event) => chooseAlgorithm(event.target.value)}
            disabled={player.controlsLocked}
          >
            {algorithmRegistry.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="narration">
          <span aria-hidden="true">●</span>
          <strong>{narration}</strong>
        </div>
        {algorithm.warning ? (
          <div className="warning" role="note">
            <strong>Safety limit:</strong> {algorithm.warning}
          </div>
        ) : null}
        {customError || player.error ? (
          <div className="error-message" role="alert">
            {customError ?? player.error}
          </div>
        ) : null}
        <BarVisualizer values={player.array} event={player.currentEvent} />
        <VisualLegend />
        <div className="timeline-row">
          <button className="text-button" onClick={() => player.jump('start')}>
            Jump to beginning
          </button>
          <input
            aria-label="Animation timeline"
            type="range"
            min="0"
            max="100"
            value={player.progress}
            readOnly
          />
          <span>
            {player.eventIndex + 1} / {player.events.length || 0}
          </span>
        </div>
        <StatsStrip event={player.currentEvent} executionMs={player.executionMs} />
        <p className="timing-note">
          Animation duration reflects event count and playback speed. JavaScript execution time is
          measured separately and is still not a production benchmark.
        </p>
      </section>

      <CodePanel algorithm={algorithm} event={player.currentEvent} />
    </main>
  )
}
