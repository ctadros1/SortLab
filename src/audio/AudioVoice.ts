import { scheduleAdsr } from './envelopes'
import type { AdsrEnvelope, Waveform } from './audioTypes'

interface VoiceOptions {
  context: AudioContext
  destination: AudioNode
  frequency: number
  waveform: Waveform
  gain: number
  envelope: AdsrEnvelope
  startTime: number
  onEnded: (voice: AudioVoice) => void
}

export class AudioVoice {
  readonly startedAt: number
  private readonly oscillator: OscillatorNode
  private readonly envelope: GainNode
  private ended = false

  constructor(options: VoiceOptions) {
    this.startedAt = options.startTime
    this.oscillator = options.context.createOscillator()
    this.envelope = options.context.createGain()
    this.oscillator.type = options.waveform
    this.oscillator.frequency.setValueAtTime(options.frequency, options.startTime)
    const timing = scheduleAdsr(
      this.envelope.gain,
      options.startTime,
      options.gain,
      options.envelope,
    )
    this.oscillator.connect(this.envelope)
    this.envelope.connect(options.destination)
    this.oscillator.onended = () => {
      if (this.ended) return
      this.ended = true
      this.oscillator.disconnect()
      this.envelope.disconnect()
      options.onEnded(this)
    }
    this.oscillator.start(options.startTime)
    this.oscillator.stop(timing.stopTime + 0.01)
  }

  cancel(atTime: number) {
    if (this.ended) return
    this.envelope.gain.cancelScheduledValues(atTime)
    this.envelope.gain.setValueAtTime(Math.max(0.0001, this.envelope.gain.value), atTime)
    this.envelope.gain.linearRampToValueAtTime(0.0001, atTime + 0.012)
    this.oscillator.stop(atTime + 0.014)
  }
}
