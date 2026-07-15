export type SortEventType =
  | 'compare'
  | 'swap'
  | 'write'
  | 'select'
  | 'pivot'
  | 'range'
  | 'merge'
  | 'heapify'
  | 'bucket'
  | 'markSorted'
  | 'note'

export interface SortStats {
  comparisons: number
  swaps: number
  writes: number
  reads: number
  auxiliary: number
  recursionDepth: number
  maxRecursionDepth: number
}

export interface SortEvent {
  type: SortEventType
  array: number[]
  indices: number[]
  codeLine: string
  narration: string
  stats: SortStats
  phase: string
  activeRange?: [number, number]
}

export type AlgorithmFamily =
  | 'Exchange'
  | 'Selection'
  | 'Insertion'
  | 'Merge'
  | 'Partition'
  | 'Heap'
  | 'Distribution'
  | 'Network'
  | 'Hybrid'
  | 'Novelty'

export type AlgorithmIconId =
  | 'adjacent'
  | 'arrows'
  | 'binary'
  | 'buckets'
  | 'cycle'
  | 'digits'
  | 'heap'
  | 'insertion'
  | 'merge'
  | 'network'
  | 'pancake'
  | 'partition'
  | 'selection'
  | 'strand'
  | 'tournament'
  | 'warning'

export type AlgorithmCaution = 'none' | 'educational' | 'pathological'

export interface AlgorithmMeta {
  id: string
  name: string
  aliases: string[]
  searchTerms: string[]
  family: AlgorithmFamily
  icon: AlgorithmIconId
  optionDescription: string
  badges: string[]
  caution: AlgorithmCaution
  shortDescription: string
  centralIdea: string
  invariant: string
  notice: string
  steps: string[]
  example: string
  complexity: { best: string; average: string; worst: string; space: string }
  stable: boolean
  inPlace: boolean
  adaptive: boolean
  comparisonBased: boolean
  useCases: string
  disadvantages: string
  related: string
  avoidWhen: string
  implementationNotes: string
  studentMistakes: string
  restrictions: string
  recommendedMax: number
  hardMax: number
  warning?: string
  approximation?: boolean
  pseudocode: Array<{ id: string; text: string; explanation: string }>
}

export type DatasetMode =
  | 'random'
  | 'nearly-sorted'
  | 'reversed'
  | 'sorted'
  | 'few-unique'
  | 'duplicates'
  | 'sawtooth'
  | 'groups'
  | 'custom'

export type DatasetIconId =
  | 'random'
  | 'nearly-sorted'
  | 'reversed'
  | 'sorted'
  | 'few-unique'
  | 'duplicates'
  | 'sawtooth'
  | 'groups'
  | 'custom'

export interface DatasetMeta {
  id: DatasetMode
  name: string
  description: string
  icon: DatasetIconId
  preview: number[]
  searchTerms: string[]
  constraints?: string
}

export type PlaybackStatus = 'idle' | 'running' | 'paused' | 'complete'
