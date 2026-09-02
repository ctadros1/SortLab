interface Env {
  ASSETS: Fetcher
  RESEND_API_KEY?: string
  TURNSTILE_VERIFY_URL: string
  REPORT_TO?: string
  REPORT_FROM?: string
}

const reportPages = new Set(['visualize', 'compare', 'learn', 'benchmark', 'sandbox', 'about'])

interface BugReportBody {
  page?: unknown
  message?: unknown
  token?: unknown
  website?: unknown
  startedAt?: unknown
  pageUrl?: unknown
  userAgent?: unknown
}

function clean(value: unknown, maximum: number) {
  return String(value ?? '')
    .trim()
    .slice(0, maximum)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

async function handleBugReport(request: Request, env: Env) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ ok: false, error: 'Send the report as JSON.' }, 415)
  }

  let body: BugReportBody
  try {
    body = (await request.json()) as BugReportBody
  } catch {
    return json({ ok: false, error: 'The report was not valid JSON.' }, 400)
  }

  const page = clean(body.page, 32)
  const message = clean(body.message, 3000)
  const token = clean(body.token, 2048)
  const honeypot = clean(body.website, 200)
  const startedAt = Number(body.startedAt)
  const pageUrl = clean(body.pageUrl, 500)
  const userAgent = clean(body.userAgent, 500)

  const submittedTooFast =
    Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < 2500
  if (honeypot || submittedTooFast) return json({ ok: true })
  if (!reportPages.has(page)) return json({ ok: false, error: 'Choose a valid SortLab page.' }, 400)
  if (message.length < 20) {
    return json({ ok: false, error: 'Please include at least 20 characters.' }, 400)
  }
  if (!token) return json({ ok: false, error: 'Verification is required.' }, 400)

  try {
    const verificationResponse = await fetch(env.TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        remoteip: request.headers.get('cf-connecting-ip') ?? undefined,
        idempotency_key: crypto.randomUUID(),
      }),
    })
    const verification = (await verificationResponse.json()) as {
      success?: boolean
      'error-codes'?: string[]
    }
    if (!verificationResponse.ok || verification.success !== true) {
      console.warn('[report-bug] turnstile rejected', verification['error-codes'] ?? [])
      return json({ ok: false, error: 'Verification failed. Please try again.' }, 400)
    }
  } catch (error) {
    console.error('[report-bug] turnstile unavailable', error)
    return json({ ok: false, error: 'Verification is temporarily unavailable.' }, 503)
  }

  if (!env.RESEND_API_KEY) {
    console.error('[report-bug] RESEND_API_KEY is not configured')
    return json({ ok: false, error: 'Reporting is temporarily unavailable.' }, 503)
  }

  const pageLabel = page[0].toUpperCase() + page.slice(1)
  const text = [
    'SortLab bug report',
    '',
    `Page: ${pageLabel}`,
    pageUrl ? `URL: ${pageUrl}` : null,
    userAgent ? `Browser: ${userAgent}` : null,
    '',
    message,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.REPORT_FROM ?? 'SortLab <hello@christiantadros.com>',
        to: [env.REPORT_TO ?? 'c@christiantadros.com'],
        subject: `[SortLab bug] ${pageLabel}`,
        text,
        html: `<pre style="font:14px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
      }),
    })
    if (!emailResponse.ok) {
      console.error('[report-bug] resend rejected', emailResponse.status)
      return json({ ok: false, error: 'The report could not be delivered.' }, 502)
    }
  } catch (error) {
    console.error('[report-bug] resend unavailable', error)
    return json({ ok: false, error: 'The report could not be delivered.' }, 502)
  }

  return json({ ok: true })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (
      request.method === 'POST' &&
      (url.pathname === '/sortlab/api/report-bug' || url.pathname === '/api/report-bug')
    ) {
      return handleBugReport(request, env)
    }

    if (url.pathname === '/') {
      return Response.redirect(new URL('/sortlab/', url), 302)
    }

    if (url.pathname === '/sortlab') {
      return Response.redirect(new URL('/sortlab/', url), 308)
    }

    return env.ASSETS.fetch(request)
  },
}
