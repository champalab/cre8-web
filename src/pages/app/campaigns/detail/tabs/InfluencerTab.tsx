import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
    UsersRound,
    Plus,
    CheckCircle2,
    XCircle,
    Clock,
    Trash2,
    Edit3,
    TrendingUp,
    Calendar,
    Filter,
    LayoutGrid,
    Table as TableIcon,
    Search,
    RefreshCw,
    X,
    Coins,
    Camera,
    Video,
    Layers,
    Zap,
    Wallet,
    Link2,
    User2,
    AtSign,
    Share2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { canCustomerReview, canManageContentPlan } from '../../../../../config/roles'
import { RootState } from '../../../../../stores'
import {
    CampaignDetail,
    CampaignInfluencerItem,
    useGetCampaignInfluencersQuery,
    useAddCampaignInfluencerMutation,
    useUpdateCampaignInfluencerMutation,
    useDeleteCampaignInfluencerMutation,
    useBulkReviewCampaignInfluencersMutation
} from '../../../../../stores/services/campaignApi'
import { useGetActorsMutation, Actor } from '../../../../../stores/services/actorApi'
import { useGetProvincesQuery } from '../../../../../stores/services/provinceApi'
import { PLATFORM_META, type ActorPlatform } from '../../../influencers/components/utils'
import { alertSuccess, alertWarning, confirmDelete } from '../../../../../utils/alerts'
import { getMutationPayload, isMutationSuccess } from '@/utils/mutation-response'
import { PostLinksDialog } from '../../PostLinksDialog'

type Props = {
    campaign: CampaignDetail
    onChanged?: () => void
}

const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount == null || amount === '') return '—'
    const num = Number(amount)
    if (isNaN(num)) return '—'
    return num.toLocaleString('en-US') + ' LAK'
}

const formatNumberThousands = (val: string | number | null | undefined) => {
    if (!val && val !== 0) return ''
    const num = Number(String(val).replace(/,/g, ''))
    if (isNaN(num)) return ''
    return num.toLocaleString('en-US')
}

const parsePriceInput = (value: string) => value.replace(/[^\d]/g, '')

const getAge = (dob?: string | null) => {
    if (!dob) return null
    const birthDate = new Date(dob)
    if (Number.isNaN(birthDate.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
    if (age < 0 || age > 120) return null
    return age
}

const actorTags = (tags: unknown): string[] => {
    if (Array.isArray(tags)) return tags.map((tag) => `${tag}`.trim()).filter(Boolean)
    if (typeof tags === 'string') {
        return tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
    }
    return []
}

type ActorFilterState = {
    gender: string
    family: string
    province: number | 'all'
    source: string
    status: string
    repost: string
    platform: string
    tags: string
    maxPrice: string
    minAge: string
    maxAge: string
}

const EMPTY_ACTOR_FILTERS: ActorFilterState = {
    gender: 'all',
    family: 'all',
    province: 'all',
    source: 'all',
    status: 'all',
    repost: 'all',
    platform: 'all',
    tags: '',
    maxPrice: '',
    minAge: '',
    maxAge: ''
}

type ActorFilterable = {
    name?: string | null
    email?: string | null
    phone_number?: string | null
    social_handle?: string | null
    code?: string | null
    address_express?: string | null
    bank_account_name?: string | null
    bank_account_number?: string | null
    source?: string | null
    gender?: string | null
    family_status?: string | null
    status?: string | null
    province_id?: number | null
    date_of_birth?: string | null
    tags?: unknown
    standard_price?: number | string | null
    client_repost_allowed?: boolean | null
    influencer_social_accounts?: { platform: string }[] | null
    provinces?: { id?: number; nameLao?: string | null; nameEng?: string | null; name?: string | null } | null
}

const hasActiveActorFilterState = (filters: ActorFilterState) =>
    filters.gender !== 'all' ||
    filters.family !== 'all' ||
    filters.province !== 'all' ||
    filters.source !== 'all' ||
    filters.status !== 'all' ||
    filters.repost !== 'all' ||
    filters.platform !== 'all' ||
    filters.tags.trim() !== '' ||
    filters.maxPrice.trim() !== '' ||
    filters.minAge.trim() !== '' ||
    filters.maxAge.trim() !== ''

const matchesActorFilters = (actor: ActorFilterable | null | undefined, filters: ActorFilterState) => {
    if (filters.gender !== 'all' && actor?.gender !== filters.gender) return false
    if (filters.family !== 'all' && actor?.family_status !== filters.family) return false
    if (filters.province !== 'all' && actor?.province_id !== filters.province && actor?.provinces?.id !== filters.province) {
        return false
    }
    if (filters.source !== 'all' && actor?.source !== filters.source) return false
    if (filters.status !== 'all' && (actor?.status || 'ACTIVE') !== filters.status) return false
    if (filters.repost === 'yes' && !actor?.client_repost_allowed) return false
    if (filters.repost === 'no' && actor?.client_repost_allowed) return false
    if (filters.platform !== 'all') {
        const hasPlatform = (actor?.influencer_social_accounts ?? []).some(
            (account) => account.platform.toLowerCase() === filters.platform
        )
        if (!hasPlatform) return false
    }
    const tagQuery = filters.tags.trim().toLowerCase()
    if (tagQuery) {
        const tags = actorTags(actor?.tags).map((tag) => tag.toLowerCase())
        if (!tags.some((tag) => tag.includes(tagQuery))) return false
    }
    const maxPrice = filters.maxPrice.trim() === '' ? null : Number(filters.maxPrice)
    if (maxPrice != null && Number.isFinite(maxPrice)) {
        const price = Number(actor?.standard_price)
        if (!Number.isFinite(price) || price > maxPrice) return false
    }
    const minAge = filters.minAge.trim() === '' ? null : Number(filters.minAge)
    const maxAge = filters.maxAge.trim() === '' ? null : Number(filters.maxAge)
    const age = getAge(actor?.date_of_birth)
    if (minAge != null && Number.isFinite(minAge) && (age == null || age < minAge)) return false
    if (maxAge != null && Number.isFinite(maxAge) && (age == null || age > maxAge)) return false
    return true
}

const matchesActorKeyword = (actor: ActorFilterable | null | undefined, query: string, extra: Array<string | null | undefined> = []) => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!tokens.length) return true
    const compactQuery = query.replace(/\s+/g, '').toLowerCase()
    const haystack = [
        actor?.name,
        actor?.email,
        actor?.phone_number,
        actor?.social_handle,
        actor?.code,
        actor?.address_express,
        actor?.bank_account_name,
        actor?.bank_account_number,
        actor?.source,
        actor?.gender,
        actor?.family_status,
        actor?.status,
        actor?.provinces?.nameLao,
        actor?.provinces?.nameEng,
        actor?.provinces?.name,
        ...actorTags(actor?.tags),
        ...extra
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    const compactHaystack = haystack.replace(/\s+/g, '')
    return tokens.every((token) => haystack.includes(token)) || (compactQuery.length >= 2 && compactHaystack.includes(compactQuery))
}

const formatAge = (dob?: string | null) => {
    const age = getAge(dob)
    return age == null ? null : `${age} ປີ`
}

const formatFollowers = (value: number | null | undefined) => {
    if (value == null) return '0'
    const num = Number(value)
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k'
    return num.toLocaleString()
}

const getTierBadge = (followers: number) => {
    if (followers >= 1_000_000) {
        return <Badge className="bg-purple-600/90 hover:bg-purple-700 text-white text-[10px] uppercase font-bold">Mega</Badge>
    }
    if (followers >= 100_000) {
        return <Badge className="bg-blue-600/90 hover:bg-blue-700 text-white text-[10px] uppercase font-bold">Macro</Badge>
    }
    if (followers >= 1_000) {
        return <Badge className="bg-emerald-600/90 hover:bg-emerald-700 text-white text-[10px] uppercase font-bold">Micro</Badge>
    }
    return (
        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
            Nano
        </Badge>
    )
}

const getStatusBadge = (status: string, t: any) => {
    switch (status) {
        case 'APPROVED':
            return (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 gap-1 font-semibold">
                    <CheckCircle2 className="size-3" /> {t('influencerTab.approve')}
                </Badge>
            )
        case 'REJECTED':
            return (
                <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 gap-1 font-semibold">
                    <XCircle className="size-3" /> {t('influencerTab.reject')}
                </Badge>
            )
        case 'PROPOSED':
        default:
            return (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1 font-semibold">
                    <Clock className="size-3" /> {t('influencerTab.proposed')}
                </Badge>
            )
    }
}

const SocialProfiles: React.FC<{
    accounts: { platform: string; profile_url: string | null; handle: string | null; follower_count: number }[]
}> = ({ accounts }) => {
    const linked = accounts.filter((account) => Boolean(account.profile_url?.trim()))

    if (!linked.length) {
        return <span className="text-xs text-muted-foreground">—</span>
    }

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {linked.map((account) => {
                const key = account.platform.toLowerCase() as ActorPlatform
                const meta = PLATFORM_META[key]
                const label = meta?.label || account.platform
                return (
                    <Tooltip key={`${account.platform}-${account.profile_url}`}>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className={`size-7 rounded-lg border-0 shadow-xs ${meta?.iconClass || 'bg-primary text-primary-foreground'}`}
                                title={`Open ${label}`}
                                onClick={() => window.open(account.profile_url!, '_blank', 'noopener,noreferrer')}
                            >
                                <span className="text-[10px] font-bold leading-none">{meta?.short || account.platform.slice(0, 1).toUpperCase()}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {label}
                            {account.handle ? ` · ${account.handle}` : ''}
                            {account.follower_count ? ` (${formatFollowers(account.follower_count)})` : ''}
                        </TooltipContent>
                    </Tooltip>
                )
            })}
        </div>
    )
}

const InfluencerTab: React.FC<Props> = ({ campaign, onChanged }) => {
    const { t } = useTranslation('app')
    const auth = useSelector((state: RootState) => state.auth)
    const canManage = canManageContentPlan(auth.role)
    const canReview = canCustomerReview(auth.role)
    const campaignUuid = campaign.uuid || ''

    // Data fetching
    const { data: influencersRes, isLoading, isFetching, refetch } = useGetCampaignInfluencersQuery(campaignUuid, { skip: !campaignUuid })
    const influencers = useMemo(() => influencersRes?.data ?? [], [influencersRes])

    const { data: provincesRes } = useGetProvincesQuery()
    const provinces = provincesRes?.data ?? []
    const [fetchActors, { isLoading: isActorsLoading }] = useGetActorsMutation()
    const [addInfluencer, { isLoading: isAdding }] = useAddCampaignInfluencerMutation()
    const [updateInfluencer, { isLoading: isUpdating }] = useUpdateCampaignInfluencerMutation()
    const [deleteInfluencer] = useDeleteCampaignInfluencerMutation()
    const [bulkReview, { isLoading: isBulkReviewing }] = useBulkReviewCampaignInfluencersMutation()

    // Local UI states
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [showActorFilters, setShowActorFilters] = useState(false)
    const [genderFilter, setGenderFilter] = useState('all')
    const [familyFilter, setFamilyFilter] = useState('all')
    const [provinceFilter, setProvinceFilter] = useState<number | 'all'>('all')
    const [sourceFilter, setSourceFilter] = useState('all')
    const [actorStatusFilter, setActorStatusFilter] = useState('all')
    const [repostFilter, setRepostFilter] = useState('all')
    const [platformFilter, setPlatformFilter] = useState('all')
    const [tagsFilter, setTagsFilter] = useState('')
    const [maxPriceFilter, setMaxPriceFilter] = useState('')
    const [minAgeFilter, setMinAgeFilter] = useState('')
    const [maxAgeFilter, setMaxAgeFilter] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
    const [selectedUuids, setSelectedUuids] = useState<string[]>([])
    const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string } | null>(null)
    const [postLinksOpen, setPostLinksOpen] = useState(false)
    const [postLinksActorId, setPostLinksActorId] = useState<number | null>(null)

    const openPostLinks = (actorId?: number | null) => {
        setPostLinksActorId(actorId ?? null)
        setPostLinksOpen(true)
    }

    // Add Influencer Modal
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [allActors, setAllActors] = useState<Actor[]>([])
    const [selectedActor, setSelectedActor] = useState<Actor | null>(null)
    const [actorSearch, setActorSearch] = useState('')
    const [showPickerFilters, setShowPickerFilters] = useState(false)
    const [pickerFilters, setPickerFilters] = useState<ActorFilterState>(EMPTY_ACTOR_FILTERS)
    const [addForm, setAddForm] = useState({
        offer_price: '',
        display_price: '',
        kpi: '',
        post_date: ''
    })

    // Edit Influencer Modal
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<CampaignInfluencerItem | null>(null)
    const [editForm, setEditForm] = useState({
        offer_price: '',
        display_price: '',
        kpi: '',
        post_date: '',
        status: 'PROPOSED',
        customer_note: ''
    })

    // Load all actors when add modal opens
    useEffect(() => {
        if (!addModalOpen) return

        let cancelled = false
        const loadActors = async () => {
            const first = await fetchActors({ page: 1 }).unwrap()
            const firstList = ((first as any)?.data || []) as Actor[]
            const totalPages = Number((first as any)?.pagination?.totalPages) || 1
            const rest: Actor[] = []
            for (let page = 2; page <= totalPages; page++) {
                const next = await fetchActors({ page }).unwrap()
                rest.push(...(((next as any)?.data || []) as Actor[]))
            }
            if (!cancelled) setAllActors([...firstList, ...rest])
        }

        loadActors().catch(() => {
            if (!cancelled) setAllActors([])
        })

        return () => {
            cancelled = true
        }
    }, [addModalOpen, fetchActors])

    const hasActiveActorFilters =
        genderFilter !== 'all' ||
        familyFilter !== 'all' ||
        provinceFilter !== 'all' ||
        sourceFilter !== 'all' ||
        actorStatusFilter !== 'all' ||
        repostFilter !== 'all' ||
        platformFilter !== 'all' ||
        tagsFilter.trim() !== '' ||
        maxPriceFilter.trim() !== '' ||
        minAgeFilter.trim() !== '' ||
        maxAgeFilter.trim() !== ''

    const clearActorFilters = () => {
        setGenderFilter('all')
        setFamilyFilter('all')
        setProvinceFilter('all')
        setSourceFilter('all')
        setActorStatusFilter('all')
        setRepostFilter('all')
        setPlatformFilter('all')
        setTagsFilter('')
        setMaxPriceFilter('')
        setMinAgeFilter('')
        setMaxAgeFilter('')
    }

    // Filtered influencers
    const filteredInfluencers = useMemo(() => {
        const tokens = searchQuery
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean)
        const compactQuery = searchQuery.replace(/\s+/g, '').toLowerCase()
        const maxPrice = maxPriceFilter.trim() === '' ? null : Number(maxPriceFilter)
        const minAge = minAgeFilter.trim() === '' ? null : Number(minAgeFilter)
        const maxAge = maxAgeFilter.trim() === '' ? null : Number(maxAgeFilter)
        const tagQuery = tagsFilter.trim().toLowerCase()

        return influencers.filter((item) => {
            if (statusFilter !== 'ALL' && item.status !== statusFilter) return false

            const actor = item.actor
            if (genderFilter !== 'all' && actor?.gender !== genderFilter) return false
            if (familyFilter !== 'all' && actor?.family_status !== familyFilter) return false
            if (provinceFilter !== 'all' && actor?.province_id !== provinceFilter && actor?.provinces?.id !== provinceFilter) return false
            if (sourceFilter !== 'all' && actor?.source !== sourceFilter) return false
            if (actorStatusFilter !== 'all' && (actor?.status || 'ACTIVE') !== actorStatusFilter) return false
            if (repostFilter === 'yes' && !actor?.client_repost_allowed) return false
            if (repostFilter === 'no' && actor?.client_repost_allowed) return false
            if (platformFilter !== 'all') {
                const hasPlatform = (actor?.influencer_social_accounts ?? []).some(
                    (account) => account.platform.toLowerCase() === platformFilter
                )
                if (!hasPlatform) return false
            }
            if (tagQuery) {
                const tags = actorTags(actor?.tags).map((tag) => tag.toLowerCase())
                if (!tags.some((tag) => tag.includes(tagQuery))) return false
            }
            if (maxPrice != null && Number.isFinite(maxPrice)) {
                const price = Number(actor?.standard_price)
                if (!Number.isFinite(price) || price > maxPrice) return false
            }
            const age = getAge(actor?.date_of_birth)
            if (minAge != null && Number.isFinite(minAge) && (age == null || age < minAge)) return false
            if (maxAge != null && Number.isFinite(maxAge) && (age == null || age > maxAge)) return false

            if (tokens.length) {
                const haystack = [
                    actor?.name,
                    actor?.email,
                    actor?.phone_number,
                    actor?.social_handle,
                    actor?.code,
                    actor?.address_express,
                    actor?.bank_account_name,
                    actor?.bank_account_number,
                    actor?.source,
                    actor?.gender,
                    actor?.family_status,
                    actor?.status,
                    actor?.provinces?.nameLao,
                    actor?.provinces?.nameEng,
                    actor?.provinces?.name,
                    item.kpi,
                    ...actorTags(actor?.tags)
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                const compactHaystack = haystack.replace(/\s+/g, '')
                const matches = tokens.every((token) => haystack.includes(token)) || (compactQuery.length >= 2 && compactHaystack.includes(compactQuery))
                if (!matches) return false
            }

            return true
        })
    }, [
        influencers,
        statusFilter,
        searchQuery,
        genderFilter,
        familyFilter,
        provinceFilter,
        sourceFilter,
        actorStatusFilter,
        repostFilter,
        platformFilter,
        tagsFilter,
        maxPriceFilter,
        minAgeFilter,
        maxAgeFilter
    ])

    // Summary stats
    const stats = useMemo(() => {
        const total = influencers.length
        const approved = influencers.filter((i) => i.status === 'APPROVED')
        const proposed = influencers.filter((i) => i.status === 'PROPOSED')
        const rejected = influencers.filter((i) => i.status === 'REJECTED')

        const totalOfferBudget = influencers.reduce((sum, i) => sum + (i.offer_price || 0), 0)
        const totalDisplayBudget = influencers.reduce((sum, i) => sum + (i.display_price || 0), 0)
        const approvedDisplayBudget = approved.reduce((sum, i) => sum + (i.display_price || 0), 0)
        const totalReach = influencers.reduce((sum, i) => sum + (i.total_followers || 0), 0)

        return {
            total,
            approvedCount: approved.length,
            proposedCount: proposed.length,
            rejectedCount: rejected.length,
            totalOfferBudget,
            totalDisplayBudget,
            approvedDisplayBudget,
            totalReach
        }
    }, [influencers])

    // Selection handlers
    const handleToggleSelect = (uuid: string) => {
        setSelectedUuids((prev) => (prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]))
    }

    const handleSelectAll = () => {
        if (selectedUuids.length === filteredInfluencers.length) {
            setSelectedUuids([])
        } else {
            setSelectedUuids(filteredInfluencers.map((i) => i.uuid))
        }
    }

    // Bulk review actions
    const handleBulkAction = async (action: 'APPROVED' | 'REJECTED') => {
        if (!selectedUuids.length) return
        try {
            const res = await bulkReview({
                campaignUuid,
                influencer_uuids: selectedUuids,
                action
            })
            if (isMutationSuccess(res)) {
                alertSuccess({
                    title: t('campaignDetail.updatedSuccess'),
                    text: t('campaignDetail.bulkUpdated', { count: selectedUuids.length, action: action.toLowerCase() })
                })
                setSelectedUuids([])
                refetch()
                onChanged?.()
            } else {
                alertWarning({ title: t('campaignDetail.updateFailed'), text: t('campaignDetail.unableUpdateInfluencers') })
            }
        } catch (error: any) {
            alertWarning({ title: t('common:error'), text: error?.message || t('campaignDetail.actionFailed') })
        }
    }

    // Single item review
    const handleSingleReview = async (item: CampaignInfluencerItem, newStatus: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await updateInfluencer({
                campaignUuid,
                influencerUuid: item.uuid,
                status: newStatus
            })
            if (isMutationSuccess(res)) {
                alertSuccess({
                    title: newStatus === 'APPROVED' ? t('campaignDetail.approved') : t('campaignDetail.rejected'),
                    text: t('campaignDetail.statusChanged', { name: item.actor?.name || t('campaignDetail.influencer'), action: newStatus.toLowerCase() })
                })
                refetch()
                onChanged?.()
            }
        } catch (error: any) {
            alertWarning({ title: t('common:error'), text: error?.message || t('campaignDetail.statusUpdateFailed') })
        }
    }

    // Delete influencer
    const handleDelete = async (item: CampaignInfluencerItem) => {
        const confirmed = await confirmDelete({
            title: t('campaignDetail.removeInfluencerTitle'),
            text: t('campaignDetail.removeInfluencerText', { name: item.actor?.name || t('campaignDetail.influencer') })
        })
        if (!confirmed) return

        try {
            const res = await deleteInfluencer({
                campaignUuid,
                influencerUuid: item.uuid
            })
            if (isMutationSuccess(res)) {
                alertSuccess({ title: t('common:removed'), text: t('campaignDetail.influencerRemoved') })
                refetch()
                onChanged?.()
            }
        } catch (error: any) {
            alertWarning({ title: t('common:error'), text: error?.message || t('campaignDetail.removeFailed') })
        }
    }

    // Open add modal
    const handleOpenAddModal = () => {
        setSelectedActor(null)
        setActorSearch('')
        setShowPickerFilters(true)
        setPickerFilters(EMPTY_ACTOR_FILTERS)
        setAddForm({
            offer_price: '',
            display_price: '',
            kpi: '',
            post_date: ''
        })
        setAddModalOpen(true)
    }

    // When an actor is picked in Add modal:
    // Auto-calculate sum of photo and video prices
    const handleSelectActor = (actor: Actor) => {
        setSelectedActor(actor)
        const pPhoto = Number(actor.price_photo) || 0
        const pVideo = Number(actor.price_video) || 0
        const photoVideoSum = pPhoto + pVideo

        // Use photo + video sum if > 0, else fallback to combo or standard_price
        const calculatedPrice = photoVideoSum > 0 ? photoVideoSum : Number(actor.price_video_photo) || Number(actor.standard_price) || 0

        const priceStr = calculatedPrice > 0 ? String(calculatedPrice) : ''
        setAddForm((prev) => ({
            ...prev,
            offer_price: priceStr,
            display_price: priceStr
        }))
    }

    // Submit Add modal
    const handleSaveAdd = async () => {
        if (!selectedActor) {
            alertWarning({ title: t('common:required'), text: t('campaignDetail.selectInfluencerFirst') })
            return
        }

        try {
            const res: any = await addInfluencer({
                campaignUuid,
                actor_id: selectedActor.id,
                offer_price: addForm.offer_price ? Number(addForm.offer_price) : null,
                display_price: addForm.display_price ? Number(addForm.display_price) : null,
                kpi: addForm.kpi.trim() || null,
                post_date: addForm.post_date || null
            })

            if (isMutationSuccess(res)) {
                alertSuccess({ title: t('common:added'), text: t('campaignDetail.influencerAdded') })
                setAddModalOpen(false)
                refetch()
                onChanged?.()
            } else {
                const payload = getMutationPayload(res)
                const errorMsg = (res as any)?.error?.data?.message || payload?.message || 'Could not add influencer'
                alertWarning({ title: res?.data?.data?.status || t('common:failed'), text: errorMsg })
            }
        } catch (error: any) {
            alertWarning({ title: t('common:error'), text: error?.message || t('campaignDetail.addFailed') })
        }
    }

    // Open edit modal
    const handleOpenEdit = (item: CampaignInfluencerItem) => {
        setEditingItem(item)
        setEditForm({
            offer_price: item.offer_price != null ? String(item.offer_price) : '',
            display_price: item.display_price != null ? String(item.display_price) : '',
            kpi: item.kpi || '',
            post_date: item.post_date || '',
            status: item.status || 'PROPOSED',
            customer_note: item.customer_note || ''
        })
        setEditModalOpen(true)
    }

    // Submit edit modal
    const handleSaveEdit = async () => {
        if (!editingItem) return

        try {
            const res = await updateInfluencer({
                campaignUuid,
                influencerUuid: editingItem.uuid,
                offer_price: editForm.offer_price ? Number(editForm.offer_price) : null,
                display_price: editForm.display_price ? Number(editForm.display_price) : null,
                kpi: editForm.kpi.trim() || null,
                post_date: editForm.post_date || null,
                status: editForm.status,
                customer_note: editForm.customer_note.trim() || null
            })

            if (isMutationSuccess(res)) {
                alertSuccess({ title: t('common:updated'), text: t('campaignDetail.detailsUpdated') })
                setEditModalOpen(false)
                refetch()
                onChanged?.()
            } else {
                alertWarning({ title: t('common:failed'), text: t('campaignDetail.unableUpdateDetails') })
            }
        } catch (error: any) {
            alertWarning({ title: t('common:error'), text: error?.message || t('campaignDetail.updateFailedShort') })
        }
    }

    // Available actors for adding
    const availableActors = useMemo(() => {
        const addedActorIds = new Set(influencers.map((i) => i.actor_id))
        return allActors
            .filter((actor) => !addedActorIds.has(actor.id))
            .filter((actor) => {
                const province = provinces.find((item) => item.id === actor.province_id)
                return (
                    matchesActorFilters(actor, pickerFilters) &&
                    matchesActorKeyword(actor, actorSearch, [province?.nameLao, province?.nameEng])
                )
            })
    }, [allActors, influencers, actorSearch, pickerFilters, provinces])

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Hero Header */}
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-black via-black to-orange text-white shadow-xl shadow-orange/15">
                    <div className="absolute -right-12 -top-16 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                    <CardContent className="relative p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 shadow-inner">
                                    <UsersRound className="size-7" />
                                </span>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t('influencerTab.proposalTitle')}</h2>
                                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">{influencers.length} {t('influencerTab.total')}</span>
                                    </div>
                                    <p className="mt-1 text-sm text-white/80">
                                        {t('influencerTab.proposalDesc')}
                                    </p>
                                </div>
                            </div>

                            {canManage && (
                                <div className="flex items-center gap-2">
                                    <Button onClick={handleOpenAddModal} className="bg-white text-primary hover:bg-white/90 shadow-md font-semibold gap-1.5">
                                        <Plus className="size-4" /> {t('influencerTab.addInfluencer')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                        onClick={() => refetch()}
                                        disabled={isFetching}
                                        title="Refresh"
                                    >
                                        <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Metrics & Budget Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="border border-border/60 shadow-xs">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <UsersRound className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold tracking-tight tabular-nums">{stats.total}</p>
                                <p className="text-xs text-muted-foreground font-medium">{t('influencerTab.proposedInfluencers')}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-border/60 shadow-xs">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-2xl font-bold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
                                        {stats.approvedCount}
                                    </p>
                                    <span className="text-xs text-muted-foreground">/ {stats.total}</span>
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">{t('influencerTab.clientApproved')}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-border/60 shadow-xs">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <TrendingUp className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold tracking-tight tabular-nums">{formatFollowers(stats.totalReach)}</p>
                                <p className="text-xs text-muted-foreground font-medium">{t('influencerTab.combinedAudience')}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-border/60 shadow-xs">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Coins className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-base sm:text-lg font-bold tracking-tight truncate">
                                    {formatCurrency(canManage ? stats.totalDisplayBudget : stats.approvedDisplayBudget)}
                                </p>
                                <p className="text-xs text-muted-foreground font-medium truncate">{canManage ? t('influencerTab.totalClientQuote') : t('influencerTab.approvedBudget')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-2xl border">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status filter tabs */}
                        <div className="flex items-center rounded-xl bg-background p-1 border shadow-xs">
                            {(['ALL', 'PROPOSED', 'APPROVED', 'REJECTED'] as const).map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${statusFilter === st ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {st === 'ALL' ? t('influencerTab.filters.all') : t(`influencerTab.filters.${st.toLowerCase()}`)}
                                    {st === 'ALL' && ` (${stats.total})`}
                                    {st === 'PROPOSED' && ` (${stats.proposedCount})`}
                                    {st === 'APPROVED' && ` (${stats.approvedCount})`}
                                    {st === 'REJECTED' && ` (${stats.rejectedCount})`}
                                </button>
                            ))}
                        </div>

                        {/* Search input */}
                        <div className="relative min-w-[180px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <Input
                                placeholder={t('influencerTab.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 pl-8 text-xs bg-background"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={`h-8 gap-1.5 ${hasActiveActorFilters ? 'border-primary text-primary' : ''}`}
                            onClick={() => setShowActorFilters((open) => !open)}
                        >
                            <Filter className="size-3.5" />
                            {t('influencerTab.actorFilters')}
                            {hasActiveActorFilters ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        {canManage && (
                            <Button variant="outline" className="h-8 gap-1.5" onClick={() => openPostLinks(null)}>
                                <Link2 className="size-3.5" /> {t('influencerTab.postLinks')}
                            </Button>
                        )}
                        {canManage && campaign.uuid && (
                            <Button asChild variant="outline" className="h-8 gap-1.5">
                                <Link to={`/app/payments?campaign=${campaign.uuid}`}>
                                    <Wallet className="size-3.5" /> {t('influencerTab.payments')}
                                </Link>
                            </Button>
                        )}
                        {/* Bulk actions for reviewer or admin */}
                        {selectedUuids.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-background border px-2.5 py-1 rounded-xl shadow-xs">
                                <span className="text-xs font-semibold text-primary">{t('influencerTab.selectedCount', { count: selectedUuids.length })}</span>
                                {(canReview || canManage) && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                            onClick={() => handleBulkAction('APPROVED')}
                                            disabled={isBulkReviewing}
                                        >
                                            <CheckCircle2 className="size-3.5" /> {t('influencerTab.approve')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1"
                                            onClick={() => handleBulkAction('REJECTED')}
                                            disabled={isBulkReviewing}
                                        >
                                            <XCircle className="size-3.5" /> {t('influencerTab.reject')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* View toggle */}
                        <div className="flex items-center border rounded-xl bg-background p-0.5 shadow-xs">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="size-7 rounded-lg"
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <LayoutGrid className="size-3.5" />
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="size-7 rounded-lg"
                                onClick={() => setViewMode('table')}
                                title="Table View"
                            >
                                <TableIcon className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {showActorFilters && (
                    <div className="grid grid-cols-1 gap-3 rounded-2xl border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                        <div className="grid gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.gender')}</Label>
                            <Select value={genderFilter} onValueChange={setGenderFilter}>
                                <SelectTrigger className="h-8 bg-background text-xs">
                                    <SelectValue placeholder={t('influencerTab.allGenders')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('influencerTab.allGenders')}</SelectItem>
                                    <SelectItem value="Male">{t('influencerTab.male')}</SelectItem>
                                    <SelectItem value="Female">{t('influencerTab.female')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.familyStatus')}</Label>
                            <Select value={familyFilter} onValueChange={setFamilyFilter}>
                                <SelectTrigger className="h-8 bg-background text-xs">
                                    <SelectValue placeholder={t('influencerTab.allFamilyStatus')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('influencerTab.allFamilyStatus')}</SelectItem>
                                    <SelectItem value="Single">{t('influencerTab.single')}</SelectItem>
                                    <SelectItem value="Married without kids">{t('influencerTab.marriedNoKids')}</SelectItem>
                                    <SelectItem value="Married with kids">{t('influencerTab.marriedWithKids')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.province')}</Label>
                            <Select
                                value={String(provinceFilter)}
                                onValueChange={(value) => setProvinceFilter(value === 'all' ? 'all' : Number(value))}
                            >
                                <SelectTrigger className="h-8 bg-background text-xs">
                                    <SelectValue placeholder={t('influencerTab.allProvinces')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('influencerTab.allProvinces')}</SelectItem>
                                    {provinces.map((province) => (
                                        <SelectItem key={province.id} value={String(province.id)}>
                                            {province.nameLao}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.source')}</Label>
                            <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger className="h-8 bg-background text-xs">
                                    <SelectValue placeholder={t('influencerTab.allSources')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('influencerTab.allSources')}</SelectItem>
                                    <SelectItem value="Rizz">Rizz</SelectItem>
                                    <SelectItem value="Freelance">Freelance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.actorStatus')}</Label>
                            <Select value={actorStatusFilter} onValueChange={setActorStatusFilter}>
                                <SelectTrigger className="h-8 bg-background text-xs">
                                    <SelectValue placeholder={t('influencerTab.allStatuses')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('influencerTab.allStatuses')}</SelectItem>
                                    <SelectItem value="ACTIVE">{t('influencerTab.active')}</SelectItem>
                                    <SelectItem value="INACTIVE">{t('influencerTab.inactive')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.clientRepost')}</Label>
                            <Select value={repostFilter} onValueChange={setRepostFilter}>
                                <SelectTrigger className="h-8 bg-background text-xs">
                                    <SelectValue placeholder={t('influencerTab.all')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('influencerTab.all')}</SelectItem>
                                    <SelectItem value="yes">{t('influencerTab.allowed')}</SelectItem>
                                    <SelectItem value="no">{t('influencerTab.notAllowed')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.platform')}</Label>
                            <Select value={platformFilter} onValueChange={setPlatformFilter}>
                                <SelectTrigger className="h-8 bg-background text-xs">
                                    <SelectValue placeholder={t('influencerTab.allPlatforms')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('influencerTab.allPlatforms')}</SelectItem>
                                    <SelectItem value="facebook">Facebook</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.tags')}</Label>
                            <Input
                                className="h-8 bg-background text-xs"
                                placeholder={t('influencerTab.searchTags')}
                                value={tagsFilter}
                                onChange={(event) => setTagsFilter(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.maxStandardPrice')}</Label>
                            <Input
                                className="h-8 bg-background text-xs"
                                type="number"
                                min={0}
                                placeholder="e.g. 1000000"
                                value={maxPriceFilter}
                                onChange={(event) => setMaxPriceFilter(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.minAge')}</Label>
                            <Input
                                className="h-8 bg-background text-xs"
                                type="number"
                                min={0}
                                placeholder="e.g. 18"
                                value={minAgeFilter}
                                onChange={(event) => setMinAgeFilter(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.maxAge')}</Label>
                            <Input
                                className="h-8 bg-background text-xs"
                                type="number"
                                min={0}
                                placeholder="e.g. 35"
                                value={maxAgeFilter}
                                onChange={(event) => setMaxAgeFilter(event.target.value)}
                            />
                        </div>
                        {hasActiveActorFilters && (
                            <div className="flex items-end justify-end sm:col-span-2 lg:col-span-4 xl:col-span-1">
                                <Button type="button" variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={clearActorFilters}>
                                    <X className="mr-1 size-3.5" />
                                    {t('influencerTab.clearActorFilters')}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Influencers List / Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                        <RefreshCw className="size-5 animate-spin text-primary" />
                        <span>Loading campaign influencers...</span>
                    </div>
                ) : filteredInfluencers.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <UsersRound className="mb-3 size-12 text-muted-foreground/30" />
                            <h3 className="text-base font-semibold">ບໍ່ພົບອິນຟລູເອັນເຊີ</h3>
                            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                                {statusFilter !== 'ALL' || hasActiveActorFilters || searchQuery.trim()
                                    ? t('influencerTab.emptyState')
                                    : 'ເພີ່ມອິນຟລູເອັນເຊີເຂົ້າໃນໃບສະເໜີແຄມເປນ ເພື່ອໃຫ້ລູກຄ້າກວດສອບ ແລະ ອະນຸມັດ.'}
                            </p>
                            {canManage && statusFilter === 'ALL' && !hasActiveActorFilters && !searchQuery.trim() && (
                                <Button onClick={handleOpenAddModal} className="mt-4 gap-1.5">
                                    <Plus className="size-4" /> ເພີ່ມອິນຟລູເອັນເຊີຄົນທຳອິດ
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : viewMode === 'grid' ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredInfluencers.map((item) => {
                            const isSelected = selectedUuids.includes(item.uuid)
                            const actor = item.actor
                            const pricePhoto = Number(actor?.price_photo) || 0
                            const priceVideo = Number(actor?.price_video) || 0
                            const addCharge = Number(actor?.client_repost_additional_charge) || 0

                            // Card influencer
                            return (
                                <Card
                                    key={item.uuid}
                                    className={`group relative overflow-hidden transition-all duration-200 border-border/70 hover:border-primary/40 hover:shadow-md ${isSelected ? 'ring-2 ring-primary border-primary' : ''
                                        }`}
                                >
                                    {/* Selection Checkbox */}
                                    {(canReview || canManage) && (
                                        <div className="absolute top-3 left-3 z-10">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggleSelect(item.uuid)}
                                                className="size-5 bg-background/90 backdrop-blur shadow-sm data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                    )}
                                    {/* Status Badge in Header */}
                                    <div className="absolute top-3 right-3 z-10">{getStatusBadge(item.status, t)}</div>
                                    {/* Actor Photo Banner */}
                                    <div className="relative overflow-hidden bg-muted aspect-[16/9]">
                                        <button
                                            type="button"
                                            className="block w-full h-full cursor-zoom-in"
                                            onClick={() => {
                                                if (actor?.profile_url) {
                                                    setPreviewPhoto({
                                                        url: actor.profile_url,
                                                        name: actor.name
                                                    })
                                                }
                                            }}
                                        >
                                            {actor?.profile_url ? (
                                                <img
                                                    src={actor.profile_url}
                                                    alt={actor.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange/10 to-black/10 text-4xl font-bold text-orange/40">
                                                    {actor?.name?.slice(0, 1).toUpperCase() || 'I'}
                                                </div>
                                            )}
                                        </button>

                                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                                            {getTierBadge(item.total_followers)}
                                            {actor?.provinces && (
                                                <Badge
                                                    variant="outline"
                                                    className="bg-background/80 backdrop-blur text-[10px] border-0 text-foreground font-medium"
                                                >
                                                    {actor.provinces.name}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="text-base font-bold truncate">{actor?.name}</CardTitle>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    {formatAge(actor?.date_of_birth) && (
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted/60 text-muted-foreground font-medium rounded-md gap-1 h-5 hover:bg-muted/60">
                                                            <User2 className="size-3" />
                                                            {formatAge(actor?.date_of_birth)}
                                                        </Badge>
                                                    )}
                                                    {actor?.social_handle ? (
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium rounded-md gap-1 h-5 hover:bg-sky-500/10">
                                                            <AtSign className="size-3" />
                                                            {actor.social_handle}
                                                        </Badge>
                                                    ) : actor?.source ? (
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium rounded-md gap-1 h-5 hover:bg-violet-500/10">
                                                            <Share2 className="size-3" />
                                                            Source: {actor.source}
                                                        </Badge>
                                                    ) : !formatAge(actor?.date_of_birth) && (
                                                        <span className="text-xs text-muted-foreground">ອິນຟລູເອັນເຊີ</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 space-y-3">
                                        {/* Reach & Socials */}
                                        <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 p-2.5 border">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="size-4 text-primary shrink-0" />
                                                <div>
                                                    <p className="text-lg font-bold tabular-nums">{item.total_followers?.toLocaleString()}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">ຜູ້ຕິດຕາມ</p>
                                                </div>
                                            </div>

                                            <SocialProfiles accounts={actor?.influencer_social_accounts ?? []} />
                                        </div>

                                        {/* Pricing Block (Displayed in Thousands) */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {canManage && (
                                                <div className="rounded-xl border p-2.5 bg-background/50">
                                                    <span className="text-[10px] font-semibold text-muted-foreground block uppercase">{t('influencerTab.offerPrice')} (ຕົ້ນທຶນ)</span>
                                                    <span className="font-bold text-foreground text-sm truncate block mt-0.5">
                                                        {formatCurrency(item.offer_price)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`rounded-xl border p-2.5 bg-primary/5 border-primary/20 ${!canManage ? 'col-span-2' : ''}`}>
                                                <span className="text-[10px] font-semibold text-primary block uppercase">{t('influencerTab.clientPrice')}</span>
                                                <span className="font-bold text-primary text-sm truncate block mt-0.5">
                                                    {formatCurrency(item.display_price)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Rate Sheet Breakdown (Photo, Video, Additional Charge) */}
                                        {(pricePhoto > 0 || priceVideo > 0 || addCharge > 0) && (
                                            <div className="rounded-xl bg-muted/40 p-2.5 border text-[11px] space-y-1">
                                                <div className="flex items-center justify-between text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Camera className="size-3 text-sky-500" /> {t('influencerTab.photoPrice')}:
                                                    </span>
                                                    <span className="font-semibold text-foreground">{formatCurrency(pricePhoto)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Video className="size-3 text-violet-500" /> {t('influencerTab.videoPrice')}:
                                                    </span>
                                                    <span className="font-semibold text-foreground">{formatCurrency(priceVideo)}</span>
                                                </div>
                                                {addCharge > 0 && (
                                                    <div className="flex items-center justify-between text-muted-foreground pt-0.5 border-t border-border/50">
                                                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                            <Zap className="size-3" /> {t('influencerTab.additionalCharge')}
                                                        </span>
                                                        <span className="font-semibold text-amber-600 dark:text-amber-400">+{formatCurrency(addCharge)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* KPI & Schedule Info */}
                                        {(item.kpi || item.post_date) && (
                                            <div className="space-y-1 rounded-xl bg-muted/30 p-2.5 border text-xs">
                                                {item.post_date && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Calendar className="size-3.5 text-primary shrink-0" />
                                                        <span className="font-medium">
                                                            {t('influencerTab.postDate')} <strong className="text-foreground">{item.post_date}</strong>
                                                        </span>
                                                    </div>
                                                )}
                                                {item.kpi && (
                                                    <div className="text-muted-foreground text-[11px] line-clamp-2">
                                                        <strong>KPI:</strong> {item.kpi}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Bar */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t">
                                            {/* Accept & Reject Buttons */}
                                            <div className="flex items-center gap-1.5">
                                                {item.status === 'PROPOSED' ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-2.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 gap-1.5 font-bold shadow-2xs"
                                                        onClick={() => handleSingleReview(item, 'APPROVED')}
                                                    >
                                                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                                        {t('influencerTab.approve')}
                                                    </Button>
                                                ) : (
                                                    <></>
                                                )}

                                                {item.status === 'PROPOSED' ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-2.5 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700 gap-1.5 font-bold shadow-2xs"
                                                        onClick={() => handleSingleReview(item, 'REJECTED')}
                                                    >
                                                        <XCircle className="size-3.5 text-rose-600 dark:text-rose-400" />
                                                        {t('influencerTab.reject')}
                                                    </Button>
                                                ) : item.status === 'REJECTED' ? (
                                                    <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 gap-1 font-semibold h-8 px-2">
                                                        <XCircle className="size-3.5" /> {t('influencerTab.rejectedStatus')}
                                                    </Badge>
                                                ) : (
                                                    <></>
                                                )}
                                            </div>

                                            {/* Admin Management Controls */}
                                            {canManage && (
                                                <div className="flex items-center gap-1 ml-auto">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2 text-xs gap-1"
                                                        onClick={() => openPostLinks(item.actor_id)}
                                                        title={t('influencerTab.addPostLink')}
                                                    >
                                                        <Link2 className="size-3.5" /> {t('influencerTab.postLinks')}
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" onClick={() => handleOpenEdit(item)}>
                                                        <Edit3 className="size-3.5" /> {t('influencerTab.edit')}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                                                        onClick={() => handleDelete(item)}
                                                        title={t('influencerTab.removeFromCampaign')}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    /* Table View */
                    <Card className="overflow-hidden border shadow-xs">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-10">
                                            {(canReview || canManage) && (
                                                <Checkbox
                                                    checked={filteredInfluencers.length > 0 && selectedUuids.length === filteredInfluencers.length}
                                                    onCheckedChange={handleSelectAll}
                                                />
                                            )}
                                        </TableHead>
                                        <TableHead>{t('influencerTab.table.influencer')}</TableHead>
                                        <TableHead>{t('influencerTab.table.reachSocials')}</TableHead>
                                        <TableHead>{t('influencerTab.table.rates')}</TableHead>
                                        <TableHead>{t('influencerTab.table.addCharge')}</TableHead>
                                        {canManage && <TableHead>{t('influencerTab.table.offerPrice')}</TableHead>}
                                        <TableHead>{t('influencerTab.table.displayPrice')}</TableHead>
                                        <TableHead>{t('influencerTab.table.postDate')}</TableHead>
                                        <TableHead>{t('influencerTab.table.kpi')}</TableHead>
                                        <TableHead>{t('influencerTab.table.status')}</TableHead>
                                        <TableHead className="text-right">{t('influencerTab.table.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInfluencers.map((item) => {
                                        const isSelected = selectedUuids.includes(item.uuid)
                                        const actor = item.actor
                                        const pricePhoto = Number(actor?.price_photo) || 0
                                        const priceVideo = Number(actor?.price_video) || 0
                                        const addCharge = Number(actor?.client_repost_additional_charge) || 0

                                        return (
                                            <TableRow key={item.uuid} className={isSelected ? 'bg-muted/30' : ''}>
                                                <TableCell>
                                                    {(canReview || canManage) && (
                                                        <Checkbox checked={isSelected} onCheckedChange={() => handleToggleSelect(item.uuid)} />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="size-9 border">
                                                            <AvatarImage src={actor?.profile_url || undefined} />
                                                            <AvatarFallback className="text-xs font-bold">
                                                                {actor?.name?.slice(0, 1).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-sm truncate">{actor?.name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {[formatAge(actor?.date_of_birth), actor?.social_handle || actor?.source]
                                                                    .filter(Boolean)
                                                                    .join(' · ') || '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-xs">{formatFollowers(item.total_followers)}</span>
                                                            {getTierBadge(item.total_followers)}
                                                        </div>
                                                        <SocialProfiles accounts={actor?.influencer_social_accounts ?? []} />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <div className="space-y-0.5">
                                                        <p className="text-muted-foreground">
                                                            {t('influencerTab.photoPrice')}: <strong className="text-foreground">{formatCurrency(pricePhoto)}</strong>
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            {t('influencerTab.videoPrice')}: <strong className="text-foreground">{formatCurrency(priceVideo)}</strong>
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {addCharge > 0 ? (
                                                        <span className="font-semibold text-amber-600 dark:text-amber-400">+{formatCurrency(addCharge)}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                {canManage && <TableCell className="font-medium text-xs">{formatCurrency(item.offer_price)}</TableCell>}
                                                <TableCell className="font-bold text-xs text-primary">{formatCurrency(item.display_price)}</TableCell>
                                                <TableCell className="text-xs">
                                                    {item.post_date ? (
                                                        <span className="font-medium text-foreground">{item.post_date}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Not set</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs max-w-[200px]">
                                                    <p className="truncate text-muted-foreground" title={item.kpi || ''}>
                                                        {item.kpi || '—'}
                                                    </p>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(item.status, t)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {item.status !== 'APPROVED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 px-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 gap-1 font-bold"
                                                                onClick={() => handleSingleReview(item, 'APPROVED')}
                                                                title={t('influencerTab.approve')}
                                                            >
                                                                <CheckCircle2 className="size-3.5" /> {t('influencerTab.approve')}
                                                            </Button>
                                                        )}
                                                        {item.status !== 'REJECTED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 px-2 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 gap-1 font-bold"
                                                                onClick={() => handleSingleReview(item, 'REJECTED')}
                                                                title={t('influencerTab.reject')}
                                                            >
                                                                <XCircle className="size-3.5" /> {t('influencerTab.reject')}
                                                            </Button>
                                                        )}
                                                        {canManage && (
                                                            <>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="size-7"
                                                                    onClick={() => openPostLinks(item.actor_id)}
                                                                    title={t('influencerTab.addPostLink')}
                                                                >
                                                                    <Link2 className="size-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="size-7"
                                                                    onClick={() => handleOpenEdit(item)}
                                                                    title={t('influencerTab.edit')}
                                                                >
                                                                    <Edit3 className="size-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="size-7 text-rose-600 hover:bg-rose-50"
                                                                    onClick={() => handleDelete(item)}
                                                                    title={t('influencerTab.delete')}
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                )}

                {/* Add Influencer Dialog */}
                <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                    <DialogContent className="max-w-7xl max-h-[98vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg">
                                <Plus className="size-5 text-primary" /> {t('influencerTab.addInfluencerToProposal')}
                            </DialogTitle>
                            <CardDescription>ເລືອກອິນຟລູເອັນເຊີ. ລະບົບຈະຄິດໄລ່ລາຄາລວມຈາກລາຄາຮູບພາບ + ວິດີໂອອັດຕະໂນມັດ.</CardDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            {/* Actor Selection */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs font-semibold">1. ເລືອກອິນຟລູເອັນເຊີ</Label>
                                    <span className="text-[10px] text-muted-foreground">{availableActors.length} ລາຍການ</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder={t('influencerTab.searchPlaceholder')}
                                            value={actorSearch}
                                            onChange={(e) => setActorSearch(e.target.value)}
                                            className="h-9 pl-8 text-xs"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className={`h-9 shrink-0 text-xs ${hasActiveActorFilterState(pickerFilters) ? 'border-primary text-primary' : ''}`}
                                        onClick={() => setShowPickerFilters((open) => !open)}
                                    >
                                        <Filter className="size-3.5" />
                                        ຕົວເລືອກກັ່ນຕອງ
                                        {hasActiveActorFilterState(pickerFilters) && <span className="ml-1 size-1.5 rounded-full bg-primary" />}
                                    </Button>
                                </div>

                                {showPickerFilters && (
                                    <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.gender')}</Label>
                                            <Select
                                                value={pickerFilters.gender}
                                                onValueChange={(value) => setPickerFilters((prev) => ({ ...prev, gender: value }))}
                                            >
                                                <SelectTrigger className="h-8 bg-background text-xs">
                                                    <SelectValue placeholder={t('influencerTab.allGenders')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('influencerTab.allGenders')}</SelectItem>
                                                    <SelectItem value="Male">{t('influencerTab.male')}</SelectItem>
                                                    <SelectItem value="Female">{t('influencerTab.female')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.familyStatus')}</Label>
                                            <Select
                                                value={pickerFilters.family}
                                                onValueChange={(value) => setPickerFilters((prev) => ({ ...prev, family: value }))}
                                            >
                                                <SelectTrigger className="h-8 bg-background text-xs">
                                                    <SelectValue placeholder={t('influencerTab.allFamilyStatus')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('influencerTab.allFamilyStatus')}</SelectItem>
                                                    <SelectItem value="Single">{t('influencerTab.single')}</SelectItem>
                                                    <SelectItem value="Married without kids">{t('influencerTab.marriedNoKids')}</SelectItem>
                                                    <SelectItem value="Married with kids">{t('influencerTab.marriedWithKids')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.province')}</Label>
                                            <Select
                                                value={String(pickerFilters.province)}
                                                onValueChange={(value) =>
                                                    setPickerFilters((prev) => ({ ...prev, province: value === 'all' ? 'all' : Number(value) }))
                                                }
                                            >
                                                <SelectTrigger className="h-8 bg-background text-xs">
                                                    <SelectValue placeholder={t('influencerTab.allProvinces')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('influencerTab.allProvinces')}</SelectItem>
                                                    {provinces.map((province) => (
                                                        <SelectItem key={province.id} value={String(province.id)}>
                                                            {province.nameLao}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.source')}</Label>
                                            <Select
                                                value={pickerFilters.source}
                                                onValueChange={(value) => setPickerFilters((prev) => ({ ...prev, source: value }))}
                                            >
                                                <SelectTrigger className="h-8 bg-background text-xs">
                                                    <SelectValue placeholder={t('influencerTab.allSources')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('influencerTab.allSources')}</SelectItem>
                                                    <SelectItem value="Rizz">Rizz</SelectItem>
                                                    <SelectItem value="Freelance">Freelance</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.status')}</Label>
                                            <Select
                                                value={pickerFilters.status}
                                                onValueChange={(value) => setPickerFilters((prev) => ({ ...prev, status: value }))}
                                            >
                                                <SelectTrigger className="h-8 bg-background text-xs">
                                                    <SelectValue placeholder={t('influencerTab.filters.all')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('influencerTab.filters.all')}</SelectItem>
                                                    <SelectItem value="ACTIVE">{t('influencerTab.active')}</SelectItem>
                                                    <SelectItem value="INACTIVE">{t('influencerTab.inactive')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.clientRepost')}</Label>
                                            <Select
                                                value={pickerFilters.repost}
                                                onValueChange={(value) => setPickerFilters((prev) => ({ ...prev, repost: value }))}
                                            >
                                                <SelectTrigger className="h-8 bg-background text-xs">
                                                    <SelectValue placeholder={t('influencerTab.filters.all')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('influencerTab.filters.all')}</SelectItem>
                                                    <SelectItem value="yes">{t('influencerTab.allowed')}</SelectItem>
                                                    <SelectItem value="no">{t('influencerTab.notAllowed')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.platform')}</Label>
                                            <Select
                                                value={pickerFilters.platform}
                                                onValueChange={(value) => setPickerFilters((prev) => ({ ...prev, platform: value }))}
                                            >
                                                <SelectTrigger className="h-8 bg-background text-xs">
                                                    <SelectValue placeholder={t('influencerTab.allPlatforms')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('influencerTab.allPlatforms')}</SelectItem>
                                                    <SelectItem value="facebook">Facebook</SelectItem>
                                                    <SelectItem value="instagram">Instagram</SelectItem>
                                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.tags')}</Label>
                                            <Input
                                                className="h-8 bg-background text-xs"
                                                placeholder={t('influencerTab.searchTags')}
                                                value={pickerFilters.tags}
                                                onChange={(event) => setPickerFilters((prev) => ({ ...prev, tags: event.target.value }))}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.maxStandardPrice')}</Label>
                                            <Input
                                                className="h-8 bg-background text-xs"
                                                type="number"
                                                min={0}
                                                placeholder="ຕົວຢ່າງ 1000000"
                                                value={pickerFilters.maxPrice}
                                                onChange={(event) => setPickerFilters((prev) => ({ ...prev, maxPrice: event.target.value }))}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.minAge')}</Label>
                                            <Input
                                                className="h-8 bg-background text-xs"
                                                type="number"
                                                min={0}
                                                placeholder="ຕົວຢ່າງ 18"
                                                value={pickerFilters.minAge}
                                                onChange={(event) => setPickerFilters((prev) => ({ ...prev, minAge: event.target.value }))}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] text-muted-foreground">{t('influencerTab.maxAge')}</Label>
                                            <Input
                                                className="h-8 bg-background text-xs"
                                                type="number"
                                                min={0}
                                                placeholder="ຕົວຢ່າງ 35"
                                                value={pickerFilters.maxAge}
                                                onChange={(event) => setPickerFilters((prev) => ({ ...prev, maxAge: event.target.value }))}
                                            />
                                        </div>
                                        {hasActiveActorFilterState(pickerFilters) && (
                                            <div className="flex items-end justify-end sm:col-span-2 lg:col-span-4 xl:col-span-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-muted-foreground"
                                                    onClick={() => setPickerFilters(EMPTY_ACTOR_FILTERS)}
                                                >
                                                    <X className="mr-1 size-3.5" />
                                                    {t('influencerTab.clearActorFilters')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="max-h-48 overflow-y-auto border rounded-xl divide-y bg-muted/20">
                                    {isActorsLoading ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground">ກຳລັງໂຫຼດອິນຟລູເອັນເຊີ...</div>
                                    ) : availableActors.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground">
                                            {actorSearch.trim() || hasActiveActorFilterState(pickerFilters)
                                                ? t('influencerTab.emptyState')
                                                : 'ບໍ່ພົບອິນຟລູເອັນເຊີທີ່ສາມາດເລືອກໄດ້'}
                                        </div>
                                    ) : (
                                        availableActors.map((actor) => {
                                            const isSelected = selectedActor?.id === actor.id
                                            const pPhoto = Number(actor.price_photo) || 0
                                            const pVideo = Number(actor.price_video) || 0
                                            const sumPV = pPhoto + pVideo

                                            return (
                                                <button
                                                    key={actor.id}
                                                    type="button"
                                                    onClick={() => handleSelectActor(actor)}
                                                    className={`w-full flex items-center justify-between p-2.5 text-left transition-colors hover:bg-muted/60 ${isSelected ? 'bg-primary/10 border-l-4 border-primary' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <Avatar className="size-8">
                                                            <AvatarImage src={actor.profile_url || undefined} />
                                                            <AvatarFallback className="text-xs">{actor.name.slice(0, 1)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold truncate">{actor.name}</p>
                                                            <div className="flex flex-wrap items-center gap-1 mt-1">
                                                                {formatAge(actor.date_of_birth) && (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                                                                        <User2 className="size-2.5" />
                                                                        {formatAge(actor.date_of_birth)}
                                                                    </span>
                                                                )}
                                                                {actor.social_handle ? (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded font-medium">
                                                                        <AtSign className="size-2.5" />
                                                                        {actor.social_handle}
                                                                    </span>
                                                                ) : actor.source ? (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded font-medium">
                                                                        <Share2 className="size-2.5" />
                                                                        {actor.source}
                                                                    </span>
                                                                ) : !formatAge(actor.date_of_birth) && (
                                                                    <span className="text-[10px] text-muted-foreground">ອິນຟລູເອັນເຊີ</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right shrink-0">
                                                        <span className="text-xs font-bold text-primary block">
                                                            {formatCurrency(sumPV > 0 ? sumPV : actor.standard_price)}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">{sumPV > 0 ? 'ລາຄາລວມ ຮູບ+ວິດີໂອ' : 'ລາຄາມາດຕະຖານ'}</span>
                                                    </div>
                                                </button>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Influencer Rate Card Breakdown */}
                            {selectedActor && (
                                <div className="rounded-xl border bg-primary/5 p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="size-7">
                                                <AvatarImage src={selectedActor.profile_url || undefined} />
                                                <AvatarFallback className="text-xs">{selectedActor.name.slice(0, 1)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className="text-xs font-bold">
                                                    {selectedActor.name}
                                                    {formatAge(selectedActor.date_of_birth) ? ` · ${formatAge(selectedActor.date_of_birth)}` : ''} — {t('influencerTab.influencerRateSheet')}
                                                </h4>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-background text-[10px] font-semibold">
                                            ຄິດໄລ່ອັດຕະໂນມັດໃນຫຼັກພັນ
                                        </Badge>
                                    </div>

                                    {/* Price Breakdown Tiles */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                        <div className="rounded-lg bg-background p-2 border">
                                            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                                <Camera className="size-3 text-sky-500" /> {t('influencerTab.photoPrice')}
                                            </span>
                                            <span className="font-bold text-foreground block mt-0.5">{formatCurrency(selectedActor.price_photo)}</span>
                                        </div>

                                        <div className="rounded-lg bg-background p-2 border">
                                            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                                <Video className="size-3 text-violet-500" /> {t('influencerTab.videoPrice')}
                                            </span>
                                            <span className="font-bold text-foreground block mt-0.5">{formatCurrency(selectedActor.price_video)}</span>
                                        </div>

                                        <div className="rounded-lg bg-background p-2 border">
                                            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                                <Layers className="size-3 text-primary" /> {t('influencerTab.photoVideoPrice')}
                                            </span>
                                            <span className="font-bold text-primary block mt-0.5">
                                                {formatCurrency((Number(selectedActor.price_photo) || 0) + (Number(selectedActor.price_video) || 0))}
                                            </span>
                                        </div>

                                        <div className="rounded-lg bg-background p-2 border">
                                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                <Zap className="size-3" /> {t('influencerTab.additionalCharge')}
                                            </span>
                                            <span className="font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                                                +{formatCurrency(selectedActor.client_repost_additional_charge)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick action buttons to set prices */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                                        <span className="text-muted-foreground font-medium">ເລືອກດ່ວນ:</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-[10px] px-2"
                                            onClick={() => {
                                                const pPhoto = Number(selectedActor.price_photo) || 0
                                                const pVideo = Number(selectedActor.price_video) || 0
                                                const sum = pPhoto + pVideo
                                                if (sum > 0) {
                                                    setAddForm({ ...addForm, offer_price: String(sum), display_price: String(sum) })
                                                }
                                            }}
                                        >
                                            ລາຄາລວມ ຮູບ+ວິດີໂອ
                                        </Button>

                                        {Number(selectedActor.price_photo) > 0 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-[10px] px-2"
                                                onClick={() => {
                                                    const val = String(selectedActor.price_photo)
                                                    setAddForm({ ...addForm, offer_price: val, display_price: val })
                                                }}
                                            >
                                                ສະເພາະຮູບພາບ
                                            </Button>
                                        )}

                                        {Number(selectedActor.price_video) > 0 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-[10px] px-2"
                                                onClick={() => {
                                                    const val = String(selectedActor.price_video)
                                                    setAddForm({ ...addForm, offer_price: val, display_price: val })
                                                }}
                                            >
                                                ສະເພາະວິດີໂອ
                                            </Button>
                                        )}

                                        {Number(selectedActor.client_repost_additional_charge) > 0 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-[10px] px-2 text-amber-600 border-amber-300 hover:bg-amber-50"
                                                onClick={() => {
                                                    const currentOffer = Number(addForm.offer_price) || 0
                                                    const currentDisplay = Number(addForm.display_price) || 0
                                                    const add = Number(selectedActor.client_repost_additional_charge) || 0
                                                    setAddForm({
                                                        ...addForm,
                                                        offer_price: String(currentOffer + add),
                                                        display_price: String(currentDisplay + add)
                                                    })
                                                }}
                                            >
                                                + ເພີ່ມຄ່າຣີໂພສ
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pricing & Proposal Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold">{t('influencerTab.offerPrice')}</Label>
                                        {addForm.offer_price && (
                                            <span className="text-[10px] font-bold text-primary">{formatCurrency(addForm.offer_price)}</span>
                                        )}
                                    </div>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="ຕົວຢ່າງ 1,500,000"
                                        value={formatNumberThousands(addForm.offer_price)}
                                        onChange={(e) => setAddForm({ ...addForm, offer_price: parsePriceInput(e.target.value) })}
                                        className="h-9 text-xs tabular-nums"
                                    />
                                    <p className="text-[10px] text-muted-foreground">ຕົ້ນທຶນພາຍໃນທີ່ຈ່າຍໃຫ້ອິນຟລູເອັນເຊີ (ຫຼັກພັນ)</p>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold">{t('influencerTab.clientPrice')}</Label>
                                        {addForm.display_price && (
                                            <span className="text-[10px] font-bold text-primary">{formatCurrency(addForm.display_price)}</span>
                                        )}
                                    </div>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="ຕົວຢ່າງ 2,000,000"
                                        value={formatNumberThousands(addForm.display_price)}
                                        onChange={(e) => setAddForm({ ...addForm, display_price: parsePriceInput(e.target.value) })}
                                        className="h-9 text-xs tabular-nums"
                                    />
                                    <p className="text-[10px] text-muted-foreground">ລາຄາທີ່ສະແດງໃຫ້ລູກຄ້າເຫັນໃນໃບສະເໜີ (ຫຼັກພັນ)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">{t('influencerTab.postDate')} (ບໍ່ບັງຄັບ)</Label>
                                    <Input
                                        type="date"
                                        value={addForm.post_date}
                                        onChange={(e) => setAddForm({ ...addForm, post_date: e.target.value })}
                                        className="h-9 text-xs"
                                    />
                                    <p className="text-[10px] text-muted-foreground">ຄ່າເລີ່ມຕົ້ນແມ່ນວ່າງເປົ່າ ເພື່ອໃຫ້ລູກຄ້າສາມາດກຳນົດເອງໄດ້</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">{t('influencerTab.kpiDeliverables')}</Label>
                                    <Input
                                        placeholder="ຕົວຢ່າງ 1 Reel + 2 Stories, 50k Views"
                                        value={addForm.kpi}
                                        onChange={(e) => setAddForm({ ...addForm, kpi: e.target.value })}
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                                {t('influencerTab.cancel')}
                            </Button>
                            <Button onClick={handleSaveAdd} disabled={isAdding || !selectedActor} className="gap-1.5">
                                <Plus className="size-4" /> ເພີ່ມອິນຟລູເອັນເຊີ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Influencer Dialog */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg">
                                <Edit3 className="size-5 text-primary" /> {t('influencerTab.editInfluencerProposal')}
                            </DialogTitle>
                            <CardDescription>{editingItem?.actor?.name}</CardDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            {/* Rate breakdown reference */}
                            {editingItem?.actor && (
                                <div className="rounded-xl border bg-muted/40 p-2.5 space-y-1 text-xs">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block">{t('influencerTab.influencerRateSheet')}</span>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div>
                                            {t('influencerTab.photoPrice')}: <strong>{formatCurrency(editingItem.actor.price_photo)}</strong>
                                        </div>
                                        <div>
                                            {t('influencerTab.videoPrice')}: <strong>{formatCurrency(editingItem.actor.price_video)}</strong>
                                        </div>
                                        <div>
                                            {t('influencerTab.photoVideoPrice')}:{' '}
                                            <strong>
                                                {formatCurrency((Number(editingItem.actor.price_photo) || 0) + (Number(editingItem.actor.price_video) || 0))}
                                            </strong>
                                        </div>
                                        {Number(editingItem.actor.client_repost_additional_charge) > 0 && (
                                            <div className="text-amber-600 dark:text-amber-400">
                                                {t('influencerTab.additionalCharge')} <strong>+{formatCurrency(editingItem.actor.client_repost_additional_charge)}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {canManage && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold">{t('influencerTab.offerPrice')}</Label>
                                            {editForm.offer_price && (
                                                <span className="text-[10px] font-bold text-primary">{formatCurrency(editForm.offer_price)}</span>
                                            )}
                                        </div>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="e.g. 1,500,000"
                                            value={formatNumberThousands(editForm.offer_price)}
                                            onChange={(e) => setEditForm({ ...editForm, offer_price: parsePriceInput(e.target.value) })}
                                            className="h-9 text-xs tabular-nums"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold">{t('influencerTab.clientPrice')}</Label>
                                            {editForm.display_price && (
                                                <span className="text-[10px] font-bold text-primary">{formatCurrency(editForm.display_price)}</span>
                                            )}
                                        </div>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="e.g. 2,000,000"
                                            value={formatNumberThousands(editForm.display_price)}
                                            onChange={(e) => setEditForm({ ...editForm, display_price: parsePriceInput(e.target.value) })}
                                            className="h-9 text-xs tabular-nums"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">{t('influencerTab.postDate')}</Label>
                                <Input
                                    type="date"
                                    value={editForm.post_date}
                                    onChange={(e) => setEditForm({ ...editForm, post_date: e.target.value })}
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">{t('influencerTab.kpiDeliverables')}</Label>
                                <Textarea
                                    rows={2}
                                    placeholder="Enter KPI requirements"
                                    value={editForm.kpi}
                                    onChange={(e) => setEditForm({ ...editForm, kpi: e.target.value })}
                                    className="text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">{t('influencerTab.status')}</Label>
                                <Select value={editForm.status} onValueChange={(val) => setEditForm({ ...editForm, status: val })}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PROPOSED">{t('influencerTab.proposed')}</SelectItem>
                                        <SelectItem value="APPROVED">{t('influencerTab.approve')}</SelectItem>
                                        <SelectItem value="REJECTED">{t('influencerTab.reject')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">{t('influencerTab.customerNote')}</Label>
                                <Textarea
                                    rows={2}
                                    placeholder="Add feedback or notes"
                                    value={editForm.customer_note}
                                    onChange={(e) => setEditForm({ ...editForm, customer_note: e.target.value })}
                                    className="text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                                {t('influencerTab.cancel')}
                            </Button>
                            <Button onClick={handleSaveEdit} disabled={isUpdating}>
                                {t('influencerTab.saveChanges')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Photo Zoom Modal */}
                <Dialog
                    open={Boolean(previewPhoto)}
                    onOpenChange={(open) => {
                        if (!open) setPreviewPhoto(null)
                    }}
                >
                    <DialogContent className="max-h-[95vh] w-[min(96vw,56rem)] max-w-none overflow-hidden border-0 bg-black/95 p-0 text-white shadow-2xl [&>button]:hidden">
                        <DialogTitle className="sr-only">{previewPhoto?.name || 'Profile photo'}</DialogTitle>
                        <div className="relative flex min-h-[50vh] flex-col">
                            <div className="flex items-center justify-between gap-3 px-4 py-3">
                                <p className="truncate text-sm font-medium">{previewPhoto?.name}</p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-9 shrink-0 rounded-full text-white hover:bg-white/10 hover:text-white"
                                    onClick={() => setPreviewPhoto(null)}
                                >
                                    <X className="size-5" />
                                </Button>
                            </div>
                            <div className="flex flex-1 items-center justify-center px-3 pb-4">
                                {previewPhoto?.url ? (
                                    <img src={previewPhoto.url} alt={previewPhoto.name} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
                                ) : null}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <PostLinksDialog
                    campaign={campaign}
                    open={postLinksOpen}
                    defaultActorId={postLinksActorId}
                    onOpenChange={(next) => {
                        setPostLinksOpen(next)
                        if (!next) {
                            setPostLinksActorId(null)
                            void onChanged?.()
                        }
                    }}
                />
            </div>
        </TooltipProvider>
    )
}

export default InfluencerTab
