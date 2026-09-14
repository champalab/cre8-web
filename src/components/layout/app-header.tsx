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
import { useGetFacebookScrapeStatusQuery } from '@/stores/services/facebookScrapeApi'
import { useEffect, useState } from 'react'
import { normalizeRole, isADMINRole } from '@/config/roles'

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

    // Determine if the current user is an Admin or Finance role
    const role = auth.role
    const normalized = normalizeRole(role)
    const isAdminOrFinance =
        isADMINRole(role) ||
        role === 'SUPER_ADMIN' ||
        role === 'ADMIN' ||
        role === 'OWNER' ||
        role === 'FINANCE' ||
        role === 'CAMPAIGN_MANAGER' ||
        normalized === 'SUPER_ADMIN' ||
        normalized === 'ADMIN' ||
        normalized === 'CAMPAIGN_MANAGER'

    // Query Facebook Scraper Session status for Admin / Finance users
    const {
        data: fbScrapeRes,
        isLoading: isFbScrapeLoading,
    } = useGetFacebookScrapeStatusQuery(undefined, {
        skip: !isAdminOrFinance,
        pollingInterval: 60000,
    })

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

    // Scrape session evaluation
    const scrape = fbScrapeRes?.data
    const isFbScrapeExpired = scrape?.status === 'expired'
    const isFbScrapeNotConnected = !scrape?.connected && !scrape?.connecting

    // Show persistent banner for Admin & Finance until successfully connected
    const showFbScrapeNotice =
        isAdminOrFinance &&
        !isFbScrapeLoading &&
        fbScrapeRes !== undefined &&
        (isFbScrapeExpired || isFbScrapeNotConnected)

    return (
        <div className="flex w-full flex-col">
            {/* Persistent Non-Dismissible Facebook Scraper Session Warning for Admin & Finance */}
            {showFbScrapeNotice && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 px-4 py-2.5 text-xs sm:text-sm text-white font-medium z-40 relative shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative flex items-center justify-center shrink-0">
                            <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-white opacity-75"></span>
                            <AlertTriangle className="size-4 shrink-0 text-white relative" />
                        </div>
                        <span className="leading-snug">
                            {isFbScrapeExpired
                                ? t('facebookViewerExpired')
                                : t('facebookViewerNotConnected')}
                        </span>
                    </div>
                    <Button
                        asChild
                        size="sm"
                        className="h-7 sm:h-8 px-3.5 text-xs font-semibold bg-white hover:bg-white/90 shrink-0 shadow-sm transition-all"
                    >
                        <Link to="/app/platforms?tab=viewer" style={{ color: 'black' }}>
                            {t('connectFacebookNow')}
                        </Link>
                    </Button>
                </div>
            )}

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
