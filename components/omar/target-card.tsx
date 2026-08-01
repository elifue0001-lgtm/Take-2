'use client'

import Link from 'next/link'
import { Bookmark as BookmarkIcon, Building as BuildingIcon, ExternalLink as ExternalLinkIcon, MapPin as MapPinIcon, MoveHorizontal as MoreHorizontalIcon, Users as UsersIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { COUNTIES, INDUSTRIES } from '@/lib/omar/config'
import {
  formatCurrencyRange,
  formatRange,
  relativeTime,
} from '@/lib/omar/scoring'
import type { ScoredTarget } from '@/lib/omar/data'
import {
  BucketChip,
  ConfidenceMeter,
  FitScore,
  MarketStatusBadge,
  ProviderBadges,
  SourcedField,
  SubscoreBar,
} from '@/components/omar/score-primitives'
import { StatusSelect } from '@/components/omar/status-select'

export function TargetCard({
  scored,
  onToggleSave,
  onStatusChange,
  className,
}: {
  scored: ScoredTarget
  onToggleSave?: (id: string, saved: boolean) => void
  onStatusChange?: (id: string, status: string) => void
  className?: string
}) {
  const { target, score, confidence, years } = scored
  const industry = INDUSTRIES.find((i) => i.id === target.industry)
  const county = COUNTIES.find((c) => c.id === target.county)

  return (
    <Card className={cn('gap-0 overflow-hidden py-0', className)}>
      <CardHeader className="gap-2 px-3.5 pt-3.5 pb-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              href={`/targets/${target.id}`}
              className="truncate text-sm font-semibold leading-tight hover:text-primary hover:underline"
            >
              {target.name}
            </Link>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BuildingIcon className="size-3" />
                {industry?.short}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="size-3" />
                {target.city}, {county?.short}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <FitScore score={score.total} bucket={score.bucket} />
            <BucketChip bucket={score.bucket} variant="short" />
          </div>
        </div>

        <SubscoreBar score={score} />
      </CardHeader>

      <CardContent className="px-3.5 pb-2.5">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <Metric label="Years in business">
            {years !== null ? (
              <SourcedField
                field={target.foundedYear}
                format={(value) => `${years} yrs · est. ${value}`}
              />
            ) : (
              <span className="text-muted-foreground">Unknown</span>
            )}
          </Metric>
          <Metric label="Employees">
            <SourcedField
              field={target.employees}
              format={(value) => formatRange(value)}
            />
          </Metric>
          <Metric label="Est. revenue">
            <SourcedField
              field={target.estRevenue}
              format={(value) => formatCurrencyRange(value)}
            />
          </Metric>
          <Metric label="Est. EBITDA">
            <SourcedField
              field={target.estEbitda}
              format={(value) => formatCurrencyRange(value)}
            />
          </Metric>
        </dl>

        {target.tags.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {target.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {target.tags.length > 3 ? (
              <span className="px-1 py-0.5 text-[10px] text-muted-foreground">
                +{target.tags.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}
      </CardContent>

      <Separator />

      <CardFooter className="flex-col items-stretch gap-2 px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <MarketStatusBadge status={target.marketStatus} />
          <ConfidenceMeter confidence={confidence} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <ProviderBadges sources={target.sources} />
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={target.saved ? 'Remove from saved' : 'Save target'}
              onClick={() => onToggleSave?.(target.id, !target.saved)}
            >
              <BookmarkIcon
                className={cn(target.saved && 'fill-primary text-primary')}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="More actions">
                    <MoreHorizontalIcon />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href={`/targets/${target.id}`} />}>
                    Open target
                  </DropdownMenuItem>
                  {target.website.value ? (
                    <DropdownMenuItem
                      render={
                        <a
                          href={`https://${target.website.value}`}
                          target="_blank"
                          rel="noreferrer noopener"
                        />
                      }
                    >
                      Visit website
                      <ExternalLinkIcon className="ml-auto" />
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    render={
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${target.name} ${target.address}`,
                        )}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      />
                    }
                  >
                    Open in Maps
                    <ExternalLinkIcon className="ml-auto" />
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusSelect
            value={target.status}
            onChange={(status) => onStatusChange?.(target.id, status)}
            className="h-7 flex-1 text-[11px]"
          />
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {relativeTime(target.discoveredAt)}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}

function Metric({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="truncate font-mono text-[11px]">{children}</dd>
    </div>
  )
}

/** Compact variant used by the dashboard spotlight and pipeline board. */
export function TargetCardCompact({ scored }: { scored: ScoredTarget }) {
  const { target, score, confidence } = scored
  const county = COUNTIES.find((c) => c.id === target.county)

  return (
    <Link
      href={`/targets/${target.id}`}
      className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-xs font-semibold leading-tight">
          {target.name}
        </p>
        <FitScore score={score.total} bucket={score.bucket} size="sm" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] text-muted-foreground">
          {county?.short} · {relativeTime(target.lastTouchedAt ?? target.discoveredAt)}
        </span>
        <ConfidenceMeter confidence={confidence} showLabel={false} />
      </div>
      <SubscoreBar score={score} />
    </Link>
  )
}
