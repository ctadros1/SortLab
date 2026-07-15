const superscripts: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  ⁿ: 'n',
  ᵖ: 'p',
}

export type MathPart = { kind: 'text' | 'variable' | 'sup'; value: string }

export function complexityParts(value: string): MathPart[] {
  const parts: MathPart[] = []
  let text = ''
  const flush = () => {
    if (text) parts.push({ kind: 'text', value: text })
    text = ''
  }
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (superscripts[character]) {
      flush()
      let exponent = superscripts[character]
      while (superscripts[value[index + 1]]) {
        index += 1
        exponent += superscripts[value[index]]
      }
      parts.push({ kind: 'sup', value: exponent })
    } else if (['n', 'k', 'd', 'b', 'p'].includes(character)) {
      const word = value.slice(index, index + 3)
      if (word === 'log') {
        text += word
        index += 2
      } else {
        flush()
        parts.push({ kind: 'variable', value: character })
      }
    } else text += character
  }
  flush()
  return parts
}

export function complexityLabel(value: string) {
  return value
    .replace(/^O\(/, 'Big O of ')
    .replace(/\)$/, '')
    .replaceAll('²', ' squared')
    .replaceAll('ⁿ', ' to the n')
    .replaceAll('ᵖ', ' to the p')
    .replaceAll('!', ' factorial')
    .replaceAll('·', ' times ')
    .replaceAll('+', ' plus ')
}
