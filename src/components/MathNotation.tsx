import type { ReactNode } from 'react'
import { complexityLabel, complexityParts } from '../ui/math'

export function MathNotation({ value }: { value: string }) {
  const children: ReactNode[] = complexityParts(value).map((part, index) => {
    if (part.kind === 'variable') return <var key={index}>{part.value}</var>
    if (part.kind === 'sup') return <sup key={index}>{part.value}</sup>
    return <span key={index}>{part.value}</span>
  })
  return (
    <span className="math-notation" aria-label={complexityLabel(value)}>
      <span aria-hidden="true">{children}</span>
    </span>
  )
}
