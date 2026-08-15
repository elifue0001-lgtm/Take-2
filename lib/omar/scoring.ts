import {
  BUCKETS,
  CONFIDENCE_BANDS,
  CRITERIA,
  DEFAULT_WEIGHTS,
  EBITDA_ANCHOR_CEILING,
  EBITDA_CEILING,
  COUNTIES,
  NOW,
} from './config'
import type {
  ConfidenceBand,
  ConfidenceResult,
  FitBucket,
  HardFilterResult,
  ScoreBreakdown,
  ScoreWeights,
  SourcedValue,
  Target,
} from './types'

/* ------------------------------------------------------------------ */
/* Acquisition Fit Score                                               */
/* ------------------------------------------------------------------ */

/**
 * Pure. Score = Σ (normalized signal × criterion weight).
 * Weights are injected so the /thesis screen can re-score without re-ingest.
 */
export function scoreTarget(
  target: Target,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): ScoreBreakdown {
  const rows = CRITERIA.map((criterion) => {
    const signal = target.signals[criterion.id]
    const max = weights[criterion.id]
    const normalized = clamp01(signal?.normalized ?? 0)
    return {
      id: criterion.id,
      label: criterion.label,
      earned: round1(normalized * max),
      max,
      normalized,
      rationale: signal?.rationale ?? 'No signal captured for this criterion.',
    }
  })

  const total = Math.round(rows.reduce((sum, row) => sum + row.earned, 0))
  return { total, bucket: bucketForScore(total), rows }
}

export function bucketForScore(score: number): FitBucket {
  return (
    BUCKETS.find((bucket) => score >= bucket.min && score <= bucket.max)?.id ??
    'low'
  )
}

export function bucketMeta(bucket: FitBucket) {
  return BUCKETS.find((b) => b.id === bucket) ?? BUCKETS[BUCKETS.length - 1]
}

/** Weights must always total 100 for the /thesis validator. */
export function weightsTotal(weights: ScoreWeights): number {
  return Object.values(weights).reduce((sum, value) => sum + value, 0)
}

/* ------------------------------------------------------------------ */
/* Data Confidence Score                                               */
/* ------------------------------------------------------------------ */

/** Fields whose presence and reliability determine how much to trust a record. */
const CONFIDENCE_FIELDS: {
  key: keyof Target
  label: string
  weight: number
}[] = [
  { key: 'foundedYear', label: 'Founded year', weight: 1.5 },
  { key: 'entityType', label: 'Entity type', weight: 1 },
  { key: 'employees', label: 'Employee count', weight: 1 },
  { key: 'estRevenue', label: 'Estimated revenue', weight: 1.5 },
  { key: 'estEbitda', label: 'Estimated EBITDA', weight: 1.5 },
  { key: 'cashflowPositive', label: 'Cashflow status', weight: 1.5 },
  { key: 'ownershipSignal', label: 'Ownership signal', weight: 1.5 },
  { key: 'recentOwnershipChange', label: 'Ownership change history', weight: 1 },
  { key: 'ownerTenureYears', label: 'Leadership tenure', weight: 1 },
  { key: 'licenses', label: 'Licenses & permits', weight: 1 },
  { key: 'reviewCount', label: 'Review volume', weight: 0.5 },
  { key: 'rating', label: 'Rating', weight: 0.5 },
  { key: 'website', label: 'Website', weight: 0.5 },
  { key: 'localSearchVisibility', label: 'Local search visibility', weight: 0.5 },
]

export function computeConfidence(target: Target): ConfidenceResult {
  let weightSum = 0
  let scoreSum = 0
  let present = 0
  const missingFields: string[] = []

  for (const field of CONFIDENCE_FIELDS) {
    const sourced = target[field.key] as SourcedValue<unknown> | undefined
    weightSum += field.weight

    if (!sourced || sourced.value === null || sourced.value === undefined) {
      missingFields.push(field.label)
      continue
    }

    present += 1
    // An estimate is worth less than a verified value, and staleness decays it.
    const estimatePenalty = sourced.estimated ? 0.72 : 1
    scoreSum += field.weight * (sourced.confidence / 100) * estimatePenalty * stalenessFactor(sourced.fetchedAt)
  }

  const score = Math.round((scoreSum / weightSum) * 100)
  return {
    score,
    band: confidenceBand(score),
    coverage: Math.round((present / CONFIDENCE_FIELDS.length) * 100),
    missingFields,
  }
}

/** Records older than a quarter are progressively discounted, floored at 0.7. */
function stalenessFactor(fetchedAt: string | null): number {
  if (!fetchedAt) return 0.7
  const days = (NOW.getTime() - new Date(fetchedAt).getTime()) / 86_400_000
  if (days <= 90) return 1
  return Math.max(0.7, 1 - (days - 90) / 900)
}

export function confidenceBand(score: number): ConfidenceBand {
  return CONFIDENCE_BANDS.find((band) => score >= band.min)?.id ?? 'low'
}

export function confidenceLabel(band: ConfidenceBand): string {
  return CONFIDENCE_BANDS.find((b) => b.id === band)?.label ?? 'Low'
}

/* ------------------------------------------------------------------ */
/* Hard filters                                                        */
/* ------------------------------------------------------------------ */

export function hardFilterResults(target: Target): HardFilterResult[] {
  const county = COUNTIES.find((c) => c.id === target.county)
  const ebitda = target.estEbitda.value

  return [
    {
      label: 'Southern California target county',
      passed: Boolean(county),
      detail: county ? `${county.label} — in thesis` : 'Outside target counties',
    },
    {
      label: 'Not a franchise',
      passed: !target.isFranchise,
      detail: target.isFranchise
        ? 'Franchised operation — excluded by thesis'
        : 'No franchise affiliation detected',
    },
    {
      label: 'Cashflow positive',
      passed: target.cashflowPositive.value,
      detail:
        target.cashflowPositive.value === null
          ? 'Unverified — requires seller financials'
          : target.cashflowPositive.value
            ? target.cashflowPositive.estimated
              ? 'Modeled as positive from margin proxies'
              : 'Confirmed positive'
            : 'Modeled as break-even or negative',
    },
    {
      label: 'EBITDA within range',
      passed: ebitda === null ? null : ebitda.max <= EBITDA_ANCHOR_CEILING,
      detail:
        ebitda === null
          ? 'No EBITDA estimate available'
          : ebitda.max <= EBITDA_CEILING
            ? `${formatCurrencyRange(ebitda)} — standard range`
            : ebitda.max <= EBITDA_ANCHOR_CEILING
              ? `${formatCurrencyRange(ebitda)} — anchor platform range`
              : `${formatCurrencyRange(ebitda)} — above ceiling`,
    },
  ]
}

/** True only when no hard filter is an outright failure. */
export function passesHardFilters(target: Target): boolean {
  return hardFilterResults(target).every((result) => result.passed !== false)
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

export function formatCompactUsd(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
  }
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

export function formatCurrencyRange(range: { min: number; max: number } | null) {
  if (!range) return '—'
  if (range.min === range.max) return formatCompactUsd(range.min)
  return `${formatCompactUsd(range.min)}–${formatCompactUsd(range.max)}`
}

export function formatRange(range: { min: number; max: number } | null) {
  if (!range) return '—'
  return range.min === range.max ? `${range.min}` : `${range.min}–${range.max}`
}

export function yearsInBusiness(target: Target): number | null {
  const founded = target.foundedYear.value
  if (!founded) return null
  return NOW.getUTCFullYear() - founded
}

export function relativeTime(iso: string | null): string {
  if (!iso) return 'never'
  const diff = NOW.getTime() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.round(months / 12)}y ago`
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
