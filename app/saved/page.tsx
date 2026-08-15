import Link from 'next/link'
import { BookmarkIcon, ListIcon, SaveIcon } from 'lucide-react'

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageBody, PageHeader } from '@/components/omar/page-header'
import { SavedSearchRow } from '@/components/omar/saved-search-row'
import { SavedTargetsGrid } from '@/components/omar/saved-targets-grid'
import { getSavedSearches, getSavedTargets, getWatchlists } from '@/lib/omar/data'

export default async function SavedPage() {
  const [saved, searches, watchlists] = await Promise.all([
    getSavedTargets(),
    getSavedSearches(),
    getWatchlists(),
  ])

  return (
    <>
      <PageHeader
        title="Saved"
        description="Targets you've bookmarked, saved filter combinations, and watchlists."
      />
      <PageBody>
        <Tabs defaultValue="targets">
          <TabsList>
            <TabsTrigger value="targets">
              <BookmarkIcon className="size-3.5" />
              Targets ({saved.length})
            </TabsTrigger>
            <TabsTrigger value="searches">
              <SaveIcon className="size-3.5" />
              Saved searches ({searches.length})
            </TabsTrigger>
            <TabsTrigger value="watchlists">
              <ListIcon className="size-3.5" />
              Watchlists ({watchlists.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="targets" className="pt-4">
            {saved.length === 0 ? (
              <Empty className="border">
                <EmptyMedia variant="icon">
                  <BookmarkIcon />
                </EmptyMedia>
                <EmptyTitle>No saved targets yet</EmptyTitle>
                <EmptyDescription>
                  Save a prospect from the Targets screen to track it here.
                </EmptyDescription>
              </Empty>
            ) : (
              <SavedTargetsGrid initialTargets={saved} />
            )}
          </TabsContent>

          <TabsContent value="searches" className="pt-4">
            {searches.length === 0 ? (
              <Empty className="border">
                <EmptyMedia variant="icon">
                  <SaveIcon />
                </EmptyMedia>
                <EmptyTitle>No saved searches</EmptyTitle>
                <EmptyDescription>
                  Save a filter combination from the Targets screen to re-run it
                  later or get alerted on new matches.
                </EmptyDescription>
              </Empty>
            ) : (
              <div className="flex flex-col rounded-md border border-border">
                {searches.map((search) => (
                  <SavedSearchRow key={search.id} search={search} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="watchlists" className="pt-4">
            {watchlists.length === 0 ? (
              <Empty className="border">
                <EmptyMedia variant="icon">
                  <ListIcon />
                </EmptyMedia>
                <EmptyTitle>No watchlists</EmptyTitle>
                <EmptyDescription>
                  Group related prospects — a roll-up cluster, a shortlist — into
                  a named watchlist.
                </EmptyDescription>
              </Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {watchlists.map((watchlist) => (
                  <div key={watchlist.id} className="rounded-md border border-border p-3">
                    <p className="text-sm font-semibold">{watchlist.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {watchlist.description}
                    </p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {watchlist.targetIds.length} targets
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {watchlist.targetIds.slice(0, 6).map((id) => (
                        <Link
                          key={id}
                          href={`/targets/${id}`}
                          className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          {id}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  )
}
