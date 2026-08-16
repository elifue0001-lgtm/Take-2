import { PageHeader } from '@/components/omar/page-header'
import { TargetsExplorer } from '@/components/omar/targets-explorer'
import { getAllTags, getSavedSearches, getTargets } from '@/lib/omar/data'
import type { FitBucket, TargetFilters } from '@/lib/omar/types'

export default async function TargetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; bucket?: string; savedSearch?: string }>
}) {
  const params = await searchParams
  const [targets, savedSearches, tags] = await Promise.all([
    getTargets(),
    getSavedSearches(),
    getAllTags(),
  ])
  const savedSearch = savedSearches.find((search) => search.id === params.savedSearch)

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
        initialFilters={savedSearch?.filters as Partial<TargetFilters> | undefined}
        tags={tags}
      />
    </>
  )
}
