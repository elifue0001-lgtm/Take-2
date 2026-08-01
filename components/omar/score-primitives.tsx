/**
 * Shared vocabulary for expressing the two scores and data provenance.
 *
 * Design contract, enforced everywhere:
 *  - Acquisition Fit is LOUD (large mono numeral, accent-ramped).
 *  - Data Confidence is QUIET (small segmented meter, neutral).
 *  - Any inferred value renders with the estimated affordance + tooltip.
 */

import { Info as InfoIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  BUCKET_STYLES,
  CONFIDENCE_BANDS,
  MARKETING_MATURITY_LABELS,
  PROVIDERS,
  WEBSITE_QUALITY_LABELS,
} from '@/lib/omar/config'
import {
  bucketMeta,
  confidenceLabel,
  formatDate,
  relativeTime,
} from '@/lib/omar/scoring'
import type {
  ConfidenceResult,
  FitBucket,
  MarketStatus,
  ProviderId,
  ScoreBreakdown,
  SourcedValue,
} from '@/lib/omar/types'

/* ------------------------------------------------------------------ */
/* Fit score                                                           */
/* ------------------------------------------------------------------ */

export function FitScore({
  score,
  bucket,
  size = 'md',
}: {
  score: number
  bucket: FitBucket
  size?: 'sm' | 'md' | 'lg'
}) {
  const styles = BUCKET_STYLES[bucket]
  const sizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  }
  return (
    <div className="flex items-baseline gap-1 leading-none">
      <span className={cn('font-mono font-semibold tracking-tight', sizes[size], styles.text)}>
        {score}
      </span>
      <span className="font-mono text-[0.65em] text-muted-foreground">/100</span>
    </div>
  )
}

export function BucketChip({
  bucket,
  variant = 'full',
  className,
}: {
  bucket: FitBucket
  variant?: 'full' | 'short'
  className?: string
}) {
  const meta = bucketMeta(bucket)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider',
        BUCKET_STYLES[bucket].chip,
        className,
      )}
    >
      {variant === 'full' ? meta.label : meta.short}
    </span>
  )
}

/**
 * The five weighted criteria as a single proportional bar. Segment width is the
 * criterion's weight; fill opacity is how much of it was earned. Reads as one
 * glyph at card density but still shows where the score came from.
 */
export function SubscoreBar({
  score,
  className,
}: {
  score: ScoreBreakdown
  className?: string
}) {
  const totalWeight = score.rows.reduce((sum, row) => sum + row.max, 0)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className={cn('flex h-1.5 w-full gap-px overflow-hidden rounded-full', className)}
            aria-label="Score composition by criterion"
          />
        }
      >
        {score.rows.map((row) => (
          <div
            key={row.id}
            className="h-full bg-muted"
            style={{ width: `${(row.max / totalWeight) * 100}%` }}
          >
            <div
              className={cn('h-full', BUCKET_STYLES[score.bucket].bar)}
              style={{ width: `${row.normalized * 100}%` }}
            />
          </div>
        ))}
      </TooltipTrigger>
      <TooltipContent className="w-64 p-0">
        <div className="flex flex-col gap-1 p-2">
          <p className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Fit composition
          </p>
          {score.rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate">{row.label}</span>
              <span className="shrink-0 font-mono tabular-nums">
                {row.earned}
                <span className="text-muted-foreground">/{row.max}</span>
              </span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ */
/* Confidence                                                          */
/* ------------------------------------------------------------------ */

/** Five segments, neutral colour. Deliberately visually quieter than FitScore. */
export function ConfidenceMeter({
  confidence,
  showLabel = true,
  className,
}: {
  confidence: ConfidenceResult
  showLabel?: boolean
  className?: string
}) {
  const filled = Math.round((confidence.score / 100) * 5)
  const missing = confidence.missingFields

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className={cn('flex items-center gap-1.5 text-left', className)} />
        }
      >
        <div className="flex items-center gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-2.5 w-1 rounded-[1px]',
                i < filled ? 'bg-muted-foreground' : 'bg-muted-foreground/20',
              )}
            />
          ))}
        </div>
        {showLabel ? (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {confidenceLabel(confidence.band)} conf
          </span>
        ) : null}
        <span className="sr-only">
          {`Data confidence ${confidence.score} of 100, ${confidenceLabel(confidence.band)}`}
        </span>
      </TooltipTrigger>
      <TooltipContent className="w-72">
        <div className="flex flex-col gap-1.5">
          <p className="font-medium">
            Data confidence {confidence.score}/100 · {confidenceLabel(confidence.band)}
          </p>
          <p className="text-muted-foreground">
            {confidence.coverage}% field coverage. Measures how complete and
            fresh the record is — not how attractive the business is.
          </p>
          {missing.length > 0 ? (
            <p className="text-muted-foreground">
              <span className="text-foreground">Missing:</span>{' '}
              {missing.slice(0, 4).join(', ')}
              {missing.length > 4 ? ` +${missing.length - 4} more` : ''}
            </p>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function ConfidenceBandLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {CONFIDENCE_BANDS.map((band) => (
        <span key={band.id} className="font-mono text-[10px] text-muted-foreground">
          {band.label} ≥ {band.min}
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sourced / estimated values                                          */
/* ------------------------------------------------------------------ */

/**
 * Renders a value together with its epistemic status. This is the single most
 * important component in the app: it is what stops a modeled EBITDA from
 * looking like a verified one.
 */
export function SourcedField<T>({
  field,
  format,
  className,
  emptyLabel = 'Not available',
}: {
  field: SourcedValue<T>
  format?: (value: T) => string
  className?: string
  emptyLabel?: string
}) {
  if (field.value === null || field.value === undefined) {
    return (
      <span className={cn('text-muted-foreground', className)}>{emptyLabel}</span>
    )
  }

  const display = format ? format(field.value) : String(field.value)

  if (!field.estimated) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className={cn('cursor-help', className)} />}>
          {display}
        </TooltipTrigger>
        <TooltipContent className="w-64">
          <p className="font-medium">Verified value</p>
          <p className="text-muted-foreground">
            {field.provider ? PROVIDERS[field.provider].label : 'Unknown source'} ·
            fetched {relativeTime(field.fetchedAt)} · field confidence{' '}
            {field.confidence}%
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn('estimated-value', className)} />}>
        {display}
      </TooltipTrigger>
      <TooltipContent className="w-72">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-primary">Estimated — not verified</p>
          {field.note ? <p className="text-muted-foreground">{field.note}</p> : null}
          <p className="text-muted-foreground">
            {field.provider ? PROVIDERS[field.provider].label : 'Modeled'} ·{' '}
            {formatDate(field.fetchedAt)} · field confidence {field.confidence}%
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

/** Compact inline marker for use in tight table cells. */
export function EstimatedTag() {
  return (
    <span className="ml-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
      est
    </span>
  )
}

export function ProviderBadges({
  sources,
  className,
}: {
  sources: ProviderId[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {sources.map((source) => (
        <span
          key={source}
          className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
        >
          {PROVIDERS[source].short}
        </span>
      ))}
    </div>
  )
}

export function MarketStatusBadge({ status }: { status: MarketStatus }) {
  const offMarket = status === 'off-market'
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              'inline-flex shrink-0 cursor-help items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider',
              offMarket
                ? 'border-primary/35 bg-primary/10 text-primary'
                : 'border-border bg-transparent text-muted-foreground',
            )}
          />
        }
      >
        {offMarket ? 'Off-market' : 'On-market'}
      </TooltipTrigger>
      <TooltipContent className="w-72">
        {offMarket ? (
          <p>
            No active listing detected. This is an inference from public signals,
            never a verified fact — confirm manually before outreach.
          </p>
        ) : (
          <p>
            Actively advertised for sale. Included for coverage, but the
            acquisition edge is lower than an unlisted prospect.
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ */
/* Misc labels                                                         */
/* ------------------------------------------------------------------ */

export function InfoHint({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
            aria-label="More information"
          />
        }
      >
        <InfoIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="w-72">{children}</TooltipContent>
    </Tooltip>
  )
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  )
}

export function StatBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'accent' | 'destructive'
}) {
  return (
    <Badge
      variant={tone === 'accent' ? 'default' : tone === 'destructive' ? 'destructive' : 'secondary'}
      className="font-mono text-[10px] uppercase tracking-wider"
    >
      {children}
    </Badge>
  )
}

export const websiteQualityLabel = (q: keyof typeof WEBSITE_QUALITY_LABELS) =>
  WEBSITE_QUALITY_LABELS[q]
export const marketingMaturityLabel = (
  m: keyof typeof MARKETING_MATURITY_LABELS,
) => MARKETING_MATURITY_LABELS[m]
