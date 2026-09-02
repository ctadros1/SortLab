import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  REPORT_ENDPOINT,
  reportPageOptions,
  TURNSTILE_SITE_KEY,
  type ReportPageId,
} from '../config/reporting'
import { AppIcon } from './Icon'

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      action: string
      theme: 'light' | 'dark'
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ) => string
  remove: (widgetId: string) => void
  reset: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let turnstileScript: Promise<TurnstileApi> | null = null

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (turnstileScript) return turnstileScript

  turnstileScript = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-sortlab-turnstile]')
    const script = existing ?? document.createElement('script')
    const loaded = () => {
      if (window.turnstile) resolve(window.turnstile)
      else reject(new Error('Turnstile did not initialize.'))
    }
    script.addEventListener('load', loaded, { once: true })
    script.addEventListener('error', () => reject(new Error('Turnstile could not load.')), {
      once: true,
    })
    if (!existing) {
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.sortlabTurnstile = 'true'
      document.head.append(script)
    }
  })
  return turnstileScript
}

interface Props {
  initialPage: ReportPageId
  onClose: () => void
}

export function ReportBugDialog({ initialPage, onClose }: Props) {
  const [page, setPage] = useState<ReportPageId>(initialPage)
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')
  const [verificationMessage, setVerificationMessage] = useState('Loading verification…')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [startedAt] = useState(Date.now)
  const widgetContainer = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const messageField = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => messageField.current?.focus(), 0)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    void loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !widgetContainer.current) return
        widgetId.current = turnstile.render(widgetContainer.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action: 'turnstile-spin-v1',
          theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
          callback: (nextToken) => {
            setToken(nextToken)
            setVerificationMessage('Verification complete.')
          },
          'expired-callback': () => {
            setToken('')
            setVerificationMessage('Verification expired. Please try again.')
          },
          'error-callback': () => {
            setToken('')
            setVerificationMessage('Verification could not complete. Please retry.')
          },
        })
      })
      .catch(() => setVerificationMessage('Verification could not load. Check your connection.'))

    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const report = message.trim()
    if (report.length < 20) {
      setStatus('error')
      setStatusMessage('Please include at least 20 characters so the problem is actionable.')
      return
    }
    if (!token) {
      setStatus('error')
      setStatusMessage('Complete the verification before sending your report.')
      return
    }

    setStatus('submitting')
    setStatusMessage('Sending report…')
    try {
      const response = await fetch(REPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          page,
          message: report,
          token,
          website: '',
          startedAt,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      })
      const payload = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || payload.ok !== true) {
        throw new Error(payload.error ?? 'The report could not be sent.')
      }
      setStatus('success')
      setStatusMessage('Your report was sent. Thank you for helping improve SortLab.')
    } catch (error) {
      setStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'The report could not be sent.')
      setToken('')
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
    }
  }

  return (
    <div
      className="report-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        aria-describedby="report-dialog-description"
      >
        <header>
          <span className="report-dialog__icon" aria-hidden="true">
            <AppIcon name="warning" />
          </span>
          <span>
            <h2 id="report-dialog-title">Report a bug</h2>
            <p id="report-dialog-description">
              Tell us what happened and where you saw it. Please do not include private data.
            </p>
          </span>
          <button type="button" aria-label="Close bug report" onClick={onClose}>
            <AppIcon name="close" aria-hidden="true" />
          </button>
        </header>

        {status === 'success' ? (
          <div className="report-dialog__success" role="status">
            <span aria-hidden="true">
              <AppIcon name="check" size={26} />
            </span>
            <h3>Report received</h3>
            <p>{statusMessage}</p>
            <button type="button" className="button button--primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label className="report-field">
              <span>Page</span>
              <select
                value={page}
                onChange={(event) => setPage(event.target.value as ReportPageId)}
              >
                {reportPageOptions.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="report-field">
              <span>
                What went wrong? <small>{message.length}/3000</small>
              </span>
              <textarea
                ref={messageField}
                rows={7}
                minLength={20}
                maxLength={3000}
                required
                value={message}
                placeholder="What did you expect, and what happened instead?"
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            <div className="report-verification">
              <span>Verification</span>
              <div ref={widgetContainer} data-action="turnstile-spin-v1" />
              <small role="status">{verificationMessage}</small>
            </div>
            {statusMessage ? (
              <p className={`report-dialog__status is-${status}`} role="status">
                {statusMessage}
              </p>
            ) : null}
            <footer>
              <button type="button" className="button" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="button button--primary button--with-icon"
                disabled={status === 'submitting' || message.trim().length < 20 || !token}
              >
                <AppIcon name="warning" aria-hidden="true" />
                {status === 'submitting' ? 'Sending…' : 'Send report'}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  )
}
