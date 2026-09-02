import { datasetRange } from '../audio/frequencyMapping'
import { sandboxLightVisualPalette, sandboxVisualPresets } from './config'
import type { SandboxVisualSettings } from './types'

function parseHex(value: string) {
  const hex = value.replace('#', '')
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))
}

function mixColor(start: string, end: string, ratio: number) {
  const left = parseHex(start)
  const right = parseHex(end)
  const channel = (index: number) => Math.round(left[index] + (right[index] - left[index]) * ratio)
  return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`
}

export class SandboxRenderer {
  private context: CanvasRenderingContext2D
  private width = 1
  private height = 1
  private ratio = 1
  private quality: SandboxVisualSettings['quality'] = 'balanced'
  private resizeObserver: ResizeObserver

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true })
    if (!context) throw new Error('Canvas 2D is unavailable in this browser.')
    this.context = context
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    this.resize()
  }

  private resize(quality = this.quality) {
    const rect = this.canvas.getBoundingClientRect()
    this.quality = quality
    const qualityRatio = quality === 'performance' ? 1 : quality === 'balanced' ? 1.5 : 2
    this.ratio = Math.min(qualityRatio, Math.max(1, window.devicePixelRatio || 1))
    this.width = Math.max(1, Math.round(rect.width))
    this.height = Math.max(1, Math.round(rect.height))
    const pixelWidth = Math.round(this.width * this.ratio)
    const pixelHeight = Math.round(this.height * this.ratio)
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth
      this.canvas.height = pixelHeight
      this.context.setTransform(this.ratio, 0, 0, this.ratio, 0, 0)
    }
  }

  draw(
    values: number[],
    activeIndices: ReadonlySet<number>,
    settings: SandboxVisualSettings,
    completionProgress = 0,
  ) {
    if (settings.quality !== this.quality) this.resize(settings.quality)
    const lightTheme = document.documentElement.dataset.theme === 'light'
    const palette = lightTheme ? sandboxLightVisualPalette : sandboxVisualPresets[settings.preset]
    const context = this.context
    if (settings.trail <= 0) {
      if (settings.backgroundStyle === 'vignette') {
        const gradient = context.createRadialGradient(
          this.width / 2,
          this.height * 0.55,
          0,
          this.width / 2,
          this.height * 0.55,
          Math.max(this.width, this.height) * 0.72,
        )
        gradient.addColorStop(0, mixColor(palette.background, palette.barLow, 0.07))
        gradient.addColorStop(1, palette.background)
        context.fillStyle = gradient
      } else context.fillStyle = palette.background
      context.fillRect(0, 0, this.width, this.height)
    } else {
      context.fillStyle = `${palette.background}${Math.round((1 - settings.trail) * 255)
        .toString(16)
        .padStart(2, '0')}`
      context.fillRect(0, 0, this.width, this.height)
    }
    if (values.length === 0) return

    const { minimum, maximum } = datasetRange(values)
    const isConstantDataset = maximum === minimum
    const range = Math.max(1, maximum - minimum)
    const barWidth = this.width / values.length
    const gap = barWidth > 2 ? Math.min(settings.gap, barWidth * 0.35) : 0
    const drawableWidth = Math.max(
      0.35,
      settings.widthMode === 'dense'
        ? barWidth
        : settings.widthMode === 'pixel'
          ? Math.floor(barWidth - gap)
          : barWidth - gap,
    )
    const sortedThrough = Math.floor(values.length * completionProgress)

    for (let index = 0; index < values.length; index += 1) {
      const ratio = isConstantDataset ? 0.5 : (values[index] - minimum) / range
      const height = Math.max(1, ratio * (this.height - 18) + 6)
      const x = index * barWidth
      const y = this.height - height
      const isActive = activeIndices.has(index)
      const isSorted = index < sortedThrough
      if (isActive) {
        context.shadowBlur = barWidth > 1.5 ? 12 * settings.activeBrightness : 0
        context.shadowColor = palette.active
        context.fillStyle = palette.active
      } else {
        context.shadowBlur = 0
        context.fillStyle = isSorted
          ? palette.sorted
          : settings.preset === 'spectrum'
            ? `hsl(${220 + ratio * 130} 82% ${54 + ratio * 18}%)`
            : mixColor(palette.barLow, palette.barHigh, ratio)
      }
      context.fillRect(x, y, drawableWidth, height)
    }
    context.shadowBlur = 0

    if (settings.showValues && values.length <= 128 && barWidth >= 7) {
      context.fillStyle = lightTheme ? 'rgba(11,27,58,.78)' : 'rgba(255,255,255,.72)'
      context.font = '10px ui-monospace, monospace'
      context.textAlign = 'center'
      for (let index = 0; index < values.length; index += 1) {
        context.fillText(String(values[index]), index * barWidth + barWidth / 2, this.height - 4)
      }
    }
  }

  destroy() {
    this.resizeObserver.disconnect()
  }
}
