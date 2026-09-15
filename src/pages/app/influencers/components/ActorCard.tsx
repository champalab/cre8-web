import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Camera, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, Eye, Globe2Icon, Link2, Loader2, Mail, MoreHorizontal, Pencil, Phone, Trash2, User2 } from 'lucide-react'
import {
    Actor,
    PROFILE_METRIC_PLATFORMS,
    useGetProfileMetricsBatchStatusMutation,
    useRefreshAllInfluencerSocialAccountsMutation
} from '@/stores/services/actorApi'
import ToastComponent from '@/components/ToastComponent'
import SafeImage from '@/components/ui/SafeImage'
import { useGetProvincesQuery } from '@/stores/services/provinceApi'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate } from '@/utils/datetime'
import { actorStatusClass, formatCount, getActorStatus, PLATFORM_META } from './utils'

interface ActorCardProps {
    actor: Actor
    onEdit: (actor: Actor) => void
    onSocialAccounts: (actor: Actor) => void
    onDetail: (actor: Actor) => void
    onDelete: (id: number) => void
    onMetricsUpdated?: () => void
}

const getAge = (dobString: string) => {
    const today = new Date()
    const birthDate = new Date(dobString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }
    return age
}

type FollowerTier = {
    name: string
    label: string
    className: string
}

const getFollowerTier = (totalFollowers: number): FollowerTier => {
    if (totalFollowers >= 1_000_000) {
        return { name: 'Mega', label: '👑 Mega', className: 'bg-amber-500/15 text-amber-600 border-amber-400/40 dark:text-amber-400' }
    } else if (totalFollowers >= 100_000) {
        return { name: 'Macro', label: '🔥 Macro', className: 'bg-purple-500/15 text-purple-600 border-purple-400/40 dark:text-purple-400' }
    } else if (totalFollowers >= 1_000) {
        return { name: 'Micro', label: '⚡ Micro', className: 'bg-blue-500/15 text-blue-600 border-blue-400/40 dark:text-blue-400' }
    } else {
        return { name: 'Nano', label: '🌱 Nano', className: 'bg-green-500/15 text-green-600 border-green-400/40 dark:text-green-400' }
    }
}

export const ActorCard = ({ actor, onEdit, onSocialAccounts, onDetail, onDelete, onMetricsUpdated }: ActorCardProps) => {
    const { t } = useTranslation('app')
    const [refreshAllSocialAccounts, { isLoading: queueingMetrics }] = useRefreshAllInfluencerSocialAccountsMutation()
    const [getMetricsBatchStatus] = useGetProfileMetricsBatchStatusMutation()
    const [metricsBatchId, setMetricsBatchId] = useState<string | null>(null)
    const { data: provincesResponse } = useGetProvincesQuery()
    const provinceName = actor.province_id ? provincesResponse?.data?.find((p) => p.id === actor.province_id)?.nameLao || actor.province_id : null

    const allPhotosRaw = useMemo(() => {
        return actor.profile_urls && actor.profile_urls.length > 0 ? actor.profile_urls : actor.profile_url ? [actor.profile_url] : []
    }, [actor.profile_url, actor.profile_urls])

    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

    const handleImageError = useCallback((url: string) => {
        setFailedImages((prev) => ({ ...prev, [url]: true }))
    }, [])

    const validPhotos = useMemo(() => {
        return allPhotosRaw.filter((url) => url && !failedImages[url])
    }, [allPhotosRaw, failedImages])

    const [activeImageIndex, setActiveImageIndex] = useState(0)
    const mainPhoto = validPhotos[activeImageIndex] || null
    const hasMultiple = validPhotos.length > 1

    const goPrev = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setActiveImageIndex((i) => (i - 1 + validPhotos.length) % validPhotos.length)
    }, [validPhotos.length])

    const goNext = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setActiveImageIndex((i) => (i + 1) % validPhotos.length)
    }, [validPhotos.length])

    const goTo = useCallback((idx: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setActiveImageIndex(idx)
    }, [])

    // Compute total followers across all social accounts (Facebook + TikTok + Instagram) and derive tier
    const totalFollowers = (actor.influencer_social_accounts ?? []).reduce((sum, acc) => {
        const count = typeof acc.follower_count === 'number' ? acc.follower_count : Number(acc.follower_count ?? 0)
        return sum + count
    }, 0)
    const hasSocialAccounts = (actor.influencer_social_accounts ?? []).length > 0
    const followerTier = hasSocialAccounts ? getFollowerTier(totalFollowers) : null
    const fetchableCount = (actor.influencer_social_accounts ?? []).filter((account) => {
        const platform = account.platform.toLowerCase()
        return (
            PROFILE_METRIC_PLATFORMS.includes(platform as (typeof PROFILE_METRIC_PLATFORMS)[number]) &&
            Boolean(account.profile_url?.trim())
        )
    }).length
    const isGettingMetrics = queueingMetrics || Boolean(metricsBatchId)

    const handleGetMetrics = async () => {
        if (!actor.uuid || isGettingMetrics) return
        if (fetchableCount === 0) {
            ToastComponent({ status: 'warning', message: t('influencers.noFetchableProfiles') })
            return
        }
        try {
            const response = await refreshAllSocialAccounts(actor.uuid).unwrap()
            if (!response.data.queued) {
                ToastComponent({ status: 'warning', message: t('influencers.noFetchableProfiles') })
                return
            }
            setMetricsBatchId(response.data.batch_id)
            ToastComponent({
                status: 'success',
                message: t('influencers.metricsQueued', { queued: response.data.queued })
            })
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || t('influencers.metricsQueueFailed')
            })
        }
    }

    useEffect(() => {
        if (!metricsBatchId || !actor.uuid) return

        let cancelled = false
        let checking = false
        const checkStatus = async () => {
            if (checking) return
            checking = true
            try {
                const response = await getMetricsBatchStatus({ uuid: actor.uuid, batchId: metricsBatchId }).unwrap()
                if (cancelled) return
                const status = response.data
                if (status.done) {
                    setMetricsBatchId(null)
                    onMetricsUpdated?.()
                    ToastComponent({
                        status: status.failed > 0 ? 'warning' : 'success',
                        message:
                            status.failed > 0
                                ? t('influencers.followPartial', {
                                    completed: status.completed,
                                    total: status.total,
                                    failed: status.failed
                                })
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
    }, [actor.uuid, getMetricsBatchStatus, metricsBatchId, onMetricsUpdated, t])

    return (
        <Card className="group flex flex-col lg:flex-row overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
            {/* Left Image / Carousel Section (45–50% width on desktop) */}
            <div className="relative flex shrink-0 flex-col lg:w-[38%] xl:w-[35%] bg-muted/10 p-2 sm:p-3">
                <div className="relative overflow-hidden rounded-3xl bg-background" style={{ aspectRatio: '3/4' }}>
                    {/* Background blur glow — transitions with the active photo */}
                    <div
                        className="absolute inset-0 scale-110 blur-3xl opacity-25 saturate-150 pointer-events-none"
                        style={{
                            backgroundImage: mainPhoto ? `url(${mainPhoto})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            transition: 'background-image 0.6s ease',
                        }}
                    />

                    {/* --- Image strip: all valid photos rendered side-by-side, strip slides via translateX --- */}
                    {validPhotos.length > 0 ? (
                        <div
                            className="absolute inset-0 flex"
                            style={{
                                width: `${validPhotos.length * 100}%`,
                                transform: `translateX(-${(activeImageIndex / validPhotos.length) * 100}%)`,
                                transition: 'transform 420ms cubic-bezier(0.4, 0, 0.2, 1)',
                                willChange: 'transform',
                            }}
                            onClick={() => onDetail(actor)}
                        >
                            {validPhotos.map((url, idx) => (
                                <div
                                    key={idx}
                                    className="relative shrink-0 cursor-pointer"
                                    style={{ width: `${100 / validPhotos.length}%` }}
                                >
                                    <SafeImage
                                        src={url}
                                        alt={`${actor.name} ${idx + 1}`}
                                        variant="avatar"
                                        fallbackName={actor.name}
                                        fallbackSrc="/images/person.jpg"
                                        className="h-full w-full object-cover"
                                        draggable={false}
                                        onError={() => handleImageError(url)}
                                    />

                                </div>
                            ))}

                        </div>
                    ) : (
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-950 text-slate-300 cursor-pointer select-none p-6 text-center"
                            onClick={() => onDetail(actor)}
                        >
                            <div className="relative mb-3 flex items-center justify-center">
                                <div className="size-20 sm:size-24 rounded-full bg-slate-800/80 border border-slate-700/60 shadow-inner flex items-center justify-center">
                                    <User2 className="size-10 sm:size-12 text-slate-400/80" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shadow-md">
                                    <Camera className="size-3.5 text-slate-300" />
                                </div>
                            </div>
                            <span className="text-3xl font-black tracking-wider text-slate-100 uppercase opacity-90">
                                {actor.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="mt-1 text-[11px] font-medium text-slate-400">
                                {t('influencers.noPhotosYet')}
                            </span>
                        </div>
                    )}

                    {/* Overlay gradients */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85 pointer-events-none z-10" />

                    {/* Photo counter badge */}
                    {hasMultiple && (
                        <div className="absolute top-3 left-3 z-20 flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-1 text-white text-[10px] font-semibold select-none">
                            <Camera className="size-3" />
                            {activeImageIndex + 1} / {validPhotos.length}
                        </div>
                    )}

                    {/* Prev button */}
                    {hasMultiple && (
                        <button
                            type="button"
                            onClick={goPrev}
                            className="absolute left-3 top-1/2 z-30 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md border border-white/15 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/55 hover:scale-110 active:scale-90 select-none"
                        >
                            <ChevronLeft className="size-5 drop-shadow" />
                        </button>
                    )}

                    {/* Next button */}
                    {hasMultiple && (
                        <button
                            type="button"
                            onClick={goNext}
                            className="absolute right-3 top-1/2 z-30 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md border border-white/15 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/55 hover:scale-110 active:scale-90 select-none"
                        >
                            <ChevronRight className="size-5 drop-shadow" />
                        </button>
                    )}

                    {/* Dot indicators */}
                    {hasMultiple && (
                        <div className="absolute bottom-[4.5rem] inset-x-0 z-20 flex justify-center gap-1.5">
                            {validPhotos.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={(e) => goTo(idx, e)}
                                    className={`rounded-full transition-all duration-300 ease-out ${idx === activeImageIndex
                                        ? 'w-5 h-1.5 bg-white shadow'
                                        : 'size-1.5 bg-white/40 hover:bg-white/70'
                                        }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Bottom Info Overlay */}
                    <div className="absolute inset-x-0 bottom-0 z-20 p-5 pt-14 pointer-events-none">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md">{actor.name}</h2>
                            {actor.status === 'ACTIVE' && <CheckCircle2 className="size-6 text-blue-400 drop-shadow-sm fill-white" />}
                        </div>
                        {actor.social_handle && <p className="text-white/80 font-medium tracking-wide drop-shadow mt-1">@{actor.social_handle}</p>}
                    </div>
                </div>
            </div>


            {/* Right Information Section */}
            <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6 lg:p-8">
                <div>
                    {/* Top Header: Actor Status & Actions */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="secondary"
                                className={`h-7 rounded-full px-3 text-[10px] font-bold uppercase tracking-widest ${actorStatusClass(actor.status)}`}
                            >
                                {getActorStatus(actor.status)}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="h-7 rounded-full border-border/60 px-3 text-[10px] font-bold tracking-widest text-muted-foreground"
                            >
                                {t('influencers.influencerBadge').toUpperCase()}
                            </Badge>
                            {followerTier && (
                                <Badge
                                    variant="outline"
                                    className={`h-7 rounded-full px-3 text-[10px] font-bold tracking-widest border ${followerTier.className}`}
                                >
                                    {followerTier.label}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 rounded-xl px-3 font-medium"
                                onClick={handleGetMetrics}
                                disabled={isGettingMetrics || fetchableCount === 0}
                                title={t('influencers.getAllMetrics')}
                            >
                                {isGettingMetrics ? <Loader2 className="size-3.5 animate-spin" /> : <Globe2Icon className="size-3.5" />}
                                {/* <span className="hidden sm:inline">{isGettingMetrics ? t('influencers.gettingMetrics') : t('influencers.getAllMetrics')}</span> */}
                            </Button>
                            <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-9 rounded-xl hover:bg-primary/5 hover:text-primary"
                                            onClick={() => onSocialAccounts(actor)}
                                        >
                                            <BarChart3 className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('influencers.manageMetrics')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-9 rounded-xl hover:bg-primary/5 hover:text-primary"
                                            onClick={() => onDetail(actor)}
                                        >
                                            <Eye className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('influencers.viewDetails')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Button size="sm" variant="secondary" className="h-9 rounded-xl px-4 font-medium" onClick={() => onEdit(actor)}>
                                <Pencil className="mr-2 size-3.5" />
                                {t('common:edit')}
                            </Button>
                        </div>
                    </div>

                    {/* Tags */}
                    {actor.tags && actor.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-6 -mt-2">
                            {actor.tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="bg-muted/40 text-muted-foreground font-normal text-[10px] px-2 h-5 hover:bg-muted/60"
                                >
                                    #{tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Social Metrics */}
                    <div className="mb-8">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">{t('influencers.socialReach')}</h3>
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                            {(Object.keys(PLATFORM_META) as Array<keyof typeof PLATFORM_META>).map((platform) => {
                                const meta = PLATFORM_META[platform]
                                const account = (actor.influencer_social_accounts ?? []).find((item) => item.platform.toLowerCase() === platform)

                                if (!account) {
                                    return (
                                        <button
                                            key={platform}
                                            type="button"
                                            className="group flex flex-col justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-3 opacity-60 transition-all hover:border-primary/30 hover:bg-primary/5 hover:opacity-100 text-left"
                                            onClick={() => onSocialAccounts(actor)}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className={`flex size-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${meta.iconClass}`}
                                                >
                                                    {meta.short}
                                                </span>
                                                <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary">
                                                    {t('influencers.addPlatform', { platform: meta.label })}
                                                </span>
                                            </div>
                                        </button>
                                    )
                                }


                                return (
                                    <div
                                        key={platform}
                                        className={`relative flex flex-col justify-center rounded-2xl border border-border/40 bg-background p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${meta.panelClass}`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className={`flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold shadow-sm ${meta.iconClass}`}
                                            >
                                                {meta.short}
                                            </span>
                                            <span className="text-xs font-semibold text-muted-foreground">{meta.label}</span>
                                            <div className="ml-auto flex items-center gap-2">
                                                {account.profile_url && (
                                                    <a
                                                        href={account.profile_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground px-3 hover:text-foreground transition-colors"
                                                        title={`Open ${meta.label} profile`}
                                                    >
                                                        <ExternalLink className="size-3.5" />
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => onSocialAccounts(actor)}
                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                    title={`Edit ${meta.label} profile link`}
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">
                                                {formatCount(account.follower_count)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{t('influencers.followers')}</span>
                                        </div>
                                        {account.following_count != null && (
                                            <div className="flex items-baseline gap-1 mt-0.5">
                                                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                                    {formatCount(account.following_count)}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">{t('influencers.following')}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-2xl border border-border/40">
                        {/* Demographics & Contact */}
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                                    <div className="w-1 h-3 bg-blue-500/50 rounded-full" />
                                    {t('influencers.personalLogistics')}
                                </h3>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
                                    {actor.gender && (
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground/70 text-[9px] uppercase">{t('influencers.gender')}</span>{' '}
                                            <span className="font-medium">{actor.gender}</span>
                                        </div>
                                    )}
                                    {actor.date_of_birth && (
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground/70 text-[9px] uppercase">{t('influencers.age')}</span>{' '}
                                            <span className="font-medium">{getAge(actor.date_of_birth)}</span>
                                        </div>
                                    )}
                                    {actor.family_status && (
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground/70 text-[9px] uppercase">{t('influencers.family')}</span>{' '}
                                            <span className="font-medium">{actor.family_status}</span>
                                        </div>
                                    )}
                                    {actor.source && (
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground/70 text-[9px] uppercase">{t('influencers.source')}</span>{' '}
                                            <span className="font-medium">{actor.source}</span>
                                        </div>
                                    )}
                                    {actor.province_id && (
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground/70 text-[9px] uppercase">{t('influencers.province')}</span>{' '}
                                            <span className="font-medium">{provinceName}</span>
                                        </div>
                                    )}
                                    {actor.code && (
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground/70 text-[9px] uppercase">{t('influencers.code')}</span>{' '}
                                            <span className="font-mono text-primary/80">{actor.code}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(actor.email || actor.phone_number || actor.address_express) && (
                                <div className="space-y-2">
                                    {actor.email && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <Mail className="size-3.5 text-muted-foreground" />
                                            <span className="font-medium truncate">{actor.email}</span>
                                        </div>
                                    )}
                                    {actor.phone_number && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <Phone className="size-3.5 text-muted-foreground" />
                                            <a href={`tel:${actor.phone_number}`} className="font-medium truncate hover:text-primary hover:underline">
                                                {actor.phone_number}
                                            </a>
                                        </div>
                                    )}
                                    {actor.address_express && (
                                        <div className="flex items-start gap-2 text-xs">
                                            <div className="mt-0.5 text-muted-foreground leading-none">📍</div>
                                            <span className="font-medium text-muted-foreground line-clamp-2">{actor.address_express}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Commercial */}
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                                    <div className="w-1 h-3 bg-emerald-500/50 rounded-full" />
                                    {t('influencers.ratesFees')}
                                </h3>
                                <div className="space-y-1.5 text-xs">
                                    {actor.standard_price ? (
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">{t('influencers.rateStandard')}</span>
                                            <span className="font-bold tabular-nums">{Number(actor.standard_price).toLocaleString()}</span>
                                        </div>
                                    ) : null}
                                    {actor.price_photo ? (
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">{t('influencers.ratePhoto')}</span>
                                            <span className="font-bold tabular-nums">{Number(actor.price_photo).toLocaleString()}</span>
                                        </div>
                                    ) : null}
                                    {actor.price_video ? (
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">{t('influencers.rateVideo')}</span>
                                            <span className="font-bold tabular-nums">{Number(actor.price_video).toLocaleString()}</span>
                                        </div>
                                    ) : null}
                                    {actor.price_video_photo ? (
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">{t('influencers.rateVideoPhoto')}</span>
                                            <span className="font-bold tabular-nums">{Number(actor.price_video_photo).toLocaleString()}</span>
                                        </div>
                                    ) : null}

                                    {(actor.client_repost_allowed || actor.client_repost_additional_charge != null) && (
                                        <div className="flex justify-between items-center pt-1 border-t border-border/40 mt-1">
                                            <span className="text-muted-foreground">{t('influencers.clientRepost')}</span>
                                            <span className="font-medium">
                                                {actor.client_repost_allowed
                                                    ? actor.client_repost_additional_charge
                                                        ? `+${Number(actor.client_repost_additional_charge).toLocaleString()}`
                                                        : t('influencers.repostAllowed')
                                                    : t('influencers.repostNo')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {!actor.standard_price && !actor.price_photo && !actor.price_video && !actor.price_video_photo && (
                                    <div className="text-xs text-muted-foreground/50 italic">{t('influencers.noRates')}</div>
                                )}
                            </div>

                            {(actor.bank_account_name || actor.bank_account_number) && (
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('influencers.bankAccount')}</h3>
                                    <div className="text-xs">
                                        {actor.bank_account_name && <div className="font-semibold text-foreground">{actor.bank_account_name}</div>}
                                        {actor.bank_account_number && (
                                            <div className="font-mono text-muted-foreground mt-0.5 tracking-wider">{actor.bank_account_number}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-5">
                    <div className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">{t('influencers.addedOn', { date: formatDate(actor.created_at) })}</div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                            <DropdownMenuItem onClick={() => onEdit(actor)} className="rounded-lg cursor-pointer">
                                <Pencil className="mr-2 size-4 text-muted-foreground" />
                                <span className="font-medium">{t('influencers.editProfile')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSocialAccounts(actor)} className="rounded-lg cursor-pointer">
                                <BarChart3 className="mr-2 size-4 text-muted-foreground" />
                                <span className="font-medium">{t('influencers.updateMetrics')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem
                                onClick={() => onDelete(actor.id)}
                                className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                                <Trash2 className="mr-2 size-4" />
                                <span className="font-medium">{t('influencers.deleteActor')}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </Card>
    )
}
