import type { SandboxOperation } from './types'

export class OperationQueue {
  private batches: SandboxOperation[][] = []
  private headOffset = 0
  private operations = 0

  constructor(
    readonly highWaterMark = 24_000,
    readonly lowWaterMark = 8_000,
  ) {}

  push(batch: SandboxOperation[]) {
    if (batch.length === 0) return
    this.batches.push(batch)
    this.operations += batch.length
  }

  drain(limit: number) {
    const drained: SandboxOperation[] = []
    while (drained.length < limit && this.batches.length > 0) {
      const batch = this.batches[0]
      const remaining = limit - drained.length
      const available = batch.length - this.headOffset
      const take = Math.min(remaining, available)
      drained.push(...batch.slice(this.headOffset, this.headOffset + take))
      this.headOffset += take
      this.operations -= take
      if (this.headOffset >= batch.length) {
        this.batches.shift()
        this.headOffset = 0
      }
    }
    return drained
  }

  clear() {
    this.batches = []
    this.headOffset = 0
    this.operations = 0
  }

  get size() {
    return this.operations
  }

  get needsBackpressure() {
    return this.operations >= this.highWaterMark
  }

  get canReleaseBackpressure() {
    return this.operations <= this.lowWaterMark
  }
}
