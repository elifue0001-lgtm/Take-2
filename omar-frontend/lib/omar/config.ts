import type {
  ConfidenceBand,
  CountyId,
  CriterionId,
  FitBucket,
  IndustryId,
  MarketingMaturity,
  PipelineStatus,
  ProviderId,
  ScoreWeights,
  WebsiteQuality,
} from './types'

/* ------------------------------------------------------------------ */
/* Buy box                                                             */
/* ------------------------------------------------------------------ */

export const INDUSTRIES: {
  id: IndustryId
  label: string
  short: string
  /** 1 = highest willingness to acquire. Drives the industryFit signal. */
  priority: number
}[] = [
  {
    id: 'fire-protection',
    label: 'Fire Protection & Backflow Testing',
    short: 'Fire / Backflow',
    priority: 1,
  },
  { id: 'hvac', label: 'HVAC', short: 'HVAC', priority: 2 },
  {
    id: 'data-destruction',
    label: 'B2B Physical & Digital Data Destruction',
    short: 'Data Destruction',
    priority: 3,
  },
  {
    id: 'medical-water',
    label: 'Medical Water Treatment',
    short: 'Medical Water',
    priority: 4,
  },
  {
    id: 'biohazard',
    label: 'Biohazard Waste Removal',
    short: 'Biohazard Waste',
    priority: 5,
  },
  {
    id: 'adjacent',
    label: 'Adjacent Recurring-Revenue Field Services',
    short: 'Adjacent Services',
    priority: 6,
  },
]

export const COUNTIES: { id: CountyId; label: string; short: string }[] = [
  { id: 'santa-barbara', label: 'Santa Barbara County', short: 'Santa Barbara' },
  { id: 'ventura', label: 'Ventura County', short: 'Ventura' },
  { id: 'los-angeles', label: 'Los Angeles County', short: 'Los Angeles' },
  { id: 'orange', label: 'Orange County', short: 'Orange' },
  { id: 'san-diego', label: 'San Diego County', short: 'San Diego' },
]

/** Non-negotiable gates. Failing any of these should never reach Ultra. */
export const HARD_FILTERS = [
  {
    id: 'geography',
    label: 'Southern California target counties',
    detail: 'Santa Barbara, Ventura, Los Angeles, Orange, or San Diego',
  },
  {
    id: 'franchise',
    label: 'Not a franchise',
    detail: 'Franchised operations are excluded outright',
  },
  {
    id: 'cashflow',
    label: 'Cashflow positive',
    detail: 'Must be generating positive cash flow',
  },
  {
    id: 'ebitda',
    label: 'EBITDA within range',
    detail: 'Under $2M normally; up to $4M for anchor platforms',
  },
] as const

export const EBITDA_CEILING = 2_000_000
export const EBITDA_ANCHOR_CEILING = 4_000_000

export const DEAL_PREFERENCES = [
  { label: 'SBA financing', value: 'Acceptable', emphasis: false },
  { label: 'Seller financing', value: 'Preferred', emphasis: true },
  { label: 'Earnouts', value: 'Acceptable', emphasis: false },
  { label: 'Structure', value: 'Asset or stock purchase', emphasis: false },
  { label: 'Company age', value: 'Older / established preferred', emphasis: false },
]

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

export const CRITERIA: {
  id: CriterionId
  label: string
  description: string
}[] = [
  {
    id: 'industryFit',
    label: 'Industry Fit',
    description:
      'How closely the business sits inside the priority roll-up verticals.',
  },
  {
    id: 'successionOpportunity',
    label: 'Succession Opportunity',
    description:
      'Lawful proxies for a likely transition: long leadership tenure, no successor signals, static leadership records.',
  },
  {
    id: 'institutionalOwnership',
    label: 'No Institutional Ownership',
    description:
      'Absence of PE, strategic, or holding-company ownership signals in public records.',
  },
  {
    id: 'operatingHistory',
    label: 'Operating History',
    description:
      'Years in continuous operation under a stable entity and brand.',
  },
  {
    id: 'stableDemand',
    label: 'Stable Demand',
    description:
      'Recurring, compliance-driven, or contract-backed revenue characteristics.',
  },
]

export const DEFAULT_WEIGHTS: ScoreWeights = {
  industryFit: 25,
  successionOpportunity: 25,
  institutionalOwnership: 25,
  operatingHistory: 15,
  stableDemand: 10,
}

export const BUCKETS: {
  id: FitBucket
  label: string
  short: string
  min: number
  max: number
}[] = [
  { id: 'ultra', label: 'Ultra High Quality', short: 'Ultra', min: 85, max: 100 },
  { id: 'high', label: 'High Quality', short: 'High', min: 70, max: 84 },
  { id: 'medium', label: 'Medium Quality', short: 'Medium', min: 55, max: 69 },
  { id: 'watchlist', label: 'Watchlist', short: 'Watchlist', min: 0, max: 54 },
]

/**
 * Buckets are an intensity ramp of the single accent colour — never new hues.
 * Keeps the palette at one accent plus neutrals.
 */
export const BUCKET_STYLES: Record<
  FitBucket,
  { chip: string; bar: string; text: string; ring: string }
> = {
  ultra: {
    chip: 'bg-primary text-primary-foreground border-primary',
    bar: 'bg-primary',
    text: 'text-primary',
    ring: 'ring-primary/40',
  },
  high: {
    chip: 'bg-primary/15 text-primary border-primary/35',
    bar: 'bg-primary/70',
    text: 'text-primary',
    ring: 'ring-primary/25',
  },
  medium: {
    chip: 'bg-transparent text-foreground border-border',
    bar: 'bg-muted-foreground/70',
    text: 'text-foreground',
    ring: 'ring-border',
  },
  watchlist: {
    chip: 'bg-muted text-muted-foreground border-transparent',
    bar: 'bg-muted-foreground/40',
    text: 'text-muted-foreground',
    ring: 'ring-border',
  },
}

export const CONFIDENCE_BANDS: {
  id: ConfidenceBand
  label: string
  min: number
}[] = [
  { id: 'high', label: 'High', min: 75 },
  { id: 'medium', label: 'Medium', min: 50 },
  { id: 'low', label: 'Low', min: 0 },
]

/* ------------------------------------------------------------------ */
/* Pipeline                                                            */
/* ------------------------------------------------------------------ */

export const PIPELINE_STATUSES: {
  id: PipelineStatus
  label: string
  /** Counts toward "active pipeline" on the dashboard. */
  active: boolean
  terminal: boolean
}[] = [
  { id: 'new', label: 'New', active: false, terminal: false },
  { id: 'reviewing', label: 'Reviewing', active: true, terminal: false },
  { id: 'qualified', label: 'Qualified', active: true, terminal: false },
  { id: 'contacted', label: 'Contacted', active: true, terminal: false },
  { id: 'in-conversation', label: 'In Conversation', active: true, terminal: false },
  { id: 'diligence', label: 'Diligence', active: true, terminal: false },
  { id: 'loi', label: 'LOI', active: true, terminal: false },
  { id: 'passed', label: 'Passed', active: false, terminal: true },
  { id: 'dead', label: 'Dead', active: false, terminal: true },
]

/* ------------------------------------------------------------------ */
/* Providers                                                           */
/* ------------------------------------------------------------------ */

export const PROVIDERS: Record<ProviderId, { label: string; short: string }> = {
  'google-places': { label: 'Google Places', short: 'Places' },
  apollo: { label: 'Apollo', short: 'Apollo' },
  'public-records': { label: 'Public Records', short: 'Records' },
  web: { label: 'Permitted Web Sources', short: 'Web' },
  manual: { label: 'Manual Entry', short: 'Manual' },
}

export const WEBSITE_QUALITY_LABELS: Record<WebsiteQuality, string> = {
  none: 'No website',
  dated: 'Dated / pre-2015 build',
  basic: 'Basic but functional',
  modern: 'Modern & maintained',
}

export const MARKETING_MATURITY_LABELS: Record<MarketingMaturity, string> = {
  none: 'None detected',
  low: 'Minimal',
  moderate: 'Moderate',
  high: 'Sophisticated',
}

/** Weak digital presence is a buying signal, not a defect. */
export const WEAK_DIGITAL_QUALITIES: WebsiteQuality[] = ['none', 'dated']

/* ------------------------------------------------------------------ */
/* Standing caveat — surfaced anywhere inference is presented          */
/* ------------------------------------------------------------------ */

export const OFF_MARKET_CAVEAT =
  'Off-market status cannot be verified from public data. OMAR ranks the likelihood that a business is unlisted and receptive; every prospect requires manual confirmation before outreach.'

export const MONTHLY_BUDGET_USD = 150

/**
 * Fixed reference clock for the seed dataset so server and client render
 * identical relative timestamps. When the backend is wired up, replace every
 * reference to NOW with `Date.now()`.
 */
export const NOW = new Date('2026-07-30T17:00:00.000Z')

export function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString()
}

export function hoursAgo(hours: number): string {
  return new Date(NOW.getTime() - hours * 3_600_000).toISOString()
}

export function daysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * 86_400_000).toISOString()
}
