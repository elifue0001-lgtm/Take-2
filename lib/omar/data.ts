/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OMAR DATA ACCESS LAYER — THE BACKEND SEAM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Every screen in this app reads through the async functions below and nothing
 * else. That is deliberate: to go from seed data to a live database you only
 * ever edit this file.
 *
 * Wiring checklist, in order:
 *
 *   1. Add a database (Neon is the default recommendation) and create tables
 *      mirroring `lib/omar/types.ts`. The `SourcedValue<T>` wrapper maps
 *      cleanly onto either a JSONB column per field or a normalized
 *      `target_field_provenance` table keyed by (target_id, field).
 *
 *   2. Replace each `SEED_*` read below with a real query. Keep the exported
 *      signatures identical so no component needs to change.
 *
 *   3. Move the mutations (`setTargetStatus`, `toggleSaved`, `addNote`, …) to
 *      Server Actions in `app/actions/`. They are already async and already
 *      return the updated entity, so callers will keep working.
 *
 *   4. Ingestion is a separate concern. Write provider adapters that emit
 *      `Target`-shaped rows, then schedule them with a cron route. Adapters
 *      must set `estimated`, `provider`, `fetchedAt`, and `confidence` on every
 *      field they touch — the UI relies on that metadata to avoid presenting an
 *      inference as a fact.
 *
 *   5. Scoring stays in `lib/omar/scoring.ts` and must remain pure. Persist
 *      normalized criterion signals, never final scores, so re-weighting the
 *      buy box on /thesis never requires re-ingesting anything.
 *
 * Search this file for `TODO(backend)` to find each individual swap point.
 */

import {
  BUCKETS,
  DEFAULT_WEIGHTS,
  NOW,
  PIPELINE_STATUSES,
  WEAK_DIGITAL_QUALITIES,
} from './config'
import {
  SEED_ALERTS,
  SEED_OUTREACH_TEMPLATES,
  SEED_RULE_VERSIONS,
  SEED_SAVED_SEARCHES,
  SEED_SOURCES,
  SEED_TAGS,
  SEED_TARGETS,
  SEED_WATCHLISTS,
} from './seed'
import {
  computeConfidence,
  passesHardFilters,
  scoreTarget,
  yearsInBusiness,
} from './scoring'
import type {
  ActivityEvent,
  AlertItem,
  DashboardStats,
  Note,
  OutreachTemplate,
  PipelineStatus,
  SavedSearch,
  ScoreWeights,
  ScoringRuleVersion,
  SourceStatus,
  Target,
  TargetFilters,
  TargetSortKey,
  Watchlist,
} from './types'

/* ------------------------------------------------------------------ */
/* Derived view model                                                  */
/* ------------------------------------------------------------------ */

/** A target plus its computed scores. Never persist these — always derive. */
export interface ScoredTarget {
  target: Target
  score: ReturnType<typeof scoreTarget>
  confidence: ReturnType<typeof computeConfidence>
  years: number | null
  passesHardFilters: boolean
}

export function toScoredTarget(
  target: Target,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): ScoredTarget {
  return {
    target,
    score: scoreTarget(target, weights),
    confidence: computeConfidence(target),
    years: yearsInBusiness(target),
    passesHardFilters: passesHardFilters(target),
  }
}

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

export const DEFAULT_FILTERS: TargetFilters = {
  query: '',
  industries: [],
  counties: [],
  buckets: [],
  fitRange: { min: 0, max: 100 },
  minConfidence: 0,
  revenueRange: { min: 0, max: 15_000_000 },
  ebitdaRange: { min: 0, max: 4_500_000 },
  minYearsInBusiness: 0,
  employeeRange: { min: 0, max: 80 },
  marketStatus: 'both',
  excludeFranchises: true,
  weakDigitalOnly: false,
  showDisqualified: false,
  minRating: 0,
  minReviewCount: 0,
  tags: [],
  statuses: [],
}

export const FILTER_BOUNDS = {
  revenue: { min: 0, max: 15_000_000 },
  ebitda: { min: 0, max: 4_500_000 },
  employees: { min: 0, max: 80 },
  years: { min: 0, max: 50 },
} as const

/** Pure and synchronous so the explorer can filter without a round trip. */
export function applyFilters(
  scored: ScoredTarget[],
  filters: TargetFilters,
): ScoredTarget[] {
  const query = filters.query.trim().toLowerCase()

  return scored.filter(({ target, score, confidence, years, passesHardFilters: passHardFilters }) => {
    if (!filters.showDisqualified && !passHardFilters) return false

    if (query) {
      const haystack = [
        target.name,
        target.city,
        target.address,
        ...target.tags,
        target.website.value ?? '',
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (filters.industries.length && !filters.industries.includes(target.industry)) {
      return false
    }
    if (filters.counties.length && !filters.counties.includes(target.county)) {
      return false
    }
    if (filters.buckets.length && !filters.buckets.includes(score.bucket)) {
      return false
    }
    if (score.total < filters.fitRange.min || score.total > filters.fitRange.max) {
      return false
    }
    if (confidence.score < filters.minConfidence) return false

    if (filters.marketStatus !== 'both' && target.marketStatus !== filters.marketStatus) {
      return false
    }
    if (filters.excludeFranchises && target.isFranchise) return false

    if (filters.weakDigitalOnly) {
      const quality = target.websiteQuality.value
      if (!quality || !WEAK_DIGITAL_QUALITIES.includes(quality)) return false
    }

    if (filters.minYearsInBusiness > 0 && (years ?? 0) < filters.minYearsInBusiness) {
      return false
    }

    // Records missing a figure are only excluded once that slider leaves its floor.
    const revenue = target.estRevenue.value
    if (filters.revenueRange.min > FILTER_BOUNDS.revenue.min && (!revenue || revenue.max < filters.revenueRange.min)) {
      return false
    }
    if (filters.revenueRange.max < FILTER_BOUNDS.revenue.max && revenue && revenue.min > filters.revenueRange.max) {
      return false
    }

    const ebitda = target.estEbitda.value
    if (filters.ebitdaRange.min > FILTER_BOUNDS.ebitda.min && (!ebitda || ebitda.max < filters.ebitdaRange.min)) {
      return false
    }
    if (filters.ebitdaRange.max < FILTER_BOUNDS.ebitda.max && ebitda && ebitda.min > filters.ebitdaRange.max) {
      return false
    }

    const employees = target.employees.value
    if (filters.employeeRange.min > FILTER_BOUNDS.employees.min && (!employees || employees.max < filters.employeeRange.min)) {
      return false
    }
    if (filters.employeeRange.max < FILTER_BOUNDS.employees.max && employees && employees.min > filters.employeeRange.max) {
      return false
    }

    if (filters.minRating > 0 && (target.rating.value ?? 0) < filters.minRating) {
      return false
    }
    if (filters.minReviewCount > 0 && (target.reviewCount.value ?? 0) < filters.minReviewCount) {
      return false
    }

    if (filters.tags.length && !filters.tags.some((tag) => target.tags.includes(tag))) {
      return false
    }
    if (filters.statuses.length && !filters.statuses.includes(target.status)) {
      return false
    }

    return true
  })
}

export function sortTargets(
  scored: ScoredTarget[],
  sort: TargetSortKey,
): ScoredTarget[] {
  const list = [...scored]
  switch (sort) {
    case 'fit-asc':
      return list.sort((a, b) => a.score.total - b.score.total)
    case 'confidence-desc':
      return list.sort((a, b) => b.confidence.score - a.confidence.score)
    case 'years-desc':
      return list.sort((a, b) => (b.years ?? -1) - (a.years ?? -1))
    case 'revenue-desc':
      return list.sort(
        (a, b) => (b.target.estRevenue.value?.max ?? -1) - (a.target.estRevenue.value?.max ?? -1),
      )
    case 'discovered-desc':
      return list.sort(
        (a, b) =>
          new Date(b.target.discoveredAt).getTime() -
          new Date(a.target.discoveredAt).getTime(),
      )
    case 'fit-desc':
    default:
      return list.sort((a, b) => b.score.total - a.score.total)
  }
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/** TODO(backend): `SELECT * FROM targets` + join provenance, notes, activity. */
export async function getTargets(
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): Promise<ScoredTarget[]> {
  return SEED_TARGETS.map((target) => toScoredTarget(target, weights))
}

/** TODO(backend): `SELECT … FROM targets WHERE id = $1`. */
export async function getTarget(
  id: string,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): Promise<ScoredTarget | null> {
  const target = SEED_TARGETS.find((t) => t.id === id || t.slug === id)
  return target ? toScoredTarget(target, weights) : null
}

/** Nearby same-vertical candidates, used by the roll-up rail on the detail page. */
export async function getSimilarTargets(
  id: string,
  limit = 4,
): Promise<ScoredTarget[]> {
  const all = await getTargets()
  const self = all.find((s) => s.target.id === id)
  if (!self) return []

  return all
    .filter((s) => s.target.id !== id)
    .map((candidate) => {
      let affinity = 0
      if (candidate.target.industry === self.target.industry) affinity += 3
      if (candidate.target.county === self.target.county) affinity += 2
      if (candidate.score.bucket === self.score.bucket) affinity += 1
      return { candidate, affinity }
    })
    .filter((entry) => entry.affinity > 0)
    .sort(
      (a, b) =>
        b.affinity - a.affinity || b.candidate.score.total - a.candidate.score.total,
    )
    .slice(0, limit)
    .map((entry) => entry.candidate)
}

/** TODO(backend): aggregate these in SQL rather than in memory. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const scored = await getTargets()
  const activeStatuses = PIPELINE_STATUSES.filter((s) => s.active).map((s) => s.id)
  const weekAgo = NOW.getTime() - 7 * 86_400_000

  const eligible = scored.filter((s) => s.passesHardFilters)

  return {
    totalTargets: scored.length,
    newThisWeek: scored.filter(
      (s) => new Date(s.target.discoveredAt).getTime() >= weekAgo,
    ).length,
    highCount: eligible.filter((s) => s.score.bucket === 'high').length,
    activePipeline: scored.filter((s) => activeStatuses.includes(s.target.status))
      .length,
    averageFit:
      eligible.length === 0
        ? 0
        : Math.round(eligible.reduce((sum, s) => sum + s.score.total, 0) / eligible.length),
    dataCoverage:
      eligible.length === 0
        ? 0
        : Math.round(
            eligible.reduce((sum, s) => sum + s.confidence.coverage, 0) / eligible.length,
          ),
  }
}

export async function getBucketCounts(): Promise<Record<string, number>> {
  const scored = await getTargets()
  return Object.fromEntries(
    BUCKETS.map((bucket) => [
      bucket.id,
      scored.filter((s) => s.passesHardFilters && s.score.bucket === bucket.id).length,
    ]),
  )
}

export async function getPipelineCounts(): Promise<Record<PipelineStatus, number>> {
  const scored = await getTargets()
  return Object.fromEntries(
    PIPELINE_STATUSES.map((status) => [
      status.id,
      scored.filter((s) => s.target.status === status.id).length,
    ]),
  ) as Record<PipelineStatus, number>
}

/** TODO(backend): `SELECT * FROM activity ORDER BY created_at DESC LIMIT $1`. */
export async function getRecentActivity(limit = 12): Promise<ActivityEvent[]> {
  const scored = await getTargets()
  return scored
    .flatMap((s) => s.target.activity)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit)
}

export async function getSpotlightTargets(limit = 4): Promise<ScoredTarget[]> {
  const scored = await getTargets()
  return sortTargets(scored.filter((s) => s.passesHardFilters), 'fit-desc')
    .filter((s) => s.score.bucket === 'high')
    .slice(0, limit)
}

/** TODO(backend): `SELECT * FROM alerts WHERE user_id = $1`. */
export async function getAlerts(): Promise<AlertItem[]> {
  const scored = await getTargets()
  const topTierTargetIds = new Set(
    scored.filter((item) => item.score.total >= 85).map((item) => item.target.id),
  )

  return SEED_ALERTS.filter((alert) => {
    if (alert.kind !== 'top-tier-discovery') return true
    return alert.targetId ? topTierTargetIds.has(alert.targetId) : false
  })
}

/** TODO(backend): `SELECT * FROM saved_searches WHERE user_id = $1`. */
export async function getSavedSearches(): Promise<SavedSearch[]> {
  return SEED_SAVED_SEARCHES
}

/** TODO(backend): `SELECT * FROM watchlists` + join membership. */
export async function getWatchlists(): Promise<Watchlist[]> {
  return SEED_WATCHLISTS
}

/** TODO(backend): read live connector health, quota, and spend from the ingestion service. */
export async function getSourceStatuses(): Promise<SourceStatus[]> {
  return SEED_SOURCES
}

/** TODO(backend): `SELECT * FROM scoring_rule_versions ORDER BY created_at DESC`. */
export async function getRuleVersions(): Promise<ScoringRuleVersion[]> {
  return SEED_RULE_VERSIONS
}

export async function getOutreachTemplates(): Promise<OutreachTemplate[]> {
  return SEED_OUTREACH_TEMPLATES
}

export async function getAllTags(): Promise<string[]> {
  return SEED_TAGS
}

export async function getSavedTargets(): Promise<ScoredTarget[]> {
  const scored = await getTargets()
  return sortTargets(
    scored.filter((s) => s.target.saved),
    'fit-desc',
  )
}

export function needsEnrichment(target: Target): boolean {
  const confidence = computeConfidence(target)
  return (
    confidence.band === 'low' ||
    target.estEbitda.value === null ||
    target.estRevenue.value === null ||
    target.cashflowPositive.value === null
  )
}

/** TODO(backend): persist this per user, not just in memory. */
let digestPreference = true

export async function getDigestPreference(): Promise<boolean> {
  return digestPreference
}

export async function setDigestPreference(enabled: boolean): Promise<boolean> {
  digestPreference = enabled
  return digestPreference
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */
/*
 * These are intentionally in-memory no-ops that return the shape the UI
 * expects. The client screens keep their own optimistic state, so converting
 * each one into a Server Action is a drop-in change.
 */

/** TODO(backend): Server Action → `UPDATE targets SET status = $2 WHERE id = $1`. */
export async function setTargetStatus(
  id: string,
  status: PipelineStatus,
): Promise<{ id: string; status: PipelineStatus }> {
  return { id, status }
}

/** TODO(backend): Server Action → upsert into `saved_targets`. */
export async function toggleSaved(
  id: string,
  saved: boolean,
): Promise<{ id: string; saved: boolean }> {
  return { id, saved }
}

/** TODO(backend): Server Action → `INSERT INTO notes …` and log an activity event. */
export async function addNote(targetId: string, body: string): Promise<Note> {
  return {
    id: `note-${Math.random().toString(36).slice(2, 10)}`,
    body,
    author: 'You',
    createdAt: new Date().toISOString(),
  }
}

/** TODO(backend): Server Action → replace the tag set for a target. */
export async function setTargetTags(
  id: string,
  tags: string[],
): Promise<{ id: string; tags: string[] }> {
  return { id, tags }
}

/** TODO(backend): Server Action → persist a new scoring rule version and re-rank. */
export async function publishWeights(
  weights: ScoreWeights,
  summary: string,
): Promise<ScoringRuleVersion> {
  return {
    id: `rv-${Math.random().toString(36).slice(2, 8)}`,
    version: 'v1.4',
    createdAt: new Date().toISOString(),
    author: 'You',
    weights,
    summary,
    active: true,
  }
}

/** TODO(backend): Server Action → `INSERT INTO saved_searches …`. */
export async function saveSearch(
  name: string,
  filters: Partial<TargetFilters>,
  resultCount: number,
): Promise<SavedSearch> {
  return {
    id: `ss-${Math.random().toString(36).slice(2, 8)}`,
    name,
    filters,
    resultCount,
    createdAt: new Date().toISOString(),
    lastRunAt: new Date().toISOString(),
    alertsEnabled: false,
  }
}

/** TODO(backend): Server Action → mark alerts read for the current user. */
export async function dismissAlert(id: string): Promise<{ id: string }> {
  return { id }
}

/** TODO(backend): enqueue an on-demand ingestion run for one provider. */
export async function triggerSourceRun(
  id: string,
): Promise<{ id: string; queuedAt: string }> {
  return { id, queuedAt: new Date().toISOString() }
}

/**
 * TODO(backend): consume an enrichment credit and return the unmasked contact.
 * Gate this behind an explicit user action and a budget check — never call it
 * during bulk ingestion.
 */
export async function revealContact(
  targetId: string,
  contactId: string,
): Promise<{ email: string; phone: string }> {
  const target = SEED_TARGETS.find((t) => t.id === targetId)
  const contact = target?.contacts.find((c) => c.id === contactId)

  let domain = 'example.com'
  const website = target?.website.value
  if (website) {
    try {
      domain = new URL(website).hostname.replace(/^www\./, '')
    } catch {
      domain = website
    }
  }

  const parts = (contact?.name ?? '').trim().split(/\s+/)
  const first = parts[0]?.[0]?.toLowerCase() ?? ''
  const last = parts.slice(1).join('').toLowerCase() || parts[0]?.toLowerCase() || 'contact'
  const email = first && last ? `${first}.${last}@${domain}` : `contact@${domain}`

  const phone = '(555) 000-0000'

  return { email, phone }
}
