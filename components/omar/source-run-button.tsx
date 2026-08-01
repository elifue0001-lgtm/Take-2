'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { triggerSourceRun } from '@/lib/omar/data'

export function SourceRunButton({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false)

  async function onRun() {
    setLoading(true)
    try {
      await triggerSourceRun(id)
      toast.success(`Queued an ingestion run for ${name}.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={onRun} disabled={loading}>
      <RefreshCwIcon className={loading ? 'animate-spin' : undefined} />
      Run now
    </Button>
  )
}
