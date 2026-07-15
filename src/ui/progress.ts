export function calculateProgressMilestones(total: number, maximum = 48) {
  if (total <= 0) return []
  const count = Math.min(total, maximum)
  if (count === 1) return [1]
  return Array.from({ length: count }, (_, index) =>
    Math.round(1 + (index * (total - 1)) / (count - 1)),
  )
}
