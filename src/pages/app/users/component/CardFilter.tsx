import React from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, RotateCcw, Search, Shield, X, Filter as FilterIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Filter } from '../type'
import { cn } from '@/lib/utils'

export interface RoleOption {
    value: string
    label?: string
    labelKey?: string
    fallback?: string
}

export interface StatusOption {
    value: string
    labelKey: string
    fallback: string
    dotColor?: string
}

export const ROLE_OPTIONS: RoleOption[] = [
    { value: 'ALL', labelKey: 'users.allRoles', fallback: 'All Roles' },
    { value: 'ADMIN', label: 'Admin (ຜູ້ດູແລ)' },
    { value: 'INFLUENCER', label: 'Influencer (ອິນຟລູເອັນເຊີ)' },
    { value: 'CUSTOMER', label: 'Customer (ລູກຄ້າ)' },
    { value: 'CAMPAIGN_MANAGER', label: 'Campaign Manager' },
    { value: 'STAFF', label: 'Staff (ພະນັກງານ)' },
]

export const STATUS_OPTIONS: StatusOption[] = [
    { value: 'ALL', labelKey: 'users.allStatuses', fallback: 'All Statuses' },
    { value: 'ACTIVE', labelKey: 'users.active', fallback: 'Active', dotColor: 'bg-emerald-500' },
    { value: 'INACTIVE', labelKey: 'users.inactive', fallback: 'Inactive', dotColor: 'bg-muted-foreground/60' },
]

type Props = {
    setQuery: React.Dispatch<React.SetStateAction<Filter>> | ((query: Filter) => void)
    query: Filter
    onClick?: () => void
    onSearch?: (customFilter?: Filter) => void
}

const CardFilter: React.FC<Props> = ({ query, setQuery, onClick, onSearch }) => {
    const { t } = useTranslation('app')

    const executeSearch = (customFilter?: Filter) => {
        const target = customFilter || query
        if (onSearch) {
            onSearch(target)
        } else if (onClick) {
            onClick()
        }
    }

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            executeSearch()
        }
    }

    const handleKeywordChange = (val: string) => {
        setQuery({
            ...query,
            keyword: val
        })
    }

    const handleRoleChange = (role: string) => {
        const next: Filter = {
            ...query,
            role: role as any
        }
        setQuery(next)
        executeSearch(next)
    }

    const handleStatusChange = (status: string) => {
        const next: Filter = {
            ...query,
            status
        }
        setQuery(next)
        executeSearch(next)
    }

    const handleReset = () => {
        const resetFilter: Filter = {
            keyword: '',
            role: 'ALL',
            status: 'ALL'
        }
        setQuery(resetFilter)
        executeSearch(resetFilter)
    }

    const hasActiveFilters = Boolean(
        (query.keyword && query.keyword.trim().length > 0) ||
        (query.role && query.role !== 'ALL') ||
        (query.status && query.status !== 'ALL')
    )

    const selectedRole = query.role || 'ALL'
    const selectedStatus = query.status || 'ALL'

    return (
        <div
            className="my-3 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all"
            onKeyDown={handleKeyPress}
        >
            <div className="flex flex-col gap-4">
                {/* Main Filter Controls Row */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                    {/* Search Keyword (5 cols) */}
                    <div className="space-y-1.5 lg:col-span-5">
                        <Label htmlFor="user-keyword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {t('users.searchLabel')}
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <Input
                                id="user-keyword"
                                value={query.keyword || ''}
                                placeholder={t('users.searchPlaceholder')}
                                onChange={(e) => handleKeywordChange(e.target.value)}
                                className="pl-9 pr-8"
                            />
                            {query.keyword && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleKeywordChange('')
                                        executeSearch({ ...query, keyword: '' })
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Role Filter (3 cols) */}
                    <div className="space-y-1.5 lg:col-span-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Shield className="size-3.5 text-indigo-500" />
                            <span>{t('users.role')}</span>
                        </Label>
                        <Select value={selectedRole} onValueChange={handleRoleChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('users.allRoles')}>
                                    {(() => {
                                        const opt = ROLE_OPTIONS.find((r) => r.value === selectedRole)
                                        return opt
                                            ? (opt.label || (opt.labelKey ? t(opt.labelKey, opt.fallback) : opt.fallback) || opt.value)
                                            : t('users.allRoles')
                                    })()}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {ROLE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label || (opt.labelKey ? t(opt.labelKey, opt.fallback) : opt.fallback)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter (2 cols) */}
                    <div className="space-y-1.5 lg:col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Activity className="size-3.5 text-emerald-500" />
                            <span>{t('users.status')}</span>
                        </Label>
                        <Select value={selectedStatus} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('users.allStatuses')}>
                                    {(() => {
                                        const opt = STATUS_OPTIONS.find((s) => s.value === selectedStatus)
                                        return opt ? (
                                            <span className="flex items-center gap-1.5">
                                                {opt.dotColor && <span className={cn('size-2 rounded-full', opt.dotColor)} />}
                                                <span>{t(opt.labelKey, opt.fallback)}</span>
                                            </span>
                                        ) : (
                                            t('users.allStatuses')
                                        )
                                    })()}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        <div className="flex items-center gap-2">
                                            {opt.dotColor && <span className={cn('size-2 rounded-full', opt.dotColor)} />}
                                            <span>{t(opt.labelKey, opt.fallback)}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Buttons (2 cols) */}
                    <div className="flex items-center gap-2 lg:col-span-2">
                        <Button
                            onClick={() => executeSearch()}
                            className="flex-1 gap-1.5 shadow-xs"
                        >
                            <Search className="size-4" />
                            <span>{t('users.searchLabel')}</span>
                        </Button>

                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleReset}
                                title={t('users.reset')}
                                className="shrink-0 text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Active Filters Pill Strip */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground font-medium">
                            <FilterIcon className="size-3" />
                            <span>{t('users.access', 'Active filters')}:</span>
                        </span>

                        {query.keyword && query.keyword.trim() && (
                            <Badge variant="secondary" className="gap-1 font-normal pl-2 pr-1 py-0.5">
                                <span>"{query.keyword.trim()}"</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleKeywordChange('')
                                        executeSearch({ ...query, keyword: '' })
                                    }}
                                    className="rounded-full hover:bg-muted p-0.5"
                                >
                                    <X className="size-3" />
                                </button>
                            </Badge>
                        )}

                        {query.role && query.role !== 'ALL' && (
                            <Badge variant="secondary" className="gap-1 font-normal pl-2 pr-1 py-0.5 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                                <span>{ROLE_OPTIONS.find((r) => r.value === query.role)?.label || query.role}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange('ALL')}
                                    className="rounded-full hover:bg-muted p-0.5"
                                >
                                    <X className="size-3" />
                                </button>
                            </Badge>
                        )}

                        {query.status && query.status !== 'ALL' && (
                            <Badge variant="secondary" className="gap-1 font-normal pl-2 pr-1 py-0.5 border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                                <span>{t(`users.${query.status.toLowerCase()}`, query.status)}</span>
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange('ALL')}
                                    className="rounded-full hover:bg-muted p-0.5"
                                >
                                    <X className="size-3" />
                                </button>
                            </Badge>
                        )}

                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-auto underline"
                        >
                            {t('users.reset')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CardFilter
