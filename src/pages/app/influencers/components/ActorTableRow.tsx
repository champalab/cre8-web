import { useTranslation } from 'react-i18next'
import { BarChart3, Eye, Pencil, Trash2 } from 'lucide-react'
import { Actor } from '@/stores/services/actorApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
    const hasSocial = (actor.influencer_social_accounts ?? []).length > 0

    return (
        <TableRow className="group hover:bg-muted/30 transition-colors">
            {/* Avatar + Name */}
            <TableCell>
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onDetail(actor)}
                >
                    <Avatar className="size-9 shrink-0">
                        <AvatarImage src={actor.profile_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {actor.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate max-w-[160px] hover:text-primary transition-colors">
                            {actor.name}
                        </p>
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
                <div className="flex gap-1">
                    {(Object.keys(PLATFORM_META) as Array<keyof typeof PLATFORM_META>).map((platform) => {
                        const meta = PLATFORM_META[platform]
                        const account = (actor.influencer_social_accounts ?? []).find(
                            (a) => a.platform.toLowerCase() === platform
                        )
                        return (
                            <div
                                key={platform}
                                className={`flex size-5 items-center justify-center rounded text-[8px] font-bold ${
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
