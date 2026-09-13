import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Plus, LayoutList, LayoutGrid, TableProperties, Globe2Icon } from 'lucide-react'
import {
    Actor,
    useCreateActorMutation,
    useDeleteActorMutation,
    useGetActorsMutation,
    useGetProfileMetricsBatchStatusMutation,
    useRefreshAllActorsSocialAccountsMutation,
    useUpdateActorMutation
} from '../../../stores/services/actorApi'
import BackdropComponent from '@/components/BackdropComponent'
import { PageHeader } from '@/components/page-header'
import PaginationComponent from '../../../components/PaginationComponent'
import ToastComponent from '../../../components/ToastComponent'
import { getMutationPayload, isMutationSuccess } from '@/utils/mutation-response'
import { alertWarning, confirmDelete } from '../../../utils/alerts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ActorCard } from './components/ActorCard'
import { ActorDetailDialog } from './components/ActorDetailDialog'
import { ActorFormDialog } from './components/ActorFormDialog'
import { ActorsSearchBar } from './components/ActorsSearchBar'
import { ActorsStatsCards } from './components/ActorsStatsCards'
import { SocialAccountsDialog } from './components/SocialAccountsDialog'
import { emptyForm as emptyActorForm, getActorStatus } from './components/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { ActorGridCard } from './components/ActorGridCard'
import { ActorTableRow } from './components/ActorTableRow'
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const ACTORS_VIEW_KEY = 'influencers:display-mode'
type ActorsViewMode = 'card' | 'grid' | 'table'

const ActorsPage: React.FC = () => {
    const { t } = useTranslation('app')
    const [page, setPage] = useState(1)
    const [keyword, setKeyword] = useState('')
    const [rows, setRows] = useState<Actor[]>([])
    const [total, setTotal] = useState({ totalItems: 0, totalPages: 0 })
    const [viewMode, setViewMode] = useState<ActorsViewMode>(() => {
        try {
            const saved = localStorage.getItem(ACTORS_VIEW_KEY)
            return saved === 'grid' || saved === 'table' ? saved : 'card'
        } catch {
            return 'card'
        }
    })
    const changeViewMode = (mode: ActorsViewMode) => {
        setViewMode(mode)
        try { localStorage.setItem(ACTORS_VIEW_KEY, mode) } catch { /* Keep the selection usable when storage is unavailable. */ }
    }
    const [open, setOpen] = useState(false)
    const [editActor, setEditActor] = useState<Actor | null>(null)
    const [form, setForm] = useState(emptyActorForm)
    const [socialActor, setSocialActor] = useState<Actor | null>(null)
    const [socialOpen, setSocialOpen] = useState(false)
    const [detailActor, setDetailActor] = useState<Actor | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [searchParams, setSearchParams] = useSearchParams()
    const [followBatchId, setFollowBatchId] = useState<string | null>(null)
    const [followBatchProgress, setFollowBatchProgress] = useState({
        total: 0,
        finished: 0,
        failed: 0
    })

    const [genderFilter, setGenderFilter] = useState<string>('all')
    const [familyFilter, setFamilyFilter] = useState<string>('all')
    const [provinceFilter, setProvinceFilter] = useState<number | 'all'>('all')
    const [standardPriceFilter, setStandardPriceFilter] = useState<string>('')
    const [tagsFilter, setTagsFilter] = useState<string>('')
    const [sourceFilter, setSourceFilter] = useState<string>('all')

    const debouncedStandardPriceFilter = useDebounce(standardPriceFilter, 1000)
    const debouncedTagsFilter = useDebounce(tagsFilter, 1000)

    const [getActors, { isLoading: loadingActors }] = useGetActorsMutation()
    const [createActor, { isLoading: creating }] = useCreateActorMutation()
    const [updateActor, { isLoading: updating }] = useUpdateActorMutation()
    const [deleteActor, { isLoading: isLoadingDeleting }] = useDeleteActorMutation()
    const [refreshAllActorsFollowers, { isLoading: queueingFollowAll }] = useRefreshAllActorsSocialAccountsMutation()
    const [getFollowBatchStatus] = useGetProfileMetricsBatchStatusMutation()

    const refetch = async (nextPage = page, nextKeyword = keyword) => {
        const res = await getActors({
            page: nextPage,
            keyword: nextKeyword.trim() || null,
            gender: genderFilter === 'all' ? null : genderFilter,
            family: familyFilter === 'all' ? null : familyFilter,
            province: provinceFilter === 'all' ? null : (provinceFilter as number),
            standard: debouncedStandardPriceFilter.trim() === '' ? null : debouncedStandardPriceFilter,
            tags: debouncedTagsFilter.trim() === '' ? null : debouncedTagsFilter.trim(),
            source: sourceFilter === 'all' ? null : sourceFilter
        })
        const data = getMutationPayload(res)
        if (!isMutationSuccess(data)) return

        const list = Array.isArray(data.data) ? data.data : []
        setRows(list)
        setTotal(data.pagination ?? { totalItems: 0, totalPages: 0 })
        if (socialActor) {
            const updated = list.find((item: Actor) => item.id === socialActor.id)
            if (updated) setSocialActor(updated)
        }
        if (detailActor) {
            const updated = list.find((item: Actor) => item.id === detailActor.id)
            if (updated) setDetailActor(updated)
        }
    }

    useEffect(() => {
        refetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, genderFilter, familyFilter, provinceFilter, debouncedStandardPriceFilter, debouncedTagsFilter, sourceFilter])

    useEffect(() => {
        if (!followBatchId) return

        let cancelled = false
        let checking = false
        const checkStatus = async () => {
            if (checking) return
            checking = true
            try {
                const response = await getFollowBatchStatus({ batchId: followBatchId }).unwrap()
                if (cancelled) return
                const status = response.data
                setFollowBatchProgress({
                    total: status.total,
                    finished: status.finished,
                    failed: status.failed
                })
                if (status.done) {
                    setFollowBatchId(null)
                    await refetch()
                    ToastComponent({
                        status: status.failed > 0 ? 'warning' : 'success',
                        message:
                            status.failed > 0
                                ? t('influencers.followPartial', { completed: status.completed, total: status.total, failed: status.failed })
                                : t('influencers.followSuccess', { completed: status.completed })
                    })
                }
            } catch {
                // Keep polling through temporary status failures.
            } finally {
                checking = false
            }
        }

        void checkStatus()
        const interval = window.setInterval(checkStatus, 2500)
        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [followBatchId, getFollowBatchStatus])

    useEffect(() => {
        const fbStatus = searchParams.get('facebook')
        if (fbStatus === 'success') {
            ToastComponent({ status: 'success', message: t('influencers.facebookOauthOk') })
            searchParams.delete('facebook')
            setSearchParams(searchParams)
            refetch()
        } else if (fbStatus === 'error') {
            ToastComponent({
                status: 'error',
                message: t('influencers.facebookOauthFail', { reason: searchParams.get('reason') || 'unknown' })
            })
            searchParams.delete('facebook')
            searchParams.delete('reason')
            setSearchParams(searchParams)
        }

        const tiktokStatus = searchParams.get('tiktok')
        if (tiktokStatus === 'success') {
            ToastComponent({ status: 'success', message: t('influencers.tiktokOauthOk') })
            searchParams.delete('tiktok')
            setSearchParams(searchParams)
            refetch()
        } else if (tiktokStatus === 'error') {
            ToastComponent({
                status: 'error',
                message: t('influencers.tiktokOauthFail', { reason: searchParams.get('reason') || 'unknown' })
            })
            searchParams.delete('tiktok')
            searchParams.delete('reason')
            setSearchParams(searchParams)
        }
    }, [searchParams])

    const handleGetFollowAll = async () => {
        try {
            const response = await refreshAllActorsFollowers().unwrap()
            if (response.data.queued === 0) {
                ToastComponent({
                    status: 'warning',
                    message: t('influencers.noProfileUrls')
                })
                return
            }
            setFollowBatchProgress({
                total: response.data.queued,
                finished: 0,
                failed: 0
            })
            setFollowBatchId(response.data.batch_id)
            ToastComponent({
                status: 'success',
                message: t('influencers.followQueued', { queued: response.data.queued, actors: response.data.actors })
            })
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || t('influencers.followAllFailed')
            })
        }
    }

    const openCreate = () => {
        setEditActor(null)
        setForm(emptyActorForm)
        setOpen(true)
    }

    const openEdit = (actor: Actor) => {
        setEditActor(actor)
        setForm({
            name: actor.name,
            email: actor.email ?? '',
            phone_number: actor.phone_number ?? '',
            profile_url: actor.profile_url ?? '',
            profile_urls: actor.profile_urls ?? [],
            status: getActorStatus(actor.status),
            gender: actor.gender || '',
            code: actor.code || '',
            source: actor.source || '',
            date_of_birth: actor.date_of_birth ? new Date(actor.date_of_birth).getFullYear().toString() : '',
            marital_status: actor.family_status || '',
            tags: Array.isArray(actor.tags) ? actor.tags.join(', ') : actor.tags || '',
            standard_price: actor.standard_price || '',
            province_id: actor.province_id || '',
            address_express: actor.address_express || '',
            bank_account_number: actor.bank_account_number || '',
            bank_account_name: actor.bank_account_name || '',
            price_photo: actor.price_photo || '',
            price_video: actor.price_video || '',
            price_video_photo: actor.price_video_photo || '',
            client_repost: actor.client_repost_allowed || false,
            additional_charge_amount: actor.client_repost_additional_charge || ''
        })
        setOpen(true)
    }

    const openSocialAccounts = (actor: Actor) => {
        setSocialActor(actor)
        setSocialOpen(true)
    }

    const openDetail = (actor: Actor) => {
        setDetailActor(actor)
        setDetailOpen(true)
    }

    const buildActorBody = () => ({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone_number: form.phone_number.trim() || null,
        profile_url: form.profile_url.trim() || null,
        profile_urls: form.profile_urls || null,
        status: form.status,
        gender: form.gender || null,
        code: form.code.trim() || null,
        source: form.source || null,
        date_of_birth: form.date_of_birth || null,
        family_status: form.marital_status || null,
        tags: form.tags.trim()
            ? form.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : null,
        standard_price: form.standard_price ? Number(form.standard_price) : null,
        province_id: form.province_id ? Number(form.province_id) : null,
        address_express: form.address_express.trim() || null,
        bank_account_number: form.bank_account_number.trim() || null,
        bank_account_name: form.bank_account_name.trim() || null,
        price_photo: form.price_photo ? Number(form.price_photo) : null,
        price_video: form.price_video ? Number(form.price_video) : null,
        price_video_photo: form.price_video_photo ? Number(form.price_video_photo) : null,
        client_repost_allowed: form.client_repost,
        client_repost_additional_charge: form.additional_charge_amount ? Number(form.additional_charge_amount) : null
    })

    const handleSearch = () => {
        if (page !== 1) {
            setPage(1)
        } else {
            refetch()
        }
    }

    const handleSubmit = async () => {
        if (!form.name.trim()) return alertWarning({ text: t('influencers.enterName') })

        const response = editActor ? await updateActor({ id: editActor.id, ...buildActorBody() }) : await createActor(buildActorBody())

        const data = getMutationPayload(response)
        if (data) ToastComponent(data)
        if (data?.status === 'error' || !isMutationSuccess(data)) return

        setOpen(false)
        setKeyword('')
        if (page !== 1) setPage(1)
        await refetch(1, '')
    }

    const handleDelete = async (id: number) => {
        const confirm = await confirmDelete({
            title: t('influencers.deleteTitle'),
            text: t('common:cannotUndo'),
            confirmButtonText: t('common:yesDelete')
        })
        if (!confirm.isConfirmed) return

        const response = await deleteActor(id)
        const data = getMutationPayload(response)
        if (data) ToastComponent(data)
        if (!isMutationSuccess(data)) return

        setRows((prev) => prev.filter((row) => row.id !== id))
    }

    const pageProfiles = rows.reduce((sum, row) => sum + (row.influencer_social_accounts?.length ?? 0), 0)
    const metricsReady = rows.reduce(
        (sum, row) =>
            sum + (row.influencer_social_accounts ?? []).filter((account) => account.follower_count != null || account.following_count != null).length,
        0
    )

    return (
        <div>
            <BackdropComponent open={loadingActors || creating || updating || isLoadingDeleting} />
            <PageHeader
                title={t('influencers.title')}
                actions={
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
                            onClick={handleGetFollowAll}
                            disabled={!!followBatchId || queueingFollowAll}
                        >
                            {queueingFollowAll || followBatchId ? <Loader2 className="size-4 animate-spin" /> : <Globe2Icon className="size-4" />}
                            {followBatchId ? t('influencers.gettingFollow', { finished: followBatchProgress.finished, total: followBatchProgress.total }) : t('influencers.getFollowAll')}
                        </Button>
                        <Button className="w-full sm:w-auto" onClick={openCreate}>
                            <Plus />
                            {t('influencers.create')}
                        </Button>
                    </div>
                }
            />

            <ActorsSearchBar
                keyword={keyword}
                onKeywordChange={setKeyword}
                onSearch={handleSearch}
                genderFilter={genderFilter}
                onGenderFilterChange={setGenderFilter}
                familyFilter={familyFilter}
                onFamilyFilterChange={setFamilyFilter}
                provinceFilter={provinceFilter}
                onProvinceFilterChange={setProvinceFilter}
                standardPriceFilter={standardPriceFilter}
                onStandardPriceFilterChange={setStandardPriceFilter}
                tagsFilter={tagsFilter}
                onTagsFilterChange={setTagsFilter}
                sourceFilter={sourceFilter}
                onSourceFilterChange={setSourceFilter}
            />

            <ActorsStatsCards totalActors={total.totalItems} pageProfiles={pageProfiles} metricsReady={metricsReady} />

            {/* View mode toggle */}
            <div className="flex items-center justify-end mb-2">
                <TooltipProvider delayDuration={200}>
                    <div role="group" aria-label={t('influencers.displayMode')} className="flex flex-wrap items-center gap-0.5 rounded-xl border bg-muted/30 p-1">
                        {([
                            { mode: 'card' as const, icon: LayoutList, label: t('influencers.viewCard') },
                            { mode: 'grid' as const, icon: LayoutGrid, label: t('influencers.viewGrid') },
                            { mode: 'table' as const, icon: TableProperties, label: t('influencers.viewTable') },
                        ] as const).map(({ mode, icon: Icon, label }) => (
                            <Tooltip key={mode}>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => changeViewMode(mode)}
                                        aria-label={label}
                                        aria-pressed={viewMode === mode}
                                        className={`flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                            viewMode === mode
                                                ? 'bg-background text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <Icon className="size-4" aria-hidden="true" />
                                        <span>{label}</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>{label}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </TooltipProvider>
            </div>
            {viewMode === 'card' && (
                <div className="grid gap-5">
                    {rows.map((actor) => (
                        <ActorCard
                            key={actor.id}
                            actor={actor}
                            onDetail={openDetail}
                            onEdit={openEdit}
                            onSocialAccounts={openSocialAccounts}
                            onDelete={handleDelete}
                            onMetricsUpdated={refetch}
                        />
                    ))}
                    {rows.length === 0 && !loadingActors ? (
                        <Card className="rounded-2xl border-dashed p-12 text-center text-muted-foreground">{t('influencers.empty')}</Card>
                    ) : null}
                </div>
            )}

            {/* Grid view */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {rows.map((actor) => (
                        <ActorGridCard
                            key={actor.id}
                            actor={actor}
                            onDetail={openDetail}
                            onEdit={openEdit}
                            onSocialAccounts={openSocialAccounts}
                            onDelete={handleDelete}
                        />
                    ))}
                    {rows.length === 0 && !loadingActors ? (
                        <Card className="col-span-full rounded-2xl border-dashed p-12 text-center text-muted-foreground">{t('influencers.empty')}</Card>
                    ) : null}
                </div>
            )}

            {/* Table view */}
            {viewMode === 'table' && (
                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead>{t('influencers.title')}</TableHead>
                                <TableHead>{t('common:status')}</TableHead>
                                <TableHead>{t('influencers.socialProfileMetrics')}</TableHead>
                                <TableHead>{t('influencers.followers')}</TableHead>
                                <TableHead>{t('influencers.rateStandard')}</TableHead>
                                <TableHead>{t('influencers.tags')}</TableHead>
                                <TableHead className="text-right">{t('common:actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((actor) => (
                                <ActorTableRow
                                    key={actor.id}
                                    actor={actor}
                                    onDetail={openDetail}
                                    onEdit={openEdit}
                                    onSocialAccounts={openSocialAccounts}
                                    onDelete={handleDelete}
                                />
                            ))}
                            {rows.length === 0 && !loadingActors && (
                                <TableRow>
                                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                        {t('influencers.empty')}
                                    </td>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}

            <PaginationComponent page={page} setPage={setPage} total={total} />

            <ActorFormDialog
                open={open}
                onOpenChange={setOpen}
                actor={editActor}
                form={form}
                onFormChange={setForm}
                onSubmit={handleSubmit}
                isSubmitting={creating || updating}
            />

            <ActorDetailDialog actor={detailActor} open={detailOpen} onOpenChange={setDetailOpen} onEdit={openEdit} onSocialAccounts={openSocialAccounts} />

            <SocialAccountsDialog actor={socialActor} open={socialOpen} onOpenChange={setSocialOpen} onUpdated={refetch} />
        </div>
    )
}

export default ActorsPage
