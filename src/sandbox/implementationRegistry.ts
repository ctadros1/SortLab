export type BrowserImplementationFidelity = 'actual' | 'parameterized' | 'simulation'

const exactBrowserImplementations = new Set([
  'quick-hoare',
  'merge-bottom-up',
  'heap',
  'radix-lsd',
  'bubble-optimized',
  'selection',
  'insertion',
  'shell',
  'counting',
  'bitonic',
  'bubble',
  'cocktail-shaker-sort',
  'odd-even-transposition-sort',
  'comb-sort',
  'gnome-sort',
  'exchange-sort',
  'restart-sort',
  'random-adjacent-swap-sort',
  'spin-the-bottle-sort',
  'annealing-sort',
  'double-selection-sort',
  'bingo-sort',
  'binary-insertion-sort',
  'pair-insertion-sort',
  'library-sort',
  'patience-sort',
  'strand-sort',
  'cycle-sort',
  'pancake-sort',
  'tournament-sort',
  'rank-sort',
  'tag-sort',
  'tree-sort',
  'avl-tree-sort',
  'red-black-tree-sort',
  'splay-sort',
  'cartesian-tree-sort',
  'bottom-up-heapsort',
  'ternary-heapsort',
  'd-ary-heapsort',
  'quick',
  'lomuto-quicksort',
  'randomized-quicksort',
  'median-of-three-quicksort',
  'tukey-ninther-quicksort',
  'three-way-quicksort',
  'dual-pivot-quicksort',
  'multi-pivot-quicksort',
  'stable-quicksort',
  'balanced-quicksort',
  'introsort',
  'merge',
  'natural-merge-sort',
  'two-way-merge-sort',
  'three-way-merge-sort',
  'k-way-merge-sort',
  'in-place-merge-sort',
  'rotation-merge-sort',
  'ping-pong-merge-sort',
  'timsort',
  'stable-counting-sort',
  'key-indexed-counting-sort',
  'pigeonhole-sort',
  'bucket-sort',
  'histogram-sort',
  'flashsort',
  'sample-sort',
  'msd-radix-sort',
  'binary-radix-sort',
  'american-flag-sort',
  'radix-exchange-sort',
  'in-place-radix-sort',
  'trie-sort',
  'base-4-radix-sort',
  'base-8-radix-sort',
  'base-10-radix-sort',
  'base-16-radix-sort',
  'base-256-radix-sort',
  'batcher-odd-even-mergesort',
  'minimum-comparator-networks-for-small-arrays',
  'stooge',
  'slow',
  'bogo',
  'deterministic-permutation-sort',
  'bozosort',
  'sleep-sort',
  'bead-sort',
  'random-swap-sort',
  'random-pair-sort',
])

const parameterizedPatterns = [
  /^shell-sort-.+-gaps$/,
  /^quicksort-.+-pivot$/,
  /^quicksort-(hoare|lomuto|three-way|dual-pivot)-partition$/,
  /^quicksort-(no|insertion-sort|heapsort|merge-sort|sorting-network)-fallback$/,
]

const parameterizedBrowserImplementations = new Set([
  'random-adjacent-swap-sort',
  'spin-the-bottle-sort',
  'annealing-sort',
  'library-sort',
  'multi-pivot-quicksort',
  'balanced-quicksort',
  'ping-pong-merge-sort',
  'in-place-radix-sort',
  'bogo',
  'bozosort',
  'sleep-sort',
  'bead-sort',
  'random-swap-sort',
  'random-pair-sort',
])

export function hasBrowserImplementation(id: string) {
  return (
    exactBrowserImplementations.has(id) ||
    parameterizedBrowserImplementations.has(id) ||
    parameterizedPatterns.some((pattern) => pattern.test(id))
  )
}

export function browserImplementationKind(id: string): BrowserImplementationFidelity {
  if (parameterizedBrowserImplementations.has(id)) return 'parameterized'
  if (exactBrowserImplementations.has(id)) return 'actual'
  if (parameterizedPatterns.some((pattern) => pattern.test(id))) return 'parameterized'
  return 'simulation'
}

export function browserImplementationNote(id: string) {
  const fidelity = browserImplementationKind(id)
  if (fidelity === 'actual')
    return 'Runs a dedicated implementation of this algorithm and emits its real comparisons, swaps, and writes.'
  if (fidelity === 'parameterized')
    return 'Runs a browser-safe implementation of the named behavior with deterministic bounds or documented family parameters.'
  return 'Uses a representative operation model; SortLab does not claim that this is the named production implementation.'
}
