import { Bookmark as BookmarkIcon, Crosshair as CrosshairIcon, Database as DatabaseIcon, Kanban as KanbanIcon, LayoutDashboard as LayoutDashboardIcon, Send as SendIcon, SlidersHorizontal as SlidersHorizontalIcon } from 'lucide-react'

export const NAV_GROUPS: {
  label: string
  items: {
    href: string
    label: string
    icon: typeof LayoutDashboardIcon
    description: string
  }[]
}[] = [
  {
    label: 'Radar',
    items: [
      {
        href: '/',
        label: 'Dashboard',
        icon: LayoutDashboardIcon,
        description: 'Coverage, spotlight, and alerts',
      },
      {
        href: '/targets',
        label: 'Targets',
        icon: CrosshairIcon,
        description: 'Filter and rank every prospect',
      },
      {
        href: '/pipeline',
        label: 'Pipeline',
        icon: KanbanIcon,
        description: 'Deal stages from new to LOI',
      },
      {
        href: '/saved',
        label: 'Saved',
        icon: BookmarkIcon,
        description: 'Saved searches and watchlists',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        href: '/outreach',
        label: 'Outreach',
        icon: SendIcon,
        description: 'Disabled until data is validated',
      },
      {
        href: '/thesis',
        label: 'Buy Box',
        icon: SlidersHorizontalIcon,
        description: 'Hard filters and scoring weights',
      },
      {
        href: '/sources',
        label: 'Sources',
        icon: DatabaseIcon,
        description: 'Connector health, quota, and spend',
      },
    ],
  },
]
