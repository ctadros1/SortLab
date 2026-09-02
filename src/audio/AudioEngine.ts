import { AudioVoice } from './AudioVoice'
import { eventAccent, normalizedVoiceGain, shouldSampleSound } from './AudioScheduler'
import { datasetRange, valueToFrequency } from './frequencyMapping'
import { createAudioSettings } from './presets'
import type {
  AudioDebugState,
  AudioOutputChannel,
  AudioSettings,
  SortSoundEvent,
} from './audioTypes'

type ContextFactory = () => AudioContext

interface OutputSettings {
  gain: number
  pan: number
}

interface OutputBus {
  gain: GainNode
  panner: StereoPannerNode | null
}

const defaultOutputSettings: Record<AudioOutputChannel, OutputSettings> = {
  center: { gain: 1, pan: 0 },
  first: { gain: Math.SQRT1_2, pan: -0.72 },
  second: { gain: Math.SQRT1_2, pan: 0.72 },
}

export class AudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private voices = new Set<AudioVoice>()
  private settings: AudioSettings = createAudioSettings()
  private outputSettings = structuredClone(defaultOutputSettings)
  private outputBuses = new Map<Exclude<AudioOutputChannel, 'center'>, OutputBus>()
  private scheduledEvents = 0
  private droppedEvents = 0
  private lifecycleBound = false

  constructor(private readonly createContext: ContextFactory = () => new AudioContext()) {}

  configure(settings: AudioSettings) {
    this.settings = { ...settings, volume: Math.min(1, Math.max(0, settings.volume)) }
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.settings.volume, this.context.currentTime, 0.012)
    }
    if (!this.settings.enabled) this.stopAll()
  }

  private ensureContext() {
    if (this.context) return this.context
    this.context = this.createContext()
    this.master = this.context.createGain()
    this.compressor = this.context.createDynamicsCompressor()
    this.master.gain.value = this.settings.volume
    this.compressor.threshold.value = -18
    this.compressor.knee.value = 18
    this.compressor.ratio.value = 8
    this.compressor.attack.value = 0.003
    this.compressor.release.value = 0.12
    this.master.connect(this.compressor)
    this.compressor.connect(this.context.destination)
    this.bindLifecycle()
    return this.context
  }

  private outputFor(channel: AudioOutputChannel) {
    const context = this.ensureContext()
    if (!this.master || channel === 'center') return this.master
    const existing = this.outputBuses.get(channel)
    if (existing) return existing.gain

    const settings = this.outputSettings[channel]
    const gain = context.createGain()
    gain.gain.value = settings.gain
    const panner =
      typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null
    if (panner) {
      panner.pan.value = settings.pan
      gain.connect(panner)
      panner.connect(this.master)
    } else gain.connect(this.master)
    this.outputBuses.set(channel, { gain, panner })
    return gain
  }

  setOutputMix(channel: Exclude<AudioOutputChannel, 'center'>, gain: number, pan: number) {
    const settings = {
      gain: Math.min(1, Math.max(0, gain)),
      pan: Math.min(1, Math.max(-1, pan)),
    }
    this.outputSettings[channel] = settings
    const bus = this.outputBuses.get(channel)
    if (!bus || !this.context) return
    bus.gain.gain.setTargetAtTime(settings.gain, this.context.currentTime, 0.012)
    bus.panner?.pan.setTargetAtTime(settings.pan, this.context.currentTime, 0.012)
  }

  private bindLifecycle() {
    if (this.lifecycleBound || typeof document === 'undefined') return
    this.lifecycleBound = true
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stopAll()
    })
  }

  async resume() {
    if (!this.settings.enabled) return false
    const context = this.ensureContext()
    if (context.state === 'suspended') {
      try {
        await context.resume()
      } catch {
        return false
      }
    }
    return context.state === 'running'
  }

  private startVoice(
    frequency: number,
    gain: number,
    startTime: number,
    channel: AudioOutputChannel,
  ) {
    const context = this.ensureContext()
    const destination = this.outputFor(channel)
    if (!destination) return
    while (this.voices.size >= this.settings.maxPolyphony) {
      const oldest = [...this.voices].sort((left, right) => left.startedAt - right.startedAt)[0]
      if (!oldest) break
      oldest.cancel(context.currentTime)
      this.voices.delete(oldest)
      this.droppedEvents += 1
    }
    const voice = new AudioVoice({
      context,
      destination,
      frequency,
      waveform: this.settings.waveform,
      gain,
      envelope: this.settings.envelope,
      startTime,
      onEnded: (ended) => this.voices.delete(ended),
    })
    this.voices.add(voice)
  }

  play(event: SortSoundEvent, channel: AudioOutputChannel = 'center') {
    if (
      !this.settings.enabled ||
      !this.settings.events[event.type as keyof typeof this.settings.events]
    )
      return false
    if (!shouldSampleSound(event, this.settings.density)) {
      this.droppedEvents += 1
      return false
    }
    return this.resume().then((ready) => {
      if (!ready || !this.context) return false
      const { minimum, maximum } = datasetRange(event.dataset)
      const countAfterStart = Math.min(
        this.settings.maxPolyphony,
        this.voices.size + Math.max(1, event.values.length),
      )
      const gain =
        0.16 *
        this.settings.gainScale *
        eventAccent(event.type) *
        normalizedVoiceGain(countAfterStart, this.settings.autoGain)
      const startTime = this.context.currentTime + 0.006
      for (const value of event.values.slice(0, 2)) {
        const frequency = valueToFrequency(
          value,
          minimum,
          maximum,
          this.settings.minimumFrequency,
          this.settings.maximumFrequency,
          this.settings.pitchMode,
        )
        this.startVoice(frequency, gain, startTime, channel)
      }
      this.scheduledEvents += 1
      return true
    })
  }

  async playCompletion(dataset: number[], speed = 30, channel: AudioOutputChannel = 'center') {
    if (!this.settings.enabled || !this.settings.events.completion) return
    const ready = await this.resume()
    if (!ready || !this.context || dataset.length === 0) return
    const { minimum, maximum } = datasetRange(dataset)
    const noteCount = 6
    for (let index = 0; index < noteCount; index += 1) {
      const ratio = index / (noteCount - 1)
      const value = minimum + (maximum - minimum) * ratio
      const frequency = valueToFrequency(
        value,
        minimum,
        maximum,
        this.settings.minimumFrequency,
        this.settings.maximumFrequency,
        this.settings.pitchMode,
      )
      const gain =
        0.08 * this.settings.gainScale * normalizedVoiceGain(index + 1, this.settings.autoGain)
      this.startVoice(frequency, gain, this.context.currentTime + 0.015 + index * 0.045, channel)
    }
    this.scheduledEvents += noteCount
    void speed
  }

  stopAll() {
    if (!this.context) return
    const now = this.context.currentTime
    for (const voice of this.voices) voice.cancel(now)
    this.voices.clear()
  }

  async suspend() {
    this.stopAll()
    if (this.context?.state === 'running') await this.context.suspend()
  }

  getDebugState(): AudioDebugState {
    return {
      contextCreated: Boolean(this.context),
      contextState: this.context?.state ?? 'unavailable',
      activeVoices: this.voices.size,
      scheduledEvents: this.scheduledEvents,
      droppedEvents: this.droppedEvents,
      outputGains: {
        center: this.outputSettings.center.gain,
        first: this.outputSettings.first.gain,
        second: this.outputSettings.second.gain,
      },
      outputPans: {
        center: this.outputSettings.center.pan,
        first: this.outputSettings.first.pan,
        second: this.outputSettings.second.pan,
      },
    }
  }
}

export const sortingAudioEngine = new AudioEngine()
