import type { AlgorithmIconId } from '../types'
import {
  browserImplementationKind,
  browserImplementationNote,
  hasBrowserImplementation,
} from './implementationRegistry'

export type SandboxWorkerKind =
  | 'quick'
  | 'merge'
  | 'heap'
  | 'radix'
  | 'counting'
  | 'shell'
  | 'bubble'
  | 'selection'
  | 'insertion'
  | 'bitonic'

export type SandboxExecutionMode =
  | 'native'
  | 'browser'
  | 'conceptual'
  | 'simulated-parallel'
  | 'simulated-external'
  | 'simulated-gpu'
  | 'experimental'

export interface SandboxAlgorithm {
  id: string
  name: string
  group: string
  description: string
  aliases: string[]
  tags: string[]
  maximum: number
  powerOfTwo?: boolean
  exactAmount?: number
  workerKind: SandboxWorkerKind
  executionMode: SandboxExecutionMode
  implementationId?: string
  fidelity: 'actual' | 'parameterized' | 'simulation'
  implementationNote: string
  icon: AlgorithmIconId
}

interface Seed {
  name: string
  id?: string
  description?: string
  aliases?: string[]
  tags?: string[]
  maximum?: number
  powerOfTwo?: boolean
  exactAmount?: number
  fixedMaximum?: boolean
  workerKind?: SandboxWorkerKind
  executionMode?: SandboxExecutionMode
}

const modeLabels: Record<SandboxExecutionMode, string> = {
  native: 'Native',
  browser: 'Browser implementation',
  conceptual: 'Conceptual',
  'simulated-parallel': 'Simulated parallel',
  'simulated-external': 'Simulated external',
  'simulated-gpu': 'Simulated GPU',
  experimental: 'Experimental',
}

const workerIcons: Record<SandboxWorkerKind, AlgorithmIconId> = {
  quick: 'partition',
  merge: 'merge',
  heap: 'heap',
  radix: 'digits',
  counting: 'buckets',
  shell: 'insertion',
  bubble: 'adjacent',
  selection: 'selection',
  insertion: 'insertion',
  bitonic: 'network',
}

function slug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function seed(name: string, overrides: Omit<Seed, 'name'> = {}): Seed {
  return { name, ...overrides }
}

function catalogGroup(
  group: string,
  workerKind: SandboxWorkerKind,
  executionMode: SandboxExecutionMode,
  maximum: number,
  seeds: Array<string | Seed>,
) {
  return seeds.map((value): SandboxAlgorithm => {
    const item = typeof value === 'string' ? seed(value) : value
    const id = item.id ?? slug(item.name)
    const declaredMode = item.executionMode ?? executionMode
    const canRunActual =
      declaredMode !== 'simulated-parallel' &&
      declaredMode !== 'simulated-external' &&
      declaredMode !== 'simulated-gpu' &&
      hasBrowserImplementation(id)
    const mode = declaredMode === 'conceptual' && canRunActual ? 'browser' : declaredMode
    const fidelity = canRunActual ? browserImplementationKind(id) : 'simulation'
    const sourceMaximum = item.maximum ?? maximum
    const multiplier = item.fixedMaximum
      ? 1
      : fidelity === 'simulation'
        ? 2
        : item.tags?.includes('Pathological')
          ? 2.5
          : item.powerOfTwo
            ? 2
            : 2.5
    const maximumValue = Math.min(16384, Math.floor(sourceMaximum * multiplier))
    return {
      id,
      name: item.name,
      group,
      description:
        item.description ??
        (fidelity === 'simulation'
          ? `${modeLabels[mode]} ${group.toLowerCase()} model using SortLab’s bounded operation pipeline.`
          : `${modeLabels[mode]} of this ${group.toLowerCase()} algorithm with its own operation stream.`),
      aliases: item.aliases ?? [],
      tags: [
        fidelity === 'simulation'
          ? modeLabels[mode]
          : fidelity === 'parameterized'
            ? 'Parameterized implementation'
            : 'Actual implementation',
        ...(item.tags ?? []),
      ],
      // Browser implementations receive a modest extra tier; simulations retain
      // their conservative bounds because their fallback stream is illustrative.
      maximum: maximumValue,
      powerOfTwo: item.powerOfTwo,
      exactAmount: item.exactAmount,
      workerKind: item.workerKind ?? workerKind,
      executionMode: mode,
      implementationId: canRunActual ? id : undefined,
      fidelity,
      implementationNote: browserImplementationNote(id),
      icon: workerIcons[item.workerKind ?? workerKind],
    }
  })
}

const nativeAlgorithms: SandboxAlgorithm[] = [
  ...catalogGroup('Recommended', 'quick', 'native', 4096, [
    seed('Quick Sort (Hoare)', {
      id: 'quick-hoare',
      description: 'Native inward-scanning quicksort tuned for dense canvas playback.',
      aliases: ['Hoare Quicksort', 'quick sort hoare'],
      tags: ['Recommended', 'Audio-friendly'],
    }),
  ]),
  ...catalogGroup('Recommended', 'merge', 'native', 4096, [
    seed('Merge Sort', {
      id: 'merge-bottom-up',
      description: 'Native iterative merge sort with batched writes.',
      aliases: ['Bottom-Up Merge Sort'],
      tags: ['Recommended', 'Visual-friendly'],
    }),
  ]),
  ...catalogGroup('Recommended', 'heap', 'native', 4096, [
    seed('Heap Sort', {
      id: 'heap',
      description: 'Native binary heap construction and repeated maximum extraction.',
      aliases: ['Heapsort'],
      tags: ['Recommended', 'Audio-friendly'],
    }),
  ]),
  ...catalogGroup('Recommended', 'radix', 'native', 4096, [
    seed('Radix Sort (LSD)', {
      id: 'radix-lsd',
      description: 'Native stable decimal digit passes with high-throughput writes.',
      aliases: ['LSD Radix Sort'],
      tags: ['Recommended', 'High throughput'],
    }),
  ]),
  ...catalogGroup('Basic exchange sorts', 'bubble', 'native', 512, [
    seed('Optimized Bubble Sort', {
      id: 'bubble-optimized',
      tags: ['High event count', 'Size restricted'],
    }),
  ]),
  ...catalogGroup('Selection and insertion sorts', 'selection', 'native', 512, [
    seed('Selection Sort', { id: 'selection', tags: ['High event count', 'Size restricted'] }),
  ]),
  ...catalogGroup('Selection and insertion sorts', 'insertion', 'native', 512, [
    seed('Insertion Sort', { id: 'insertion', tags: ['Audio-friendly', 'Size restricted'] }),
  ]),
  ...catalogGroup('Shell sort gap presets', 'shell', 'native', 2048, [
    seed('Shell Sort — Original Shell Gaps', { id: 'shell', tags: ['Visual-friendly'] }),
  ]),
  ...catalogGroup('Distribution and integer sorts', 'counting', 'native', 4096, [
    seed('Counting Sort', { id: 'counting', tags: ['High throughput'] }),
  ]),
  ...catalogGroup('Sorting networks', 'bitonic', 'native', 4096, [
    seed('Bitonic Sort', {
      id: 'bitonic',
      powerOfTwo: true,
      tags: ['Visual-friendly', 'Power-of-two required'],
    }),
  ]),
]

const conceptualAlgorithms = [
  ...catalogGroup('Basic exchange sorts', 'bubble', 'conceptual', 512, [
    seed('Bubble Sort', { id: 'bubble' }),
    seed('Cocktail Shaker Sort', { workerKind: 'bubble' }),
    seed('Odd–Even Transposition Sort', { workerKind: 'bubble' }),
    seed('Comb Sort', { workerKind: 'shell' }),
    seed('Gnome Sort', { workerKind: 'insertion' }),
    'Exchange Sort',
    seed('Restart Sort', { maximum: 64, tags: ['Novelty', 'Size restricted'] }),
    seed('Random Adjacent-Swap Sort', { maximum: 64, tags: ['Novelty', 'Size restricted'] }),
    seed('Spin-the-Bottle Sort', { maximum: 64, tags: ['Novelty', 'Size restricted'] }),
    seed('Annealing Sort', { maximum: 128, tags: ['Experimental', 'Size restricted'] }),
  ]),
  ...catalogGroup('Selection and insertion sorts', 'insertion', 'conceptual', 512, [
    seed('Double Selection Sort', { workerKind: 'selection' }),
    seed('Bingo Sort', { workerKind: 'selection' }),
    'Binary Insertion Sort',
    'Pair Insertion Sort',
    'Library Sort',
    'Patience Sort',
    'Strand Sort',
    'Cycle Sort',
    'Pancake Sort',
    seed('Tournament Sort', { workerKind: 'selection' }),
    seed('Rank Sort', { workerKind: 'selection' }),
    seed('Tag Sort', { workerKind: 'selection' }),
  ]),
  ...catalogGroup('Shell sort gap presets', 'shell', 'conceptual', 2048, [
    'Shell Sort — Hibbard Gaps',
    'Shell Sort — Pratt Gaps',
    'Shell Sort — Knuth Gaps',
    'Shell Sort — Sedgewick Gaps',
    'Shell Sort — Tokuda Gaps',
    'Shell Sort — Ciura Gaps',
    'Shell Sort — Extended Ciura Gaps',
  ]),
  ...catalogGroup('Tree and heap sorts', 'heap', 'conceptual', 2048, [
    seed('Tree Sort', { workerKind: 'insertion' }),
    seed('AVL Tree Sort', { workerKind: 'insertion' }),
    seed('Red-Black Tree Sort', { workerKind: 'insertion' }),
    seed('Splay Sort', { workerKind: 'insertion' }),
    seed('Cartesian Tree Sort', { workerKind: 'insertion' }),
    'Bottom-Up Heapsort',
    'Ternary Heapsort',
    'd-ary Heapsort',
    'Weak-Heap Sort',
    'Smoothsort',
    'Adaptive Heapsort',
    'Poplar Sort',
    'Cube Sort',
  ]),
  ...catalogGroup('Quicksort family', 'quick', 'conceptual', 4096, [
    seed('Standard Quicksort', { id: 'quick' }),
    'Lomuto Quicksort',
    'Randomized Quicksort',
    'Median-of-Three Quicksort',
    'Tukey Ninther Quicksort',
    'Three-Way Quicksort',
    'Bentley–McIlroy Quicksort',
    'Dual-Pivot Quicksort',
    'Multi-Pivot Quicksort',
    'Stable Quicksort',
    'Balanced Quicksort',
    'BlockQuicksort',
    'Introsort',
    'Pattern-Defeating Quicksort',
    'QuickMergesort',
    'Fluxsort',
    'Crumsort',
    'Blitsort',
    'Logsort',
    'Glidesort',
    'Driftsort',
    'ipnsort',
    'Vergesort',
    seed('vqsort', { executionMode: 'experimental', tags: ['SIMD model'] }),
    'Wave Sort',
  ]),
  ...catalogGroup('Quicksort pivot presets', 'quick', 'conceptual', 4096, [
    'Quicksort — First Element Pivot',
    'Quicksort — Last Element Pivot',
    'Quicksort — Middle Element Pivot',
    'Quicksort — Random Element Pivot',
    'Quicksort — Median of Three Pivot',
    'Quicksort — Median of Five Pivot',
    'Quicksort — Tukey Ninther Pivot',
    'Quicksort — Sample Median Pivot',
    'Quicksort — Approximate Median Pivot',
  ]),
  ...catalogGroup('Quicksort partition presets', 'quick', 'conceptual', 4096, [
    'Quicksort — Hoare Partition',
    'Quicksort — Lomuto Partition',
    'Quicksort — Three-Way Partition',
    'Quicksort — Dual-Pivot Partition',
    'Quicksort — Block Partition',
    'Quicksort — Stable Partition',
  ]),
  ...catalogGroup('Quicksort fallback presets', 'quick', 'conceptual', 4096, [
    'Quicksort — No Fallback',
    'Quicksort — Insertion Sort Fallback',
    'Quicksort — Heapsort Fallback',
    'Quicksort — Merge Sort Fallback',
    'Quicksort — Sorting Network Fallback',
  ]),
  ...catalogGroup('Merge sort family', 'merge', 'conceptual', 4096, [
    seed('Top-Down Merge Sort', { id: 'merge' }),
    'Natural Merge Sort',
    'Two-Way Merge Sort',
    'Three-Way Merge Sort',
    'k-Way Merge Sort',
    'In-Place Merge Sort',
    'Rotation Merge Sort',
    'SymMerge Sort',
    'Ping-Pong Merge Sort',
    'Block Merge Sort',
    'Grailsort',
    'WikiSort',
    'SqrtSort',
    'Timsort',
    'Powersort',
    'Peeksort',
    'Shivers Sort',
    'Adaptive Shivers Sort',
    'Merge-Insertion Sort',
    'Quadsort',
    'Spinsort',
    'Flat Stable Sort',
    'MEL Sort',
    'SquareSort',
    'Wall-L Merge Sort',
  ]),
  ...catalogGroup('Distribution and integer sorts', 'counting', 'conceptual', 4096, [
    'Stable Counting Sort',
    'Key-Indexed Counting Sort',
    'Pigeonhole Sort',
    seed('Bucket Sort', { workerKind: 'radix' }),
    'Histogram Sort',
    'Address-Calculation Sort',
    'Interpolation Sort',
    'Proxmap Sort',
    'Flashsort',
    'Distributive Partitioning Sort',
    'Distribution Shuffle Sort',
    'Unshuffle Sort',
    seed('Sample Sort', { workerKind: 'quick' }),
    seed('Super Scalar Sample Sort', { workerKind: 'quick' }),
    seed('Spreadsort', { workerKind: 'radix' }),
    'Linear-Probing Sort',
  ]),
  ...catalogGroup('Radix and string sorts', 'radix', 'conceptual', 4096, [
    'MSD Radix Sort',
    'Binary Radix Sort',
    'Base-4 Radix Sort',
    'Base-8 Radix Sort',
    'Base-10 Radix Sort',
    'Base-16 Radix Sort',
    'Base-256 Radix Sort',
    'American Flag Sort',
    'Radix-Exchange Sort',
    'In-Place Radix Sort',
    'Burstsort',
    'Trie Sort',
    'Postman’s Sort',
    'ska_sort',
    'String Radix Sort',
    seed('Unicode Radix Sort — Simulated', { executionMode: 'conceptual' }),
  ]),
  ...catalogGroup('Learned and distribution-aware sorts', 'quick', 'conceptual', 2048, [
    'Learned Sort',
    seed('In-Place Parallel Learned Sort — Simulated', { executionMode: 'simulated-parallel' }),
    'Adaptive Hybrid Sort',
    'Cache-Oblivious Distribution Sort',
    'Need for Speed Sort',
    'Model-Predicted Bucket Sort — Simulated',
  ]),
  ...catalogGroup('Sorting networks', 'bitonic', 'conceptual', 4096, [
    seed('Batcher Odd–Even Mergesort', { powerOfTwo: true }),
    seed('Pairwise Sorting Network', { powerOfTwo: true }),
    seed('Shell Sorting Network', { powerOfTwo: true }),
    seed('Bose–Nelson Sorting Network', { powerOfTwo: true }),
    seed('Minimum-Comparator Networks for Small Arrays', {
      maximum: 16,
      powerOfTwo: true,
      exactAmount: 16,
      fixedMaximum: true,
      description: 'Fixed 16-input, 60-comparator network using a published best-known schedule.',
    }),
    seed('SIMD Sorting Network — Simulated', { executionMode: 'simulated-gpu', powerOfTwo: true }),
    seed('AlphaDev Fixed-Size Sort — Simulated', { maximum: 64, powerOfTwo: true }),
    seed('Shearsort', { powerOfTwo: true }),
    seed('Columnsort', { powerOfTwo: true }),
  ]),
  ...catalogGroup('Experimental and research sorts', 'merge', 'conceptual', 2048, [
    'Zacksort',
    'Zucksort',
    'Ducksort',
    'Frogsort',
    'Geckosort',
    'Octosort',
    'Squidsort',
    'Walksort',
    'Jumpsort',
    'Corsort',
    'Multizip Sort',
  ]),
  ...catalogGroup('Novelty and intentionally bad sorts', 'insertion', 'conceptual', 32, [
    seed('Bogosort', { id: 'bogo', maximum: 8, tags: ['Pathological', 'Operation limited'] }),
    seed('Deterministic Permutation Sort', { maximum: 9, tags: ['Pathological'] }),
    seed('Bozosort', { maximum: 10, tags: ['Pathological'] }),
    seed('Bogobogosort', { maximum: 6, tags: ['Pathological'] }),
    seed('Stooge Sort', { id: 'stooge', maximum: 128, tags: ['Pathological'] }),
    seed('Slowsort', { id: 'slow', maximum: 100, tags: ['Pathological'] }),
    seed('Sleep Sort', { maximum: 64, tags: ['Timer simulation'] }),
    seed('Bead Sort', { maximum: 128 }),
    seed('Miracle Sort — Simulation Only', { maximum: 32, tags: ['Joke simulation'] }),
    seed('Quantum Bogosort — Fictional Simulation', { maximum: 16, tags: ['Fictional'] }),
    seed('Intelligent Design Sort — Joke Simulation', { maximum: 32, tags: ['Joke simulation'] }),
    seed('Guess Sort — Simulated', { maximum: 32 }),
    seed('Lucky Sort — Simulated', { maximum: 32 }),
    seed('Random Swap Sort', { maximum: 32 }),
    seed('Random Pair Sort', { maximum: 32 }),
    seed('Recursive Bogo Sort', { maximum: 7, tags: ['Pathological'] }),
  ]),
]

const parallelAlgorithms = catalogGroup(
  'Parallel and multicore sorts',
  'merge',
  'simulated-parallel',
  4096,
  [
    seed('Parallel Bubble Sort', { workerKind: 'bubble', maximum: 512 }),
    seed('Parallel Odd–Even Sort', { workerKind: 'bubble', maximum: 1024 }),
    seed('Parallel Rank Sort', { workerKind: 'selection', maximum: 1024 }),
    'Parallel Merge Sort',
    'Parallel Multiway Merge Sort',
    seed('Parallel Quicksort', { workerKind: 'quick' }),
    seed('Parallel Heapsort', { workerKind: 'heap' }),
    seed('Parallel Radix Sort', { workerKind: 'radix' }),
    seed('Parallel Sample Sort', { workerKind: 'quick' }),
    seed('Parallel Sorting by Regular Sampling', { workerKind: 'quick' }),
    seed('Hyperquicksort', { workerKind: 'quick' }),
    seed('Parallel Cubesort', { workerKind: 'heap' }),
    seed('Multilevel Sample Sort', { workerKind: 'quick' }),
    seed('IPS4o', { workerKind: 'quick' }),
    seed('PS4o', { workerKind: 'quick' }),
    seed('RAMS', { workerKind: 'quick' }),
    'Work-Stealing Merge Sort — Simulated',
    'NUMA-Aware Sort — Simulated',
  ],
)

const gpuAlgorithms = catalogGroup('GPU and vectorized sorts', 'bitonic', 'simulated-gpu', 4096, [
  seed('GPU Bitonic Sort', { powerOfTwo: true }),
  seed('GPU Merge Sort', { workerKind: 'merge' }),
  seed('GPU Radix Sort', { workerKind: 'radix' }),
  seed('GPU Sample Sort', { workerKind: 'quick' }),
  seed('Multistep Bitonic Sort', { powerOfTwo: true }),
  seed('Adaptive Bitonic Sort', { powerOfTwo: true }),
  seed('Vectorized Quicksort', { workerKind: 'quick' }),
  seed('Vectorized Radix Sort', { workerKind: 'radix' }),
  seed('SIMD Network Sort', { powerOfTwo: true }),
  seed('Warp-Level Bitonic Sort — Simulated', { maximum: 1024, powerOfTwo: true }),
  seed('Block-Level GPU Sort — Simulated', { powerOfTwo: true }),
  seed('WebGPU Compute Sort — Experimental', {
    executionMode: 'experimental',
    powerOfTwo: true,
    tags: ['CPU fallback'],
  }),
])

const externalAlgorithms = catalogGroup(
  'External and out-of-core sorts',
  'merge',
  'simulated-external',
  4096,
  [
    'External Merge Sort',
    'External k-Way Merge Sort',
    'Replacement-Selection Sort',
    'Balanced Two-Way Merge Sort',
    'Balanced Multiway Merge Sort',
    'Nonbalanced Merge Sort',
    'Polyphase Merge Sort',
    'Optimal Polyphase Merge Sort',
    'Cascade Merge Sort',
    'Oscillating Merge Sort',
    'Optimal Merge Pattern',
    seed('External Quicksort', { workerKind: 'quick' }),
    seed('External Radix Sort', { workerKind: 'radix' }),
    seed('External Distribution Sort', { workerKind: 'radix' }),
    seed('External Tag Sort', { workerKind: 'selection' }),
    'Tape Merge Sort — Simulated',
    'Disk Run Sort — Simulated',
  ],
)

const mergedCatalog = [
  ...nativeAlgorithms,
  ...conceptualAlgorithms,
  ...parallelAlgorithms,
  ...gpuAlgorithms,
  ...externalAlgorithms,
]

/** Duplicate names from the source list resolve to their first, most specific catalog entry. */
export const sandboxAlgorithms = [...new Map(mergedCatalog.map((item) => [item.id, item])).values()]

export const sandboxExecutionLabels = modeLabels
