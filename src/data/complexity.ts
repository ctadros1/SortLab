const factorial = (value: number) => {
  let result = 1
  for (let current = 2; current <= value; current += 1) result *= current
  return result
}

export const complexityCurves = [
  { id: 'constant', label: 'O(1)', color: 'curve-1', work: () => 1 },
  { id: 'logarithmic', label: 'O(log₂ n)', color: 'curve-2', work: (n: number) => Math.log2(n) },
  { id: 'linear', label: 'O(n)', color: 'curve-3', work: (n: number) => n },
  {
    id: 'linearithmic',
    label: 'O(n log₂ n)',
    color: 'curve-4',
    work: (n: number) => n * Math.log2(n),
  },
  { id: 'quadratic', label: 'O(n²)', color: 'curve-5', work: (n: number) => n ** 2 },
  { id: 'exponential', label: 'O(2ⁿ)', color: 'curve-6', work: (n: number) => 2 ** n },
  { id: 'factorial', label: 'O(n!)', color: 'curve-7', work: factorial },
] as const

export const complexityInputs = Array.from({ length: 9 }, (_, index) => index + 2)
