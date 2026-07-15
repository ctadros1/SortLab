import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react'
import {
  CODE_LANGUAGE_STORAGE_KEY,
  codeLanguages,
  getAlgorithmCodeSnippet,
  resolveActiveSemanticLine,
  type CodeLanguage,
  type CodeLine,
} from '../code/algorithmCode'
import type { AlgorithmMeta, SortEvent } from '../types'
import type { RichOption } from '../ui/combobox'
import { AlgorithmIcon, AppIcon } from './Icon'
import { MathNotation } from './MathNotation'
import { RichCombobox } from './RichCombobox'

interface LanguageOption extends RichOption {
  label: string
  abbreviation: string
}

const languageOptions: LanguageOption[] = codeLanguages.map((language) => ({
  ...language,
  name: language.label,
  group: 'Languages',
  searchText: `${language.label} ${language.abbreviation}`,
}))

function isCodeLanguage(value: string | null): value is CodeLanguage {
  return codeLanguages.some((language) => language.id === value)
}

function SyntaxLine({ line }: { line: CodeLine }) {
  return (
    <code aria-label={line.text} style={{ '--code-indent': line.indent } as React.CSSProperties}>
      <span aria-hidden="true">
        {line.tokens.map((token, index) => (
          <span className={`syntax-${token.kind}`} key={`${token.text}-${index}`}>
            {token.text}
          </span>
        ))}
      </span>
    </code>
  )
}

export function CodePanel({ algorithm, event }: { algorithm: AlgorithmMeta; event?: SortEvent }) {
  const [tab, setTab] = useState<'code' | 'explain'>('code')
  const [language, setLanguage] = useState<CodeLanguage>(() => {
    const stored =
      typeof window === 'undefined' ? null : window.localStorage.getItem(CODE_LANGUAGE_STORAGE_KEY)
    return isCodeLanguage(stored) ? stored : 'pseudocode'
  })
  const id = useId().replace(/:/g, '')
  const snippet = useMemo(() => getAlgorithmCodeSnippet(algorithm, language), [algorithm, language])
  const activeSemanticId = resolveActiveSemanticLine(algorithm.id, event?.codeLine, event?.phase)
  const activeLine = snippet.lines.find((line) => line.id === activeSemanticId)

  useEffect(() => {
    window.localStorage.setItem(CODE_LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const handleTabKeys = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setTab((current) => (current === 'code' ? 'explain' : 'code'))
  }

  return (
    <aside className="code-panel" aria-label={`${algorithm.name} code and explanation`}>
      <div className="panel-heading">
        <div>
          <span className="section-label">Algorithm guide</span>
          <h2>
            <AlgorithmIcon name={algorithm.icon} aria-hidden="true" /> {algorithm.name}
          </h2>
        </div>
        <span className="family-tag">{algorithm.family}</span>
      </div>
      <div className="code-tabs" role="tablist" aria-label="Algorithm guide views">
        <button
          type="button"
          role="tab"
          id={`${id}-code-tab`}
          aria-selected={tab === 'code'}
          aria-controls={`${id}-code-panel`}
          tabIndex={tab === 'code' ? 0 : -1}
          onKeyDown={handleTabKeys}
          onClick={() => setTab('code')}
        >
          <AppIcon name="code" aria-hidden="true" /> Code
        </button>
        <button
          type="button"
          role="tab"
          id={`${id}-explain-tab`}
          aria-selected={tab === 'explain'}
          aria-controls={`${id}-explain-panel`}
          tabIndex={tab === 'explain' ? 0 : -1}
          onKeyDown={handleTabKeys}
          onClick={() => setTab('explain')}
        >
          <AppIcon name="explain" aria-hidden="true" /> Explain
        </button>
      </div>

      {tab === 'code' ? (
        <div
          className="code-tab-panel"
          role="tabpanel"
          id={`${id}-code-panel`}
          aria-labelledby={`${id}-code-tab`}
        >
          <div className="code-language-row">
            <span>Language</span>
            <RichCombobox
              label="Code language"
              value={language}
              options={languageOptions}
              searchable={false}
              onChange={(value) => {
                if (isCodeLanguage(value)) setLanguage(value)
              }}
              renderSelected={(option) => (
                <span className="language-selection">
                  <AppIcon name="code" aria-hidden="true" />
                  <strong>{option.label}</strong>
                </span>
              )}
              renderOption={(option, selected) => (
                <span className="language-option">
                  <b aria-hidden="true">{option.abbreviation}</b>
                  <span>{option.label}</span>
                  {selected ? <AppIcon name="check" aria-hidden="true" /> : null}
                </span>
              )}
            />
          </div>
          <ol className="pseudocode" aria-label={`${algorithm.name} ${language} code`}>
            {snippet.lines.map((line, index) => {
              const current = line.id === activeSemanticId
              return (
                <li
                  className={current ? 'is-current' : ''}
                  data-semantic-line={line.id}
                  key={line.id}
                  aria-current={current ? 'step' : undefined}
                >
                  <span className="code-pointer" aria-hidden="true">
                    {current ? '›' : ''}
                  </span>
                  <span className="code-line-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <SyntaxLine line={line} />
                </li>
              )
            })}
          </ol>
          <section className="line-explanation" aria-live="polite">
            <h3>
              <AppIcon name="narration" aria-hidden="true" /> Current line
            </h3>
            <p>
              {activeLine?.explanation ??
                'Start the algorithm to connect each visual operation to this code.'}
            </p>
            <span className="sr-only">
              {activeLine ? `Current code line: ${activeLine.text}` : 'No active line yet.'}
            </span>
          </section>
        </div>
      ) : (
        <div
          className="explain-tab-panel"
          role="tabpanel"
          id={`${id}-explain-panel`}
          aria-labelledby={`${id}-explain-tab`}
        >
          <section>
            <h3>Plain-language summary</h3>
            <p>{algorithm.centralIdea}</p>
          </section>
          <div className="explain-status-grid">
            <section>
              <span>Current phase</span>
              <strong>{event?.phase ?? 'Ready'}</strong>
            </section>
            <section>
              <span>Current operation</span>
              <strong>{event?.narration ?? 'Waiting to start'}</strong>
            </section>
          </div>
          <section>
            <h3>Important invariant</h3>
            <p>{algorithm.invariant}</p>
          </section>
          <section>
            <h3>What to notice</h3>
            <p>{algorithm.notice}</p>
          </section>
          <section>
            <h3>Worked example</h3>
            <p>{algorithm.example}</p>
          </section>
          <section>
            <h3>Common mistake</h3>
            <p>{algorithm.studentMistakes}</p>
          </section>
        </div>
      )}

      <section className="complexity-summary" aria-label="Complexity and traits">
        <h3>Complexity</h3>
        <dl className="complexity-grid">
          {(
            [
              ['Worst', algorithm.complexity.worst],
              ['Average', algorithm.complexity.average],
              ['Best', algorithm.complexity.best],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                <MathNotation value={value} />
              </dd>
            </div>
          ))}
        </dl>
        <h3 className="traits-heading">Traits</h3>
        <div className="trait-badges" aria-label="Algorithm traits">
          <span data-positive={algorithm.stable}>
            <b>Stable</b> {algorithm.stable ? 'Yes' : 'No'}
          </span>
          <span data-positive={algorithm.inPlace}>
            <b>In place</b> {algorithm.inPlace ? 'Yes' : 'No'}
          </span>
          <span data-positive={algorithm.adaptive}>
            <b>Adaptive</b> {algorithm.adaptive ? 'Yes' : 'No'}
          </span>
        </div>
      </section>
    </aside>
  )
}
