import { Link, matchPath, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getMenuForRole, NavItem } from '@/config/navigation'
import { RootState } from '@/stores'

function NavLinkItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { t } = useTranslation('sidebar')
  const { pathname } = useLocation()
  const label = t(item.nameKey)
  const isActive =
    (item.path === '/app/campaigns' && pathname.startsWith('/app/campaigns')) ||
    matchPath({ path: item.path, end: true }, pathname) != null

  const Icon = item.icon

  const link = (
    <Link
      to={item.path.toLowerCase()}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {Icon ? (
        <Icon className={cn('size-5 shrink-0', isActive && 'text-primary-foreground')} />
      ) : null}
      {!collapsed && (
        <span className={cn('truncate', isActive && 'text-primary-foreground')}>{label}</span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return link
}

type Props = {
  collapsed: boolean
  embedded?: boolean
  className?: string
}

export function AppSidebar({ collapsed, embedded = false, className }: Props) {
  const { t } = useTranslation('sidebar')
  const auth = useSelector((state: RootState) => state.auth)
  const menu = getMenuForRole(auth.role)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80',
          !embedded && 'fixed inset-y-0 left-0 z-40',
          embedded ? 'w-full' : collapsed ? 'w-[4.5rem]' : 'w-60',
          className
        )}
      >
        <div className={cn('flex flex-col items-center gap-2 px-3 py-5', collapsed ? 'px-2' : 'px-4')}>
          <Link to='/'>
            <img
              src="/images/logo.png"
              alt="Logo"
              className={cn('object-contain', collapsed ? 'size-9' : 'h-12 w-auto')}
            />
          </Link>
          {!collapsed && (
            <>
              <p className="text-center text-sm font-semibold text-foreground">
                {import.meta.env.VITE_APP_NAME}
              </p>
              {auth.role && (
                <Badge variant="muted" className="text-[10px] uppercase tracking-wide">
                  {auth.role}
                </Badge>
              )}
            </>
          )}
        </div>

        <Separator />

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {menu.map((item, index) =>
            item.group ? (
              !collapsed ? (
                <div key={`${item.name}-${index}`} className="px-3 pb-1 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(item.nameKey)}
                  </p>
                </div>
              ) : (
                <Separator key={`${item.name}-${index}`} className="my-2" />
              )
            ) : (
              <NavLinkItem key={item.path} item={item} collapsed={collapsed} />
            )
          )}
        </nav>
      </aside>
    </TooltipProvider>
  )
}
