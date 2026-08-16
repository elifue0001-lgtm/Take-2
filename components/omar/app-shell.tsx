'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RadarIcon } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { NAV_GROUPS } from '@/components/omar/nav-items'
import { TopBar } from '@/components/omar/top-bar'
import type { AlertItem } from '@/lib/omar/types'

export function AppShell({
  children,
  alerts,
}: {
  children: React.ReactNode
  alerts: AlertItem[]
}) {
  return (
    <TooltipProvider delay={200}>
      <SidebarProvider>
        <OmarSidebar />
        <SidebarInset className="min-w-0 h-screen overflow-hidden flex flex-col">
          <TopBar alerts={alerts} />
          <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="bottom-right" />
    </TooltipProvider>
  )
}

function OmarSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <RadarIcon className="size-4" />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate font-mono text-sm font-semibold tracking-[0.18em]">
              OMAR
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              Off-Market Acquisition Radar
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.12em]">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <p className="px-2 py-1 text-[10px] leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
          Private single-user instance. Every prospect requires manual
          confirmation before outreach.
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
