import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AudioSettings,
  PitchMode,
  SoundDensity,
  SoundPresetId,
  Waveform,
} from '../audio/audioTypes'
import { createAudioSettings, soundPresetList } from '../audio/presets'
import { useSandboxPlayer } from '../hooks/useSandboxPlayer'
import {
  compatibleSandboxAmount,
  SANDBOX_MAX_AMOUNT,
  SANDBOX_MIN_AMOUNT,
  sandboxAlgorithmById,
  sandboxAmountRestriction,
  sandboxVisualPresets,
} from '../sandbox/config'
import { sandboxShortcutAction } from '../sandbox/controls'
import type {
  SandboxBackgroundStyle,
  SandboxPreferences,
  SandboxQuality,
  SandboxSpeedMode,
  SandboxVisualPresetId,
  SandboxWidthMode,
} from '../sandbox/types'
import { AppIcon, ChevronRight } from './Icon'
import { SandboxAlgorithmPicker } from './SandboxAlgorithmPicker'
import { SandboxDatasetPicker } from './SandboxDatasetPicker'
import { Switch } from './Switch'

interface PendingAlgorithmAdjustment {
  algorithm: string
  algorithmName: string
  previousAmount: number
  nextAmount: number
  maximum: number
  powerOfTwo: boolean
}

function FormatNumber({ value }: { value: number }) {
  return <>{Math.round(value).toLocaleString()}</>
}

function AudioToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="sandbox-check">
      <input
        name={`sandbox-${label.toLowerCase().replaceAll(' ', '-')}`}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

export function SandboxPage() {
  const {
    setCanvas,
    preferences,
    updatePreferences,
    status,
    stats,
    error,
    audioPrompt,
    start,
    pause,
    stop,
    reset,
    shuffle,
  } = useSandboxPlayer()
  const [interfaceHidden, setInterfaceHidden] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAlgorithmAdjustment | null>(
    null,
  )
  const rootRef = useRef<HTMLElement>(null)
  const locked = status === 'running' || status === 'paused'
  const restriction = sandboxAmountRestriction(preferences.algorithm, preferences.amount)
  const sandboxAlgorithm = sandboxAlgorithmById.get(preferences.algorithm)
  const algorithmName = sandboxAlgorithm?.name ?? 'Algorithm'
  const amountMaximum = Math.min(
    SANDBOX_MAX_AMOUNT,
    sandboxAlgorithm?.maximum ?? SANDBOX_MAX_AMOUNT,
  )

  const update = updatePreferences
  const updateAudio = useCallback(
    (changes: Partial<AudioSettings>) =>
      update((current) => ({ ...current, audio: { ...current.audio, ...changes } })),
    [update],
  )
  const updateVisual = useCallback(
    (changes: Partial<SandboxPreferences['visual']>) =>
      update((current) => ({ ...current, visual: { ...current.visual, ...changes } })),
    [update],
  )

  const changeAmount = useCallback(
    (requestedAmount: number) => {
      const amount = compatibleSandboxAmount(preferences.algorithm, requestedAmount)
      update((current) => ({ ...current, amount }))
      shuffle()
    },
    [preferences.algorithm, shuffle, update],
  )

  const chooseAlgorithm = useCallback(
    (algorithm: string) => {
      const selected = sandboxAlgorithmById.get(algorithm)
      if (!selected) return
      const nextAmount = compatibleSandboxAmount(algorithm, preferences.amount)
      if (nextAmount !== preferences.amount) {
        setPendingAdjustment({
          algorithm,
          algorithmName: selected.name,
          previousAmount: preferences.amount,
          nextAmount,
          maximum: selected.maximum,
          powerOfTwo: Boolean(selected.powerOfTwo),
        })
        return
      }
      update((current) => ({ ...current, algorithm }))
      reset()
    },
    [preferences.amount, reset, update],
  )

  const confirmAlgorithmAdjustment = useCallback(() => {
    if (!pendingAdjustment) return
    update((current) => ({
      ...current,
      algorithm: pendingAdjustment.algorithm,
      amount: pendingAdjustment.nextAmount,
    }))
    setPendingAdjustment(null)
    shuffle()
  }, [pendingAdjustment, shuffle, update])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await rootRef.current?.requestFullscreen()
      else await document.exitFullscreen()
    } catch {
      setFullscreen(false)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.sandboxHidden = interfaceHidden ? 'true' : 'false'
    return () => {
      delete document.documentElement.dataset.sandboxHidden
    }
  }, [interfaceHidden])

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => document.removeEventListener('fullscreenchange', onFullscreen)
  }, [])

  useEffect(() => {
    if (!pendingAdjustment) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPendingAdjustment(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [pendingAdjustment])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLButtonElement
      )
        return
      const action = sandboxShortcutAction(event.key, event.code, interfaceHidden)
      if (action === 'toggle-playback') {
        event.preventDefault()
        if (status === 'running') pause()
        else void start()
      } else if (action === 'reset') reset()
      else if (action === 'shuffle') shuffle()
      else if (action === 'mute') updateAudio({ enabled: !preferences.audio.enabled })
      else if (action === 'toggle-interface') setInterfaceHidden((hidden) => !hidden)
      else if (action === 'fullscreen') void toggleFullscreen()
      else if (action === 'restore-interface') setInterfaceHidden(false)
      else if (action === 'faster' || action === 'slower') {
        const order: SandboxSpeedMode[] = ['realtime', 'fast', 'maximum']
        const current = order.indexOf(preferences.speedMode)
        const direction = action === 'faster' ? 1 : -1
        const next = order[Math.min(order.length - 1, Math.max(0, current + direction))]
        update((preferences) => ({ ...preferences, speedMode: next }))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    interfaceHidden,
    pause,
    preferences.audio.enabled,
    preferences.speedMode,
    reset,
    shuffle,
    start,
    status,
    toggleFullscreen,
    update,
    updateAudio,
  ])

  return (
    <main
      className={`sandbox-page ${interfaceHidden ? 'is-interface-hidden' : ''}`}
      id="main-content"
      ref={rootRef}
      data-status={status}
      data-queue-size={stats.queueSize}
      data-audio-voices={stats.audioVoices}
    >
      <canvas
        ref={setCanvas}
        className="sandbox-canvas"
        role="img"
        aria-label={`${algorithmName} Sandbox visualization with ${preferences.amount.toLocaleString()} values`}
      />

      <div className="sandbox-identity" aria-hidden={!interfaceHidden}>
        <strong>SortLab / Sandbox</strong>
        <span>{algorithmName}</span>
      </div>

      {interfaceHidden ? (
        <button
          type="button"
          className="sandbox-restore"
          onClick={() => setInterfaceHidden(false)}
          aria-label="Restore Sandbox controls"
          data-tooltip="Restore controls (H)"
        >
          <AppIcon name="restore" aria-hidden="true" />
          <span>Show controls</span>
        </button>
      ) : null}

      {!interfaceHidden ? (
        <aside className="sandbox-controls" aria-label="Sandbox controls">
          <span className="sandbox-controls__handle" aria-hidden="true" />
          <div className="sandbox-controls__heading">
            <div>
              <h1>Sandbox</h1>
              <small>High-scale sorting playground</small>
            </div>
            <div className="sandbox-heading-actions">
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                data-tooltip="Fullscreen (F)"
              >
                <AppIcon name="fullscreen" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setInterfaceHidden(true)}
                aria-label="Hide interface"
                data-tooltip="Hide interface (H)"
              >
                <AppIcon name="hide" aria-hidden="true" />
              </button>
            </div>
          </div>

          <section className="sandbox-section sandbox-section--setup" aria-labelledby="sort-setup">
            <h2 id="sort-setup">Sort setup</h2>
            <label className="sandbox-field sandbox-field--algorithm">
              <span>Algorithm</span>
              <SandboxAlgorithmPicker
                value={preferences.algorithm}
                disabled={locked}
                onChange={chooseAlgorithm}
              />
            </label>
            <label className="sandbox-field sandbox-field--dataset">
              <span>Dataset</span>
              <SandboxDatasetPicker
                value={preferences.dataset}
                disabled={locked}
                onChange={(dataset) => {
                  update((current) => ({ ...current, dataset }))
                  shuffle()
                }}
              />
            </label>
            <label className="sandbox-amount">
              <span className="sandbox-amount__heading">
                <span>Amount</span>
                <small>
                  Max {amountMaximum.toLocaleString()}
                  {sandboxAlgorithm?.powerOfTwo ? ' · powers of two' : ''}
                </small>
              </span>
              <span className="sandbox-amount__input">
                <input
                  aria-label="Amount"
                  name="sandbox-amount"
                  type="number"
                  inputMode="numeric"
                  min={SANDBOX_MIN_AMOUNT}
                  max={amountMaximum}
                  step="1"
                  defaultValue={preferences.amount}
                  disabled={locked}
                  key={preferences.amount}
                  onBlur={(event) =>
                    changeAmount(Number(event.currentTarget.value || SANDBOX_MIN_AMOUNT))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur()
                  }}
                />
                <span>values</span>
              </span>
              <input
                aria-label="Amount slider"
                name="sandbox-amount"
                type="range"
                min={SANDBOX_MIN_AMOUNT}
                max={amountMaximum}
                step="1"
                value={preferences.amount}
                disabled={locked}
                onChange={(event) => changeAmount(Number(event.target.value))}
              />
              <span className="sandbox-amount__scale" aria-hidden="true">
                <small>{SANDBOX_MIN_AMOUNT}</small>
                <small>{amountMaximum.toLocaleString()}</small>
              </span>
            </label>
          </section>

          {restriction || error ? (
            <p className="sandbox-error" role="alert">
              {restriction ?? error}
            </p>
          ) : null}
          {audioPrompt ? (
            <button className="sandbox-audio-prompt" onClick={() => void start()}>
              Enable audio for this session
            </button>
          ) : null}

          <section className="sandbox-section sandbox-section--playback" aria-labelledby="playback">
            <h2 id="playback">Playback</h2>
            <label className="sandbox-field sandbox-field--speed">
              <span>Speed mode</span>
              <select
                name="sandbox-speed-mode"
                value={preferences.speedMode}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    speedMode: event.target.value as SandboxSpeedMode,
                  }))
                }
              >
                <option value="realtime">Real-time</option>
                <option value="fast">Fast</option>
                <option value="maximum">Maximum</option>
              </select>
            </label>
            <button
              className="sandbox-button sandbox-button--primary"
              onClick={status === 'running' ? pause : () => void start()}
            >
              <AppIcon name={status === 'running' ? 'pause' : 'play'} aria-hidden="true" />
              {status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start'}
            </button>
            <div className="sandbox-playback" aria-label="Sandbox playback controls">
              <button className="sandbox-button sandbox-button--secondary" onClick={reset}>
                <AppIcon name="reset" aria-hidden="true" /> Reset
              </button>
              <button
                className="sandbox-button sandbox-button--danger"
                onClick={stop}
                disabled={status === 'idle'}
              >
                <AppIcon name="stop" aria-hidden="true" /> Stop
              </button>
              <button className="sandbox-button sandbox-button--secondary" onClick={shuffle}>
                <AppIcon name="shuffle" aria-hidden="true" /> Shuffle
              </button>
            </div>
          </section>

          <div className="sandbox-quick-settings">
            <Switch
              checked={preferences.audio.enabled}
              onChange={(enabled) => updateAudio({ enabled })}
              label="Sound"
              description="Synchronized sampled operations"
            />
            <label className="sandbox-range">
              <span>
                Volume <strong>{Math.round(preferences.audio.volume * 100)}%</strong>
              </span>
              <input
                name="sandbox-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={preferences.audio.volume}
                disabled={!preferences.audio.enabled}
                onChange={(event) => updateAudio({ volume: Number(event.target.value) })}
              />
            </label>
            <label className="sandbox-field">
              <span>Visual preset</span>
              <select
                name="sandbox-visual-preset"
                value={preferences.visual.preset}
                onChange={(event) =>
                  updateVisual({ preset: event.target.value as SandboxVisualPresetId })
                }
              >
                {Object.values(sandboxVisualPresets).map((preset) => (
                  <option value={preset.id} key={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <details className="sandbox-disclosure">
            <summary>
              <span>
                <AppIcon name="audio" aria-hidden="true" /> Audio settings
              </span>
              <ChevronRight className="sandbox-disclosure__chevron" aria-hidden="true" />
            </summary>
            <div className="sandbox-settings-grid">
              <label className="sandbox-field">
                <span>Preset</span>
                <select
                  name="sandbox-sound-preset"
                  value={preferences.audio.id}
                  onChange={(event) => {
                    const preset = event.target.value as SoundPresetId
                    update((current) => ({
                      ...current,
                      audio: createAudioSettings(preset, {
                        enabled: current.audio.enabled,
                        volume: current.audio.volume,
                      }),
                    }))
                  }}
                >
                  {soundPresetList.map((preset) => (
                    <option value={preset.id} key={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sandbox-field">
                <span>Waveform</span>
                <select
                  name="sandbox-waveform"
                  value={preferences.audio.waveform}
                  onChange={(event) => updateAudio({ waveform: event.target.value as Waveform })}
                >
                  <option value="triangle">Triangle</option>
                  <option value="sine">Sine</option>
                  <option value="square">Square</option>
                  <option value="sawtooth">Sawtooth</option>
                </select>
              </label>
              <label className="sandbox-field">
                <span>Pitch mode</span>
                <select
                  name="sandbox-pitch-mode"
                  value={preferences.audio.pitchMode}
                  onChange={(event) => updateAudio({ pitchMode: event.target.value as PitchMode })}
                >
                  <option value="continuous">Continuous</option>
                  <option value="chromatic">Chromatic</option>
                  <option value="pentatonic">Pentatonic</option>
                  <option value="major">Major scale</option>
                </select>
              </label>
              <label className="sandbox-field">
                <span>Sound density</span>
                <select
                  name="sandbox-sound-density"
                  value={preferences.audio.density}
                  onChange={(event) => updateAudio({ density: event.target.value as SoundDensity })}
                >
                  <option value="sparse">Sparse</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </select>
              </label>
              <label className="sandbox-number">
                <span>Minimum Hz</span>
                <input
                  name="sandbox-minimum-frequency"
                  autoComplete="off"
                  type="number"
                  min="40"
                  max={preferences.audio.maximumFrequency}
                  value={preferences.audio.minimumFrequency}
                  onChange={(event) =>
                    updateAudio({ minimumFrequency: Number(event.target.value) })
                  }
                />
              </label>
              <label className="sandbox-number">
                <span>Maximum Hz</span>
                <input
                  name="sandbox-maximum-frequency"
                  autoComplete="off"
                  type="number"
                  min={preferences.audio.minimumFrequency}
                  max="4000"
                  value={preferences.audio.maximumFrequency}
                  onChange={(event) =>
                    updateAudio({ maximumFrequency: Number(event.target.value) })
                  }
                />
              </label>
              {(['attack', 'decay', 'noteDuration', 'release'] as const).map((field) => (
                <label className="sandbox-range" key={field}>
                  <span>
                    {field === 'noteDuration' ? 'Sustain' : field[0].toUpperCase() + field.slice(1)}
                    <strong>{preferences.audio.envelope[field].toFixed(3)}s</strong>
                  </span>
                  <input
                    name={`sandbox-envelope-${field}`}
                    type="range"
                    min="0.002"
                    max={field === 'noteDuration' ? '0.4' : '0.2'}
                    step="0.002"
                    value={preferences.audio.envelope[field]}
                    onChange={(event) =>
                      updateAudio({
                        envelope: {
                          ...preferences.audio.envelope,
                          [field]: Number(event.target.value),
                        },
                      })
                    }
                  />
                </label>
              ))}
              <label className="sandbox-range">
                <span>
                  Maximum polyphony <strong>{preferences.audio.maxPolyphony}</strong>
                </span>
                <input
                  name="sandbox-maximum-polyphony"
                  type="range"
                  min="1"
                  max="32"
                  value={preferences.audio.maxPolyphony}
                  onChange={(event) => updateAudio({ maxPolyphony: Number(event.target.value) })}
                />
              </label>
              <div className="sandbox-toggle-grid">
                {(['compare', 'swap', 'write', 'pivot', 'completion'] as const).map((eventType) => (
                  <AudioToggle
                    key={eventType}
                    label={`${eventType[0].toUpperCase()}${eventType.slice(1)} sound`}
                    checked={preferences.audio.events[eventType]}
                    onChange={(checked) =>
                      updateAudio({
                        events: { ...preferences.audio.events, [eventType]: checked },
                      })
                    }
                  />
                ))}
                <AudioToggle
                  label="Automatic gain"
                  checked={preferences.audio.autoGain}
                  onChange={(autoGain) => updateAudio({ autoGain })}
                />
              </div>
            </div>
          </details>

          <details className="sandbox-disclosure">
            <summary>
              <span>
                <AppIcon name="settings" aria-hidden="true" /> Visual settings
              </span>
              <ChevronRight className="sandbox-disclosure__chevron" aria-hidden="true" />
            </summary>
            <div className="sandbox-settings-grid">
              <label className="sandbox-range">
                <span>
                  Bar gap <strong>{preferences.visual.gap}px</strong>
                </span>
                <input
                  name="sandbox-bar-gap"
                  type="range"
                  min="0"
                  max="4"
                  step="0.5"
                  value={preferences.visual.gap}
                  onChange={(event) => updateVisual({ gap: Number(event.target.value) })}
                />
              </label>
              <label className="sandbox-field">
                <span>Bar width</span>
                <select
                  name="sandbox-bar-width"
                  value={preferences.visual.widthMode}
                  onChange={(event) =>
                    updateVisual({ widthMode: event.target.value as SandboxWidthMode })
                  }
                >
                  <option value="fit">Fit</option>
                  <option value="pixel">Pixel aligned</option>
                  <option value="dense">Dense</option>
                </select>
              </label>
              <label className="sandbox-field">
                <span>Background</span>
                <select
                  name="sandbox-background"
                  value={preferences.visual.backgroundStyle}
                  onChange={(event) =>
                    updateVisual({
                      backgroundStyle: event.target.value as SandboxBackgroundStyle,
                    })
                  }
                >
                  <option value="vignette">Vignette</option>
                  <option value="solid">Solid</option>
                </select>
              </label>
              <label className="sandbox-range">
                <span>
                  Active brightness{' '}
                  <strong>{preferences.visual.activeBrightness.toFixed(1)}×</strong>
                </span>
                <input
                  name="sandbox-active-brightness"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={preferences.visual.activeBrightness}
                  onChange={(event) =>
                    updateVisual({ activeBrightness: Number(event.target.value) })
                  }
                />
              </label>
              <label className="sandbox-range">
                <span>
                  Trail persistence <strong>{Math.round(preferences.visual.trail * 100)}%</strong>
                </span>
                <input
                  name="sandbox-trail-persistence"
                  type="range"
                  min="0"
                  max="0.82"
                  step="0.02"
                  value={preferences.visual.trail}
                  onChange={(event) => updateVisual({ trail: Number(event.target.value) })}
                />
              </label>
              <label className="sandbox-field">
                <span>Rendering quality</span>
                <select
                  name="sandbox-rendering-quality"
                  value={preferences.visual.quality}
                  onChange={(event) =>
                    updateVisual({ quality: event.target.value as SandboxQuality })
                  }
                >
                  <option value="performance">Performance</option>
                  <option value="balanced">Balanced</option>
                  <option value="high">High DPI</option>
                </select>
              </label>
              <label className="sandbox-field">
                <span>Frame-rate target</span>
                <select
                  name="sandbox-frame-rate-target"
                  value={preferences.visual.targetFps}
                  onChange={(event) =>
                    updateVisual({ targetFps: Number(event.target.value) as 30 | 60 })
                  }
                >
                  <option value="60">60 fps</option>
                  <option value="30">30 fps</option>
                </select>
              </label>
              <div className="sandbox-toggle-grid">
                <AudioToggle
                  label="Show values"
                  checked={preferences.visual.showValues}
                  onChange={(showValues) => updateVisual({ showValues })}
                />
                <AudioToggle
                  label="Show statistics"
                  checked={preferences.visual.showStatistics}
                  onChange={(showStatistics) => updateVisual({ showStatistics })}
                />
                <AudioToggle
                  label="Show legend"
                  checked={preferences.visual.showLegend}
                  onChange={(showLegend) => updateVisual({ showLegend })}
                />
                <AudioToggle
                  label="Completion sweep"
                  checked={preferences.visual.completionAnimation}
                  onChange={(completionAnimation) => updateVisual({ completionAnimation })}
                />
              </div>
            </div>
          </details>

          <details className="sandbox-disclosure sandbox-shortcuts">
            <summary>
              <span>
                <AppIcon name="keyboard" aria-hidden="true" /> Keyboard shortcuts
              </span>
              <ChevronRight className="sandbox-disclosure__chevron" aria-hidden="true" />
            </summary>
            <p>
              Space play/pause · R reset · S shuffle · M mute · H interface · F fullscreen · ↑/↓
              speed
            </p>
          </details>
        </aside>
      ) : null}

      {pendingAdjustment ? (
        <div className="sandbox-dialog-backdrop" role="presentation">
          <section
            className="sandbox-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sandbox-adjustment-title"
            aria-describedby="sandbox-adjustment-copy"
          >
            <span className="sandbox-dialog__icon" aria-hidden="true">
              <AppIcon name="warning" size={28} />
            </span>
            <div className="sandbox-dialog__copy">
              <h2 id="sandbox-adjustment-title">
                Adjust amount for {pendingAdjustment.algorithmName}?
              </h2>
              <p id="sandbox-adjustment-copy">
                {pendingAdjustment.powerOfTwo
                  ? `${pendingAdjustment.algorithmName} supports power-of-two amounts up to ${pendingAdjustment.maximum.toLocaleString()} values.`
                  : `${pendingAdjustment.algorithmName} supports up to ${pendingAdjustment.maximum.toLocaleString()} values.`}{' '}
                Selecting it will lower Amount from{' '}
                {pendingAdjustment.previousAmount.toLocaleString()} to{' '}
                {pendingAdjustment.nextAmount.toLocaleString()}.
              </p>
            </div>
            <div className="sandbox-dialog__actions">
              <button
                type="button"
                className="sandbox-button sandbox-button--secondary"
                autoFocus
                onClick={() => setPendingAdjustment(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sandbox-button sandbox-button--primary"
                onClick={confirmAlgorithmAdjustment}
              >
                Use {pendingAdjustment.nextAmount.toLocaleString()} values
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {preferences.visual.showStatistics ? (
        <section className="sandbox-stats" aria-label="Sandbox statistics">
          <strong>{algorithmName}</strong>
          <span>{preferences.amount.toLocaleString()} values</span>
          <dl>
            <div>
              <dt>Comparisons</dt>
              <dd>
                <FormatNumber value={stats.comparisons} />
              </dd>
            </div>
            <div>
              <dt>Writes</dt>
              <dd>
                <FormatNumber value={stats.writes} />
              </dd>
            </div>
            <div>
              <dt>Swaps</dt>
              <dd>
                <FormatNumber value={stats.swaps} />
              </dd>
            </div>
            <div>
              <dt>Ops/s</dt>
              <dd>
                <FormatNumber value={stats.operationsPerSecond} />
              </dd>
            </div>
            <div>
              <dt>Animation</dt>
              <dd>{(stats.elapsedMs / 1000).toFixed(1)}s</dd>
            </div>
            <div>
              <dt>Progress</dt>
              <dd>{stats.progress.toFixed(0)}%</dd>
            </div>
            <div>
              <dt>Frame rate</dt>
              <dd>{stats.fps} fps</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {preferences.visual.showLegend ? (
        <div className="sandbox-legend" aria-label="Sandbox color legend">
          <span>
            <i className="is-base" /> Value
          </span>
          <span>
            <i className="is-active" /> Active
          </span>
          <span>
            <i className="is-sorted" /> Sorted
          </span>
        </div>
      ) : null}

      {status === 'complete' ? (
        <div className="sandbox-complete" role="status">
          <AppIcon name="check" aria-hidden="true" />
          <span>
            <strong>Sort complete</strong>
            {stats.operations.toLocaleString()} streamed operations
          </span>
          <button onClick={shuffle}>New array</button>
        </div>
      ) : null}
    </main>
  )
}
