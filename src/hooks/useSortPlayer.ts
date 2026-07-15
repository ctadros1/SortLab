import { useCallback, useEffect, useRef, useState } from 'react'
import { materializeEvents } from '../algorithms/engine'
import { playCompletion, playTone } from '../audio/audio'
import { clampStep } from '../playback/state'
import type { PlaybackStatus, SortEvent } from '../types'

export function useSortPlayer(initialArray: number[], initialAlgorithm: string) {
  const [source, setSource] = useState(initialArray)
  const [algorithmId, setAlgorithmId] = useState(initialAlgorithm)
  const [events, setEvents] = useState<SortEvent[]>([])
  const [eventIndex, setEventIndex] = useState(-1)
  const [status, setStatus] = useState<PlaybackStatus>('idle')
  const [speed, setSpeed] = useState(12)
  const [sound, setSound] = useState(true)
  const [volume, setVolume] = useState(0.35)
  const [executionMs, setExecutionMs] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const speedRef = useRef(speed)
  const lastToneRef = useRef(0)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

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
    let available = events
    if (available.length === 0 || status === 'idle') {
      available = prepare() ?? []
      setEventIndex(-1)
    }
    if (available.length > 0) setStatus('running')
  }, [events, prepare, status])

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
    if (sound && ['compare', 'swap', 'write'].includes(event.type)) {
      const now = performance.now()
      const minimumGap = speed > 30 ? 90 : 25
      if (now - lastToneRef.current >= minimumGap) {
        const value = event.array[event.indices[0] ?? 0] ?? 0
        void playTone(value, event.array, volume, event.type)
        lastToneRef.current = now
      }
    }
    if (eventIndex === events.length - 1 && status === 'running') {
      const timer = window.setTimeout(() => {
        setStatus('complete')
        if (sound) void playCompletion(volume)
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [eventIndex, events, sound, speed, status, volume])

  const pause = () => setStatus('paused')
  const stop = () => {
    setStatus('idle')
    setEvents([])
    setEventIndex(-1)
  }
  const reset = () => {
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
    setSource(next)
    setEvents([])
    setEventIndex(-1)
    setStatus('idle')
    setError(null)
  }

  const selectAlgorithm = (id: string) => {
    setAlgorithmId(id)
    setEvents([])
    setEventIndex(-1)
    setStatus('idle')
    setError(null)
  }

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
    executionMs,
    error,
    progress,
    hasRun,
    controlsLocked,
    setSpeed,
    setSound,
    setVolume,
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
