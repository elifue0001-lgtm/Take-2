'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PIPELINE_STATUSES } from '@/lib/omar/config'
import type { PipelineStatus } from '@/lib/omar/types'
import { cn } from '@/lib/utils'

export function StatusSelect({
  value,
  onChange,
  className,
}: {
  value: PipelineStatus
  onChange?: (status: PipelineStatus) => void
  className?: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange?.(next as PipelineStatus)}
    >
      <SelectTrigger size="sm" className={cn('w-full font-mono uppercase tracking-wider', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PIPELINE_STATUSES.map((status) => (
          <SelectItem key={status.id} value={status.id}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
