'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Switch } from '@/components/ui/switch'
import { setSavedSearchAlerts, type SavedSearch } from '@/lib/omar/data'

export function SavedSearchRow({ search }: { search: SavedSearch }) {
  const [alertsEnabled, setAlertsEnabled] = useState(search.alertsEnabled)

  async function handleToggle(next: boolean) {
    setAlertsEnabled(next)
    await setSavedSearchAlerts(search.id, next)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5 text-xs last:border-b-0">
      <Link
        href={`/targets?savedSearch=${encodeURIComponent(search.id)}`}
        className="flex min-w-0 flex-1 flex-col gap-0.5 hover:text-primary"
      >
        <span className="font-medium">{search.name}</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {search.resultCount} results · last run {new Date(search.lastRunAt).toLocaleDateString()}
        </span>
      </Link>

      <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Alerts
        </span>
        <Switch checked={alertsEnabled} onCheckedChange={(checked) => handleToggle(Boolean(checked))} />
      </div>
    </div>
  )
}
