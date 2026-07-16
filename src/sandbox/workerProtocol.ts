import type { SandboxOperation } from './types'
import type { SandboxAlgorithm } from './config'

export interface SandboxWorkerStats {
  comparisons: number
  swaps: number
  writes: number
  operations: number
}

export type SandboxWorkerRequest =
  | {
      type: 'start'
      runId: number
      algorithm: SandboxAlgorithm['workerKind']
      values: number[]
      batchSize: number
      operationBudget: number
    }
  | { type: 'ack'; runId: number }
  | { type: 'cancel'; runId: number }

export type SandboxWorkerResponse =
  | {
      type: 'batch'
      runId: number
      operations: SandboxOperation[]
      stats: SandboxWorkerStats
    }
  | { type: 'complete'; runId: number; stats: SandboxWorkerStats }
  | { type: 'canceled'; runId: number }
  | { type: 'error'; runId: number; message: string }

export function isSandboxWorkerResponse(value: unknown): value is SandboxWorkerResponse {
  if (!value || typeof value !== 'object') return false
  const message = value as { type?: unknown; runId?: unknown }
  return (
    typeof message.runId === 'number' &&
    ['batch', 'complete', 'canceled', 'error'].includes(String(message.type))
  )
}
