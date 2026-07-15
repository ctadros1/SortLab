export class CancellationToken {
  private canceled = false

  cancel() {
    this.canceled = true
  }

  reset() {
    this.canceled = false
  }

  get isCanceled() {
    return this.canceled
  }
}
