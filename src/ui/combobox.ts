export interface RichOption {
  id: string
  name: string
  group: string
  searchText: string
  disabled?: boolean
  disabledReason?: string
}

export function nextEnabledIndex(
  options: Array<Pick<RichOption, 'disabled'>>,
  current: number,
  direction: 1 | -1,
) {
  if (options.length === 0) return -1
  for (let offset = 1; offset <= options.length; offset += 1) {
    const candidate = (current + direction * offset + options.length) % options.length
    if (!options[candidate]?.disabled) return candidate
  }
  return -1
}

export function filterRichOptions<T extends RichOption>(options: T[], query: string) {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  const normalized = normalize(query)
  if (!normalized) return options
  return options.filter((option) => normalize(option.searchText).includes(normalized))
}
