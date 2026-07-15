import type { AlgorithmFamily, AlgorithmMeta } from '../types'

type Entry = Partial<AlgorithmMeta> &
  Pick<
    AlgorithmMeta,
    | 'id'
    | 'name'
    | 'family'
    | 'shortDescription'
    | 'centralIdea'
    | 'complexity'
    | 'stable'
    | 'inPlace'
    | 'adaptive'
    | 'comparisonBased'
  >

const defaultCode = [
  {
    id: 'scan',
    text: 'scan the active range',
    explanation: 'Inspect the values that are still unsorted.',
  },
  {
    id: 'compare',
    text: 'compare candidate values',
    explanation: 'Use the algorithm’s rule to decide their order.',
  },
  {
    id: 'move',
    text: 'move the chosen value',
    explanation: 'Swap or write the value into its next position.',
  },
  {
    id: 'repeat',
    text: 'repeat until the range is sorted',
    explanation: 'Continue on the remaining unsorted work.',
  },
]

function define(entry: Entry): AlgorithmMeta {
  return {
    aliases: [],
    steps: [
      `Identify the next ${entry.family.toLowerCase()}-sort operation.`,
      'Compare or distribute the active values using the algorithm’s rule.',
      'Move values while preserving every input item.',
      'Finalize the ordered range and repeat until complete.',
    ],
    example: 'Example: [4, 2, 3] becomes [2, 3, 4] as the highlighted rule is applied.',
    useCases: 'Best used when its data assumptions and operation costs match the problem.',
    disadvantages:
      'Its asymptotic bounds do not capture every cache, runtime, or data-distribution effect.',
    related:
      'Compare it with algorithms in the same family and with a general-purpose O(n log n) sort.',
    avoidWhen:
      'Avoid it when its worst-case bound, memory use, or input restrictions are unacceptable.',
    implementationNotes:
      'This implementation yields structured events so the UI can animate, narrate, count, and replay every step.',
    studentMistakes:
      'Common mistakes include off-by-one range errors, losing duplicate values, and confusing animation time with execution time.',
    restrictions: 'Accepts safe integers.',
    recommendedMax: 80,
    hardMax: 120,
    pseudocode: defaultCode,
    ...entry,
  }
}

const quadratic = { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' }
const nlogn = { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(log n)' }

export const algorithmRegistry: AlgorithmMeta[] = [
  define({
    id: 'bubble',
    name: 'Bubble Sort',
    aliases: ['sinking sort'],
    family: 'Exchange',
    shortDescription: 'Repeatedly swaps adjacent out-of-order pairs.',
    centralIdea: 'Large values “bubble” right one comparison at a time.',
    complexity: { ...quadratic, best: 'O(n²)' },
    stable: true,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    useCases: 'Introductory tracing and tiny datasets.',
    disadvantages: 'Performs many comparisons and swaps.',
    pseudocode: [
      {
        id: 'compare-adjacent',
        text: 'for each adjacent pair, compare A[i] and A[i+1]',
        explanation: 'Check whether the neighbors are in ascending order.',
      },
      {
        id: 'swap-adjacent',
        text: 'if A[i] > A[i+1], swap them',
        explanation: 'Move the larger neighbor one position right.',
      },
      {
        id: 'finish-pass',
        text: 'finalize the rightmost unsorted position',
        explanation: 'The pass leaves its maximum at the end.',
      },
    ],
  }),
  define({
    id: 'bubble-optimized',
    name: 'Optimized Bubble Sort',
    family: 'Exchange',
    shortDescription: 'Bubble Sort with an early exit after a swap-free pass.',
    centralIdea: 'A pass with no swaps proves the array is sorted.',
    complexity: { ...quadratic, best: 'O(n)' },
    stable: true,
    inPlace: true,
    adaptive: true,
    comparisonBased: true,
    related: 'Bubble Sort with a useful best-case improvement.',
    pseudocode: [
      {
        id: 'compare-adjacent',
        text: 'compare each adjacent pair',
        explanation: 'Look for an inversion in the current pass.',
      },
      {
        id: 'swap-adjacent',
        text: 'swap out-of-order neighbors; set swapped = true',
        explanation: 'Remember that the pass made a change.',
      },
      {
        id: 'stop-if-no-swaps',
        text: 'if no swaps occurred, stop',
        explanation: 'No adjacent inversion means the whole array is sorted.',
      },
    ],
  }),
  define({
    id: 'selection',
    name: 'Selection Sort',
    family: 'Selection',
    shortDescription: 'Selects the smallest remaining value for each position.',
    centralIdea: 'Grow a sorted prefix by repeatedly finding the minimum.',
    complexity: quadratic,
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    useCases: 'Tiny arrays when writes are much more expensive than comparisons.',
    disadvantages: 'Always makes roughly n²/2 comparisons.',
    pseudocode: [
      {
        id: 'set-minimum',
        text: 'minimum = start',
        explanation: 'Begin with the first unsorted value as the candidate.',
      },
      {
        id: 'scan-unsorted',
        text: 'scan the rest for a smaller value',
        explanation: 'Update the candidate when a smaller value is found.',
      },
      {
        id: 'place-minimum',
        text: 'swap minimum into start',
        explanation: 'Place the smallest remaining value into its final position.',
      },
    ],
  }),
  define({
    id: 'insertion',
    name: 'Insertion Sort',
    family: 'Insertion',
    shortDescription: 'Inserts each value into an already sorted prefix.',
    centralIdea: 'Shift larger values right to open a place for the key.',
    complexity: { ...quadratic, best: 'O(n)' },
    stable: true,
    inPlace: true,
    adaptive: true,
    comparisonBased: true,
    useCases: 'Small or nearly sorted arrays; base cases in hybrid sorts.',
    pseudocode: [
      {
        id: 'compare-key',
        text: 'while the prior value is greater than key',
        explanation: 'Find where the key belongs in the sorted prefix.',
      },
      {
        id: 'shift-right',
        text: 'shift the prior value one place right',
        explanation: 'Open space without losing the value.',
      },
      {
        id: 'insert-key',
        text: 'write key into the open position',
        explanation: 'The sorted prefix grows by one.',
      },
    ],
  }),
  define({
    id: 'binary-insertion',
    name: 'Binary Insertion Sort',
    family: 'Insertion',
    shortDescription: 'Uses binary search to find each insertion point.',
    centralIdea: 'Reduce comparisons for position finding, while shifts remain linear.',
    complexity: { ...quadratic, best: 'O(n log n)' },
    stable: true,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    disadvantages: 'Binary search does not remove the O(n) shifting cost.',
    pseudocode: [
      {
        id: 'binary-compare',
        text: 'binary-search the sorted prefix',
        explanation: 'Halve the candidate insertion range.',
      },
      {
        id: 'shift-right',
        text: 'shift values after the insertion point',
        explanation: 'Open the chosen position.',
      },
      {
        id: 'insert-key',
        text: 'write key at the insertion point',
        explanation: 'Preserve duplicate order by inserting after equals.',
      },
    ],
  }),
  define({
    id: 'cocktail',
    name: 'Cocktail Shaker Sort',
    family: 'Exchange',
    shortDescription: 'Bubble passes alternate left-to-right and right-to-left.',
    centralIdea: 'Move both large and small misplaced values in each round.',
    complexity: { ...quadratic, best: 'O(n)' },
    stable: true,
    inPlace: true,
    adaptive: true,
    comparisonBased: true,
  }),
  define({
    id: 'gnome',
    name: 'Gnome Sort',
    family: 'Exchange',
    shortDescription: 'Swaps backward until local order is restored.',
    centralIdea: 'Walk forward on order and step backward after a swap.',
    complexity: { ...quadratic, best: 'O(n)' },
    stable: true,
    inPlace: true,
    adaptive: true,
    comparisonBased: true,
  }),
  define({
    id: 'comb',
    name: 'Comb Sort',
    family: 'Exchange',
    shortDescription: 'Compares distant pairs with a shrinking gap.',
    centralIdea: 'Remove small values near the end before finishing like Bubble Sort.',
    complexity: { best: 'O(n log n)', average: 'O(n² / 2ᵖ)', worst: 'O(n²)', space: 'O(1)' },
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
  }),
  define({
    id: 'odd-even',
    name: 'Odd–Even Sort',
    family: 'Exchange',
    shortDescription: 'Alternates compare-exchange phases on odd and even pairs.',
    centralIdea: 'Independent neighboring pairs can be processed in phases.',
    complexity: quadratic,
    stable: true,
    inPlace: true,
    adaptive: true,
    comparisonBased: true,
  }),

  define({
    id: 'merge',
    name: 'Merge Sort',
    family: 'Merge',
    shortDescription: 'Splits the array, sorts each half, and merges them.',
    centralIdea: 'Merging two sorted ranges is linear.',
    complexity: { ...nlogn, space: 'O(n)' },
    stable: true,
    inPlace: false,
    adaptive: false,
    comparisonBased: true,
    useCases: 'Stable predictable sorting and linked/external data.',
    pseudocode: [
      {
        id: 'select-ranges',
        text: 'split until each range has one item',
        explanation: 'Single-item ranges are already sorted.',
      },
      {
        id: 'compare-fronts',
        text: 'compare the front values of both ranges',
        explanation: 'Take the smaller next value.',
      },
      {
        id: 'copy-back',
        text: 'copy the merged output back',
        explanation: 'Replace the two ranges with one sorted range.',
      },
    ],
  }),
  define({
    id: 'merge-top-down',
    name: 'Top-Down Merge Sort',
    family: 'Merge',
    shortDescription: 'The recursive form of Merge Sort.',
    centralIdea: 'Recursively divide before merging upward.',
    complexity: { ...nlogn, space: 'O(n)' },
    stable: true,
    inPlace: false,
    adaptive: false,
    comparisonBased: true,
  }),
  define({
    id: 'merge-bottom-up',
    name: 'Bottom-Up Merge Sort',
    family: 'Merge',
    shortDescription: 'Iteratively merges runs of width 1, 2, 4, and so on.',
    centralIdea: 'Build larger sorted runs without recursion.',
    complexity: { ...nlogn, space: 'O(n)' },
    stable: true,
    inPlace: false,
    adaptive: false,
    comparisonBased: true,
  }),

  define({
    id: 'quick',
    name: 'Quick Sort',
    aliases: ['quicksort'],
    family: 'Partition',
    shortDescription: 'Partitions around a pivot, then sorts both sides.',
    centralIdea: 'Put smaller and larger values on opposite sides of a pivot.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
  }),
  define({
    id: 'quick-lomuto',
    name: 'Quick Sort (Lomuto)',
    family: 'Partition',
    shortDescription: 'Uses one moving boundary and the rightmost pivot.',
    centralIdea: 'Scan once while growing the ≤ pivot region.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
  }),
  define({
    id: 'quick-hoare',
    name: 'Quick Sort (Hoare)',
    family: 'Partition',
    shortDescription: 'Scans inward from both ends around a pivot value.',
    centralIdea: 'Swap values found on the wrong side of the pivot.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    pseudocode: [
      {
        id: 'choose-pivot',
        text: 'pivot = middle value',
        explanation: 'Choose the partition reference value.',
      },
      {
        id: 'scan-inward',
        text: 'move i right and j left until misplaced values appear',
        explanation: 'Find a pair on the wrong sides.',
      },
      {
        id: 'swap-misplaced',
        text: 'if i < j, swap A[i] and A[j]',
        explanation: 'Move both values toward their correct partition.',
      },
    ],
  }),
  define({
    id: 'quick-randomized',
    name: 'Randomized Quick Sort',
    family: 'Partition',
    shortDescription: 'Chooses a deterministic seeded-looking pivot position before partitioning.',
    centralIdea: 'Varying pivot choice reduces dependence on input order.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    implementationNotes:
      'The visualizer derives a reproducible pivot from the current range so runs can be replayed.',
  }),
  define({
    id: 'quick-three-way',
    name: 'Three-Way Quick Sort',
    family: 'Partition',
    shortDescription: 'Partitions into less-than, equal-to, and greater-than regions.',
    centralIdea: 'Group duplicates with the pivot in one pass.',
    complexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
    stable: false,
    inPlace: true,
    adaptive: true,
    comparisonBased: true,
    useCases: 'Data with many duplicate keys.',
  }),
  define({
    id: 'heap',
    name: 'Heap Sort',
    family: 'Heap',
    shortDescription: 'Builds a max heap and repeatedly extracts its root.',
    centralIdea: 'A heap keeps the largest remaining value at index 0.',
    complexity: nlogn,
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    useCases: 'Predictable O(n log n) time with constant auxiliary storage.',
  }),
  define({
    id: 'shell',
    name: 'Shell Sort',
    family: 'Insertion',
    shortDescription: 'Runs insertion sort across shrinking gaps.',
    centralIdea: 'Move far-away values early, then finish with gap 1.',
    complexity: { best: 'O(n log n)', average: 'depends on gaps', worst: 'O(n²)', space: 'O(1)' },
    stable: false,
    inPlace: true,
    adaptive: true,
    comparisonBased: true,
    restrictions: 'Uses a simple halving gap sequence; other sequences have different bounds.',
  }),

  define({
    id: 'timsort',
    name: 'TimSort-Inspired',
    family: 'Hybrid',
    shortDescription: 'Sorts small runs with insertion sort, then merges them.',
    centralIdea: 'Combine efficient small-run sorting with stable merging.',
    complexity: { ...nlogn, best: 'O(n)', space: 'O(n)' },
    stable: true,
    inPlace: false,
    adaptive: true,
    comparisonBased: true,
    approximation: true,
    implementationNotes:
      'Educational approximation: fixed-size runs plus stable merges. It is not Python or Java’s production TimSort.',
  }),
  define({
    id: 'introsort',
    name: 'IntroSort-Inspired',
    family: 'Hybrid',
    shortDescription:
      'Uses Quick Sort, switches to Heap Sort at a depth limit, and insertion-sorts small ranges.',
    centralIdea: 'Protect Quick Sort from pathological recursion.',
    complexity: nlogn,
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    approximation: true,
    implementationNotes:
      'Educational approximation, not the exact C++ standard-library implementation.',
  }),

  define({
    id: 'counting',
    name: 'Counting Sort',
    family: 'Distribution',
    shortDescription: 'Counts each integer value and writes values back in order.',
    centralIdea: 'Value range replaces pairwise comparison.',
    complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)', space: 'O(k)' },
    stable: false,
    inPlace: false,
    adaptive: false,
    comparisonBased: false,
    restrictions: 'Integers only; k is the value range and is capped at 5,000 for visualization.',
    recommendedMax: 120,
    hardMax: 250,
  }),
  define({
    id: 'radix-lsd',
    name: 'Radix Sort (LSD)',
    family: 'Distribution',
    shortDescription: 'Processes digits from least significant to most significant.',
    centralIdea: 'Stable digit grouping builds total order.',
    complexity: {
      best: 'O(d(n + b))',
      average: 'O(d(n + b))',
      worst: 'O(d(n + b))',
      space: 'O(n + b)',
    },
    stable: true,
    inPlace: false,
    adaptive: false,
    comparisonBased: false,
    restrictions:
      'Safe integers; d is digit count and b is radix 10. Negative values are handled by sign partitioning.',
  }),
  define({
    id: 'radix-msd',
    name: 'Radix Sort (MSD)',
    family: 'Distribution',
    shortDescription: 'Partitions first by the most significant digit.',
    centralIdea: 'Top digits create broad ordered groups before finer digits.',
    complexity: {
      best: 'O(d(n + b))',
      average: 'O(d(n + b))',
      worst: 'O(d(n + b))',
      space: 'O(n + b)',
    },
    stable: true,
    inPlace: false,
    adaptive: false,
    comparisonBased: false,
    approximation: true,
    implementationNotes:
      'The educational implementation uses sign-aware radix ordering and visualizes the top-level distribution.',
  }),
  define({
    id: 'bucket',
    name: 'Bucket Sort',
    family: 'Distribution',
    shortDescription: 'Distributes values into ranges, sorts each bucket, and concatenates them.',
    centralIdea: 'A roughly uniform distribution makes small buckets cheap to sort.',
    complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n²)', space: 'O(n + k)' },
    stable: false,
    inPlace: false,
    adaptive: false,
    comparisonBased: false,
    restrictions: 'Performance depends on distribution and bucket policy.',
  }),
  define({
    id: 'pigeonhole',
    name: 'Pigeonhole Sort',
    family: 'Distribution',
    shortDescription: 'Places each integer into a hole for its exact value.',
    centralIdea: 'Direct addressing turns ordering into counting.',
    complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)', space: 'O(k)' },
    stable: false,
    inPlace: false,
    adaptive: false,
    comparisonBased: false,
    restrictions:
      'Integers only; this implementation shares Counting Sort’s 5,000-value range cap.',
  }),

  define({
    id: 'cycle',
    name: 'Cycle Sort',
    family: 'Selection',
    shortDescription: 'Rotates each value directly into its final position.',
    centralIdea: 'Minimize writes by following permutation cycles.',
    complexity: quadratic,
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    useCases: 'Teaching write minimization; niche memory-wear scenarios.',
    studentMistakes:
      'Duplicates require skipping equal destination values to avoid endless cycles.',
  }),
  define({
    id: 'pancake',
    name: 'Pancake Sort',
    family: 'Selection',
    shortDescription: 'Sorts using only prefix reversals.',
    centralIdea: 'Flip the current maximum to the front, then to its final end position.',
    complexity: quadratic,
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
  }),
  define({
    id: 'strand',
    name: 'Strand Sort',
    family: 'Merge',
    shortDescription: 'Extracts increasing strands and merges them into output.',
    centralIdea: 'Natural ordered subsequences become merge inputs.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(n)' },
    stable: true,
    inPlace: false,
    adaptive: true,
    comparisonBased: true,
  }),
  define({
    id: 'tree',
    name: 'Tree Sort',
    family: 'Selection',
    shortDescription: 'Inserts values into a binary search tree, then traverses in order.',
    centralIdea: 'Tree shape encodes comparison order.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(n)' },
    stable: false,
    inPlace: false,
    adaptive: false,
    comparisonBased: true,
    disadvantages: 'An unbalanced tree degenerates to a chain.',
  }),
  define({
    id: 'tournament',
    name: 'Tournament Sort',
    family: 'Selection',
    shortDescription: 'Repeatedly selects a winner through comparisons.',
    centralIdea: 'A tournament structure identifies the next smallest value.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    stable: false,
    inPlace: false,
    adaptive: false,
    comparisonBased: true,
    approximation: true,
    implementationNotes:
      'The educational visualizer rescans the shrinking candidate pool to make each match explicit.',
  }),
  define({
    id: 'bitonic',
    name: 'Bitonic Sort',
    family: 'Network',
    shortDescription: 'Uses a fixed compare-exchange network over bitonic sequences.',
    centralIdea: 'Structured parallel stages create and merge bitonic order.',
    complexity: {
      best: 'O(n log² n)',
      average: 'O(n log² n)',
      worst: 'O(n log² n)',
      space: 'O(1)',
    },
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    restrictions: 'Visualization size must be a power of two.',
    hardMax: 128,
  }),
  define({
    id: 'batcher-odd-even',
    name: 'Batcher Odd–Even Merge Sort',
    family: 'Network',
    shortDescription: 'Educational odd-even compare-exchange network.',
    centralIdea: 'Predetermined phases can run pair comparisons in parallel.',
    complexity: {
      best: 'O(n log² n)',
      average: 'O(n log² n)',
      worst: 'O(n log² n)',
      space: 'O(1)',
    },
    stable: true,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    restrictions: 'Visualization size must be a power of two.',
    approximation: true,
    implementationNotes:
      'The visual implementation uses repeated odd-even network phases for clarity rather than a hardware-optimized Batcher schedule.',
  }),

  define({
    id: 'stooge',
    name: 'Stooge Sort',
    family: 'Novelty',
    shortDescription: 'Recursively sorts overlapping two-thirds ranges three times.',
    centralIdea: 'An intentionally inefficient recursion demonstration.',
    complexity: { best: 'O(n²·⁷¹)', average: 'O(n²·⁷¹)', worst: 'O(n²·⁷¹)', space: 'O(log n)' },
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    recommendedMax: 12,
    hardMax: 30,
    warning: 'Intentionally impractical. Keep arrays tiny.',
  }),
  define({
    id: 'slow',
    name: 'Slow Sort',
    family: 'Novelty',
    shortDescription: 'A multiply recursive “pessimal” sorting algorithm.',
    centralIdea: 'Demonstrate how a correct algorithm can still be unusably slow.',
    complexity: {
      best: 'super-polynomial',
      average: 'super-polynomial',
      worst: 'super-polynomial',
      space: 'O(n)',
    },
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    recommendedMax: 10,
    hardMax: 22,
    warning: 'Intentionally pathological. A hard size cap protects the browser.',
  }),
  define({
    id: 'bogo',
    name: 'Bogo Sort',
    family: 'Novelty',
    shortDescription: 'Shuffles until sorted, with a deterministic safety fallback.',
    centralIdea: 'Illustrate factorial growth and the need for guardrails.',
    complexity: { best: 'O(n)', average: 'O(n·n!)', worst: 'unbounded', space: 'O(1)' },
    stable: false,
    inPlace: true,
    adaptive: false,
    comparisonBased: true,
    recommendedMax: 6,
    hardMax: 8,
    warning:
      'Maximum 8 values. The visualizer stops shuffling after a safe attempt limit and finishes with Insertion Sort.',
    approximation: true,
  }),
]

export const algorithmById = new Map(
  algorithmRegistry.map((algorithm) => [algorithm.id, algorithm]),
)

export const families: AlgorithmFamily[] = [
  'Exchange',
  'Selection',
  'Insertion',
  'Merge',
  'Partition',
  'Heap',
  'Distribution',
  'Network',
  'Hybrid',
  'Novelty',
]

export function validateAlgorithmInput(id: string, values: number[]) {
  const algorithm = algorithmById.get(id)
  if (!algorithm) return `Unknown algorithm: ${id}`
  if (values.length > algorithm.hardMax)
    return `${algorithm.name} is limited to ${algorithm.hardMax} values in visualization mode.`
  if (
    (id === 'bitonic' || id === 'batcher-odd-even') &&
    values.length > 1 &&
    (values.length & (values.length - 1)) !== 0
  ) {
    return `${algorithm.name} requires a power-of-two array size such as 8, 16, 32, or 64.`
  }
  if (
    (id === 'counting' || id === 'pigeonhole') &&
    values.length > 0 &&
    Math.max(...values) - Math.min(...values) > 5000
  ) {
    return `${algorithm.name} is limited to a value range of 5,000 in visualization mode.`
  }
  return null
}
