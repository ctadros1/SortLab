import type { AdsrEnvelope } from './audioTypes'

export interface SchedulableAudioParam {
  cancelScheduledValues(time: number): AudioParam
  setValueAtTime(value: number, time: number): AudioParam
  linearRampToValueAtTime(value: number, time: number): AudioParam
}

export function normalizeEnvelope(envelope: AdsrEnvelope): AdsrEnvelope {
  return {
    attack: Math.max(0.001, envelope.attack),
    decay: Math.max(0.001, envelope.decay),
    sustain: Math.min(1, Math.max(0.001, envelope.sustain)),
    release: Math.max(0.005, envelope.release),
    noteDuration: Math.max(0.01, envelope.noteDuration),
  }
}

export function scheduleAdsr(
  parameter: SchedulableAudioParam,
  startTime: number,
  peakGain: number,
  envelope: AdsrEnvelope,
) {
  const normalized = normalizeEnvelope(envelope)
  const attackEnd = startTime + normalized.attack
  const decayEnd = attackEnd + normalized.decay
  const releaseStart = Math.max(decayEnd, startTime + normalized.noteDuration)
  const stopTime = releaseStart + normalized.release
  const floor = 0.0001

  parameter.cancelScheduledValues(startTime)
  parameter.setValueAtTime(floor, startTime)
  parameter.linearRampToValueAtTime(Math.max(floor, peakGain), attackEnd)
  parameter.linearRampToValueAtTime(Math.max(floor, peakGain * normalized.sustain), decayEnd)
  parameter.setValueAtTime(Math.max(floor, peakGain * normalized.sustain), releaseStart)
  parameter.linearRampToValueAtTime(floor, stopTime)

  return { attackEnd, decayEnd, releaseStart, stopTime }
}
