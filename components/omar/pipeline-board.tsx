'use client'

import { useState } from 'react'
import Link from 'next/link'

import { FitScore } from '@/components/omar/score-primitives'
import { StatusSelect } from '@/components/omar/status-select'
import { PIPELINE_STATUSES } from '@/lib/omar/config'
import { setTargetStatus, type ScoredTarget } from '@/lib/omar/data'
import { relativeTime } from '@/lib/omar/scoring'
import type { PipelineStatus } from '@/lib/omar/types'

export function PipelineBoard({ initialTargets }: { initialTargets: ScoredTarget[] }) {
  const [targets, setTargets] = useState(initialTargets)

  const inPipeline = targets.filter((s) => s.target.status !== 'new')
  const columns = PIPELINE_STATUSES.filter((s) => s.id !== 'new')

  async function move(id: string, status: PipelineStatus) {
    setTargets((prev) =>
      prev.map((s) => (s.target.id === id ? { ...s, target: { ...s.target, status } } : s)),
    )
    await setTargetStatus(id, status)
  }

  return (
    <div className="flex min-w-full gap-3 overflow-x-auto p-4 md:p-6">
      {columns.map((column) => {
        const items = inPipeline.filter((s) => s.target.status === column.id)
        return (
          <div key={column.id} className="flex w-64 shrink-0 flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {column.label}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">{items.length}</span>
            </div>
            <div className="flex min-h-16 flex-col gap-2 rounded-md border border-dashed border-border p-1.5">
              {items.length === 0 ? (
                <p className="px-2 py-4 text-center text-[11px] text-muted-foreground">
                  Nothing here
                </p>
              ) : (
                items.map((scored) => (
                  <div
                    key={scored.target.id}
                    className="flex flex-col gap-1.5 rounded-md border border-border bg-card p-2.5"
                  >
                    <Link
                      href={`/targets/${scored.target.id}`}
                      className="flex items-start justify-between gap-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold leading-tight hover:text-primary hover:underline">
                        {scored.target.name}
                      </span>
                      <FitScore score={scored.score.total} bucket={scored.score.bucket} size="sm" />
                    </Link>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {relativeTime(scored.target.lastTouchedAt ?? scored.target.discoveredAt)}
                    </span>
                    <StatusSelect
                      value={scored.target.status}
                      onChange={(status) => move(scored.target.id, status)}
                      className="h-6 text-[10px]"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
