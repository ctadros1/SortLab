import {
  Activity,
  ArrowDownNarrowWide,
  ArrowRightLeft,
  ArrowUpNarrowWide,
  AudioLines,
  BarChart3,
  Blocks,
  BookOpen,
  Braces,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  CircleGauge,
  Database,
  Diamond,
  Flag,
  GitCompareArrows,
  Grid3X3,
  Hash,
  Headphones,
  Info,
  Keyboard,
  Layers3,
  Lightbulb,
  ListFilter,
  ListOrdered,
  Eye,
  EyeOff,
  Maximize2,
  Monitor,
  Menu,
  Moon,
  MoveHorizontal,
  Pause,
  PencilLine,
  Play,
  RefreshCcw,
  RotateCcw,
  Scale,
  Search,
  Settings2,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Square,
  StepBack,
  StepForward,
  Sun,
  TriangleAlert,
  Volume2,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { AlgorithmIconId, DatasetIconId } from '../types'

export type AppIconName =
  | 'activity'
  | 'auxiliary'
  | 'algorithm'
  | 'audio'
  | 'benchmark'
  | 'beginning'
  | 'check'
  | 'code'
  | 'compare'
  | 'complexity'
  | 'dataset'
  | 'depth'
  | 'end'
  | 'explain'
  | 'generate'
  | 'info'
  | 'keyboard'
  | 'learn'
  | 'monitor'
  | 'menu'
  | 'moon'
  | 'narration'
  | 'next'
  | 'pause'
  | 'play'
  | 'previous'
  | 'phase'
  | 'reads'
  | 'reset'
  | 'restore'
  | 'fullscreen'
  | 'hide'
  | 'sandbox'
  | 'search'
  | 'seed'
  | 'settings'
  | 'shuffle'
  | 'size'
  | 'sound'
  | 'speed'
  | 'steps'
  | 'stop'
  | 'sun'
  | 'swap'
  | 'theme'
  | 'timer'
  | 'volume'
  | 'warning'
  | 'write'
  | 'close'

const appIcons: Record<AppIconName, LucideIcon> = {
  activity: Activity,
  auxiliary: Settings2,
  algorithm: Braces,
  audio: Headphones,
  benchmark: BarChart3,
  beginning: SkipBack,
  check: Check,
  code: Braces,
  compare: GitCompareArrows,
  complexity: Scale,
  dataset: Database,
  depth: Layers3,
  end: SkipForward,
  explain: Lightbulb,
  generate: RefreshCcw,
  info: Info,
  keyboard: Keyboard,
  learn: BookOpen,
  monitor: Monitor,
  menu: Menu,
  moon: Moon,
  narration: CircleDot,
  next: StepForward,
  pause: Pause,
  play: Play,
  previous: StepBack,
  phase: Flag,
  reads: Eye,
  reset: RotateCcw,
  restore: Eye,
  fullscreen: Maximize2,
  hide: EyeOff,
  sandbox: SlidersHorizontal,
  search: Search,
  seed: Hash,
  settings: Settings2,
  shuffle: Shuffle,
  size: Grid3X3,
  sound: Volume2,
  speed: CircleGauge,
  steps: ListOrdered,
  stop: Square,
  sun: Sun,
  swap: ArrowRightLeft,
  theme: SlidersHorizontal,
  timer: CircleGauge,
  volume: AudioLines,
  warning: TriangleAlert,
  write: PencilLine,
  close: X,
}

const datasetIcons: Record<DatasetIconId, LucideIcon> = {
  random: Shuffle,
  'nearly-sorted': ListOrdered,
  reversed: ArrowDownNarrowWide,
  sorted: ArrowUpNarrowWide,
  'few-unique': ListFilter,
  duplicates: Blocks,
  sawtooth: Waves,
  groups: Layers3,
  custom: PencilLine,
}

interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

export function AppIcon({ name, ...props }: IconProps & { name: AppIconName }) {
  const Component = appIcons[name]
  return <Component size={props.size ?? 18} strokeWidth={props.strokeWidth ?? 1.9} {...props} />
}

export function AlgorithmIcon({ name, ...props }: IconProps & { name: AlgorithmIconId }) {
  const size = props.size ?? 18
  return (
    <img
      src={`${import.meta.env.BASE_URL}learn-icons/${name}.png`}
      alt=""
      aria-hidden={props['aria-hidden'] ?? true}
      className={['algorithm-custom-icon', props.className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      decoding="async"
    />
  )
}

export function DatasetIcon({ name, ...props }: IconProps & { name: DatasetIconId }) {
  const Component = datasetIcons[name]
  return <Component size={props.size ?? 18} strokeWidth={props.strokeWidth ?? 1.9} {...props} />
}

export { ChevronDown, ChevronRight, Diamond, Flag, MoveHorizontal }
