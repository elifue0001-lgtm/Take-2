import { PageHeader } from '@/components/omar/page-header'
import { PipelineBoard } from '@/components/omar/pipeline-board'
import { getTargets } from '@/lib/omar/data'

export default async function PipelinePage() {
  const targets = await getTargets()

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Deal stages from first contact through LOI. New discoveries stay on Targets until you move them here."
      />
      <PipelineBoard initialTargets={targets} />
    </>
  )
}
