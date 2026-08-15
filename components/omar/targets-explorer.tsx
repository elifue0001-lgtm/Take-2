'use client'

import { useEffect, useMemo, useState } from 'react'
import { FilterIcon, RadarIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Switch } from '@/components/ui/switch'
import { SectionLabel } from '@/components/omar/score-primitives'
import { TargetCard } from '@/components/omar/target-card'
import { BUCKETS, COUNTIES, INDUSTRIES } from '@/lib/omar/config'
import {
  applyFilters,
  DEFAULT_FILTERS,
  FILTER_BOUNDS,
  needsEnrichment,
  saveSearch,
  sortTargets,
  type ScoredTarget,
} from '@/lib/omar/data'
import { useTargetActions } from '@/lib/omar/use-target-actions'
import { formatCompactUsd } from '@/lib/omar/scoring'
import type {
  CountyId,
  FitBucket,
  IndustryId,
  MarketStatus,
  PipelineStatus,
  TargetFilters,
  TargetSortKey,
} from '@/lib/omar/types'

const SORT_OPTIONS: { value: TargetSortKey; label: string }[] = [
  { value: 'fit-desc', label: 'Fit — high to low' },
  { value: 'fit-asc', label: 'Fit — low to high' },
  { value: 'confidence-desc', label: 'Confidence — high to low' },
  { value: 'years-desc', label: 'Years in business' },
  { value: 'revenue-desc', label: 'Est. revenue' },
  { value: 'discovered-desc', label: 'Recently discovered' },
]

export function TargetsExplorer({
  initialTargets,
  initialQuery = '',
  initialBucket,
  initialFilters,
}: {
  initialTargets: ScoredTarget[]
  initialQuery?: string
  initialBucket?: FitBucket
  initialFilters?: Partial<TargetFilters>
}) {
  const [targets, setTargets] = useState(initialTargets)
  const { toggleSave, changeStatus } = useTargetActions(targets, setTargets)
  const [sort, setSort] = useState<TargetSortKey>('fit-desc')
  const [alertsOnNewMatches, setAlertsOnNewMatches] = useState(false)
  const [filters, setFilters] = useState<TargetFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
    query: initialQuery || initialFilters?.query || '',
    buckets: initialBucket
      ? [initialBucket]
      : initialFilters?.buckets && Array.isArray(initialFilters.buckets)
        ? (initialFilters.buckets as FitBucket[])
        : [],
  })

  useEffect(() => {
    setFilters((prev) => ({ ...prev, query: initialQuery }))
  }, [initialQuery])

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ...initialFilters,
      buckets: initialBucket
        ? [initialBucket]
        : initialFilters?.buckets && Array.isArray(initialFilters.buckets)
          ? (initialFilters.buckets as FitBucket[])
          : [],
      query: initialQuery || initialFilters?.query || '',
    }))
  }, [initialBucket, initialFilters, initialQuery])

  const results = useMemo(
    () => sortTargets(applyFilters(targets, filters), sort),
    [targets, filters, sort],
  )
  const verifyQueue = useMemo(
    () => sortTargets(results.filter((scored) => needsEnrichment(scored.target)), 'fit-desc'),
    [results],
  )
  const regularResults = useMemo(
    () => results.filter((scored) => !needsEnrichment(scored.target)),
    [results],
  )

  function update<K extends keyof TargetFilters>(key: K, value: TargetFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function toggleInArray<T>(key: keyof TargetFilters, value: T) {
    setFilters((prev) => {
      const current = prev[key] as unknown as T[]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [key]: next }
    })
  }

  async function handleToggleSave(id: string, saved: boolean) {
    await toggleSave(id, saved)
  }

  async function handleStatusChange(id: string, status: string) {
    await changeStatus(id, status as PipelineStatus)
  }

  async function handleSaveSearch() {
    const name = window.prompt('Name this saved search', 'New search')
    if (!name?.trim()) return

    await saveSearch(name.trim(), filters, results.length, alertsOnNewMatches)
    setAlertsOnNewMatches(false)
  }

  const filterPanel = (
    <FilterPanel filters={filters} update={update} toggleInArray={toggleInArray} />
  )

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:flex-row md:gap-5 md:p-6">
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-[4.5rem] flex max-h-[calc(100vh-6rem)] flex-col gap-5 overflow-y-auto pr-1">
          {filterPanel}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-mono font-medium text-foreground">{results.length}</span>{' '}
            of {targets.length} targets
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Alerts
              </span>
              <Switch
                checked={alertsOnNewMatches}
                onCheckedChange={(checked) => setAlertsOnNewMatches(Boolean(checked))}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSaveSearch}>
              Save search
            </Button>
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="md:hidden">
                    <FilterIcon />
                    Filters
                  </Button>
                }
              />
              <SheetContent side="left" className="w-72 overflow-y-auto p-4">
                <SheetHeader className="p-0 pb-2">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                {filterPanel}
              </SheetContent>
            </Sheet>

            <Select value={sort} onValueChange={(v) => setSort(v as TargetSortKey)}>
              <SelectTrigger size="sm" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {verifyQueue.length > 0 ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <SectionLabel className="text-amber-700 dark:text-amber-300">
                Verify these next
              </SectionLabel>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                {verifyQueue.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {verifyQueue.map((scored) => (
                <TargetCard
                  key={scored.target.id}
                  scored={scored}
                  onToggleSave={handleToggleSave}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        ) : null}

        {results.length === 0 ? (
          <Empty className="border">
            <EmptyMedia variant="icon">
              <RadarIcon />
            </EmptyMedia>
            <EmptyTitle>No targets match these filters</EmptyTitle>
            <EmptyDescription>
              Try widening the buy box — clear a filter or two and results will
              reappear.
            </EmptyDescription>
            <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Reset filters
            </Button>
          </Empty>
        ) : null}

        {regularResults.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {regularResults.map((scored) => (
              <TargetCard
                key={scored.target.id}
                scored={scored}
                onToggleSave={handleToggleSave}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function FilterPanel({
  filters,
  update,
  toggleInArray,
}: {
  filters: TargetFilters
  update: <K extends keyof TargetFilters>(key: K, value: TargetFilters[K]) => void
  toggleInArray: <T>(key: keyof TargetFilters, value: T) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionLabel>Search</SectionLabel>
        {hasActiveFilters(filters) ? (
          <button
            type="button"
            className="inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            onClick={() => update('query', '') }
          >
            <XIcon className="size-3" /> clear
          </button>
        ) : null}
      </div>
      <input
        value={filters.query}
        onChange={(e) => update('query', e.target.value)}
        placeholder="Name, city, tag…"
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      <div className="flex flex-col gap-2">
        <SectionLabel>Fit bucket</SectionLabel>
        <div className="flex flex-col gap-1.5">
          {BUCKETS.map((bucket) => (
            <CheckRow
              key={bucket.id}
              label={bucket.label}
              checked={filters.buckets.includes(bucket.id)}
              onCheckedChange={() => toggleInArray<FitBucket>('buckets', bucket.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>Industry</SectionLabel>
        <div className="flex flex-col gap-1.5">
          {INDUSTRIES.map((industry) => (
            <CheckRow
              key={industry.id}
              label={industry.label}
              checked={filters.industries.includes(industry.id)}
              onCheckedChange={() => toggleInArray<IndustryId>('industries', industry.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>County</SectionLabel>
        <div className="flex flex-col gap-1.5">
          {COUNTIES.map((county) => (
            <CheckRow
              key={county.id}
              label={county.label}
              checked={filters.counties.includes(county.id)}
              onCheckedChange={() => toggleInArray<CountyId>('counties', county.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>Market status</SectionLabel>
        <Select
          value={filters.marketStatus}
          onValueChange={(v) => update('marketStatus', v as MarketStatus | 'both')}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">On &amp; off-market</SelectItem>
            <SelectItem value="off-market">Off-market only</SelectItem>
            <SelectItem value="on-market">On-market only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Est. EBITDA</SectionLabel>
        <Slider
          min={FILTER_BOUNDS.ebitda.min}
          max={FILTER_BOUNDS.ebitda.max}
          step={100_000}
          value={[filters.ebitdaRange.min, filters.ebitdaRange.max]}
          onValueChange={(v) => { const a = Array.isArray(v) ? v : [v]; update('ebitdaRange', { min: a[0], max: a[1] }) }}
        />
        <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>{formatCompactUsd(filters.ebitdaRange.min)}</span>
          <span>{formatCompactUsd(filters.ebitdaRange.max)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Min. years in business</SectionLabel>
        <Slider
          min={FILTER_BOUNDS.years.min}
          max={FILTER_BOUNDS.years.max}
          value={[filters.minYearsInBusiness]}
          onValueChange={(v) => update('minYearsInBusiness', Array.isArray(v) ? v[0] : v)}
        />
        <span className="font-mono text-[10px] text-muted-foreground">
          {filters.minYearsInBusiness}+ years
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Min. data confidence</SectionLabel>
        <Slider
          min={0}
          max={100}
          value={[filters.minConfidence]}
          onValueChange={(v) => update('minConfidence', Array.isArray(v) ? v[0] : v)}
        />
        <span className="font-mono text-[10px] text-muted-foreground">
          {filters.minConfidence}+ / 100
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionLabel>Signal</SectionLabel>
        <CheckRow
          label="Exclude franchises"
          checked={filters.excludeFranchises}
          onCheckedChange={(v) => update('excludeFranchises', Boolean(v))}
        />
        <CheckRow
          label="Weak digital presence only"
          checked={filters.weakDigitalOnly}
          onCheckedChange={(v) => update('weakDigitalOnly', Boolean(v))}
        />
        <CheckRow
          label="Show disqualified"
          checked={filters.showDisqualified}
          onCheckedChange={(v) => update('showDisqualified', Boolean(v))}
        />
      </div>
    </div>
  )
}

function CheckRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean | 'indeterminate') => void
}) {
  return (
    <Label className="flex items-center gap-2 text-xs font-normal text-foreground">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      {label}
    </Label>
  )
}

function hasActiveFilters(filters: TargetFilters): boolean {
  return (
    filters.query.length > 0 ||
    filters.industries.length > 0 ||
    filters.counties.length > 0 ||
    filters.buckets.length > 0 ||
    filters.showDisqualified
  )
}
