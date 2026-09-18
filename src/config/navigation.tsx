import { Building2, ClipboardList, LayoutDashboard, Megaphone, ShieldCheck, Smartphone, TrendingUp, Users, Bell, Wallet } from 'lucide-react'
import React, { lazy, LazyExoticComponent } from 'react'
import { matchPath } from 'react-router-dom'
import { Role } from '../pages/app/users/type.d'
import { canAccess, ROLE_ADMIN, ROLE_CAMPAIGN_MANAGER, ROLE_SUPER_ADMIN, normalizeRole } from './roles'
import type enSidebar from '../i18n/locales/en/sidebar.json'

export type SidebarNameKey = keyof typeof enSidebar

export type NavItem = {
    path: string
    routePath: string
    group: boolean
    name: string
    nameKey: SidebarNameKey
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component?: LazyExoticComponent<React.ComponentType<any>>
    icon?: React.ElementType
    roles: Role[]
    /** When true, ADMIN/SUPER_ADMIN bypass does not apply — role must match exactly. */
    strictRoles?: boolean
    children?: NavItem[]
}

export type PublicRouteItem = {
    name: string
    path: string
    routePath: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: LazyExoticComponent<React.ComponentType<any>>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lazyPage = (factory: () => Promise<{ default: React.ComponentType<any> }>) => lazy(factory)

export const navigation: NavItem[] = [
    // ─── Overview ────────────────────────────────────────────
    {
        path: '',
        routePath: '',
        group: true,
        name: 'Overview',
        nameKey: 'overview',
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CAMPAIGN_MANAGER]
    },
    {
        path: '/app',
        routePath: '',
        group: false,
        name: 'Dashboard',
        nameKey: 'dashboard',
        component: lazyPage(() => import('../pages/app/dashboard')),
        icon: LayoutDashboard,
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CAMPAIGN_MANAGER]
    },
    {
        path: '',
        routePath: '',
        group: true,
        name: 'Influencer Marketing',
        nameKey: 'influencerMarketing',
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CAMPAIGN_MANAGER, 'CUSTOMER', 'CUSTOMER_ADMIN', 'CUSTOMER_REVIEWER', 'CUSTOMER_VIEWER']
    },

    {
        path: '/app/customers',
        routePath: 'customers',
        group: false,
        name: 'Customers',
        nameKey: 'customers',
        component: lazyPage(() => import('../pages/app/customers')),
        icon: Building2,
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CAMPAIGN_MANAGER]
    },
    {
        path: '/app/influencers',
        routePath: 'influencers',
        group: false,
        name: 'Influencers',
        nameKey: 'influencers',
        component: lazyPage(() => import('../pages/app/influencers')),
        icon: Users,
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CAMPAIGN_MANAGER]
    },
    {
        path: '/app/campaigns',
        routePath: 'campaigns',
        group: false,
        name: 'Campaigns',
        nameKey: 'campaigns',
        component: lazyPage(() => import('../pages/app/campaigns')),
        icon: Megaphone,
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CAMPAIGN_MANAGER, 'CUSTOMER', 'CUSTOMER_ADMIN', 'CUSTOMER_REVIEWER', 'CUSTOMER_VIEWER']
    },
    {
        path: '/app/payments',
        routePath: 'payments',
        group: false,
        name: 'Payments',
        nameKey: 'payments',
        component: lazyPage(() => import('../pages/app/payments')),
        icon: Wallet,
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CAMPAIGN_MANAGER]
    },
    {
        path: '/app/campaigns/:uuid',
        routePath: 'campaigns/:uuid',
        group: false,
        name: 'Campaign Detail',
        nameKey: 'campaignDetail',
        component: lazyPage(() => import('../pages/app/campaigns/detail')),
        // icon: Campaign,
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CAMPAIGN_MANAGER, 'CUSTOMER', 'CUSTOMER_ADMIN', 'CUSTOMER_REVIEWER', 'CUSTOMER_VIEWER']
    },
    {
        path: '/app/notifications',
        routePath: 'notifications',
        group: false,
        name: 'Notifications',
        nameKey: 'notifications',
        component: lazyPage(() => import('../pages/app/notifications')),
        icon: Bell,
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CAMPAIGN_MANAGER, 'STAFF', 'CUSTOMER', 'CUSTOMER_ADMIN', 'CUSTOMER_REVIEWER', 'INFLUENCER']
    },
    {
        path: '/app/view-logs',
        routePath: 'view-logs',
        group: false,
        name: 'View Logs',
        nameKey: 'viewLogs',
        component: lazyPage(() => import('../pages/app/view-logs')),
        icon: TrendingUp,
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CAMPAIGN_MANAGER]
    },

    // ─── Settings ────────────────────────────────────────────
    {
        path: '',
        routePath: '',
        group: true,
        name: 'Settings',
        nameKey: 'settings',
        roles: [ROLE_ADMIN]
    },
    {
        path: '/app/platforms',
        routePath: 'platforms',
        group: false,
        name: 'Social Platforms',
        nameKey: 'socialPlatforms',
        component: lazyPage(() => import('../pages/app/platforms')),
        icon: Smartphone,
        roles: [ROLE_ADMIN]
    },
    {
        path: '/app/users',
        routePath: 'users',
        group: false,
        name: 'Users',
        nameKey: 'users',
        component: lazyPage(() => import('../pages/app/users')),
        icon: ShieldCheck,
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN]
    },
    {
        path: '/app/audit-logs',
        routePath: 'audit-logs',
        group: false,
        name: 'Audit Logs',
        nameKey: 'auditLogs',
        component: lazyPage(() => import('../pages/app/audit-logs')),
        icon: ClipboardList,
        roles: [ROLE_SUPER_ADMIN, ROLE_ADMIN]
    }
]

export const publicRoutes: PublicRouteItem[] = [
    {
        name: 'home',
        path: '/',
        routePath: '',
        component: lazyPage(() => import('../pages/public/home/Home'))
    },
    {
        name: 'sign-in',
        path: '/login',
        routePath: 'login',
        component: lazyPage(() => import('../pages/public/login'))
    },
    {
        name: 'campaign-performance',
        path: '/public/campaigns/:slug',
        routePath: 'public/campaigns/:slug',
        component: lazyPage(() => import('../pages/public/campaigns/index'))
    },
    {
        name: 'campaign-performance',
        path: '/campaigns/:slug',
        routePath: '/campaigns/:slug',
        component: lazyPage(() => import('../pages/public/campaigns/index'))
    },
    {
        name: 'video-downloader',
        path: '/video-downloader',
        routePath: 'video-downloader',
        component: lazyPage(() => import('../pages/public/video-downloader'))
    }
]

export function getAppRoutes(): NavItem[] {
    return navigation.filter((item) => !item.group && item.component)
}

export function getMenuForRole(role: Role | null): NavItem[] {
    if (!role) return []

    const result: NavItem[] = []
    let pendingGroup: NavItem | null = null

    for (const item of navigation) {
        const accessOpts = item.strictRoles ? { strict: true } : undefined
        if (item.group) {
            pendingGroup = canAccess(role, item.roles, accessOpts) ? item : null
            continue
        }

        if (!canAccess(role, item.roles, accessOpts)) continue
        // Detail/dynamic routes stay registered but out of the sidebar
        if (item.path.includes(':')) continue

        if (pendingGroup) {
            result.push(pendingGroup)
            pendingGroup = null
        }

        result.push(item)
    }

    return result
}

export function findNavByPathname(pathname: string): NavItem | undefined {
    if (pathname.startsWith('/app/campaigns/') && pathname !== '/app/campaigns') {
        return navigation.find((item) => item.path === '/app/campaigns/:uuid')
    }
    if (pathname.startsWith('/app/campaigns')) {
        return navigation.find((item) => item.path === '/app/campaigns')
    }
    return navigation.find((item) => !item.group && matchPath({ path: item.path, end: true }, pathname) != null)
}

export function canAccessPath(role: Role | null, pathname: string): boolean {
    if (pathname.startsWith('/app/campaigns/') && pathname !== '/app/campaigns') {
        const item = navigation.find((entry) => entry.path === '/app/campaigns/:uuid')
        return item ? canAccess(role, item.roles, item.strictRoles ? { strict: true } : undefined) : false
    }
    const item = findNavByPathname(pathname)
    if (!item) return false
    return canAccess(role, item.roles, item.strictRoles ? { strict: true } : undefined)
}

export { canAccess }

export function getDefaultAppPath(role: Role | null): string {
    const normalized = normalizeRole(role)
    if (normalized === 'INFLUENCER') return '/app/notifications'
    if (normalized === 'CUSTOMER' || normalized === 'CUSTOMER_ADMIN' || normalized === 'CUSTOMER_REVIEWER' || normalized === 'CUSTOMER_VIEWER') {
        return '/app/campaigns'
    }
    return '/app'
}
