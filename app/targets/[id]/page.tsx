import { notFound } from 'next/navigation'
import { Building as BuildingIcon, ExternalLink as ExternalLinkIcon, MapPin as MapPinIcon } from 'lucide-react'

import { PageBody, PageHeader } from '@/components/omar/page-header'
import {
  BucketChip,
  ConfidenceMeter,
  FitScore,
  MarketStatusBadge,
  ProviderBadges,
  SectionLabel,
  SourcedField,
} from '@/components/omar/score-primitives'
import { TargetCardCompact } from '@/components/omar/target-card'
import { TargetDetailPanel } from '@/components/omar/target-detail-panel'
import { COUNTIES, INDUSTRIES, PROVIDERS } from '@/lib/omar/config'
import { getSimilarTargets, getTarget } from '@/lib/omar/data'
import {
  formatCurrencyRange,
  formatDate,
  formatRange,
  hardFilterResults,
} from '@/lib/omar/scoring'

export default async function TargetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const scored = await getTarget(id)
  if (!scored) notFound()

  const { target, score, confidence, years } = scored
  const similar = await getSimilarTargets(target.id)
  const industry = INDUSTRIES.find((i) => i.id === target.industry)
  const county = COUNTIES.find((c) => c.id === target.county)
  const hardFilters = hardFilterResults(target)

  return (
    <>
      <PageHeader
        title={target.name}
        description={`${industry?.label ?? ''} · ${target.city}, ${county?.label ?? ''}`}
        actions={
          <div className="flex items-center gap-2">
            <MarketStatusBadge status={target.marketStatus} />
            <BucketChip bucket={score.bucket} />
          </div>
        }
      />
      <PageBody className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border p-4">
            <div className="flex items-center gap-6">
              <FitScore score={score.total} bucket={score.bucket} size="lg" />
              <div className="h-10 w-px bg-border" />
              <ConfidenceMeter confidence={confidence} />
            </div>
            <ProviderBadges sources={target.sources} />
          </div>

          <section className="flex flex-col gap-2">
            <SectionLabel>Score composition</SectionLabel>
            <div className="flex flex-col gap-2 rounded-md border border-border p-4">
              {score.rows.map((row) => (
                <div key={row.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{row.label}</span>
                    <span className="font-mono tabular-nums">
                      {row.earned}
                      <span className="text-muted-foreground">/{row.max}</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${row.normalized * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {row.rationale}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel>Hard filters</SectionLabel>
            <div className="flex flex-col rounded-md border border-border">
              {hardFilters.map((filter) => (
                <div
                  key={filter.label}
                  className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-xs last:border-b-0"
                >
                  <span>{filter.label}</span>
                  <span
                    className={
                      filter.passed === false
                        ? 'text-destructive'
                        : filter.passed === null
                          ? 'text-muted-foreground'
                          : 'text-primary'
                    }
                  >
                    {filter.detail}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel>Firmographics</SectionLabel>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border p-4 text-xs sm:grid-cols-3">
              <Field label="Founded">
                <SourcedField field={target.foundedYear} format={(v) => `${v} (${years} yrs)`} />
              </Field>
              <Field label="Entity type">
                <SourcedField field={target.entityType} />
              </Field>
              <Field label="Employees">
                <SourcedField field={target.employees} format={formatRange} />
              </Field>
              <Field label="Est. revenue">
                <SourcedField field={target.estRevenue} format={formatCurrencyRange} />
              </Field>
              <Field label="Est. EBITDA">
                <SourcedField field={target.estEbitda} format={formatCurrencyRange} />
              </Field>
              <Field label="Cashflow positive">
                <SourcedField field={target.cashflowPositive} format={(v) => (v ? 'Yes' : 'No')} />
              </Field>
              <Field label="Ownership signal">
                <SourcedField field={target.ownershipSignal} />
              </Field>
              <Field label="Leadership tenure">
                <SourcedField field={target.ownerTenureYears} format={(v) => `${v} yrs`} />
              </Field>
              <Field label="Recent ownership change">
                <SourcedField
                  field={target.recentOwnershipChange}
                  format={(v) => (v ? 'Yes' : 'No')}
                />
              </Field>
              <Field label="Reviews">
                <SourcedField
                  field={target.reviewCount}
                  format={(v) => `${v} reviews · ${target.rating.value ?? '—'}★`}
                />
              </Field>
              <Field label="Website">
                {target.website.value ? (
                  <a
                    href={`https://${target.website.value}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                  >
                    {target.website.value}
                    <ExternalLinkIcon className="size-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">None found</span>
                )}
              </Field>
              <Field label="Licenses">
                <SourcedField
                  field={target.licenses}
                  format={(v) => (v.length ? v.join(', ') : 'None on record')}
                />
              </Field>
            </dl>
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel>Provenance</SectionLabel>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Field</th>
                    <th className="px-3 py-2 text-left font-medium">Value</th>
                    <th className="px-3 py-2 text-left font-medium">Source</th>
                    <th className="px-3 py-2 text-left font-medium">Fetched</th>
                    <th className="px-3 py-2 text-left font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {target.provenance.map((row) => (
                    <tr key={row.field} className="border-t border-border">
                      <td className="px-3 py-2">{row.field}</td>
                      <td className="px-3 py-2">
                        {row.value}
                        {row.estimated ? (
                          <span className="ml-1 text-[10px] text-muted-foreground">est</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {PROVIDERS[row.provider].label}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatDate(row.fetchedAt)}
                      </td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">
                        {row.confidence}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {similar.length > 0 ? (
            <section className="flex flex-col gap-2">
              <SectionLabel>Similar targets</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                {similar.map((s) => (
                  <TargetCardCompact key={s.target.id} scored={s} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-5">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BuildingIcon className="size-3" />
              {target.address}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon className="size-3" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${target.name} ${target.address}`,
                )}`}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-foreground hover:underline"
              >
                Open in Maps
              </a>
            </span>
          </div>
          <TargetDetailPanel scored={scored} />
        </aside>
      </PageBody>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}
