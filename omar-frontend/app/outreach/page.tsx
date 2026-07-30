import { LockIcon, MailIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { PageBody, PageHeader } from '@/components/omar/page-header'
import { SectionLabel } from '@/components/omar/score-primitives'
import { getOutreachTemplates } from '@/lib/omar/data'

export default async function OutreachPage() {
  const templates = await getOutreachTemplates()

  return (
    <>
      <PageHeader
        title="Outreach"
        description="Drafting and sending stays manual until data quality is proven — this screen previews templates only."
      />
      <PageBody>
        <Alert>
          <LockIcon />
          <AlertTitle>Automated outreach is disabled</AlertTitle>
          <AlertDescription>
            No message has ever been sent from OMAR. Every prospect — on-market or
            off — requires manual confirmation before any contact is made.
            Enabling send will be a deliberate, separate decision once ingestion
            and scoring have a track record.
          </AlertDescription>
        </Alert>

        <section className="flex flex-col gap-2">
          <SectionLabel>Draft templates (preview only)</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {templates.map((template) => (
              <div key={template.id} className="flex flex-col gap-2 rounded-md border border-border p-4 opacity-80">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    <MailIcon className="size-3.5 text-muted-foreground" />
                    {template.name}
                  </span>
                  <Badge variant="secondary" className="gap-1">
                    <LockIcon className="size-2.5" />
                    Locked
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Subject: {template.subject}</p>
                <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                  {template.body}
                </p>
                {template.variables.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {template.variables.map((v) => (
                      <span
                        key={v}
                        className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </PageBody>
    </>
  )
}
