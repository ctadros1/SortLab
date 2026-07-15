import { calculateProgressMilestones } from '../ui/progress'

export function EventProgress({ current, total }: { current: number; total: number }) {
  const completed = Math.min(Math.max(0, current), total)
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const milestones = calculateProgressMilestones(total)
  return (
    <section className="event-progress" aria-label="Sorting event progress">
      <div
        className="event-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-valuetext={`Step ${completed} of ${total}`}
      >
        <span
          className="event-progress__fill"
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        />
        <span className="event-progress__milestones" aria-hidden="true">
          {milestones.map((step) => (
            <i className={step <= completed ? 'is-complete' : ''} key={step} />
          ))}
        </span>
        {total > 0 ? (
          <i
            className="event-progress__current"
            style={{ left: `${percent}%` }}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="event-progress__labels">
        <span>
          Step {completed} / {total}
        </span>
        <strong>{percent}%</strong>
      </div>
    </section>
  )
}
