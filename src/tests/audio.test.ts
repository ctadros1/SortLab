import { describe, expect, it } from 'vitest'
import { AudioEngine } from '../audio/AudioEngine'
import { densityStride, normalizedVoiceGain, shouldSampleSound } from '../audio/AudioScheduler'
import { scheduleAdsr, type SchedulableAudioParam } from '../audio/envelopes'
import { quantizeFrequency, valueToFrequency } from '../audio/frequencyMapping'
import {
  loadVisualizeAudioPreferences,
  saveVisualizeAudioPreferences,
  VISUALIZE_AUDIO_KEY,
} from '../audio/preferences'
import { createAudioSettings, soundPresets } from '../audio/presets'

class FakeAudioParam implements SchedulableAudioParam {
  value = 0
  events: Array<[string, number, number]> = []
  cancelScheduledValues(time: number) {
    this.events.push(['cancel', 0, time])
    return this as unknown as AudioParam
  }
  setValueAtTime(value: number, time: number) {
    this.value = value
    this.events.push(['set', value, time])
    return this as unknown as AudioParam
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.value = value
    this.events.push(['linear', value, time])
    return this as unknown as AudioParam
  }
  setTargetAtTime(value: number, time: number) {
    this.value = value
    this.events.push(['target', value, time])
    return this as unknown as AudioParam
  }
}

class FakeNode {
  connect() {
    return this
  }
  disconnect() {}
}

class FakeGain extends FakeNode {
  gain = new FakeAudioParam()
}

class FakeCompressor extends FakeNode {
  threshold = new FakeAudioParam()
  knee = new FakeAudioParam()
  ratio = new FakeAudioParam()
  attack = new FakeAudioParam()
  release = new FakeAudioParam()
}

class FakeOscillator extends FakeNode {
  type: OscillatorType = 'sine'
  frequency = new FakeAudioParam()
  onended: (() => void) | null = null
  start() {}
  stop() {}
}

class FakeAudioContext {
  state: AudioContextState = 'running'
  currentTime = 1
  destination = new FakeNode()
  oscillators: FakeOscillator[] = []
  createGain() {
    return new FakeGain()
  }
  createDynamicsCompressor() {
    return new FakeCompressor()
  }
  createOscillator() {
    const oscillator = new FakeOscillator()
    this.oscillators.push(oscillator)
    return oscillator
  }
  async resume() {
    this.state = 'running'
  }
  async suspend() {
    this.state = 'suspended'
  }
}

const compareEvent = {
  type: 'compare' as const,
  values: [-5, 10],
  dataset: [-5, 0, 10],
  speed: 24,
  sequence: 0,
}

describe('frequency mapping and envelopes', () => {
  it('maps minimum and maximum dataset values to the configured audible range', () => {
    expect(valueToFrequency(0, 0, 100, 120, 1212)).toBeCloseTo(120)
    expect(valueToFrequency(100, 0, 100, 120, 1212)).toBeCloseTo(1212)
  })

  it('handles equal, negative, clamped, and non-finite values safely', () => {
    expect(valueToFrequency(5, 5, 5, 120, 1212)).toBeCloseTo(666)
    expect(valueToFrequency(-10, -10, 10, 120, 1212)).toBeCloseTo(120)
    expect(valueToFrequency(999, -10, 10, 120, 1212)).toBeCloseTo(1212)
    expect(Number.isFinite(valueToFrequency(Number.NaN, 0, 10))).toBe(true)
  })

  it('quantizes continuous frequencies to supported musical pitch modes', () => {
    expect(quantizeFrequency(445, 'chromatic')).toBeCloseTo(440)
    expect(quantizeFrequency(445, 'pentatonic')).toBeCloseTo(440)
    expect(quantizeFrequency(445, 'major')).toBeCloseTo(440)
  })

  it('schedules click-free ADSR ramps in time order', () => {
    const parameter = new FakeAudioParam()
    const timing = scheduleAdsr(parameter, 2, 0.2, {
      attack: 0.01,
      decay: 0.02,
      sustain: 0.4,
      release: 0.05,
      noteDuration: 0.08,
    })
    expect(timing.attackEnd).toBeLessThan(timing.decayEnd)
    expect(timing.decayEnd).toBeLessThanOrEqual(timing.releaseStart)
    expect(timing.releaseStart).toBeLessThan(timing.stopTime)
    expect(parameter.events.map(([kind]) => kind)).toEqual([
      'cancel',
      'set',
      'linear',
      'linear',
      'set',
      'linear',
    ])
  })
})

describe('sound density, presets, and persistence', () => {
  it('reduces detail as playback speed rises while preserving accents', () => {
    expect(densityStride(12, 'balanced')).toBe(1)
    expect(densityStride(120, 'sparse')).toBe(10)
    expect(shouldSampleSound({ ...compareEvent, type: 'pivot', sequence: 7 }, 'sparse')).toBe(true)
    expect(shouldSampleSound({ ...compareEvent, speed: 120, sequence: 1 }, 'sparse')).toBe(false)
  })

  it('normalizes gain using inverse square root scaling', () => {
    expect(normalizedVoiceGain(1)).toBe(1)
    expect(normalizedVoiceGain(4)).toBe(0.5)
    expect(normalizedVoiceGain(16)).toBe(0.25)
    expect(normalizedVoiceGain(16, false)).toBe(1)
  })

  it('defines complete Classic, Soft, and Minimal presets', () => {
    expect(Object.keys(soundPresets)).toEqual(['classic', 'soft', 'minimal'])
    expect(soundPresets.classic.waveform).toBe('triangle')
    expect(soundPresets.classic.minimumFrequency).toBe(120)
    expect(soundPresets.classic.maximumFrequency).toBe(1212)
    expect(soundPresets.minimal.maxPolyphony).toBeLessThan(soundPresets.classic.maxPolyphony)
  })

  it('persists and validates Visualize sound preferences', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }
    saveVisualizeAudioPreferences({ enabled: false, volume: 0.42, preset: 'soft' }, storage)
    expect(values.has(VISUALIZE_AUDIO_KEY)).toBe(true)
    expect(loadVisualizeAudioPreferences(storage)).toEqual({
      enabled: false,
      volume: 0.42,
      preset: 'soft',
    })
  })
})

describe('AudioEngine lifecycle', () => {
  it('creates one context, enforces voice limits, and cancels every voice', async () => {
    let contextsCreated = 0
    const fake = new FakeAudioContext()
    const engine = new AudioEngine(() => {
      contextsCreated += 1
      return fake as unknown as AudioContext
    })
    engine.configure(createAudioSettings('classic', { maxPolyphony: 2, enabled: true }))
    await engine.play(compareEvent)
    await engine.play({ ...compareEvent, sequence: 1, type: 'swap' })
    expect(contextsCreated).toBe(1)
    expect(engine.getDebugState().activeVoices).toBeLessThanOrEqual(2)
    expect(engine.getDebugState().droppedEvents).toBeGreaterThan(0)
    engine.stopAll()
    expect(engine.getDebugState().activeVoices).toBe(0)
    await engine.resume()
    expect(contextsCreated).toBe(1)
  })
})
