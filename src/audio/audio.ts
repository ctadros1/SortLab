let context: AudioContext | null = null
let master: GainNode | null = null

export function valueToFrequency(value: number, minimum: number, maximum: number) {
  if (maximum === minimum) return 440
  const ratio = Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)))
  return 180 * Math.pow(880 / 180, ratio)
}

export async function playTone(value: number, values: number[], volume: number, kind: string) {
  context ??= new AudioContext()
  if (context.state === 'suspended') await context.resume()
  master ??= context.createGain()
  master.connect(context.destination)
  master.gain.setValueAtTime(Math.max(0, Math.min(0.2, volume * 0.2)), context.currentTime)
  const oscillator = context.createOscillator()
  const envelope = context.createGain()
  oscillator.type = kind === 'swap' ? 'triangle' : kind === 'write' ? 'sine' : 'square'
  oscillator.frequency.value = valueToFrequency(value, Math.min(...values), Math.max(...values))
  envelope.gain.setValueAtTime(0.0001, context.currentTime)
  envelope.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.005)
  envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.055)
  oscillator.connect(envelope)
  envelope.connect(master)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.06)
  oscillator.onended = () => {
    oscillator.disconnect()
    envelope.disconnect()
  }
}

export async function playCompletion(volume: number) {
  for (const [index, value] of [10, 35, 60, 90].entries()) {
    window.setTimeout(() => void playTone(value, [0, 100], volume, 'write'), index * 55)
  }
}
