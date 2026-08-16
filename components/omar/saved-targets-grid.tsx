'use client'

import { useState } from 'react'

import { TargetCard } from '@/components/omar/target-card'
import type { ScoredTarget } from '@/lib/omar/data'
import { useTargetActions } from '@/lib/omar/use-target-actions'

export function SavedTargetsGrid({ initialTargets }: { initialTargets: ScoredTarget[] }) {
  const [targets, setTargets] = useState(initialTargets)
  const { toggleSave, changeStatus } = useTargetActions(targets, setTargets)

  async function handleToggleSave(id: string, saved: boolean) {
    if (!saved) {
      setTargets((prev) => prev.filter((item) => item.target.id !== id))
    }
    await toggleSave(id, saved)
  }

  async function handleStatusChange(id: string, status: string) {
    await changeStatus(id, status as any)
  }

  return (
    <div className="@container">
      <div className="grid gap-3 @lg:grid-cols-2 @xl:grid-cols-3">
        {targets.map((scored) => (
          <TargetCard
            key={scored.target.id}
            scored={scored}
            onToggleSave={handleToggleSave}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  )
}
