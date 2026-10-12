import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Eye, Pencil, Trash2, CheckCircle2, User2, ExternalLink, Heart } from 'lucide-react'
import { Actor } from '@/stores/services/actorApi'
import SafeImage from '@/components/ui/SafeImage'
import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { actorStatusClass, formatCount, getActorStatus, getFollowerTier, PLATFORM_META } from './utils'

interface ActorGridCardProps {
    actor: Actor
    onEdit: (actor: Actor) => void
    onSocialAccounts: (actor: Actor) => void
    onDetail: (actor: Actor) => void
    onDelete: (id: number) => void
}

export const ActorGridCard = ({ actor, onEdit, onSocialAccounts, onDetail, onDelete }: ActorGridCardProps) => {
    const { t } = useTranslation('app')
    const [imgFailed, setImgFailed] = useState(false)

    const rawPhoto = actor.profile_urls?.[0] || actor.profile_url || null
    const photo = !imgFailed ? rawPhoto : null

    const totalFollowers = (actor.influencer_social_accounts ?? []).reduce((sum, acc) => {
        return sum + Number(acc.follower_count ?? 0)
    }, 0)
    const hasSocialAccounts = (actor.influencer_social_accounts ?? []).length > 0
    const followerTier = hasSocialAccounts ? getFollowerTier(totalFollowers) : null
    const totalLikes = (actor.influencer_social_accounts ?? []).reduce((sum, acc) => {
        return sum + Number(acc.like_count ?? 0)
    }, 0)
    const hasLikes = (actor.influencer_social_accounts ?? []).some((acc) => acc.like_count != null && Number(acc.like_count) > 0)

    return (
        <Card className="group overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
            {/* Photo */}
            <div className="relative aspect-[4/5] w-full cursor-pointer overflow-hidden bg-muted/30" onClick={() => onDetail(actor)}>
                {photo ? (
                    <SafeImage
                        src={photo}
                        alt={actor.name}
                        variant="avatar"
                        fallbackName={actor.name}
                        fallbackSrc="/images/person.jpg"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-950 text-slate-300 p-4 text-center select-none">
                        <div className="relative mb-2 flex items-center justify-center">
                            <div className="size-14 sm:size-16 rounded-full bg-slate-800/80 border border-slate-700/60 shadow-inner flex items-center justify-center">
                                <User2 className="size-7 sm:size-8 text-slate-400/80" />
                            </div>
                        </div>
                        <span className="text-2xl font-black text-slate-100 uppercase tracking-wider">{actor.name.charAt(0).toUpperCase()}</span>
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Status & Tier badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap max-w-[calc(100%-2.5rem)]">
                    <Badge variant="secondary" className={`text-[9px] font-bold uppercase tracking-widest px-2 h-5 backdrop-blur-md shadow-xs ${actorStatusClass(actor.status)}`}>
                        {getActorStatus(actor.status)}
                    </Badge>
                    {followerTier && (
                        <Badge
                            variant="outline"
                            className={`text-[9px] font-bold tracking-wider px-2 h-5 border backdrop-blur-md shadow-xs bg-background/85 ${followerTier.className}`}
                            title={`${followerTier.name} Influencer (${formatCount(totalFollowers)} ${t('influencers.followers')})`}
                        >
                            {followerTier.label}
                        </Badge>
                    )}
                </div>

                {/* Active check */}
                {actor.status === 'ACTIVE' && (
                    <div className="absolute top-2 right-2">
                        <CheckCircle2 className="size-4 text-blue-400 fill-white drop-shadow" />
                    </div>
                )}

                {/* Bottom info */}
                <div className="absolute bottom-0 inset-x-0 p-3 text-white pointer-events-none">
                    <div className="flex items-center justify-between gap-1.5">
                        <p className="font-bold text-sm leading-tight line-clamp-1 drop-shadow-sm">{actor.name}</p>
                        {actor.profile_url && (
                            <a
                                href={actor.profile_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="pointer-events-auto inline-flex size-6 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white/90 hover:text-white transition-all hover:scale-110 active:scale-95 shrink-0 shadow-sm"
                                title="Open profile in new tab"
                            >
                                <ExternalLink className="size-3" />
                            </a>
                        )}
                    </div>
                    {actor.social_handle && <p className="text-white/70 text-[10px] mt-0.5">@{actor.social_handle}</p>}
                    {(actor.influencer_social_accounts ?? []).length > 0 && (
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-white/75 text-[10px] mt-0.5 font-medium">
                            <span>
                                {formatCount(totalFollowers)} {t('influencers.followers')}
                            </span>
                            {hasLikes && (
                                <span className="inline-flex items-center gap-0.5 text-rose-300">
                                    <Heart className="size-2.5 fill-rose-400 text-rose-400" />
                                    {formatCount(totalLikes)} {t('influencers.likes')}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Platform indicators */}
            <CardContent className="p-2">
                <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1.5">
                        {(Object.keys(PLATFORM_META) as Array<keyof typeof PLATFORM_META>).map((platform) => {
                            const meta = PLATFORM_META[platform]
                            const account = (actor.influencer_social_accounts ?? []).find((a) => a.platform.toLowerCase() === platform)
                            if (account?.profile_url) {
                                return (
                                    <a
                                        key={platform}
                                        href={account.profile_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className={`flex size-5.5 items-center justify-center rounded-md text-[8px] font-bold shadow-xs transition-all hover:scale-110 active:scale-95 ${meta.iconClass}`}
                                        title={`Open ${meta.label} profile in new tab`}
                                    >
                                        {meta.short}
                                    </a>
                                )
                            }
                            return (
                                <div
                                    key={platform}
                                    className={`flex size-5.5 items-center justify-center rounded-md text-[8px] font-bold ${
                                        account ? meta.iconClass : 'bg-muted text-muted-foreground/30'
                                    }`}
                                    title={meta.label}
                                >
                                    {meta.short}
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => onDetail(actor)}
                            title={t('influencers.viewDetails')}
                        >
                            <Eye className="size-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => onSocialAccounts(actor)}
                            title={t('influencers.manageMetrics')}
                        >
                            <BarChart3 className="size-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => onEdit(actor)}
                            title={t('common:edit')}
                        >
                            <Pencil className="size-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => onDelete(actor.id)}
                            title={t('common:delete')}
                        >
                            <Trash2 className="size-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
