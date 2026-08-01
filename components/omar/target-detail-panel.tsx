'use client'

import { useState } from 'react'
import { BookmarkIcon, LockIcon, PlusIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SectionLabel } from '@/components/omar/score-primitives'
import { StatusSelect } from '@/components/omar/status-select'
import {
  addNote,
  revealContact,
  setTargetStatus,
  setTargetTags,
  toggleSaved,
  type ScoredTarget,
} from '@/lib/omar/data'
import { relativeTime } from '@/lib/omar/scoring'
import type { PipelineStatus } from '@/lib/omar/types'
import { cn } from '@/lib/utils'

export function TargetDetailPanel({ scored }: { scored: ScoredTarget }) {
  const [target, setTarget] = useState(scored.target)
  const [tagDraft, setTagDraft] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [revealed, setRevealed] = useState<Record<string, { email: string; phone: string }>>({})

  async function onToggleSave() {
    const next = !target.saved
    setTarget((prev) => ({ ...prev, saved: next }))
    await toggleSaved(target.id, next)
  }

  async function onStatusChange(status: string) {
    setTarget((prev) => ({ ...prev, status: status as PipelineStatus }))
    await setTargetStatus(target.id, status as PipelineStatus)
  }

  async function onAddTag() {
    const value = tagDraft.trim()
    if (!value || target.tags.includes(value)) return
    const nextTags = [...target.tags, value]
    setTarget((prev) => ({ ...prev, tags: nextTags }))
    setTagDraft('')
    await setTargetTags(target.id, nextTags)
  }

  async function onRemoveTag(tag: string) {
    const nextTags = target.tags.filter((t) => t !== tag)
    setTarget((prev) => ({ ...prev, tags: nextTags }))
    await setTargetTags(target.id, nextTags)
  }

  async function onAddNote() {
    const body = noteDraft.trim()
    if (!body) return
    const note = await addNote(target.id, body)
    setTarget((prev) => ({ ...prev, notes: [note, ...prev.notes] }))
    setNoteDraft('')
  }

  async function onReveal(contactId: string) {
    const contact = await revealContact(target.id, contactId)
    setRevealed((prev) => ({ ...prev, [contactId]: contact }))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button
          variant={target.saved ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={onToggleSave}
        >
          <BookmarkIcon className={cn(target.saved && 'fill-current')} />
          {target.saved ? 'Saved' : 'Save target'}
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionLabel>Pipeline status</SectionLabel>
        <StatusSelect value={target.status} onChange={onStatusChange} />
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionLabel>Tags</SectionLabel>
        <div className="flex flex-wrap gap-1">
          {target.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                onClick={() => onRemoveTag(tag)}
                className="hover:text-foreground"
              >
                <XIcon className="size-2.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAddTag()
              }
            }}
            placeholder="Add a tag…"
            className="h-7 flex-1 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button variant="outline" size="icon-sm" onClick={onAddTag} aria-label="Add tag">
            <PlusIcon />
          </Button>
        </div>
      </div>

      {target.contacts.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Contacts</SectionLabel>
          <div className="flex flex-col gap-2">
            {target.contacts.map((contact) => {
              const unlocked = revealed[contact.id]
              return (
                <div
                  key={contact.id}
                  className="flex flex-col gap-1 rounded-md border border-border p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-muted-foreground">{contact.role}</span>
                  </div>
                  {unlocked ? (
                    <div className="flex flex-col text-muted-foreground">
                      <span>{unlocked.email}</span>
                      {unlocked.phone ? <span>{unlocked.phone}</span> : null}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>
                        {contact.emailMasked} · {contact.phoneMasked}
                      </span>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onReveal(contact.id)}
                      >
                        <LockIcon className="size-3" />
                        Reveal · {contact.creditCost} cr
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <SectionLabel>Notes</SectionLabel>
        <div className="flex flex-col gap-2">
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a note about this prospect…"
            className="min-h-16 text-xs"
          />
          <Button size="sm" variant="outline" onClick={onAddNote} className="self-end">
            Add note
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {target.notes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No notes yet.</p>
          ) : (
            target.notes.map((note) => (
              <div key={note.id} className="rounded-md border border-border p-2.5 text-xs">
                <p className="leading-relaxed">{note.body}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {note.author} · {relativeTime(note.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
