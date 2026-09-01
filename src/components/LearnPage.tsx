import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { algorithmRegistry, families } from '../algorithms/registry'
import type { AlgorithmIconId, AlgorithmMeta } from '../types'
import { ComplexityChart } from './ComplexityChart'
import { AppIcon, ChevronDown, ChevronRight } from './Icon'
import { MathNotation } from './MathNotation'
import { Switch } from './Switch'

type SortKey = 'name' | 'family' | 'average' | 'worst'

interface FilterFieldsProps {
  family: string
  comparison: string
  stableOnly: boolean
  inPlaceOnly: boolean
  setFamily: (value: string) => void
  setComparison: (value: string) => void
  setStableOnly: (value: boolean) => void
  setInPlaceOnly: (value: boolean) => void
}

function LearnAlgorithmIcon({ name }: { name: AlgorithmIconId }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}learn-icons/${name}.png`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
    />
  )
}

function FilterFields({
  family,
  comparison,
  stableOnly,
  inPlaceOnly,
  setFamily,
  setComparison,
  setStableOnly,
  setInPlaceOnly,
}: FilterFieldsProps) {
  return (
    <>
      <label className="learn-filter-field">
        <span>Family</span>
        <select value={family} onChange={(event) => setFamily(event.target.value)}>
          <option value="All">All families</option>
          {families.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="learn-filter-field">
        <span>Type</span>
        <select value={comparison} onChange={(event) => setComparison(event.target.value)}>
          <option value="all">All types</option>
          <option value="comparison">Comparison sorts</option>
          <option value="distribution">Non-comparison sorts</option>
        </select>
      </label>
      <Switch
        checked={stableOnly}
        onChange={setStableOnly}
        label="Stable only"
        icon={<AppIcon name="check" />}
      />
      <Switch
        checked={inPlaceOnly}
        onChange={setInPlaceOnly}
        label="In-place only"
        icon={<AppIcon name="activity" />}
      />
    </>
  )
}

function readLessonId() {
  const match = window.location.hash.match(/^#learn\/([^/]+)$/)
  const id = match?.[1]
  return id && algorithmRegistry.some((algorithm) => algorithm.id === id) ? id : null
}

function scrollToPageStart() {
  window.scrollTo({
    top: 0,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

function sortValue(algorithm: AlgorithmMeta, sortKey: SortKey) {
  if (sortKey === 'average' || sortKey === 'worst') return algorithm.complexity[sortKey]
  return algorithm[sortKey]
}

function SortButton({
  label,
  sortKey,
  activeSort,
  onSort,
}: {
  label: string
  sortKey: SortKey
  activeSort: SortKey | null
  onSort: (sortKey: SortKey) => void
}) {
  const active = activeSort === sortKey
  return (
    <button
      type="button"
      className={active ? 'is-active' : ''}
      aria-pressed={active}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <ChevronDown aria-hidden="true" size={14} />
    </button>
  )
}

function AlgorithmRow({ algorithm, onOpen }: { algorithm: AlgorithmMeta; onOpen: () => void }) {
  return (
    <li>
      <button type="button" className="learn-algorithm-row" onClick={onOpen}>
        <span className="learn-row__identity">
          <span className="learn-row__icon" aria-hidden="true">
            <LearnAlgorithmIcon name={algorithm.icon} />
          </span>
          <span>
            <strong>{algorithm.name}</strong>
            <small>{algorithm.shortDescription}</small>
            <span className="learn-row__mobile-meta">
              Avg. <MathNotation value={algorithm.complexity.average} />
              <i aria-hidden="true">·</i>
              Worst <MathNotation value={algorithm.complexity.worst} />
              <i aria-hidden="true">·</i>
              {algorithm.stable ? 'Stable' : 'Unstable'}
              <i aria-hidden="true">·</i>
              {algorithm.inPlace ? 'In place' : 'Extra space'}
            </span>
          </span>
        </span>
        <span className="learn-row__family">{algorithm.family}</span>
        <span className="learn-row__complexity">
          <MathNotation value={algorithm.complexity.average} />
        </span>
        <span className="learn-row__complexity">
          <MathNotation value={algorithm.complexity.worst} />
        </span>
        <span className="learn-row__trait" data-positive={algorithm.stable}>
          <AppIcon name={algorithm.stable ? 'check' : 'close'} aria-hidden="true" size={16} />
          <span className="sr-only">{algorithm.stable ? 'Stable' : 'Unstable'}</span>
        </span>
        <span className="learn-row__trait" data-positive={algorithm.inPlace}>
          <AppIcon name={algorithm.inPlace ? 'check' : 'close'} aria-hidden="true" size={16} />
          <span className="sr-only">{algorithm.inPlace ? 'In place' : 'Extra space'}</span>
        </span>
        <ChevronRight className="learn-row__chevron" aria-hidden="true" size={19} />
      </button>
    </li>
  )
}

function LearnCatalog({ onOpen }: { onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('All')
  const [stableOnly, setStableOnly] = useState(false)
  const [inPlaceOnly, setInPlaceOnly] = useState(false)
  const [comparison, setComparison] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)

  const filtered = useMemo(
    () =>
      algorithmRegistry
        .filter((algorithm) => {
          const text =
            `${algorithm.name} ${algorithm.aliases.join(' ')} ${algorithm.shortDescription}`.toLowerCase()
          return (
            text.includes(query.trim().toLowerCase()) &&
            (family === 'All' || algorithm.family === family) &&
            (!stableOnly || algorithm.stable) &&
            (!inPlaceOnly || algorithm.inPlace) &&
            (comparison === 'all' || algorithm.comparisonBased === (comparison === 'comparison'))
          )
        })
        .sort((left, right) =>
          sortKey ? sortValue(left, sortKey).localeCompare(sortValue(right, sortKey)) : 0,
        ),
    [comparison, family, inPlaceOnly, query, sortKey, stableOnly],
  )

  const filters = {
    family,
    comparison,
    stableOnly,
    inPlaceOnly,
    setFamily,
    setComparison,
    setStableOnly,
    setInPlaceOnly,
  }

  return (
    <main className="page-shell learn-page learn-catalog" id="main-content">
      <header className="learn-catalog__intro">
        <h1>Understand every sort, one idea at a time</h1>
        <p>Browse the catalog, compare essential traits, then open a focused lesson.</p>
      </header>

      <section className="learn-catalog-controls" aria-label="Algorithm filters">
        <label className="learn-search">
          <span className="sr-only">Search algorithms</span>
          <AppIcon name="search" aria-hidden="true" size={21} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search algorithms"
          />
        </label>
        <div className="learn-filters learn-filters--desktop">
          <FilterFields {...filters} />
        </div>
        <details className="learn-filter-disclosure">
          <summary>
            <AppIcon name="settings" aria-hidden="true" />
            Filters
            <ChevronDown aria-hidden="true" size={18} />
          </summary>
          <div className="learn-filters learn-filters--mobile">
            <FilterFields {...filters} />
          </div>
        </details>
        <p className="learn-result-count" aria-live="polite">
          {filtered.length} of {algorithmRegistry.length} algorithms
        </p>
      </section>

      <section className="learn-index" aria-label="Sorting algorithm lessons">
        <div className="learn-index__header">
          <SortButton label="Algorithm" sortKey="name" activeSort={sortKey} onSort={setSortKey} />
          <SortButton label="Family" sortKey="family" activeSort={sortKey} onSort={setSortKey} />
          <SortButton label="Average" sortKey="average" activeSort={sortKey} onSort={setSortKey} />
          <SortButton label="Worst" sortKey="worst" activeSort={sortKey} onSort={setSortKey} />
          <span>Stable</span>
          <span>In place</span>
          <span aria-hidden="true" />
        </div>
        {filtered.length ? (
          <ul className="learn-index__list">
            {filtered.map((algorithm) => (
              <AlgorithmRow
                algorithm={algorithm}
                onOpen={() => onOpen(algorithm.id)}
                key={algorithm.id}
              />
            ))}
          </ul>
        ) : (
          <div className="learn-empty-state">
            <AppIcon name="search" aria-hidden="true" size={24} />
            <h2>No algorithms match those filters</h2>
            <p>Try a broader search or turn off one of the trait filters.</p>
          </div>
        )}
      </section>
      <ComplexityChart />
    </main>
  )
}

function LessonFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function LearnLesson({
  algorithm,
  onBack,
  onOpen,
}: {
  algorithm: AlgorithmMeta
  onBack: () => void
  onOpen: (id: string) => void
}) {
  const related = algorithmRegistry
    .filter((candidate) => candidate.family === algorithm.family && candidate.id !== algorithm.id)
    .slice(0, 4)

  return (
    <main className="page-shell learn-page learn-lesson" id="main-content">
      <button type="button" className="learn-back" onClick={onBack}>
        <ChevronRight aria-hidden="true" size={18} />
        All algorithms
      </button>
      <header className="learn-lesson__header">
        <span className="learn-lesson__icon" aria-hidden="true">
          <LearnAlgorithmIcon name={algorithm.icon} />
        </span>
        <div>
          <h1>{algorithm.name}</h1>
          <p>{algorithm.shortDescription}</p>
        </div>
      </header>

      <dl className="learn-facts" aria-label={`${algorithm.name} key facts`}>
        <LessonFact label="Family">{algorithm.family}</LessonFact>
        <LessonFact label="Average">
          <MathNotation value={algorithm.complexity.average} />
        </LessonFact>
        <LessonFact label="Worst">
          <MathNotation value={algorithm.complexity.worst} />
        </LessonFact>
        <LessonFact label="Space">
          <MathNotation value={algorithm.complexity.space} />
        </LessonFact>
        <LessonFact label="Stability">{algorithm.stable ? 'Stable' : 'Unstable'}</LessonFact>
        <LessonFact label="Memory">{algorithm.inPlace ? 'In place' : 'Extra space'}</LessonFact>
      </dl>

      <article className="learn-article">
        {algorithm.warning ? (
          <div className="warning learn-article__notice">
            <AppIcon name="warning" aria-hidden="true" />
            <span>{algorithm.warning}</span>
          </div>
        ) : null}
        {algorithm.approximation ? (
          <div className="approximation-note learn-article__notice">
            Educational approximation—see implementation notes.
          </div>
        ) : null}

        <section>
          <h2>Central idea</h2>
          <p className="learn-article__lead">{algorithm.centralIdea}</p>
          <p>{algorithm.invariant}</p>
        </section>
        <section>
          <h2>Step by step</h2>
          <ol className="learn-steps">
            {algorithm.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section>
          <h2>Worked example</h2>
          <div className="learn-example">{algorithm.example}</div>
        </section>
        <section>
          <h2>Use it when</h2>
          <p>{algorithm.useCases}</p>
        </section>
        <section>
          <h2>Tradeoffs</h2>
          <p>{algorithm.disadvantages}</p>
          <h3>When not to use it</h3>
          <p>{algorithm.avoidWhen}</p>
        </section>
        <section>
          <h2>Implementation notes</h2>
          <p>{algorithm.implementationNotes}</p>
        </section>
        <section>
          <h2>Common student mistakes</h2>
          <p>{algorithm.studentMistakes}</p>
        </section>
        <section>
          <h2>Input rules</h2>
          <p>{algorithm.restrictions}</p>
        </section>
      </article>

      {related.length ? (
        <nav className="learn-related" aria-label="Related algorithm lessons">
          <strong>Related algorithms</strong>
          <div>
            {related.map((item) => (
              <button type="button" onClick={() => onOpen(item.id)} key={item.id}>
                {item.name}
                <ChevronRight aria-hidden="true" size={15} />
              </button>
            ))}
          </div>
        </nav>
      ) : null}
    </main>
  )
}

export function LearnPage() {
  const [lessonId, setLessonId] = useState<string | null>(readLessonId)

  useEffect(() => {
    const syncLesson = () => setLessonId(readLessonId())
    window.addEventListener('hashchange', syncLesson)
    return () => window.removeEventListener('hashchange', syncLesson)
  }, [])

  const openLesson = useCallback((id: string) => {
    setLessonId(id)
    window.location.hash = `learn/${id}`
    scrollToPageStart()
  }, [])

  const closeLesson = useCallback(() => {
    setLessonId(null)
    window.location.hash = 'learn'
    scrollToPageStart()
  }, [])

  const lesson = lessonId
    ? algorithmRegistry.find((algorithm) => algorithm.id === lessonId)
    : undefined

  return lesson ? (
    <LearnLesson algorithm={lesson} onBack={closeLesson} onOpen={openLesson} />
  ) : (
    <LearnCatalog onOpen={openLesson} />
  )
}
