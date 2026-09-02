export const TURNSTILE_SITE_KEY = '0x4AAAAAAEkmHIZBKlJG4REB'

export const reportPageOptions = [
  ['visualize', 'Visualize'],
  ['compare', 'Compare'],
  ['learn', 'Learn'],
  ['benchmark', 'Benchmark'],
  ['sandbox', 'Sandbox'],
  ['about', 'About'],
] as const

export type ReportPageId = (typeof reportPageOptions)[number][0]

export const REPORT_ENDPOINT = `${import.meta.env.BASE_URL}api/report-bug`
