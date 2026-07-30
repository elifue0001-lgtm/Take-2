'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  AlertTriangleIcon,
  MailIcon,
  TargetIcon,
  XIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { SectionLabel } from '@/components/omar/score-primitives'
import { relativeTime } from '@/lib/omar/scoring'
import type { AlertItem, AlertKind } from '@/lib/omar/types'

const ALERT_ICONS: Record<AlertKind, typeof TargetIcon> = {
  'ultra-discovery': TargetIcon,
  'outreach-reply': MailIcon,
  'ingestion-error': AlertTriangleIcon,
}

/**
 * Alerts are deliberately scarce: Ultra discoveries, outreach replies, and
 * ingestion errors only. Anything else belongs in the weekly digest.
 */
export function AlertsPopover({
  alerts,
  children,
}: {
  alerts: AlertItem[]
  children: React.ReactNode
}) {
  // TODO(backend): replace with a Server Action calling dismissAlert().
  const [dismissed, setDismissed] = useState<string[]>([])
  const visible = alerts.filter((alert) => !dismissed.includes(alert.id))

  return (
    <Popover>
      <PopoverTrigger render={children as React.ReactElement} />
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <SectionLabel>Alerts</SectionLabel>
          <span className="font-mono text-[10px] text-muted-foreground">
            {visible.filter((alert) => !alert.read).length} unread
          </span>
        </div>
        <Separator />

        {visible.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No alerts. You are only notified for Ultra discoveries, replies, and
            ingestion errors.
          </p>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="flex flex-col">
              {visible.map((alert) => {
                const Icon = ALERT_ICONS[alert.kind]
                const body = (
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      {!alert.read ? (
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                      ) : null}
                      <p className="truncate text-xs font-medium">{alert.title}</p>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {alert.body}
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {relativeTime(alert.createdAt)}
                    </span>
                  </div>
                )

                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2.5 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-accent/50"
                  >
                    <Icon
                      className={
                        alert.kind === 'ingestion-error'
                          ? 'mt-0.5 size-3.5 shrink-0 text-destructive'
                          : 'mt-0.5 size-3.5 shrink-0 text-primary'
                      }
                    />
                    {alert.targetId ? (
                      <Link href={`/targets/${alert.targetId}`} className="min-w-0 flex-1">
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      aria-label={`Dismiss alert: ${alert.title}`}
                      onClick={() => setDismissed((prev) => [...prev, alert.id])}
                    >
                      <XIcon />
                    </Button>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
