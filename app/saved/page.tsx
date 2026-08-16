import { BookmarkIcon, ChevronDownIcon, ListIcon, SaveIcon } from 'lucide-react'

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageBody, PageHeader } from '@/components/omar/page-header'
import { SavedSearchRow } from '@/components/omar/saved-search-row'
import { SavedTargetsGrid } from '@/components/omar/saved-targets-grid'
import { getSavedSearches, getSavedTargets, getTargets, getWatchlists } from '@/lib/omar/data'

export default async function SavedPage() {
  const [saved, searches, watchlists, targets] = await Promise.all([
    getSavedTargets(),
    getSavedSearches(),
    getWatchlists(),
    getTargets(),
  ])

  const targetLookup = new Map(targets.map((scored) => [scored.target.id, scored]))

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
                {watchlists.map((watchlist) => {
                  const members = watchlist.targetIds
                    .map((id) => targetLookup.get(id))
                    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

                  return (
                    <Collapsible key={watchlist.id} className="rounded-md border border-border bg-card">
                      <div className="p-3">
                        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{watchlist.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {watchlist.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {members.length} targets
                            </span>
                            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                          </div>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent className="border-t border-border p-3">
                        {members.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No matching targets found in the current dataset.
                          </p>
                        ) : (
                          <SavedTargetsGrid initialTargets={members} />
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  )
}
