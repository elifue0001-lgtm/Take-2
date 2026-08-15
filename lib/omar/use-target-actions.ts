'use client'

import { useCallback } from 'react'

import { setTargetStatus, toggleSaved, type ScoredTarget } from '@/lib/omar/data'
import type { PipelineStatus } from '@/lib/omar/types'

export function useTargetActions(
  targets: ScoredTarget[],
  setTargets: React.Dispatch<React.SetStateAction<ScoredTarget[]>>,
) {
  void targets

  const updateTarget = useCallback(
    (targetId: string, updater: (current: ScoredTarget) => ScoredTarget) => {
      setTargets((prev) => prev.map((item) => (item.target.id === targetId ? updater(item) : item)))
    },
    [setTargets],
  )

  const toggleSave = useCallback(
    async (id: string, saved: boolean) => {
      updateTarget(id, (current) => ({
        ...current,
        target: { ...current.target, saved },
      }))
      await toggleSaved(id, saved)
    },
    [updateTarget],
  )

  const changeStatus = useCallback(
    async (id: string, status: PipelineStatus) => {
      updateTarget(id, (current) => ({
        ...current,
        target: { ...current.target, status },
      }))
      await setTargetStatus(id, status)
    },
    [updateTarget],
  )

  return { toggleSave, changeStatus }
}
