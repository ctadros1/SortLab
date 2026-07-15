import {
  Activity,
  ArrowDownNarrowWide,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRightLeft,
  ArrowUpNarrowWide,
  AudioLines,
  BarChart3,
  Binary,
  Blocks,
  BookOpen,
  Braces,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  CircleGauge,
  Columns3,
  Database,
  Diamond,
  Flag,
  GitCompareArrows,
  GitMerge,
  Grid3X3,
  Hash,
  Headphones,
  Info,
  Keyboard,
  Layers3,
  Lightbulb,
  ListFilter,
  ListOrdered,
  Monitor,
  Menu,
  Moon,
  MoveHorizontal,
  Network,
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
  Target,
  TriangleAlert,
  Trophy,
  Volume2,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { AlgorithmIconId, DatasetIconId } from '../types'

export type AppIconName =
  | 'activity'
  | 'algorithm'
  | 'audio'
  | 'benchmark'
  | 'beginning'
  | 'check'
  | 'code'
  | 'compare'
  | 'complexity'
  | 'dataset'
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
  | 'reset'
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
  | 'volume'
  | 'warning'
  | 'write'
  | 'close'

const appIcons: Record<AppIconName, LucideIcon> = {
  activity: Activity,
  algorithm: Braces,
  audio: Headphones,
  benchmark: BarChart3,
  beginning: SkipBack,
  check: Check,
  code: Braces,
  compare: GitCompareArrows,
  complexity: Scale,
  dataset: Database,
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
  reset: RotateCcw,
  search: Search,
  seed: Hash,
  settings: Settings2,
  shuffle: Shuffle,
  size: Grid3X3,
  sound: Volume2,
  speed: CircleGauge,
  steps: Activity,
  stop: Square,
  sun: Sun,
  swap: ArrowLeftRight,
  theme: SlidersHorizontal,
  volume: AudioLines,
  warning: TriangleAlert,
  write: PencilLine,
  close: X,
}

const algorithmIcons: Record<AlgorithmIconId, LucideIcon> = {
  adjacent: ArrowLeftRight,
  arrows: ArrowRightLeft,
  binary: Binary,
  buckets: Columns3,
  cycle: RefreshCcw,
  digits: Hash,
  heap: Network,
  insertion: ArrowDownToLine,
  merge: GitMerge,
  network: GitCompareArrows,
  pancake: Layers3,
  partition: MoveHorizontal,
  selection: Target,
  strand: Waves,
  tournament: Trophy,
  warning: TriangleAlert,
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
  const Component = algorithmIcons[name]
  return <Component size={props.size ?? 18} strokeWidth={props.strokeWidth ?? 1.9} {...props} />
}

export function DatasetIcon({ name, ...props }: IconProps & { name: DatasetIconId }) {
  const Component = datasetIcons[name]
  return <Component size={props.size ?? 18} strokeWidth={props.strokeWidth ?? 1.9} {...props} />
}

export { ChevronDown, ChevronRight, Diamond, Flag, MoveHorizontal }
