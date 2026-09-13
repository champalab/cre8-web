import { Menu, PanelLeftClose, PanelLeftOpen, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { cn } from '@/lib/utils'
import { setDrawerOpen } from '@/stores/features/drawer'
import { RootState } from '@/stores'
import ProfileAvatar from '@/layouts/layouts/admin/components/ProfileAvatar'
import { useGetFacebookBusinessStatusQuery } from '@/stores/services/facebookBusinessApi'
import { useEffect, useState } from 'react'

type Props = {
    collapsed: boolean
    onToggle: () => void
    onMobileOpen: () => void
    className?: string
}

export function AppHeader({ collapsed, onToggle, onMobileOpen, className }: Props) {
    const { t } = useTranslation()
    const auth = useSelector((state: RootState) => state.auth)
    const { data: fbStatus } = useGetFacebookBusinessStatusQuery()

    const [needsSync, setNeedsSync] = useState(false)

    useEffect(() => {
        if (fbStatus?.data?.connected) {
            const lastActivity = fbStatus.data.last_synced_at || fbStatus.data.connected_at
            if (lastActivity) {
                const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
                if (new Date().getTime() - new Date(lastActivity).getTime() > thirtyDaysMs) {
                    setNeedsSync(true)
                } else {
                    setNeedsSync(false)
                }
            } else {
                setNeedsSync(true) // No activity recorded
            }
        } else {
            setNeedsSync(false)
        }
    }, [fbStatus])

    return (
        <div className="flex w-full flex-col">
            {needsSync && (
                <div className="flex items-center justify-between bg-destructive px-4 py-2 text-sm text-destructive-foreground font-medium z-40 relative">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4" />
                        <span>{t('facebookStale')}</span>
                    </div>
                    <Button asChild size="sm" className="h-8">
                        <Link to="/app/platforms?tab=business">{t('reconnect')}</Link>
                    </Button>
                </div>
            )}
            <header
                className={cn(
                    'sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60',
                    className
                )}
            >
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileOpen}>
                    <Menu className="size-5" />
                    <span className="sr-only">{t('openMenu')}</span>
                </Button>

                <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={onToggle}>
                    {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
                    <span className="sr-only">{t('toggleSidebar')}</span>
                </Button>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-muted-foreground">
                        {t('welcome', { name: auth.name })}
                    </p>
                </div>

                <LanguageSwitcher />
                <ThemeToggle />
                <ProfileAvatar />
            </header>
        </div>
    )
}

export function useDrawerToggle() {
    const dispatch = useDispatch()
    const drawer = useSelector((state: RootState) => state.drawer)

    const toggle = () => {
        dispatch(setDrawerOpen({ open: !drawer.open }))
    }

    const close = () => {
        dispatch(setDrawerOpen({ open: false }))
    }

    const open = () => {
        dispatch(setDrawerOpen({ open: true }))
    }

    return { open: drawer.open, toggle, close, openDrawer: open }
}
