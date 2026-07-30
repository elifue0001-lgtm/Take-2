import { PageBody, PageHeader } from '@/components/omar/page-header'
import { SectionLabel } from '@/components/omar/score-primitives'
import { ThesisEditor } from '@/components/omar/thesis-editor'
import { DEAL_PREFERENCES, HARD_FILTERS, OFF_MARKET_CAVEAT } from '@/lib/omar/config'
import { getRuleVersions, getTargets } from '@/lib/omar/data'

export default async function ThesisPage() {
  const [scored, ruleVersions] = await Promise.all([getTargets(), getRuleVersions()])
  const targets = scored.map((s) => s.target)

  return (
    <>
      <PageHeader
        title="Buy Box"
        description="Hard filters, weighted signals, and the standing off-market caveat that governs every score in OMAR."
      />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="flex flex-col gap-2">
            <SectionLabel>Hard filters — non-negotiable</SectionLabel>
            <div className="flex flex-col rounded-md border border-border">
              {HARD_FILTERS.map((filter) => (
                <div
                  key={filter.id}
                  className="border-b border-border px-3 py-2.5 text-xs last:border-b-0"
                >
                  <p className="font-medium">{filter.label}</p>
                  <p className="text-muted-foreground">{filter.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel>Deal preferences</SectionLabel>
            <div className="flex flex-col rounded-md border border-border">
              {DEAL_PREFERENCES.map((pref) => (
                <div
                  key={pref.label}
                  className="flex items-center justify-between border-b border-border px-3 py-2.5 text-xs last:border-b-0"
                >
                  <span>{pref.label}</span>
                  <span className={pref.emphasis ? 'font-medium text-primary' : 'text-muted-foreground'}>
                    {pref.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <p className="rounded-md border border-dashed border-border p-3 text-xs leading-relaxed text-muted-foreground">
          {OFF_MARKET_CAVEAT}
        </p>

        <ThesisEditor targets={targets} ruleVersions={ruleVersions} />
      </PageBody>
    </>
  )
}
