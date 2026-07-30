/**
 * OMAR — Off-Market Acquisition Radar
 * Canonical domain types. The backend must satisfy these shapes so the UI
 * layer can be swapped from seed data to live data without component changes.
 */

export type IndustryId =
  | 'fire-protection'
  | 'hvac'
  | 'data-destruction'
  | 'medical-water'
  | 'biohazard'
  | 'adjacent'

export type CountyId =
  | 'santa-barbara'
  | 'ventura'
  | 'los-angeles'
  | 'orange'
  | 'san-diego'

/** The five weighted criteria of the Acquisition Fit Score. */
export type CriterionId =
  | 'industryFit'
  | 'successionOpportunity'
  | 'institutionalOwnership'
  | 'operatingHistory'
  | 'stableDemand'

export type FitBucket = 'ultra' | 'high' | 'medium' | 'watchlist'

export type ConfidenceBand = 'low' | 'medium' | 'high'

export type MarketStatus = 'off-market' | 'on-market'

export type PipelineStatus =
  | 'new'
  | 'reviewing'
  | 'qualified'
  | 'contacted'
  | 'in-conversation'
  | 'diligence'
  | 'loi'
  | 'passed'
  | 'dead'

export type ProviderId =
  | 'google-places'
  | 'apollo'
  | 'public-records'
  | 'web'
  | 'manual'

export type WebsiteQuality = 'none' | 'dated' | 'basic' | 'modern'
export type MarketingMaturity = 'none' | 'low' | 'moderate' | 'high'

/**
 * Every non-trivial field carries its own provenance so the UI can distinguish
 * a verified fact from a modeled inference. `estimated: true` MUST render with
 * the estimated affordance.
 */
export interface SourcedValue<T> {
  value: T | null
  estimated: boolean
  provider: ProviderId | null
  /** ISO timestamp of last successful fetch/verification. */
  fetchedAt: string | null
  /** 0–100 reliability of this individual field. */
  confidence: number
  /** Plain-English explanation of the proxy used, shown in a tooltip. */
  note?: string
}

export interface Range {
  min: number
  max: number
}

export interface Contact {
  id: string
  name: string
  role: string
  emailMasked: string
  phoneMasked: string
  provider: ProviderId
  /** Revealing a contact consumes enrichment credits. */
  creditCost: number
}

export interface Note {
  id: string
  body: string
  author: string
  createdAt: string
}

export type ActivityKind =
  | 'discovered'
  | 'score-change'
  | 'status-change'
  | 'data-refresh'
  | 'note'
  | 'tag'

export interface ActivityEvent {
  id: string
  targetId: string
  targetName: string
  kind: ActivityKind
  summary: string
  createdAt: string
  from?: string | number
  to?: string | number
}

export interface ProvenanceRow {
  field: string
  value: string
  provider: ProviderId
  fetchedAt: string
  confidence: number
  estimated: boolean
}

/**
 * Normalized 0–1 signal per criterion, plus the rationale sentence surfaced in
 * the score breakdown. Scoring is `normalized * weight`, so re-weighting the
 * buy box never requires re-ingesting data.
 */
export interface CriterionSignal {
  normalized: number
  rationale: string
}

export type CriterionSignals = Record<CriterionId, CriterionSignal>

export interface Target {
  id: string
  slug: string
  name: string
  industry: IndustryId
  address: string
  city: string
  county: CountyId
  marketStatus: MarketStatus
  isFranchise: boolean
  discoveredAt: string
  lastTouchedAt: string | null
  status: PipelineStatus
  saved: boolean
  tags: string[]
  sources: ProviderId[]

  // Firmographics
  website: SourcedValue<string>
  foundedYear: SourcedValue<number>
  entityType: SourcedValue<string>
  employees: SourcedValue<Range>
  locationCount: SourcedValue<number>
  licenses: SourcedValue<string[]>
  estRevenue: SourcedValue<Range>
  estEbitda: SourcedValue<Range>
  cashflowPositive: SourcedValue<boolean>
  ownershipSignal: SourcedValue<string>
  recentOwnershipChange: SourcedValue<boolean>
  ownerTenureYears: SourcedValue<number>

  // Digital presence signals
  reviewCount: SourcedValue<number>
  rating: SourcedValue<number>
  websiteQuality: SourcedValue<WebsiteQuality>
  localSearchVisibility: SourcedValue<number>
  marketingMaturity: SourcedValue<MarketingMaturity>

  signals: CriterionSignals
  contacts: Contact[]
  notes: Note[]
  activity: ActivityEvent[]
  provenance: ProvenanceRow[]
}

export interface ScoreRow {
  id: CriterionId
  label: string
  earned: number
  max: number
  normalized: number
  rationale: string
}

export interface ScoreBreakdown {
  total: number
  bucket: FitBucket
  rows: ScoreRow[]
}

export interface ConfidenceResult {
  score: number
  band: ConfidenceBand
  /** Share of tracked fields that have any value at all. */
  coverage: number
  missingFields: string[]
}

export interface HardFilterResult {
  label: string
  passed: boolean | null
  detail: string
}

export type ScoreWeights = Record<CriterionId, number>

export interface TargetFilters {
  query: string
  industries: IndustryId[]
  counties: CountyId[]
  buckets: FitBucket[]
  fitRange: Range
  minConfidence: number
  revenueRange: Range
  ebitdaRange: Range
  minYearsInBusiness: number
  employeeRange: Range
  marketStatus: MarketStatus | 'both'
  excludeFranchises: boolean
  weakDigitalOnly: boolean
  minRating: number
  minReviewCount: number
  tags: string[]
  statuses: PipelineStatus[]
}

export type TargetSortKey =
  | 'fit-desc'
  | 'fit-asc'
  | 'confidence-desc'
  | 'years-desc'
  | 'revenue-desc'
  | 'discovered-desc'

export interface SavedSearch {
  id: string
  name: string
  filters: Partial<TargetFilters>
  resultCount: number
  createdAt: string
  lastRunAt: string
  alertsEnabled: boolean
}

export interface Watchlist {
  id: string
  name: string
  description: string
  targetIds: string[]
}

export type AlertKind = 'ultra-discovery' | 'outreach-reply' | 'ingestion-error'

export interface AlertItem {
  id: string
  kind: AlertKind
  title: string
  body: string
  createdAt: string
  read: boolean
  targetId?: string
}

export interface SourceStatus {
  id: ProviderId
  name: string
  purpose: string
  connected: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  recordsIngested: number
  errorCount: number
  /** Credits or API units consumed this billing period. */
  usage: number
  usageQuota: number
  usageUnit: string
  spendUsd: number
  budgetUsd: number
  notes: string
}

export interface ScoringRuleVersion {
  id: string
  version: string
  createdAt: string
  author: string
  weights: ScoreWeights
  summary: string
  active: boolean
}

export interface OutreachTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
}

export interface DashboardStats {
  totalTargets: number
  newThisWeek: number
  ultraCount: number
  activePipeline: number
  averageFit: number
  dataCoverage: number
}
