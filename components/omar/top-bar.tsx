'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Bell as BellIcon, Moon as MoonIcon, Search as SearchIcon, Sun as SunIcon, User as UserIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Switch } from '@/components/ui/switch'
import { AlertsPopover } from '@/components/omar/alerts-popover'
import type { AlertItem } from '@/lib/omar/types'

export function TopBar({ alerts }: { alerts: AlertItem[] }) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [digest, setDigest] = useState(true)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    router.push(trimmed ? `/targets?q=${encodeURIComponent(trimmed)}` : '/targets')
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 h-5" />

      <form onSubmit={submit} className="min-w-0 flex-1 md:max-w-sm">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search targets, cities, tags…"
            aria-label="Search targets"
          />
        </InputGroup>
      </form>

      <div className="ml-auto flex items-center gap-1">
        <div className="mr-1 hidden items-center gap-2 lg:flex">
          <label
            htmlFor="digest-toggle"
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            Weekly digest
          </label>
          <Switch
            id="digest-toggle"
            checked={digest}
            onCheckedChange={setDigest}
            aria-label="Toggle weekly digest"
          />
        </div>

        <AlertsPopover alerts={alerts}>
          <Button variant="ghost" size="icon-sm" className="relative" aria-label="Alerts">
            <BellIcon />
            {alerts.some((alert) => !alert.read) ? (
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
            ) : null}
          </Button>
        </AlertsPopover>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle colour scheme"
        >
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="block dark:hidden" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Settings">
                <UserIcon />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              OMAR — private instance
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/thesis')}>
                Buy box &amp; scoring
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/sources')}>
                Data sources &amp; budget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/saved')}>
                Saved searches
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-normal leading-relaxed text-muted-foreground">
              Authentication is not wired up yet. Add it before this instance
              holds real deal notes.
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
