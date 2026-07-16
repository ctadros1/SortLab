import type { Dispatch, SetStateAction } from 'react'
import type { useSortPlayer } from '../hooks/useSortPlayer'
import type { DatasetMode } from '../types'
import { soundPresetList } from '../audio/presets'
import type { SoundPresetId } from '../audio/audioTypes'
import { AlgorithmPicker } from './AlgorithmPicker'
import { DatasetPicker } from './DatasetPicker'
import { AppIcon } from './Icon'
import { Switch } from './Switch'

type Player = ReturnType<typeof useSortPlayer>

function ControlLabel({ children }: { children: string }) {
  return <span className="control-label">{children}</span>
}

function RailHeading({ children }: { children: string }) {
  return <h2 className="rail-section__heading">{children}</h2>
}

interface Props {
  player: Player
  mode: DatasetMode
  setMode: Dispatch<SetStateAction<DatasetMode>>
  seed: number
  setSeed: Dispatch<SetStateAction<number>>
  size: number
  setSize: Dispatch<SetStateAction<number>>
  custom: string
  setCustom: Dispatch<SetStateAction<string>>
  sameArray: boolean
  setSameArray: Dispatch<SetStateAction<boolean>>
  chooseAlgorithm: (id: string) => void
  regenerate: (mode?: DatasetMode, size?: number, seed?: number) => void
}

export function ControlSidebar({
  player,
  mode,
  setMode,
  seed,
  setSeed,
  size,
  setSize,
  custom,
  setCustom,
  sameArray,
  setSameArray,
  chooseAlgorithm,
  regenerate,
}: Props) {
  const primaryLabel =
    player.status === 'running' ? 'Pause' : player.status === 'paused' ? 'Resume' : 'Start'
  const primaryIcon = player.status === 'running' ? 'pause' : 'play'
  const primaryAction = player.status === 'running' ? player.pause : player.play

  return (
    <aside className="control-rail" aria-label="Sorting controls">
      <div className="rail-section rail-section--selection">
        <RailHeading>Selection</RailHeading>
        <div className="control-field control-field--algorithm">
          <ControlLabel>Algorithm</ControlLabel>
          <AlgorithmPicker
            value={player.algorithmId}
            values={player.source}
            onChange={chooseAlgorithm}
            disabled={player.controlsLocked}
            portal
          />
        </div>
        <div className="control-field">
          <ControlLabel>Dataset</ControlLabel>
          <DatasetPicker value={mode} onChange={setMode} disabled={player.controlsLocked} portal />
        </div>
        {mode === 'custom' ? (
          <label className="control-field custom-input-field">
            <ControlLabel>Comma-separated integers</ControlLabel>
            <textarea
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              disabled={player.controlsLocked}
              rows={3}
            />
          </label>
        ) : null}
        <div className="field-row">
          <label className="control-field">
            <ControlLabel>Seed</ControlLabel>
            <input
              type="number"
              value={seed}
              onChange={(event) => setSeed(Number(event.target.value))}
              disabled={player.controlsLocked}
            />
          </label>
          <label className="control-field">
            <ControlLabel>Size</ControlLabel>
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
          className="button button--secondary generate-button"
          onClick={() => regenerate()}
          disabled={player.controlsLocked}
        >
          Generate array
        </button>
      </div>

      <div className="rail-section">
        <RailHeading>Playback</RailHeading>
        <label className="range-label">
          <span>
            <ControlLabel>Speed</ControlLabel>
            <strong>{player.speed} steps/s</strong>
          </span>
          <input
            type="range"
            min="1"
            max="120"
            value={player.speed}
            onChange={(event) => player.setSpeed(Number(event.target.value))}
          />
        </label>
        <Switch
          checked={sameArray}
          onChange={setSameArray}
          label="Use same array"
          description="Keep the seed fixed when shuffling"
        />
        <div className="playback-grid" aria-label="Playback controls">
          <button
            className="button button--secondary button--with-icon"
            onClick={player.reset}
            data-tooltip="Shortcut: R"
            aria-label="Reset"
          >
            <AppIcon name="reset" aria-hidden="true" /> Reset
          </button>
          <button
            className="button button--secondary button--with-icon"
            onClick={() => player.jump('start')}
            data-tooltip="Return before the first step"
            aria-label="Beginning"
          >
            <AppIcon name="beginning" aria-hidden="true" /> Beginning
          </button>
          <button
            className="button button--secondary button--with-icon"
            onClick={() => player.step(-1)}
            data-tooltip="Shortcut: Left Arrow"
            aria-label="Previous"
          >
            <AppIcon name="previous" aria-hidden="true" /> Previous
          </button>
          <button
            className="button button--primary button--with-icon playback-primary"
            onClick={primaryAction}
            data-tooltip="Shortcut: Space"
            aria-label={primaryLabel}
          >
            <AppIcon name={primaryIcon} aria-hidden="true" /> {primaryLabel}
          </button>
          <button
            className="button button--secondary button--with-icon"
            onClick={() => player.step(1)}
            data-tooltip="Shortcut: Right Arrow"
            aria-label="Next"
          >
            <AppIcon name="next" aria-hidden="true" /> Next
          </button>
          <button
            className="button button--secondary button--with-icon"
            onClick={() => player.jump('end')}
            data-tooltip="Jump to the completed state"
            aria-label="End"
          >
            <AppIcon name="end" aria-hidden="true" /> End
          </button>
          <button
            className="button button--danger button--with-icon"
            onClick={player.stop}
            disabled={player.status === 'idle'}
            data-tooltip="Shortcut: Escape"
            aria-label="Stop"
          >
            <AppIcon name="stop" aria-hidden="true" /> Stop
          </button>
          <button
            className="button button--secondary button--with-icon"
            onClick={() => regenerate(mode, size, sameArray ? seed : seed + 1)}
            data-tooltip="Shortcut: S"
            aria-label="Shuffle"
          >
            <AppIcon name="shuffle" aria-hidden="true" /> Shuffle
          </button>
        </div>
      </div>

      <div className="rail-section">
        <RailHeading>Audio</RailHeading>
        <Switch
          checked={player.sound}
          onChange={player.setSound}
          label="Sound"
          description="Value-mapped Web Audio tones"
        />
        <label className="range-label">
          <span>
            <ControlLabel>Volume</ControlLabel>
            <strong>{Math.round(player.volume * 100)}%</strong>
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
        <label className="control-field audio-preset-field">
          <ControlLabel>Preset</ControlLabel>
          <select
            value={player.soundPreset}
            onChange={(event) => player.setSoundPreset(event.target.value as SoundPresetId)}
            disabled={!player.sound}
            aria-label="Sound preset"
          >
            {soundPresetList.map((preset) => (
              <option value={preset.id} key={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rail-section rail-section--help">
        <RailHeading>Help</RailHeading>
        <details className="shortcut-help">
          <summary>Keyboard shortcuts</summary>
          <dl>
            <div>
              <dt>Space</dt>
              <dd>Play or pause</dd>
            </div>
            <div>
              <dt>← / →</dt>
              <dd>Step backward or forward</dd>
            </div>
            <div>
              <dt>R / S</dt>
              <dd>Reset or shuffle</dd>
            </div>
            <div>
              <dt>M / Esc</dt>
              <dd>Mute or stop</dd>
            </div>
          </dl>
        </details>
        <p className="rail-hint">
          Select an algorithm and dataset, generate once, then step slowly.
        </p>
      </div>
    </aside>
  )
}
