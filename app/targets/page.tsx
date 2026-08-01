import { PageHeader } from '@/components/omar/page-header'
import { TargetsExplorer } from '@/components/omar/targets-explorer'
import { getTargets } from '@/lib/omar/data'
import type { FitBucket } from '@/lib/omar/types'

export default async function TargetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; bucket?: string }>
}) {
  const params = await searchParams
  const targets = await getTargets()

  return (
    <>
      <PageHeader
        title="Targets"
        description="Every prospect the radar has discovered, filtered and ranked against the buy box."
      />
      <TargetsExplorer
        initialTargets={targets}
        initialQuery={params.q ?? ''}
        initialBucket={params.bucket as FitBucket | undefined}
      />
    </>
  )
}
