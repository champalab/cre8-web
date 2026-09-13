import { useTranslation } from 'react-i18next'
import { BarChart3, Eye, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { Actor } from '@/stores/services/actorApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { actorStatusClass, formatCount, getActorStatus, PLATFORM_META } from './utils'

interface ActorGridCardProps {
    actor: Actor
    onEdit: (actor: Actor) => void
    onSocialAccounts: (actor: Actor) => void
    onDetail: (actor: Actor) => void
    onDelete: (id: number) => void
}

export const ActorGridCard = ({ actor, onEdit, onSocialAccounts, onDetail, onDelete }: ActorGridCardProps) => {
    const { t } = useTranslation('app')

    const photo = actor.profile_urls?.[0] || actor.profile_url || null

    const totalFollowers = (actor.influencer_social_accounts ?? []).reduce((sum, acc) => {
        return sum + Number(acc.follower_count ?? 0)
    }, 0)

    return (
        <Card className="group overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
            {/* Photo */}
            <div
                className="relative aspect-[4/5] w-full cursor-pointer overflow-hidden bg-muted/30"
                onClick={() => onDetail(actor)}
            >
                {photo ? (
                    <img
                        src={photo}
                        alt={actor.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/60 to-muted text-muted-foreground/30">
                        <span className="text-5xl font-black">{actor.name.charAt(0).toUpperCase()}</span>
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Status badge */}
                <div className="absolute top-2 left-2">
                    <Badge
                        variant="secondary"
                        className={`text-[9px] font-bold uppercase tracking-widest px-2 h-5 ${actorStatusClass(actor.status)}`}
                    >
                        {getActorStatus(actor.status)}
                    </Badge>
                </div>

                {/* Active check */}
                {actor.status === 'ACTIVE' && (
                    <div className="absolute top-2 right-2">
                        <CheckCircle2 className="size-4 text-blue-400 fill-white drop-shadow" />
                    </div>
                )}

                {/* Bottom info */}
                <div className="absolute bottom-0 inset-x-0 p-3 text-white">
                    <p className="font-bold text-sm leading-tight line-clamp-1">{actor.name}</p>
                    {actor.social_handle && (
                        <p className="text-white/70 text-[10px] mt-0.5">@{actor.social_handle}</p>
                    )}
                    {(actor.influencer_social_accounts ?? []).length > 0 && (
                        <p className="text-white/60 text-[10px] mt-0.5 font-medium">
                            {formatCount(totalFollowers)} {t('influencers.followers')}
                        </p>
                    )}
                </div>
            </div>

            {/* Platform indicators */}
            <CardContent className="p-2">
                <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                        {(Object.keys(PLATFORM_META) as Array<keyof typeof PLATFORM_META>).map((platform) => {
                            const meta = PLATFORM_META[platform]
                            const account = (actor.influencer_social_accounts ?? []).find(
                                (a) => a.platform.toLowerCase() === platform
                            )
                            return (
                                <div
                                    key={platform}
                                    className={`flex size-5 items-center justify-center rounded-md text-[8px] font-bold ${
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
