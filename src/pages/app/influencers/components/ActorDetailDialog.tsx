import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    BarChart3,
    ExternalLink,
    ImageOff,
    Link2,
    Mail,
    Pencil,
    Phone,
    User,
    UserPlus,
    Users,
} from 'lucide-react'

import { Actor, useGetActorByIdQuery } from '@/stores/services/actorApi'
import BackdropComponent from '@/components/BackdropComponent'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { formatDate, formatDateTime } from '@/utils/datetime'

const formatFollowers = (value: string | number | null | undefined) => {
    if (value == null || value === '') return '—'
    const num = Number(value)
    if (Number.isNaN(num)) return `${value}`
    return num.toLocaleString()
}

const getActorStatus = (status?: string | null) =>
    status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'

const actorStatusClass = (status?: string | null) =>
    getActorStatus(status) === 'ACTIVE'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        : 'border-slate-400/30 bg-slate-500/10 text-slate-600 dark:text-slate-400'

type Props = {
    actor: Actor | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit?: (actor: Actor) => void
    onSocialAccounts?: (actor: Actor) => void
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="text-sm text-foreground">{value}</div>
        </div>
    )
}

function GalleryImageItem({ url, index }: { url: string; index: number }) {
    const [hasError, setHasError] = useState(false)

    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 transition-all hover:border-primary/40 hover:opacity-90 sm:h-32 sm:w-32"
        >
            {hasError ? (
                <div className="flex flex-col items-center justify-center gap-1 p-2 text-center text-muted-foreground">
                    <ImageOff className="size-6 text-muted-foreground/50 sm:size-8" />
                    <span className="text-[10px] sm:text-xs">Failed to load</span>
                </div>
            ) : (
                <img
                    src={url}
                    alt={`Profile ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => setHasError(true)}
                />
            )}
        </a>
    )
}


export function ActorDetailDialog({ actor, open, onOpenChange, onEdit, onSocialAccounts }: Props) {
    const { t } = useTranslation('app')
    const { data, isLoading, isFetching } = useGetActorByIdQuery(actor?.id ?? 0, {
        skip: !open || !actor?.id,
    })

    const detail: Actor | null = data?.data ?? actor
    const socialAccounts = detail?.influencer_social_accounts ?? []
    const hasFollowerData = socialAccounts.some((account) => account.follower_count != null)
    const hasFollowingData = socialAccounts.some((account) => account.following_count != null)
    const totalFollowers = socialAccounts.reduce(
        (sum, account) => sum + Number(account.follower_count || 0),
        0
    )
    const totalFollowing = socialAccounts.reduce(
        (sum, account) => sum + Number(account.following_count || 0),
        0
    )

    return (
        <>
            <BackdropComponent open={isLoading || isFetching} />

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-4xl overflow-y-auto p-0 sm:w-full">
                    <DialogHeader>
                        <DialogTitle className="sr-only">{t('influencers.profileTitle')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {t('influencers.profileInformation')}
                        </DialogDescription>
                    </DialogHeader>

                    {detail && (
                        <div className="space-y-5 pb-5">
                            <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/20 via-primary/5 to-background px-5 pb-6 pt-8 sm:px-7">
                                <div className="absolute -right-16 -top-20 size-52 rounded-full bg-primary/10 blur-3xl" />
                                <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                                    <Avatar className="size-24 border-4 border-background shadow-lg">
                                        <AvatarImage src={detail.profile_url || undefined} />
                                        <AvatarFallback className="bg-primary text-3xl text-primary-foreground">
                                            {detail.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-center sm:text-left">
                                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                                            {t('influencers.profileTitle')}
                                        </p>
                                        <h2 className="text-2xl font-bold tracking-tight">{detail.name}</h2>
                                        <p className="mt-1 break-all text-xs text-muted-foreground">
                                            Actor #{detail.id} · {detail.uuid}
                                        </p>
                                        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                                            <Badge
                                                variant="outline"
                                                className={`font-bold uppercase ${actorStatusClass(detail.status)}`}
                                            >
                                                {getActorStatus(detail.status)}
                                            </Badge>
                                            <Badge variant={detail.users ? 'default' : 'outline'}>
                                                {detail.users ? t('influencers.loginStatus', { status: detail.users.status }) : t('influencers.noUserAccount')}
                                            </Badge>
                                            <Badge variant="outline">
                                                {t('influencers.linkedPlatforms', { count: socialAccounts.length })}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="-mt-2 grid grid-cols-3 gap-2 px-4 sm:gap-3 sm:px-6">
                                <Card className="border-primary/15 bg-gradient-to-br from-primary/10 to-background">
                                    <CardContent className="p-3 sm:p-4">
                                        <BarChart3 className="mb-2 size-5 text-primary" />
                                        <p className="text-[11px] text-muted-foreground sm:text-xs">{t('influencers.platforms')}</p>
                                        <p className="text-xl font-bold tabular-nums sm:text-2xl">
                                            {socialAccounts.length}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="border-sky-500/15 bg-gradient-to-br from-sky-500/10 to-background">
                                    <CardContent className="p-3 sm:p-4">
                                        <Users className="mb-2 size-5 text-sky-600" />
                                        <p className="text-[11px] text-muted-foreground sm:text-xs">{t('influencers.followers')}</p>
                                        <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">
                                            {hasFollowerData ? formatFollowers(totalFollowers) : '—'}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="border-violet-500/15 bg-gradient-to-br from-violet-500/10 to-background">
                                    <CardContent className="p-3 sm:p-4">
                                        <UserPlus className="mb-2 size-5 text-violet-600" />
                                        <p className="text-[11px] text-muted-foreground sm:text-xs">{t('influencers.following')}</p>
                                        <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">
                                            {hasFollowingData ? formatFollowers(totalFollowing) : '—'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="mx-4 sm:mx-6">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">{t('influencers.profileInformation')}</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <DetailField
                                        label={t('common:email')}
                                        value={
                                            detail.email ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <Mail className="size-4 text-muted-foreground" />
                                                    {detail.email}
                                                </span>
                                            ) : (
                                                '—'
                                            )
                                        }
                                    />
                                    <DetailField
                                        label={t('common:phone')}
                                        value={
                                            detail.phone_number ? (
                                                <a
                                                    href={`tel:${detail.phone_number}`}
                                                    className="inline-flex items-center gap-2 text-primary hover:underline"
                                                >
                                                    <Phone className="size-4" />
                                                    {detail.phone_number}
                                                </a>
                                            ) : (
                                                '—'
                                            )
                                        }
                                    />
                                    <DetailField
                                        label={t('influencers.profileUrlLabel')}
                                        value={
                                            detail.profile_url ? (
                                                <a
                                                    href={detail.profile_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 text-primary hover:underline"
                                                >
                                                    <ExternalLink className="size-4" />
                                                    {t('influencers.openProfile')}
                                                </a>
                                            ) : (
                                                '—'
                                            )
                                        }
                                    />
                                    <DetailField
                                        label={t('influencers.statusLabel')}
                                        value={
                                            <Badge
                                                variant="outline"
                                                className={`font-bold uppercase ${actorStatusClass(detail.status)}`}
                                            >
                                                {getActorStatus(detail.status)}
                                            </Badge>
                                        }
                                    />
                                    <DetailField label={t('influencers.actorId')} value={detail.id} />
                                    <DetailField label={t('influencers.createdAt')} value={formatDate(detail.created_at)} />
                                    <DetailField label={t('influencers.updatedAt')} value={formatDate(detail.updated_at)} />
                                </CardContent>
                            </Card>

                            {detail.profile_urls && detail.profile_urls.length > 0 && (
                                <Card className="mx-4 sm:mx-6">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">{t('influencers.photoGallery')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-4">
                                            {detail.profile_urls.map((url, i) => (
                                                <GalleryImageItem key={`${url}-${i}`} url={url} index={i} />
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}


                            {detail.users && (
                                <Card className="mx-4 sm:mx-6">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <User className="size-4" />
                                            {t('influencers.userAccount')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-3 sm:grid-cols-2">
                                        <DetailField label={t('influencers.roleLabel')} value={detail.users.role} />
                                        <DetailField label={t('influencers.statusLabel')} value={detail.users.status} />
                                        <DetailField label={t('influencers.userEmail')} value={detail.users.email || '—'} />
                                        <DetailField label={t('influencers.userUuid')} value={detail.users.uuid} />
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="mx-4 overflow-hidden border-primary/15 sm:mx-6">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Link2 className="size-4" />
                                        </span>
                                        {t('influencers.socialProfileMetrics')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 pb-4">
                                    {socialAccounts.length > 0 ? (
                                        <>
                                            <div className="grid gap-3 px-4 sm:grid-cols-2 lg:grid-cols-3">
                                                {socialAccounts.map((account) => (
                                                    <div
                                                        key={account.uuid}
                                                        className="overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex min-w-0 items-center gap-2">
                                                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold uppercase text-primary">
                                                                    {account.platform.slice(0, 2)}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold capitalize">
                                                                        {account.platform}
                                                                    </p>
                                                                    <p className="truncate text-xs text-muted-foreground">
                                                                        {account.handle || t('influencers.noHandle')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                                            <div className="rounded-lg bg-background/80 p-2.5">
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('influencers.followers')}
                                                                </p>
                                                                <p className="mt-1 text-lg font-bold tabular-nums">
                                                                    {formatFollowers(account.follower_count)}
                                                                </p>
                                                            </div>
                                                            <div className="rounded-lg bg-background/80 p-2.5">
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('influencers.following')}
                                                                </p>
                                                                <p className="mt-1 text-lg font-bold tabular-nums">
                                                                    {formatFollowers(account.following_count)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="mt-3 text-[11px] text-muted-foreground">
                                                            {t('influencers.syncedAt', { date: formatDateTime(account.last_scraped_at) })}
                                                        </p>
                                                        {account.last_error_code ? (
                                                            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
                                                                <p className="text-[11px] font-semibold uppercase text-amber-700 dark:text-amber-400">
                                                                    {account.last_error_code}
                                                                </p>
                                                                {account.last_error_message ? (
                                                                    <p className="mt-1 text-[11px] text-amber-800/90 dark:text-amber-300/90">
                                                                        {account.last_error_message}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        ) : null}
                                                        {account.profile_url ? (
                                                            <a
                                                                href={account.profile_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="mt-2 inline-flex items-center gap-1 break-all text-xs text-primary hover:underline"
                                                            >
                                                                <ExternalLink className="size-3" />
                                                                {t('influencers.profileLink')}
                                                            </a>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="hidden">
                                                <Table className="min-w-[560px]">
                                                    <TableHeader>
                                                        <TableRow>
                                                            {[
                                                                'Platform',
                                                                'Handle',
                                                                'Followers',
                                                                'Following',
                                                                'Status',
                                                            ].map((header) => (
                                                                <TableHead key={header}>{header}</TableHead>
                                                            ))}
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {socialAccounts.map((account) => (
                                                            <TableRow key={account.uuid}>
                                                                <TableCell className="font-medium capitalize">
                                                                    {account.platform}
                                                                </TableCell>
                                                                <TableCell>{account.handle || '—'}</TableCell>
                                                                <TableCell className="tabular-nums">
                                                                    {formatFollowers(account.follower_count)}
                                                                </TableCell>
                                                                <TableCell className="tabular-nums">
                                                                    {formatFollowers(account.following_count)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant={
                                                                            account.status === 'ACTIVE'
                                                                                ? 'default'
                                                                                : 'secondary'
                                                                        }
                                                                    >
                                                                        {account.status}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="px-6 text-sm text-muted-foreground">
                                            {t('influencers.noSocialAccounts')}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <DialogFooter className="gap-2 px-4 pb-5 sm:px-6">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            {t('common:close')}
                        </Button>
                        {detail && onSocialAccounts ? (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onOpenChange(false)
                                    onSocialAccounts(detail)
                                }}
                            >
                                <Link2 className="size-4" />
                                {t('influencers.socialAccounts')}
                            </Button>
                        ) : null}
                        {detail && onEdit ? (
                            <Button
                                onClick={() => {
                                    onOpenChange(false)
                                    onEdit(detail)
                                }}
                            >
                                <Pencil className="size-4" />
                                {t('common:edit')}
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
