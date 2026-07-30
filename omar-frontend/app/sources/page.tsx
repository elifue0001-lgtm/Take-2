import { AlertTriangleIcon } from 'lucide-react'

import { PageBody, PageHeader } from '@/components/omar/page-header'
import { SectionLabel } from '@/components/omar/score-primitives'
import { SourceRunButton } from '@/components/omar/source-run-button'
import { MONTHLY_BUDGET_USD } from '@/lib/omar/config'
import { getSourceStatuses } from '@/lib/omar/data'
import { relativeTime } from '@/lib/omar/scoring'

export default async function SourcesPage() {
  const sources = await getSourceStatuses()
  const spend = sources.reduce((sum, s) => sum + s.spendUsd, 0)

  return (
    <>
      <PageHeader
        title="Sources"
        description="Connector health, quota consumption, and spend against the monthly budget."
        actions={
          <span className="font-mono text-xs text-muted-foreground">
            ${spend.toFixed(0)} / ${MONTHLY_BUDGET_USD} this month
          </span>
        }
      />
      <PageBody>
        <div className="grid gap-3 md:grid-cols-2">
          {sources.map((source) => {
            const usagePct = source.usageQuota > 0 ? (source.usage / source.usageQuota) * 100 : 0
            const spendPct = source.budgetUsd > 0 ? (source.spendUsd / source.budgetUsd) * 100 : 0
            return (
              <div key={source.id} className="flex flex-col gap-3 rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <span
                        className={
                          source.connected
                            ? 'size-1.5 rounded-full bg-primary'
                            : 'size-1.5 rounded-full bg-muted-foreground/40'
                        }
                      />
                      {source.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{source.purpose}</span>
                  </div>
                  <SourceRunButton id={source.id} name={source.name} />
                </div>

                {source.errorCount > 0 ? (
                  <div className="flex items-center gap-1.5 rounded-sm bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                    <AlertTriangleIcon className="size-3" />
                    {source.errorCount} ingestion error{source.errorCount === 1 ? '' : 's'}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Usage
                    </span>
                    <span className="font-mono tabular-nums">
                      {source.usage} / {source.usageQuota} {source.usageUnit}
                    </span>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, usagePct)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Spend
                    </span>
                    <span className="font-mono tabular-nums">
                      ${source.spendUsd.toFixed(0)} / ${source.budgetUsd.toFixed(0)}
                    </span>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, spendPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                  <span>Records ingested: {source.recordsIngested}</span>
                  <span>Last run {relativeTime(source.lastRunAt)}</span>
                </div>
                {source.notes ? (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {source.notes}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
        <p className="pt-1 text-xs text-muted-foreground">
          <SectionLabel className="inline">Note</SectionLabel> — connector health
          here reflects the last ingestion run recorded by the backend once it's
          wired up; these values are illustrative until then.
        </p>
      </PageBody>
    </>
  )
}
