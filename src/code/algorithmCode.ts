import type { AlgorithmMeta } from '../types'

export const codeLanguages = [
  { id: 'pseudocode', label: 'Pseudocode', abbreviation: 'PS' },
  { id: 'c_cpp', label: 'C / C++', abbreviation: 'C/C++' },
  { id: 'java', label: 'Java', abbreviation: 'JV' },
  { id: 'python', label: 'Python', abbreviation: 'PY' },
  { id: 'typescript', label: 'TypeScript', abbreviation: 'TS' },
] as const

export type CodeLanguage = (typeof codeLanguages)[number]['id']
export type SyntaxTokenKind = 'keyword' | 'function' | 'number' | 'string' | 'comment' | 'plain'

export interface SyntaxToken {
  text: string
  kind: SyntaxTokenKind
}

export interface CodeLine {
  id: string
  text: string
  explanation: string
  indent: number
  tokens: SyntaxToken[]
}

export interface AlgorithmCodeSnippet {
  algorithmId: string
  language: CodeLanguage
  lines: CodeLine[]
}

export const CODE_LANGUAGE_STORAGE_KEY = 'sortlab.code-language.v1'

const commonDone = ['done']

export const semanticIdsByAlgorithm: Record<string, string[]> = {
  bubble: ['compare-adjacent', 'swap-adjacent', 'finish-pass', ...commonDone],
  'bubble-optimized': ['compare-adjacent', 'swap-adjacent', 'stop-if-no-swaps', ...commonDone],
  selection: ['set-minimum', 'scan-unsorted', 'place-minimum', 'finalize-position', ...commonDone],
  insertion: ['compare-key', 'shift-right', 'insert-key', ...commonDone],
  'binary-insertion': ['binary-compare', 'shift-right', 'insert-key', ...commonDone],
  cocktail: ['forward-compare', 'forward-swap', 'backward-compare', 'backward-swap', ...commonDone],
  gnome: ['compare-neighbors', 'swap-and-step-back', ...commonDone],
  comb: ['compare-gap', 'swap-gap', ...commonDone],
  'odd-even': ['odd-phase', 'even-phase', 'compare-exchange', ...commonDone],
  merge: ['select-ranges', 'compare-fronts', 'copy-back', 'range-merged', ...commonDone],
  'merge-top-down': ['select-ranges', 'compare-fronts', 'copy-back', 'range-merged', ...commonDone],
  'merge-bottom-up': [
    'select-ranges',
    'compare-fronts',
    'copy-back',
    'range-merged',
    ...commonDone,
  ],
  quick: ['choose-pivot', 'scan-inward', 'swap-misplaced', ...commonDone],
  'quick-lomuto': ['choose-pivot', 'compare-pivot', 'move-left', 'place-pivot', ...commonDone],
  'quick-hoare': ['choose-pivot', 'scan-inward', 'swap-misplaced', ...commonDone],
  'quick-randomized': [
    'choose-random-pivot',
    'choose-pivot',
    'compare-pivot',
    'move-left',
    'place-pivot',
    ...commonDone,
  ],
  'quick-three-way': ['choose-pivot', 'compare-pivot', 'move-less', 'move-greater', ...commonDone],
  heap: [
    'select-root',
    'compare-left-child',
    'compare-right-child',
    'swap-with-largest',
    'extract-maximum',
    'finalize-maximum',
    ...commonDone,
  ],
  shell: ['compare-key', 'shift-right', 'insert-key', ...commonDone],
  timsort: [
    'compare-key',
    'shift-right',
    'insert-key',
    'select-ranges',
    'compare-fronts',
    'copy-back',
    'range-merged',
    ...commonDone,
  ],
  introsort: [
    'compare-key',
    'shift-right',
    'insert-key',
    'heap-fallback',
    'choose-pivot',
    'compare-pivot',
    'move-left',
    'place-pivot',
    ...commonDone,
  ],
  counting: ['count-value', 'write-counts', ...commonDone],
  'radix-lsd': ['assign-digit-bucket', 'collect-buckets', ...commonDone],
  'radix-msd': ['split-most-significant-digit', 'collect-recursive-buckets', ...commonDone],
  bucket: ['assign-bucket', 'concatenate-buckets', ...commonDone],
  pigeonhole: ['count-value', 'write-counts', ...commonDone],
  cycle: ['count-smaller', 'rotate-item', ...commonDone],
  pancake: ['find-maximum', 'flip-prefix', ...commonDone],
  strand: ['extract-strand', 'merge-strand', ...commonDone],
  tree: ['insert-tree', 'inorder-write', ...commonDone],
  tournament: ['tournament-match', 'write-winner', ...commonDone],
  bitonic: ['compare-wire', 'compare-exchange', ...commonDone],
  'batcher-odd-even': ['network-compare', 'compare-exchange', ...commonDone],
  'double-selection': ['scan', 'compare', 'move', 'repeat', ...commonDone],
  'merge-natural': [
    'scan',
    'select-ranges',
    'compare-fronts',
    'copy-back',
    'range-merged',
    ...commonDone,
  ],
  'quick-dual-pivot': ['scan', 'compare', 'move', 'repeat', ...commonDone],
  smoothsort: ['scan', 'compare', 'move', 'repeat', ...commonDone],
  patience: ['compare', 'move', ...commonDone],
  'radix-binary': ['scan', 'move', 'repeat', ...commonDone],
  'american-flag': ['scan', 'move', ...commonDone],
  flashsort: ['scan', 'move', 'compare-key', 'shift-right', 'insert-key', ...commonDone],
  library: ['scan', 'compare', 'move', 'repeat', ...commonDone],
  'parallel-merge-simulated': [
    'scan',
    'compare-key',
    'shift-right',
    'insert-key',
    'select-ranges',
    'compare-fronts',
    'copy-back',
    'range-merged',
    'repeat',
    ...commonDone,
  ],
  'sample-sort-simulated': ['scan', 'move', ...commonDone],
  'sleep-sort-simulated': ['scan', 'move', 'repeat', ...commonDone],
  'bead-sort-simulated': ['scan', 'move', 'repeat', ...commonDone],
  stooge: ['compare-ends', 'swap-ends', ...commonDone],
  slow: ['compare-maxima', 'move-maximum', ...commonDone],
  bogo: [
    'shuffle',
    'check-sorted',
    'safety-fallback',
    'compare-key',
    'shift-right',
    'insert-key',
    ...commonDone,
  ],
}

const pseudocodeText: Record<string, string> = {
  scan: 'scan the active values using this algorithm’s structural rule',
  compare: 'compare the active candidates or partition boundaries',
  move: 'move the chosen value into its next structural position',
  repeat: 'repeat the current phase on the remaining work',
  'compare-adjacent': 'compare adjacent values a[i] and a[i + 1]',
  'swap-adjacent': 'if out of order, swap a[i] and a[i + 1]',
  'finish-pass': 'finalize the rightmost value in this pass',
  'stop-if-no-swaps': 'if no swaps occurred, stop early',
  'set-minimum': 'set the first unsorted value as the minimum',
  'scan-unsorted': 'compare the minimum with the next candidate',
  'place-minimum': 'swap the minimum into the sorted prefix',
  'finalize-position': 'finalize the next prefix position',
  'compare-key': 'compare the key with the preceding gap value',
  'shift-right': 'shift the larger value one gap to the right',
  'insert-key': 'write the key into the open position',
  'binary-compare': 'binary-search the sorted prefix for the key',
  'forward-compare': 'compare neighbors from left to right',
  'forward-swap': 'swap an inverted pair during the forward sweep',
  'backward-compare': 'compare neighbors from right to left',
  'backward-swap': 'swap an inverted pair during the backward sweep',
  'compare-neighbors': 'compare the current value with its left neighbor',
  'swap-and-step-back': 'swap the pair and step one position left',
  'compare-gap': 'compare values separated by the current gap',
  'swap-gap': 'swap the separated values when out of order',
  'odd-phase': 'compare every odd-indexed adjacent pair',
  'even-phase': 'compare every even-indexed adjacent pair',
  'compare-exchange': 'exchange the pair when the network direction requires it',
  'select-ranges': 'select two adjacent sorted ranges',
  'compare-fronts': 'take the smaller front value from either range',
  'copy-back': 'write the merged value back into the array',
  'range-merged': 'mark the combined range as merged',
  'choose-random-pivot': 'move a deterministic random pivot to the partition edge',
  'choose-pivot': 'choose the pivot for the active range',
  'compare-pivot': 'compare the scan value with the pivot',
  'move-left': 'move a smaller value into the left partition',
  'place-pivot': 'place the pivot between the partitions',
  'scan-inward': 'scan inward from both ends toward the pivot',
  'swap-misplaced': 'swap values found on the wrong sides',
  'move-less': 'move the value into the less-than partition',
  'move-greater': 'move the value into the greater-than partition',
  'select-root': 'restore heap order below the current root',
  'compare-left-child': 'compare the root candidate with its left child',
  'compare-right-child': 'compare the largest candidate with its right child',
  'swap-with-largest': 'swap the root with its largest child and recurse',
  'extract-maximum': 'move the heap maximum to the sorted suffix',
  'finalize-maximum': 'finalize the extracted maximum',
  'heap-fallback': 'use heap sort when the recursion depth limit is reached',
  'count-value': 'increment the count for the current value',
  'write-counts': 'write counted values back in ascending order',
  'assign-digit-bucket': 'place the value into its current digit bucket',
  'collect-buckets': 'collect digit buckets from low to high',
  'split-most-significant-digit': 'split values by their most significant digit',
  'collect-recursive-buckets': 'collect recursively sorted digit buckets',
  'assign-bucket': 'map the value into its proportional bucket',
  'concatenate-buckets': 'concatenate sorted buckets into the array',
  'count-smaller': 'count values smaller than the cycle item',
  'rotate-item': 'rotate the item into its final cycle position',
  'find-maximum': 'find the maximum in the unsorted prefix',
  'flip-prefix': 'reverse the prefix to move its maximum',
  'extract-strand': 'extract an increasing strand from remaining values',
  'merge-strand': 'merge the strand into the sorted output',
  'insert-tree': 'insert the value into the binary search tree',
  'inorder-write': 'write the tree in in-order traversal order',
  'tournament-match': 'compare candidates and retain the smaller winner',
  'write-winner': 'write each tournament winner to the output',
  'compare-wire': 'compare the two values connected by this bitonic wire',
  'network-compare': 'compare the adjacent pair for this network phase',
  'compare-ends': 'compare the first and last values of the range',
  'swap-ends': 'swap the range ends when they are inverted',
  'compare-maxima': 'compare maxima returned by the recursive halves',
  'move-maximum': 'move the larger maximum to the range end',
  shuffle: 'shuffle the array using the next deterministic permutation',
  'check-sorted': 'check whether the shuffled array is sorted',
  'safety-fallback': 'after the safety limit, finish with insertion sort',
  done: 'mark every value sorted and finish',
}

const explanations: Record<string, string> = {
  done: 'The algorithm has completed, so the final state can be marked sorted.',
  'compare-fronts': 'Only the smallest unmerged front value can be next in the merged range.',
  'scan-inward': 'Hoare partitioning advances both scans until it finds misplaced values.',
  'compare-pivot': 'The comparison decides which side of the pivot receives the current value.',
  'heap-fallback': 'IntroSort changes strategy here to keep its worst-case bound under control.',
}

function humanize(id: string) {
  return id.replaceAll('-', ' ')
}

function snake(id: string) {
  return id.replaceAll('-', '_')
}

function camel(id: string) {
  return id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

function codeFor(id: string, language: CodeLanguage, algorithmId: string) {
  const functionName = snake(algorithmId)
  if (id === 'structure.start') {
    if (language === 'pseudocode') return `procedure ${functionName}(a)`
    if (language === 'python') return `def ${functionName}(a):`
    if (language === 'c_cpp') return `void ${functionName}(int a[], size_t n) {`
    if (language === 'java') return `static void ${camel(algorithmId)}(int[] a) {`
    if (language === 'typescript') return `function ${camel(algorithmId)}(a: number[]): void {`
    return `function ${camel(algorithmId)}(a) {`
  }
  if (id === 'structure.end') {
    if (language === 'pseudocode') return 'end procedure'
    return language === 'python' ? `# end ${functionName}` : '}'
  }
  if (language === 'pseudocode') return pseudocodeText[id] ?? humanize(id)
  const operationName = snake(id)
  const quotedId = JSON.stringify(id)
  if (language === 'python') {
    if (id === 'done') return 'return a'
    return `${operationName}(a, state)`
  }
  if (id === 'done') return 'return a;'
  if (language === 'typescript') return `${operationName}(a, state satisfies SortState);`
  if (language === 'java') return `${operationName}(a, state);`
  if (language === 'c_cpp') return `${operationName}(a, &state);`
  return `step(${quotedId});`
}

const keywordPattern =
  /\b(for|while|if|else|return|break|continue|const|let|void|int|boolean|def|in|true|false|satisfies)\b/g

export function tokenizeCode(text: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  let cursor = 0
  for (const match of text.matchAll(keywordPattern)) {
    const index = match.index ?? 0
    if (index > cursor) tokens.push({ text: text.slice(cursor, index), kind: 'plain' })
    tokens.push({ text: match[0], kind: 'keyword' })
    cursor = index + match[0].length
  }
  if (cursor < text.length) tokens.push({ text: text.slice(cursor), kind: 'plain' })
  return tokens.length ? tokens : [{ text, kind: 'plain' }]
}

export function getAlgorithmCodeSnippet(
  algorithm: Pick<AlgorithmMeta, 'id'>,
  language: CodeLanguage,
): AlgorithmCodeSnippet {
  const ids = [
    'structure.start',
    ...(semanticIdsByAlgorithm[algorithm.id] ?? ['done']),
    'structure.end',
  ]
  return {
    algorithmId: algorithm.id,
    language,
    lines: ids.map((id) => {
      const text = codeFor(id, language, algorithm.id)
      return {
        id,
        text,
        indent: id === 'structure.start' || id === 'structure.end' ? 0 : 1,
        explanation:
          id === 'structure.start'
            ? `Begin the concise ${algorithm.id.replaceAll('-', ' ')} sorting logic.`
            : id === 'structure.end'
              ? 'End the algorithm logic.'
              : (explanations[id] ??
                `${(pseudocodeText[id] ?? humanize(id)).replace(/^./, (letter) => letter.toUpperCase())}.`),
        tokens: tokenizeCode(text),
      }
    }),
  }
}

export function resolveActiveSemanticLine(
  algorithmId: string,
  requestedId: string | undefined,
  phase: string | undefined,
) {
  if (!requestedId) return undefined
  const ids = semanticIdsByAlgorithm[algorithmId] ?? []
  if (ids.includes(requestedId)) return requestedId
  const fallback =
    ids.find((id) => phase && humanize(id).includes(phase.toLowerCase().split(' ')[0])) ?? ids[0]
  if (import.meta.env.DEV)
    console.warn(
      `[SortLab] Missing code-line mapping "${requestedId}" for ${algorithmId}; using "${fallback ?? 'none'}".`,
    )
  return fallback
}
