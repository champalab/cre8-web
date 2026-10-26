import { useTranslation } from 'react-i18next'
import { BarChart3, ExternalLink, Eye, Heart, Pencil, Trash2 } from 'lucide-react'
import { Actor } from '@/stores/services/actorApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Avatar } from '@/components/ui/avatar'
import SafeImage from '@/components/ui/SafeImage'
import { actorStatusClass, formatCount, getActorStatus, PLATFORM_META } from './utils'

interface ActorTableRowProps {
    actor: Actor
    onEdit: (actor: Actor) => void
    onSocialAccounts: (actor: Actor) => void
    onDetail: (actor: Actor) => void
    onDelete: (id: number) => void
}

export const ActorTableRow = ({ actor, onEdit, onSocialAccounts, onDetail, onDelete }: ActorTableRowProps) => {
    const { t } = useTranslation('app')

    const totalFollowers = (actor.influencer_social_accounts ?? []).reduce(
        (sum, acc) => sum + Number(acc.follower_count ?? 0),
        0
    )
    const totalLikes = (actor.influencer_social_accounts ?? []).reduce(
        (sum, acc) => sum + Number(acc.like_count ?? 0),
        0
    )
    const hasLikes = (actor.influencer_social_accounts ?? []).some(
        (acc) => acc.like_count != null && Number(acc.like_count) > 0
    )
    const hasSocial = (actor.influencer_social_accounts ?? []).length > 0

    return (
        <TableRow className="group hover:bg-muted/30 transition-colors">
            {/* Avatar + Name */}
            <TableCell>
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onDetail(actor)}
                >
                    <Avatar className="size-9 shrink-0 overflow-hidden">
                        <SafeImage
                            src={actor.profile_url}
                            alt={actor.name}
                            variant="avatar"
                            fallbackName={actor.name}
                            fallbackSrc="/images/person.jpg"
                            className="h-full w-full object-cover"
                        />
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm truncate max-w-[150px] group-hover:text-primary transition-colors">
                                {actor.name}
                            </p>
                            {actor.profile_url && (
                                <a
                                    href={actor.profile_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex size-5 items-center justify-center rounded text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Open profile in new tab"
                                >
                                    <ExternalLink className="size-3" />
                                </a>
                            )}
                        </div>
                        {actor.social_handle && (
                            <p className="text-[10px] text-muted-foreground">@{actor.social_handle}</p>
                        )}
                    </div>
                </div>
            </TableCell>

            {/* Status */}
            <TableCell>
                <Badge
                    variant="secondary"
                    className={`text-[10px] font-bold uppercase tracking-wider ${actorStatusClass(actor.status)}`}
                >
                    {getActorStatus(actor.status)}
                </Badge>
            </TableCell>

            {/* Platforms */}
            <TableCell>
                <div className="flex gap-1.5">
                    {(Object.keys(PLATFORM_META) as Array<keyof typeof PLATFORM_META>).map((platform) => {
                        const meta = PLATFORM_META[platform]
                        const account = (actor.influencer_social_accounts ?? []).find(
                            (a) => a.platform.toLowerCase() === platform
                        )
                        if (account?.profile_url) {
                            return (
                                <a
                                    key={platform}
                                    href={account.profile_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`inline-flex size-5.5 items-center justify-center rounded-md text-[8px] font-bold shadow-xs transition-all hover:scale-115 active:scale-95 ${meta.iconClass}`}
                                    title={`Open ${meta.label} profile in new tab`}
                                >
                                    {meta.short}
                                </a>
                            )
                        }
                        return (
                            <div
                                key={platform}
                                className={`inline-flex size-5.5 items-center justify-center rounded-md text-[8px] font-bold ${
                                    account ? meta.iconClass : 'bg-muted text-muted-foreground/30'
                                }`}
                                title={meta.label}
                            >
                                {meta.short}
                            </div>
                        )
                    })}
                </div>
            </TableCell>

            {/* Followers */}
            <TableCell className="tabular-nums text-sm">
                {hasSocial ? formatCount(totalFollowers) : '—'}
            </TableCell>

            {/* Likes */}
            <TableCell className="tabular-nums text-sm">
                {hasLikes ? (
                    <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                        <Heart className="size-3 fill-rose-500/20 text-rose-500" />
                        {formatCount(totalLikes)}
                    </span>
                ) : (
                    <span className="text-muted-foreground/60">—</span>
                )}
            </TableCell>

            {/* Price */}
            <TableCell className="tabular-nums text-sm">
                {actor.standard_price ? Number(actor.standard_price).toLocaleString() : '—'}
            </TableCell>

            {/* Tags */}
            <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {(actor.tags ?? []).slice(0, 3).map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[9px] font-normal h-4 px-1.5"
                        >
                            #{tag}
                        </Badge>
                    ))}
                    {(actor.tags ?? []).length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{(actor.tags ?? []).length - 3}</span>
                    )}
                </div>
            </TableCell>

            {/* Actions */}
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                        onClick={() => onDetail(actor)}
                        title={t('influencers.viewDetails')}
                    >
                        <Eye className="size-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                        onClick={() => onSocialAccounts(actor)}
                        title={t('influencers.manageMetrics')}
                    >
                        <BarChart3 className="size-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                        onClick={() => onEdit(actor)}
                        title={t('common:edit')}
                    >
                        <Pencil className="size-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(actor.id)}
                        title={t('common:delete')}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}
