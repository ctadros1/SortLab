import { useCallback, useEffect, useRef, useState } from 'react'
import { materializeEvents } from '../algorithms/engine'
import { sortingAudioEngine } from '../audio/AudioEngine'
import { loadVisualizeAudioPreferences, saveVisualizeAudioPreferences } from '../audio/preferences'
import { createAudioSettings } from '../audio/presets'
import { clampStep } from '../playback/state'
import type { SoundPresetId } from '../audio/audioTypes'
import type { PlaybackStatus, SortEvent } from '../types'

export function useSortPlayer(initialArray: number[], initialAlgorithm: string) {
  const [source, setSource] = useState(initialArray)
  const [algorithmId, setAlgorithmId] = useState(initialAlgorithm)
  const [events, setEvents] = useState<SortEvent[]>([])
  const [eventIndex, setEventIndex] = useState(-1)
  const [status, setStatus] = useState<PlaybackStatus>('idle')
  const [speed, setSpeed] = useState(12)
  const [audioPreferences, setAudioPreferences] = useState(() =>
    loadVisualizeAudioPreferences(typeof localStorage === 'undefined' ? undefined : localStorage),
  )
  const [executionMs, setExecutionMs] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const speedRef = useRef(speed)
  const sound = audioPreferences.enabled
  const volume = audioPreferences.volume
  const soundPreset = audioPreferences.preset

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    sortingAudioEngine.configure(createAudioSettings(soundPreset, { enabled: sound, volume }))
    saveVisualizeAudioPreferences(
      audioPreferences,
      typeof localStorage === 'undefined' ? undefined : localStorage,
    )
    if (!sound) sortingAudioEngine.stopAll()
  }, [audioPreferences, sound, soundPreset, volume])

  useEffect(() => () => sortingAudioEngine.stopAll(), [])

  const prepare = useCallback(() => {
    try {
      const start = performance.now()
      const next = materializeEvents(algorithmId, source)
      setExecutionMs(performance.now() - start)
      setEvents(next.events)
      setError(null)
      return next.events
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The algorithm could not be prepared.')
      setStatus('idle')
      return null
    }
  }, [algorithmId, source])

  const play = useCallback(() => {
    if (sound) void sortingAudioEngine.resume()
    let available = events
    if (available.length === 0 || status === 'idle') {
      available = prepare() ?? []
      setEventIndex(-1)
    }
    if (available.length > 0) setStatus('running')
  }, [events, prepare, sound, status])

  useEffect(() => {
    if (status !== 'running') return
    let frame = 0
    let last = performance.now()
    let accumulator = 0
    const tick = (now: number) => {
      const interval = 1000 / speedRef.current
      accumulator += now - last
      last = now
      const advance = Math.max(0, Math.min(16, Math.floor(accumulator / interval)))
      if (advance > 0) {
        accumulator -= advance * interval
        setEventIndex((current) => Math.min(events.length - 1, current + advance))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [events.length, status])

  useEffect(() => {
    if (eventIndex < 0 || !events[eventIndex]) return
    const event = events[eventIndex]
    if (sound && ['compare', 'swap', 'write', 'pivot'].includes(event.type)) {
      const values = event.indices
        .slice(0, 2)
        .map((index) => event.array[index])
        .filter((value): value is number => Number.isFinite(value))
      void sortingAudioEngine.play({
        type: event.type,
        values,
        dataset: event.array,
        speed,
        sequence: eventIndex,
      })
    }
    if (eventIndex === events.length - 1 && status === 'running') {
      const timer = window.setTimeout(() => {
        setStatus('complete')
        if (sound) void sortingAudioEngine.playCompletion(event.array, speed)
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [eventIndex, events, sound, speed, status])

  const pause = () => {
    sortingAudioEngine.stopAll()
    setStatus('paused')
  }
  const stop = () => {
    sortingAudioEngine.stopAll()
    setStatus('idle')
    setEvents([])
    setEventIndex(-1)
  }
  const reset = () => {
    sortingAudioEngine.stopAll()
    setStatus('idle')
    setEvents([])
    setEventIndex(-1)
    setError(null)
  }
  const step = (amount: number) => {
    let available = events
    if (available.length === 0) available = prepare() ?? []
    if (available.length === 0) return
    setStatus('paused')
    setEventIndex((current) => clampStep(current, amount, available.length))
  }
  const jump = (target: 'start' | 'end') => {
    let available = events
    if (available.length === 0) available = prepare() ?? []
    if (available.length === 0) return
    setStatus(target === 'end' ? 'complete' : 'paused')
    setEventIndex(target === 'end' ? available.length - 1 : -1)
  }

  const replaceSource = (next: number[]) => {
    sortingAudioEngine.stopAll()
    setSource(next)
    setEvents([])
    setEventIndex(-1)
    setStatus('idle')
    setError(null)
  }

  const selectAlgorithm = (id: string) => {
    sortingAudioEngine.stopAll()
    setAlgorithmId(id)
    setEvents([])
    setEventIndex(-1)
    setStatus('idle')
    setError(null)
  }

  const setSound = (enabled: boolean) => {
    setAudioPreferences((current) => ({ ...current, enabled }))
    if (enabled) void sortingAudioEngine.resume()
  }

  const setVolume = (nextVolume: number) =>
    setAudioPreferences((current) => ({ ...current, volume: nextVolume }))

  const setSoundPreset = (preset: SoundPresetId) =>
    setAudioPreferences((current) => ({ ...current, preset }))

  const currentEvent = eventIndex >= 0 ? events[eventIndex] : undefined
  const array = currentEvent?.array ?? source
  const progress = events.length > 0 ? ((eventIndex + 1) / events.length) * 100 : 0
  const hasRun = events.length > 0
  const controlsLocked = status === 'running' || status === 'paused'

  return {
    source,
    array,
    algorithmId,
    events,
    eventIndex,
    currentEvent,
    status,
    speed,
    sound,
    volume,
    soundPreset,
    executionMs,
    error,
    progress,
    hasRun,
    controlsLocked,
    setSpeed,
    setSound,
    setVolume,
    setSoundPreset,
    play,
    pause,
    stop,
    reset,
    step,
    jump,
    replaceSource,
    selectAlgorithm,
  }
}
