interface Props {
  currentRoute: string
  onAbout: () => void
  onHome: () => void
  onReportBug: () => void
}

export function AppFooter({ currentRoute, onAbout, onHome, onReportBug }: Props) {
  return (
    <footer className={`app-footer app-footer--${currentRoute}`}>
      <button className="footer-brand" type="button" onClick={onHome} aria-label="SortLab home">
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
      <nav aria-label="Footer navigation">
        <button
          type="button"
          aria-current={currentRoute === 'about' ? 'page' : undefined}
          onClick={onAbout}
        >
          About
        </button>
        <a href="https://github.com/ctadros1/sort-lab" target="_blank" rel="noreferrer">
          GitHub <span aria-hidden="true">↗</span>
        </a>
        <button type="button" onClick={onReportBug}>
          Report Bug
        </button>
      </nav>
    </footer>
  )
}
