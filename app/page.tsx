import Link from 'next/link'
import {
  ArrowRightIcon,
  DatabaseIcon,
  FlagIcon,
  PencilLineIcon,
  RadarIcon,
  TagIcon,
  TrendingUpIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PageBody, PageHeader } from '@/components/omar/page-header'
import {
  BucketChip,
  SectionLabel,
} from '@/components/omar/score-primitives'
import { TargetCardCompact } from '@/components/omar/target-card'
import { BUCKETS } from '@/lib/omar/config'
import {
  getBucketCounts,
  getDashboardStats,
  getRecentActivity,
  getSourceStatuses,
  getSpotlightTargets,
} from '@/lib/omar/data'
import { relativeTime } from '@/lib/omar/scoring'
import type { ActivityKind } from '@/lib/omar/types'

const ACTIVITY_ICONS: Record<ActivityKind, typeof RadarIcon> = {
  discovered: RadarIcon,
  'score-change': TrendingUpIcon,
  'status-change': FlagIcon,
  'data-refresh': DatabaseIcon,
  note: PencilLineIcon,
  tag: TagIcon,
}

export default async function DashboardPage() {
  const [stats, spotlight, buckets, activity, sources] = await Promise.all([
    getDashboardStats(),
    getSpotlightTargets(6),
    getBucketCounts(),
    getRecentActivity(8),
    getSourceStatuses(),
  ])

  const spend = sources.reduce((sum, s) => sum + s.spendUsd, 0)
  const budget = sources.reduce((sum, s) => sum + s.budgetUsd, 0)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Coverage, spotlight prospects, and recent activity across the Southern California field-service radar."
        actions={
          <Button size="sm" render={<Link href="/targets" />}>
            Browse targets
            <ArrowRightIcon />
          </Button>
        }
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Total targets" value={stats.totalTargets} />
          <StatTile label="New this week" value={stats.newThisWeek} />
          <StatTile label="High quality" value={stats.highCount} accent />
          <StatTile label="Active pipeline" value={stats.activePipeline} />
          <StatTile label="Average fit" value={`${stats.averageFit}`} suffix="/100" />
          <StatTile label="Data coverage" value={`${stats.dataCoverage}%`} />
        </div>

        <section className="flex flex-col gap-2">
          <SectionLabel>Bucket breakdown</SectionLabel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BUCKETS.map((bucket) => (
              <Link
                key={bucket.id}
                href={`/targets?bucket=${bucket.id}`}
                className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40"
              >
                <BucketChip bucket={bucket.id} variant="short" />
                <span className="font-mono text-2xl font-semibold tabular-nums">
                  {buckets[bucket.id] ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Spotlight — highest fit prospects</SectionLabel>
            <Link
              href="/targets"
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {spotlight.length === 0 ? (
            <Empty className="border">
              <EmptyMedia variant="icon">
                <RadarIcon />
              </EmptyMedia>
              <EmptyTitle>No High targets yet</EmptyTitle>
              <EmptyDescription>
                Connect a data source or widen the buy box on the Targets screen.
              </EmptyDescription>
            </Empty>
          ) : (
            <div className="@container">
              <div className="grid gap-3 @lg:grid-cols-2 @xl:grid-cols-3">
                {spotlight.map((scored) => (
                  <TargetCardCompact key={scored.target.id} scored={scored} />
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="flex flex-col gap-2">
            <SectionLabel>Recent activity</SectionLabel>
            <div className="flex flex-col rounded-md border border-border">
              {activity.length === 0 ? (
                <p className="p-4 text-xs text-muted-foreground">
                  Nothing has happened yet — activity appears here as targets are
                  discovered, scored, and worked.
                </p>
              ) : (
                activity.map((event) => {
                  const Icon = ACTIVITY_ICONS[event.kind]
                  return (
                    <Link
                      key={event.id}
                      href={`/targets/${event.targetId}`}
                      className="flex items-start gap-2.5 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-accent/40"
                    >
                      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="truncate text-xs">
                          <span className="font-medium">{event.targetName}</span>{' '}
                          <span className="text-muted-foreground">{event.summary}</span>
                        </p>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {relativeTime(event.createdAt)}
                        </span>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel>Data sources &amp; budget</SectionLabel>
            <div className="flex flex-col gap-2 rounded-md border border-border p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Monthly spend</span>
                <span className="font-mono tabular-nums">
                  ${spend.toFixed(0)}
                  <span className="text-muted-foreground"> / ${budget.toFixed(0)}</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, (spend / (budget || 1)) * 100)}%` }}
                />
              </div>
              <div className="mt-1 flex flex-col gap-1.5">
                {sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={
                          source.connected
                            ? 'size-1.5 rounded-full bg-primary'
                            : 'size-1.5 rounded-full bg-muted-foreground/40'
                        }
                      />
                      {source.name}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {source.errorCount > 0 ? `${source.errorCount} errors` : relativeTime(source.lastRunAt)}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/sources"
                className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                View source health →
              </Link>
            </div>
          </section>
        </div>
      </PageBody>
    </>
  )
}

function StatTile({
  label,
  value,
  suffix,
  accent = false,
}: {
  label: string
  value: string | number
  suffix?: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-3">
      <span className="truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={
          accent
            ? 'font-mono text-2xl font-semibold tabular-nums text-primary'
            : 'font-mono text-2xl font-semibold tabular-nums'
        }
      >
        {value}
        {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
      </span>
    </div>
  )
}
