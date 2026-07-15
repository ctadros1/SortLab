import { useCallback, useEffect, useRef, useState } from 'react'
import { sortingAudioEngine } from '../audio/AudioEngine'
import { generateArray } from '../utils/array'
import {
  completionSweepDuration,
  estimateSandboxOperations,
  operationsPerFrame,
  sandboxAlgorithms,
  sandboxAmountRestriction,
} from '../sandbox/config'
import { OperationQueue } from '../sandbox/operationQueue'
import { loadSandboxPreferences, saveSandboxPreferences } from '../sandbox/preferences'
import { SandboxRenderer } from '../sandbox/SandboxRenderer'
import type {
  SandboxOperation,
  SandboxPreferences,
  SandboxStats,
  SandboxStatus,
} from '../sandbox/types'
import {
  isSandboxWorkerResponse,
  type SandboxWorkerRequest,
  type SandboxWorkerStats,
} from '../sandbox/workerProtocol'

const emptyStats: SandboxStats = {
  comparisons: 0,
  swaps: 0,
  writes: 0,
  operations: 0,
  operationsPerSecond: 0,
  elapsedMs: 0,
  progress: 0,
  fps: 0,
  queueSize: 0,
  audioVoices: 0,
}

function operationValues(operation: SandboxOperation, values: number[]) {
  if (operation[0] === 0 || operation[0] === 1)
    return [values[operation[1]], values[operation[2]]].filter(Number.isFinite)
  if (operation[0] === 2 || operation[0] === 3) return [operation[2]]
  return []
}

function applyOperation(operation: SandboxOperation, values: number[]) {
  if (operation[0] === 1) {
    ;[values[operation[1]], values[operation[2]]] = [values[operation[2]], values[operation[1]]]
  } else if (operation[0] === 2) values[operation[1]] = operation[2]
}

function soundType(operation: SandboxOperation) {
  if (operation[0] === 0) return 'compare' as const
  if (operation[0] === 1) return 'swap' as const
  if (operation[0] === 2) return 'write' as const
  if (operation[0] === 3) return 'pivot' as const
  return null
}

export function useSandboxPlayer() {
  const [preferences, setPreferences] = useState(() =>
    loadSandboxPreferences(typeof localStorage === 'undefined' ? undefined : localStorage),
  )
  const [status, setStatus] = useState<SandboxStatus>('idle')
  const [stats, setStats] = useState<SandboxStats>(emptyStats)
  const [error, setError] = useState<string | null>(null)
  const [audioPrompt, setAudioPrompt] = useState(false)
  const rendererRef = useRef<SandboxRenderer | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const queueRef = useRef(new OperationQueue())
  const runIdRef = useRef(0)
  const workerCompleteRef = useRef(false)
  const pendingAckRef = useRef(false)
  const [initialSource] = useState(() => generateArray(preferences.dataset, preferences.amount, 42))
  const sourceRef = useRef(initialSource)
  const valuesRef = useRef([...initialSource])
  const activeRef = useRef(new Set<number>())
  const workerStatsRef = useRef<SandboxWorkerStats>({
    comparisons: 0,
    swaps: 0,
    writes: 0,
    operations: 0,
  })
  const statusRef = useRef(status)
  const preferencesRef = useRef(preferences)
  const startedAtRef = useRef(0)
  const processedRef = useRef(0)
  const lastStatsUpdateRef = useRef(0)
  const lastRenderRef = useRef(0)
  const completionStartedRef = useRef(0)
  const frameCounterRef = useRef({ frames: 0, started: 0, fps: 0 })

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    preferencesRef.current = preferences
    saveSandboxPreferences(
      preferences,
      typeof localStorage === 'undefined' ? undefined : localStorage,
    )
    sortingAudioEngine.configure(preferences.audio)
  }, [preferences])

  const setCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    rendererRef.current?.destroy()
    rendererRef.current = canvas ? new SandboxRenderer(canvas) : null
    rendererRef.current?.draw(valuesRef.current, activeRef.current, preferencesRef.current.visual)
  }, [])

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'cancel',
        runId: runIdRef.current,
      } satisfies SandboxWorkerRequest)
      workerRef.current.terminate()
      workerRef.current = null
    }
    pendingAckRef.current = false
    workerCompleteRef.current = false
    queueRef.current.clear()
  }, [])

  const draw = useCallback((completionProgress = 0) => {
    rendererRef.current?.draw(
      valuesRef.current,
      activeRef.current,
      preferencesRef.current.visual,
      completionProgress,
    )
  }, [])

  const replaceDataset = useCallback(() => {
    terminateWorker()
    const next = generateArray(
      preferencesRef.current.dataset,
      preferencesRef.current.amount,
      Math.floor(Math.random() * 1_000_000),
    )
    sourceRef.current = next
    valuesRef.current = [...next]
    activeRef.current.clear()
    statusRef.current = 'idle'
    startedAtRef.current = 0
    setStatus('idle')
    setStats(emptyStats)
    setError(null)
    draw()
    sortingAudioEngine.stopAll()
  }, [draw, terminateWorker])

  const start = useCallback(async () => {
    if (statusRef.current === 'paused') {
      statusRef.current = 'running'
      setStatus('running')
      if (preferencesRef.current.audio.enabled) {
        void sortingAudioEngine.resume().then((ready) => setAudioPrompt(!ready))
      }
      return
    }
    if (statusRef.current === 'running') return
    const restriction = sandboxAmountRestriction(
      preferencesRef.current.algorithm,
      preferencesRef.current.amount,
    )
    if (restriction) {
      setError(restriction)
      setStatus('error')
      return
    }
    terminateWorker()
    const algorithm = sandboxAlgorithms.find(
      (entry) => entry.id === preferencesRef.current.algorithm,
    )
    if (!algorithm) return
    valuesRef.current = [...sourceRef.current]
    activeRef.current.clear()
    workerStatsRef.current = { comparisons: 0, swaps: 0, writes: 0, operations: 0 }
    processedRef.current = 0
    startedAtRef.current = performance.now()
    completionStartedRef.current = 0
    runIdRef.current += 1
    const runId = runIdRef.current
    const worker = new Worker(new URL('../sandbox/sandbox.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<unknown>) => {
      if (!isSandboxWorkerResponse(event.data) || event.data.runId !== runId) return
      if (event.data.type === 'batch') {
        queueRef.current.push(event.data.operations)
        workerStatsRef.current = event.data.stats
        if (queueRef.current.needsBackpressure) pendingAckRef.current = true
        else worker.postMessage({ type: 'ack', runId } satisfies SandboxWorkerRequest)
      } else if (event.data.type === 'complete') {
        workerStatsRef.current = event.data.stats
        workerCompleteRef.current = true
      } else if (event.data.type === 'error') {
        setError(event.data.message)
        statusRef.current = 'error'
        setStatus('error')
      }
    }
    worker.onerror = () => {
      setError('The Sandbox worker stopped unexpectedly.')
      statusRef.current = 'error'
      setStatus('error')
    }
    worker.postMessage({
      type: 'start',
      runId,
      algorithm: algorithm.workerKind,
      values: sourceRef.current,
      batchSize: 512,
    } satisfies SandboxWorkerRequest)
    statusRef.current = 'running'
    setStatus('running')
    if (preferencesRef.current.audio.enabled) {
      void sortingAudioEngine.resume().then((ready) => setAudioPrompt(!ready))
    }
    setError(null)
    setStats(emptyStats)
  }, [terminateWorker])

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return
    sortingAudioEngine.stopAll()
    statusRef.current = 'paused'
    setStatus('paused')
  }, [])

  const stop = useCallback(() => {
    terminateWorker()
    sortingAudioEngine.stopAll()
    activeRef.current.clear()
    statusRef.current = 'idle'
    startedAtRef.current = 0
    setStatus('idle')
    draw()
  }, [draw, terminateWorker])

  const reset = useCallback(() => {
    terminateWorker()
    sortingAudioEngine.stopAll()
    valuesRef.current = [...sourceRef.current]
    activeRef.current.clear()
    statusRef.current = 'idle'
    startedAtRef.current = 0
    setStatus('idle')
    setStats(emptyStats)
    setError(null)
    draw()
  }, [draw, terminateWorker])

  useEffect(() => {
    let animationFrame = 0
    const tick = (now: number) => {
      const currentPreferences = preferencesRef.current
      const frameCounter = frameCounterRef.current
      const frameInterval = 1000 / currentPreferences.visual.targetFps
      const shouldRender = now - lastRenderRef.current >= frameInterval - 1

      let completionProgress = 0
      if (statusRef.current === 'running' && shouldRender) {
        const operations = queueRef.current.drain(
          operationsPerFrame(currentPreferences.speedMode, currentPreferences.visual.targetFps),
        )
        activeRef.current.clear()
        for (const operation of operations) {
          applyOperation(operation, valuesRef.current)
          const type = soundType(operation)
          if (operation[0] !== 4) {
            activeRef.current.add(operation[1])
            if (operation[0] === 0 || operation[0] === 1) activeRef.current.add(operation[2])
          }
          if (type && currentPreferences.audio.enabled) {
            const soundEvent = {
              type,
              values: operationValues(operation, valuesRef.current),
              dataset: valuesRef.current,
              speed: operationsPerFrame(
                currentPreferences.speedMode,
                currentPreferences.visual.targetFps,
              ),
              sequence: processedRef.current,
            }
            void sortingAudioEngine.play(soundEvent)
          }
          processedRef.current += 1
        }
        if (pendingAckRef.current && queueRef.current.canReleaseBackpressure && workerRef.current) {
          workerRef.current.postMessage({
            type: 'ack',
            runId: runIdRef.current,
          } satisfies SandboxWorkerRequest)
          pendingAckRef.current = false
        }
        if (workerCompleteRef.current && queueRef.current.size === 0) {
          workerCompleteRef.current = false
          completionStartedRef.current = now
          setStatus('complete')
          statusRef.current = 'complete'
          if (currentPreferences.audio.enabled)
            void sortingAudioEngine.playCompletion(valuesRef.current)
        }
      }

      if (statusRef.current === 'complete' && currentPreferences.visual.completionAnimation) {
        const duration = completionSweepDuration(valuesRef.current.length)
        completionProgress = Math.min(1, (now - completionStartedRef.current) / duration)
      } else if (statusRef.current === 'complete') completionProgress = 1

      if (shouldRender) {
        draw(completionProgress)
        lastRenderRef.current = now
        if (frameCounter.started === 0) frameCounter.started = now
        frameCounter.frames += 1
        if (now - frameCounter.started >= 500) {
          frameCounter.fps = (frameCounter.frames * 1000) / (now - frameCounter.started)
          frameCounter.frames = 0
          frameCounter.started = now
        }
      }

      if (now - lastStatsUpdateRef.current >= 180) {
        const elapsedEnd = statusRef.current === 'complete' ? completionStartedRef.current : now
        const elapsedMs = startedAtRef.current ? Math.max(0, elapsedEnd - startedAtRef.current) : 0
        const estimate = estimateSandboxOperations(
          currentPreferences.algorithm,
          currentPreferences.amount,
        )
        setStats({
          ...workerStatsRef.current,
          operationsPerSecond:
            elapsedMs > 0 ? Math.round((processedRef.current * 1000) / elapsedMs) : 0,
          elapsedMs,
          progress:
            statusRef.current === 'complete'
              ? 100
              : Math.min(99, (processedRef.current / estimate) * 100),
          fps: Math.round(frameCounter.fps),
          queueSize: queueRef.current.size,
          audioVoices: sortingAudioEngine.getDebugState().activeVoices,
        })
        lastStatsUpdateRef.current = now
      }
      animationFrame = requestAnimationFrame(tick)
    }
    animationFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrame)
  }, [draw])

  useEffect(
    () => () => {
      terminateWorker()
      sortingAudioEngine.stopAll()
    },
    [terminateWorker],
  )

  const updatePreferences = useCallback(
    (update: (current: SandboxPreferences) => SandboxPreferences) => {
      const next = update(preferencesRef.current)
      preferencesRef.current = next
      setPreferences(next)
    },
    [],
  )

  return {
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
    shuffle: replaceDataset,
  }
}
