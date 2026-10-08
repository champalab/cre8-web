import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronsUpDown, Eye, Megaphone, Search, X } from 'lucide-react'
import { Campaign } from '@/stores/services/campaignApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CampaignSelectorProps {
    selectedUuid?: string
    campaigns?: Campaign[]
    isLoading?: boolean
    onSelect: (campaign: Campaign) => void
    className?: string
}

export const CampaignSelector: React.FC<CampaignSelectorProps> = ({
    selectedUuid,
    campaigns = [],
    isLoading = false,
    onSelect,
    className
}) => {
    const { t } = useTranslation('app')
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')

    const selectedCampaign = useMemo(() => {
        if (!selectedUuid || !campaigns.length) return null
        return campaigns.find((c) => c.uuid === selectedUuid) || null
    }, [campaigns, selectedUuid])

    const filteredCampaigns = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return campaigns
        return campaigns.filter((c) => {
            const title = (c.title || '').toLowerCase()
            const code = (c.campaign_code || '').toLowerCase()
            const company = (c.customers?.company_name || '').toLowerCase()
            const brand = (c.customers?.brand_name || '').toLowerCase()
            const desc = (c.description || '').toLowerCase()
            return title.includes(q) || code.includes(q) || company.includes(q) || brand.includes(q) || desc.includes(q)
        })
    }, [campaigns, query])

    const formatViews = (views?: number | null) => {
        if (!views) return '0'
        return Number(views).toLocaleString()
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'group flex h-auto min-h-10 items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-background/95 px-3 py-2 text-left shadow-sm transition-all hover:border-primary/50 hover:bg-accent/40 sm:max-w-md',
                        className
                    )}
                >
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <Megaphone className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold sm:text-sm text-foreground">
                                {selectedCampaign ? selectedCampaign.title : t('campaignDetail.selectCampaign', 'Select Campaign')}
                            </p>
                            {selectedCampaign && (
                                <p className="truncate text-[11px] text-muted-foreground">
                                    {selectedCampaign.customers?.company_name || selectedCampaign.campaign_code || `${formatViews(selectedCampaign.total_view)} views`}
                                </p>
                            )}
                        </div>
                    </div>
                    <ChevronsUpDown className="size-4 shrink-0 opacity-50 transition-transform group-hover:opacity-100" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[calc(100vw-2rem)] p-0 shadow-xl sm:w-[380px] md:w-[440px]"
                align="start"
                sideOffset={6}
            >
                {/* Search Bar */}
                <div className="flex items-center border-b border-border/60 px-3 py-2">
                    <Search className="size-4 shrink-0 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('campaignDetail.searchCampaigns', 'Search campaigns...')}
                        className="h-8 border-0 bg-transparent px-2.5 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                        autoFocus
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Clear search"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Items Counter Header */}
                <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                    <span>{t('campaignDetail.allCampaigns', 'All Campaigns')}</span>
                    <span className="tabular-nums">
                        {filteredCampaigns.length} / {campaigns.length}
                    </span>
                </div>

                {/* Campaign List */}
                <div className="max-h-72 overflow-y-auto p-1.5 divide-y divide-border/40">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                            <span className="animate-pulse">{t('common.loading', 'Loading...')}</span>
                        </div>
                    ) : filteredCampaigns.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            {t('campaignDetail.noCampaignsFound', 'No campaigns found')}
                        </div>
                    ) : (
                        filteredCampaigns.map((camp) => {
                            const isSelected = camp.uuid === selectedUuid
                            return (
                                <button
                                    key={camp.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(camp)
                                        setOpen(false)
                                    }}
                                    className={cn(
                                        'group flex w-full items-start justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                                        isSelected
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'hover:bg-accent/60 text-foreground'
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className={cn('truncate text-xs sm:text-sm', isSelected && 'font-semibold text-primary')}>
                                                {camp.title}
                                            </p>
                                            {camp.status && (
                                                <Badge
                                                    variant="secondary"
                                                    className="shrink-0 px-1.5 py-0 text-[10px] uppercase font-medium"
                                                >
                                                    {camp.status}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                            {camp.customers?.company_name && (
                                                <span className="truncate max-w-[160px] font-medium text-foreground/80">
                                                    {camp.customers.company_name}
                                                </span>
                                            )}
                                            {camp.campaign_code && (
                                                <span className="font-mono text-[10px] opacity-75">
                                                    {camp.campaign_code}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                                            <Eye className="size-3" />
                                            <span>{formatViews(camp.total_view)}</span>
                                        </div>
                                        {isSelected && (
                                            <Check className="size-4 text-primary shrink-0" />
                                        )}
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default CampaignSelector
