'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { BucketChip, SectionLabel } from '@/components/omar/score-primitives'
import { BUCKETS, CRITERIA, DEFAULT_WEIGHTS } from '@/lib/omar/config'
import { publishWeights } from '@/lib/omar/data'
import { bucketForScore, scoreTarget, weightsTotal } from '@/lib/omar/scoring'
import type { CriterionId, ScoreWeights, ScoringRuleVersion, Target } from '@/lib/omar/types'

export function ThesisEditor({
  targets,
  ruleVersions,
}: {
  targets: Target[]
  ruleVersions: ScoringRuleVersion[]
}) {
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS)
  const [summary, setSummary] = useState('')
  const [publishing, setPublishing] = useState(false)

  const total = weightsTotal(weights)
  const valid = total === 100

  const bucketCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const bucket of BUCKETS) counts[bucket.id] = 0
    for (const target of targets) {
      const { total: score } = scoreTarget(target, weights)
      const bucket = bucketForScore(score)
      counts[bucket] = (counts[bucket] ?? 0) + 1
    }
    return counts
  }, [targets, weights])

  function setWeight(id: CriterionId, value: number) {
    setWeights((prev) => ({ ...prev, [id]: value }))
  }

  function autoBalance() {
    const entries = Object.entries(weights) as [CriterionId, number][]
    const currentTotal = entries.reduce((sum, [, value]) => sum + value, 0)
    if (currentTotal === 0) return

    const scaled = entries.map(([id, value]) => [id, value / currentTotal] as const)
    const rounded = scaled.map(([id, ratio]) => [id, Math.round(ratio * 100)] as const)
    const roundedTotal = rounded.reduce((sum, [, value]) => sum + value, 0)
    const diff = 100 - roundedTotal
    const largestIndex = rounded.reduce(
      (best, current, index) => (current[1] > rounded[best][1] ? index : best),
      0,
    )
    const adjusted = rounded.map(([id, value], index) => [id, index === largestIndex ? value + diff : value] as const)

    setWeights((prev) => {
      const next = { ...prev }
      for (const [id, value] of adjusted) next[id] = value
      return next
    })
  }

  async function onPublish() {
    if (!valid) {
      toast.error('Weights must total exactly 100 before publishing.')
      return
    }
    setPublishing(true)
    try {
      await publishWeights(weights, summary || 'Manual re-weight from /thesis')
      toast.success('New scoring rule version published.')
      setSummary('')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 rounded-md border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Scoring weights</SectionLabel>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={autoBalance}
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Auto-balance
              </button>
              <span
                className={
                  valid
                    ? 'font-mono text-xs text-primary'
                    : 'font-mono text-xs text-destructive'
                }
              >
                {total} / 100 {valid ? '' : '— must equal 100'}
              </span>
            </div>
          </div>

          {CRITERIA.map((criterion) => (
            <div key={criterion.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{criterion.label}</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {weights[criterion.id]}
                </span>
              </div>
              <Slider
                min={0}
                max={50}
                value={[weights[criterion.id]]}
                onValueChange={(v) => setWeight(criterion.id, Array.isArray(v) ? v[0] : v)}
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {criterion.description}
              </p>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What changed and why…"
              className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button size="sm" onClick={onPublish} disabled={!valid || publishing}>
              Publish new version
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>Live re-rank preview</SectionLabel>
          <p className="text-xs text-muted-foreground">
            How the current {targets.length} targets would redistribute across
            buckets under these weights — nothing is saved until you publish.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BUCKETS.map((bucket) => (
              <div key={bucket.id} className="flex flex-col gap-1.5 rounded-md border border-border p-3">
                <BucketChip bucket={bucket.id} variant="short" />
                <span className="font-mono text-xl font-semibold tabular-nums">
                  {bucketCounts[bucket.id] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-2">
        <SectionLabel>Version history</SectionLabel>
        <div className="flex flex-col rounded-md border border-border">
          {ruleVersions.map((version) => (
            <div
              key={version.id}
              className="flex flex-col gap-1 border-b border-border px-3 py-2.5 text-xs last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-medium">{version.version}</span>
                {version.active ? (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                    Active
                  </span>
                ) : null}
              </div>
              <p className="text-muted-foreground">{version.summary}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {version.author} · {new Date(version.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
