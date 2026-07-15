import { useCallback, useEffect, useState } from 'react'
import { algorithmById, algorithmRegistry, validateAlgorithmInput } from '../algorithms/registry'
import { useSortPlayer } from '../hooks/useSortPlayer'
import type { DatasetMode } from '../types'
import { generateArray, parseCustomInput } from '../utils/array'
import { AlgorithmPicker } from './AlgorithmPicker'
import { BarVisualizer, VisualLegend } from './BarVisualizer'
import { CodePanel } from './CodePanel'
import { ControlSidebar } from './ControlSidebar'
import { AppIcon } from './Icon'
import { StatsStrip } from './StatsStrip'

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
        event.target instanceof HTMLButtonElement ||
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
    player.currentEvent?.narration ?? 'Choose an algorithm, inspect its idea, then press Start.'

  return (
    <main className="visualize-layout" id="main-content">
      <ControlSidebar
        player={player}
        mode={mode}
        setMode={setMode}
        seed={seed}
        setSeed={setSeed}
        size={size}
        setSize={setSize}
        custom={custom}
        setCustom={setCustom}
        sameArray={sameArray}
        setSameArray={setSameArray}
        chooseAlgorithm={chooseAlgorithm}
        regenerate={regenerate}
      />

      <section className="visual-stage" aria-label="Sorting visualization workspace">
        <div className="mobile-algorithm-picker">
          <span className="control-label">
            <AppIcon name="algorithm" aria-hidden="true" /> Algorithm
          </span>
          <AlgorithmPicker
            label="Mobile algorithm"
            value={player.algorithmId}
            values={player.source}
            onChange={chooseAlgorithm}
            disabled={player.controlsLocked}
          />
        </div>
        <div className="narration" role="status" aria-live="polite">
          <AppIcon name="narration" aria-hidden="true" />
          <strong>{narration}</strong>
        </div>
        {algorithm.warning ? (
          <div className="warning" role="note">
            <AppIcon name="warning" aria-hidden="true" />
            <span>
              <strong>Safety limit:</strong> {algorithm.warning}
            </span>
          </div>
        ) : null}
        {customError || player.error ? (
          <div className="error-message" role="alert">
            <AppIcon name="warning" aria-hidden="true" /> {customError ?? player.error}
          </div>
        ) : null}
        <BarVisualizer values={player.array} event={player.currentEvent} />
        <VisualLegend />
        <div className="timeline-row">
          <button className="text-button" onClick={() => player.jump('start')}>
            <AppIcon name="beginning" aria-hidden="true" /> Beginning
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
        <StatsStrip
          event={player.currentEvent}
          executionMs={player.executionMs}
          steps={player.eventIndex + 1}
        />
        <p className="timing-note">
          <AppIcon name="info" aria-hidden="true" /> Animation duration reflects event count and
          playback speed. JavaScript execution time is measured separately and is not a production
          benchmark.
        </p>
      </section>

      <CodePanel algorithm={algorithm} event={player.currentEvent} />
    </main>
  )
}
