export type Role =
    | 'SUPER_ADMIN'
    | 'ADMIN'
    | 'CAMPAIGN_MANAGER'
    | 'STAFF'
    | 'INFLUENCER'
    | 'CUSTOMER'
    | 'CUSTOMER_ADMIN'
    | 'CUSTOMER_REVIEWER'
    | 'CUSTOMER_VIEWER'
    | 'VIEWER'
    | 'OWNER'
    | 'FINANCE'
    | 'EMPLOYEE'
    | 'AGENT'

export const ROLE_SUPER_ADMIN: Role = 'SUPER_ADMIN'
export const ROLE_ADMIN: Role = 'ADMIN'
export const ROLE_CAMPAIGN_MANAGER: Role = 'CAMPAIGN_MANAGER'
export const ROLE_STAFF: Role = 'STAFF'

export const ADMIN_ROLES: Role[] = [ROLE_SUPER_ADMIN, ROLE_ADMIN, 'OWNER']

export const CONTENT_PLAN_MANAGE_ROLES: Role[] = [...ADMIN_ROLES, ROLE_CAMPAIGN_MANAGER]

export const LEGACY_ROLE_MAP: Record<string, Role> = {
    OWNER: ROLE_SUPER_ADMIN,
    FINANCE: ROLE_CAMPAIGN_MANAGER,
    EMPLOYEE: ROLE_STAFF,
    AGENT: 'VIEWER'
}

export function normalizeRole(role: Role | string | null): Role | null {
    if (!role) return null
    if (role in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[role]
    return role as Role
}

export const INTERNAL_ROLES: Role[] = [
    ROLE_SUPER_ADMIN,
    ROLE_ADMIN,
    ROLE_CAMPAIGN_MANAGER,
    ROLE_STAFF,
    'OWNER',
    'FINANCE'
]

export const APP_LOGIN_ROLES: Role[] = [
    ...INTERNAL_ROLES,
    'INFLUENCER',
    'CUSTOMER',
    'CUSTOMER_ADMIN',
    'CUSTOMER_REVIEWER',
    'CUSTOMER_VIEWER'
]

export function canAccess(
    role: Role | null,
    allowedRoles: Role[],
    options?: { strict?: boolean }
): boolean {
    const normalized = normalizeRole(role)
    if (!normalized) return false
    if (
        !options?.strict &&
        (normalized === ROLE_SUPER_ADMIN || normalized === ROLE_ADMIN || normalized === 'OWNER')
    ) {
        return true
    }
    return allowedRoles.some((item) => normalizeRole(item) === normalized)
}

export function isADMINRole(role: Role | string | null): boolean {
    const normalized = normalizeRole(role)
    return normalized != null && ADMIN_ROLES.includes(normalized)
}

export function canManageContentPlan(role: Role | string | null): boolean {
    const normalized = normalizeRole(role)
    return normalized != null && CONTENT_PLAN_MANAGE_ROLES.includes(normalized)
}

export const CUSTOMER_REVIEW_ROLES: Role[] = [
    'CUSTOMER',
    'CUSTOMER_ADMIN',
    'CUSTOMER_REVIEWER',
]

export function canCustomerReview(role: Role | string | null): boolean {
    const normalized = normalizeRole(role)
    return normalized != null && CUSTOMER_REVIEW_ROLES.includes(normalized)
}
