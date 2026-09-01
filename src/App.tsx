import { useEffect, useState } from 'react'
import { sortingAudioEngine } from './audio/AudioEngine'
import { BenchmarkPage } from './components/BenchmarkPage'
import { ComparePage } from './components/ComparePage'
import { LearnPage } from './components/LearnPage'
import { VisualizerPage } from './components/VisualizerPage'
import { SandboxPage } from './components/SandboxPage'
import { AppIcon, type AppIconName } from './components/Icon'

type Route = 'visualize' | 'sandbox' | 'compare' | 'learn' | 'benchmark'
type Theme = 'light' | 'dark' | 'system'

const routeOrder: Route[] = ['visualize', 'compare', 'learn', 'benchmark', 'sandbox']

const routeLabels: Record<Route, string> = {
  visualize: 'Visualize',
  sandbox: 'Sandbox',
  compare: 'Compare',
  learn: 'Learn',
  benchmark: 'Benchmark',
}

const routeIcons: Record<Route, AppIconName> = {
  visualize: 'activity',
  sandbox: 'sandbox',
  compare: 'compare',
  learn: 'learn',
  benchmark: 'benchmark',
}

const themeOptions: Array<{ value: Theme; label: string; icon: AppIconName }> = [
  { value: 'light', label: 'Light theme', icon: 'sun' },
  { value: 'system', label: 'System theme', icon: 'monitor' },
  { value: 'dark', label: 'Dark theme', icon: 'moon' },
]

function routeFromHash(): Route {
  const root = window.location.hash.slice(1).split('/')[0]
  return root in routeLabels ? (root as Route) : 'visualize'
}

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('sortlab-theme') as Theme) || 'system',
  )
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const systemTheme = matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const dark = theme === 'dark' || (theme === 'system' && systemTheme.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }

    applyTheme()
    localStorage.setItem('sortlab-theme', theme)
    if (theme !== 'system') return

    systemTheme.addEventListener('change', applyTheme)
    return () => systemTheme.removeEventListener('change', applyTheme)
  }, [theme])

  useEffect(() => {
    const onHashChange = () => {
      sortingAudioEngine.stopAll()
      setRoute(routeFromHash())
      setMenuOpen(false)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const chooseRoute = (next: Route) => {
    sortingAudioEngine.stopAll()
    setRoute(next)
    if (window.location.hash !== `#${next}`) window.location.hash = next
    setMenuOpen(false)
    window.scrollTo({
      top: 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="topbar">
        <button
          className="mobile-menu"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <AppIcon name={menuOpen ? 'close' : 'menu'} aria-hidden="true" size={22} />
        </button>
        <button
          className="brand"
          onClick={() => chooseRoute('visualize')}
          aria-label="SortLab home"
        >
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="brand-wordmark">
            Sort<span>Lab</span>
          </span>
        </button>
        <nav className={menuOpen ? 'is-open' : ''} aria-label="Primary navigation">
          {routeOrder.map((item) => (
            <button
              className={route === item ? 'is-active' : ''}
              aria-current={route === item ? 'page' : undefined}
              onClick={() => chooseRoute(item)}
              key={item}
            >
              <AppIcon name={routeIcons[item]} aria-hidden="true" />
              {routeLabels[item]}
            </button>
          ))}
        </nav>
        <div
          className="theme-control"
          role="group"
          aria-label="Color theme"
          data-theme-index={themeOptions.findIndex((option) => option.value === theme)}
        >
          <span className="theme-control__indicator" aria-hidden="true" />
          {themeOptions.map((option) => (
            <button
              type="button"
              aria-label={option.label}
              aria-pressed={theme === option.value}
              onClick={() => setTheme(option.value)}
              key={option.value}
            >
              <AppIcon name={option.icon} aria-hidden="true" />
            </button>
          ))}
        </div>
      </header>
      {route === 'visualize' ? <VisualizerPage /> : null}
      {route === 'sandbox' ? <SandboxPage /> : null}
      {route === 'compare' ? <ComparePage /> : null}
      {route === 'learn' ? <LearnPage /> : null}
      {route === 'benchmark' ? <BenchmarkPage /> : null}
      {route !== 'sandbox' ? (
        <footer className="app-footer">
          <strong>SortLab</strong>
          <span>
            A local-first teaching tool. No accounts, analytics, trackers, external fonts, or
            uploaded data.
          </span>
        </footer>
      ) : null}
    </div>
  )
}
