import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Eye, Heart, Link2, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { Campaign, useGetCampaignInfluencersQuery } from '@/stores/services/campaignApi'
import { useGetPlatformsQuery } from '@/stores/services/platformApi'
import {
    useCreateCampaignPostLinksMutation,
    useDeleteCampaignPostLinkMutation,
    useGetCampaignPostLinksQuery,
    useUpdateCampaignPostLinkMutation
} from '@/stores/services/postLinksApi'
import { inferPlatformFromUrl, inferPostMediaType, validatePostLink, type PostMediaType } from '@/utils/post-url'
import { alertWarning, confirmDelete } from '@/utils/alerts'
import ToastComponent from '@/components/ToastComponent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type DraftLink = {
    key: string
    platform_id: string
    post_url: string
    media_type: PostMediaType | ''
}

const emptyDraft = (): DraftLink => ({
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    platform_id: '',
    post_url: '',
    media_type: ''
})

function normalizePostUrl(url: string) {
    return url.trim().toLowerCase().replace(/\/+$/, '')
}

function fieldErrors(url: string, mediaType: PostMediaType | '') {
    const result = validatePostLink(url, mediaType)
    if (result.ok) return { url: '', media_type: '' }
    return {
        url: result.field === 'url' ? result.error : '',
        media_type: result.field === 'media_type' ? result.error : ''
    }
}

function RadioChip({
    name,
    value,
    checked,
    onChange,
    children
}: {
    name: string
    value: string
    checked: boolean
    onChange: (value: string) => void
    children: ReactNode
}) {
    return (
        <label
            className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                checked ? 'border-primary bg-primary/10 font-medium text-foreground' : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
            )}
        >
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={() => onChange(value)}
                className="size-4 accent-primary"
            />
            {children}
        </label>
    )
}

export function PostLinksDialog({
    campaign,
    open,
    onOpenChange,
    defaultActorId
}: {
    campaign: Campaign | null
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Lock the dialog to this influencer so rows only collect platform + URL. */
    defaultActorId?: number | null
}) {
    const { t } = useTranslation('app')
    const campaignUuid = campaign?.uuid || ''
    const [actorId, setActorId] = useState('')
    const [drafts, setDrafts] = useState<DraftLink[]>([emptyDraft()])
    const [saving, setSaving] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingRows, setPendingRows] = useState<DraftLink[]>([])
    const [editingUuid, setEditingUuid] = useState<string | null>(null)
    const [editPlatformId, setEditPlatformId] = useState('')
    const [editUrl, setEditUrl] = useState('')
    const [editMediaType, setEditMediaType] = useState<PostMediaType | ''>('')

    const { data: platformsRes } = useGetPlatformsQuery(undefined, { skip: !open })
    const platforms = platformsRes?.data ?? []
    const { data: influencersRes } = useGetCampaignInfluencersQuery(campaignUuid, { skip: !open || !campaignUuid })
    const influencers = (influencersRes?.data ?? []).filter((item) => item.status !== 'REJECTED')
    const lockedActorId = defaultActorId ? String(defaultActorId) : ''
    const selectedActorId = lockedActorId || actorId
    const { data: linksRes, isFetching } = useGetCampaignPostLinksQuery(
        {
            campaign_uuid: campaignUuid,
            actor_id: selectedActorId ? Number(selectedActorId) : undefined,
            page: 1,
            limit: 500
        },
        { skip: !open || !campaignUuid }
    )

    const selectedInfluencer = influencers.find((item) => String(item.actor_id) === selectedActorId)

    const existingLinks = useMemo(() => {
        const items = linksRes?.data?.items
        return Array.isArray(items) ? items : []
    }, [linksRes])

    const [createPostLinks] = useCreateCampaignPostLinksMutation()
    const [deletePostLink, { isLoading: deleting }] = useDeleteCampaignPostLinkMutation()
    const [updatePostLink, { isLoading: updating }] = useUpdateCampaignPostLinkMutation()

    useEffect(() => {
        if (!open) return
        setActorId(defaultActorId ? String(defaultActorId) : '')
        setDrafts([emptyDraft()])
        setConfirmOpen(false)
        setPendingRows([])
        setEditingUuid(null)
    }, [open, defaultActorId])

    const platformName = (platformId: string) => platforms.find((p) => String(p.id) === platformId)?.name || ''

    const platformIdFromUrl = (url: string) => {
        const slug = inferPlatformFromUrl(url)
        if (!slug) return ''
        const match = platforms.find((platform) => {
            const name = platform.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
            if (slug === 'facebook') return name === 'facebook' || name === 'fb'
            if (slug === 'tiktok') return name === 'tiktok'
            if (slug === 'instagram') return name === 'instagram' || name === 'ig'
            return name === slug
        })
        return match ? String(match.id) : ''
    }

    const addDraft = () => setDrafts((prev) => [...prev, emptyDraft()])
    const removeDraft = (key: string) => setDrafts((prev) => (prev.length <= 1 ? [emptyDraft()] : prev.filter((row) => row.key !== key)))
    const updateDraft = (key: string, patch: Partial<DraftLink>) => {
        setDrafts((prev) =>
            prev.map((row) => {
                if (row.key !== key) return row
                const next = { ...row, ...patch }
                if (patch.post_url !== undefined) {
                    next.platform_id = platformIdFromUrl(next.post_url)
                }
                return next
            })
        )
    }

    const requestSave = () => {
        if (!campaignUuid) return
        if (!selectedActorId) return alertWarning({ text: t('postLinksDialog.errSelectFirst') })
        const rows = drafts.filter((row) => row.post_url.trim() || row.platform_id || row.media_type)
        if (!rows.length) return alertWarning({ text: t('postLinksDialog.errAddAtLeastOne') })

        const seenUrls = new Set(existingLinks.map((link) => normalizePostUrl(link.post_url)))
        for (const [index, row] of rows.entries()) {
            const check = validatePostLink(row.post_url, row.media_type)
            if (!check.ok) return alertWarning({ text: t('postLinksDialog.errNoMatchPlatform', { row: index + 1 }) })
            const platformId = row.platform_id || platformIdFromUrl(check.url)
            if (!platformId) return alertWarning({ text: t('postLinksDialog.errNoMatchPlatform', { row: index + 1 }) })
            const urlKey = normalizePostUrl(check.url)
            if (seenUrls.has(urlKey)) {
                return alertWarning({ text: t('postLinksDialog.errAlreadySaved', { row: index + 1 }) })
            }
            seenUrls.add(urlKey)
            row.platform_id = platformId
            row.post_url = check.url
        }

        setPendingRows(rows)
        setConfirmOpen(true)
    }

    const handleSave = async () => {
        if (!campaignUuid || !selectedActorId) return
        const rows = pendingRows.length ? pendingRows : drafts.filter((row) => row.post_url.trim())
        if (!rows.length) return
        const payload: Array<{ platform_id: number; post_url: string; media_type: PostMediaType }> = []
        for (const [index, row] of rows.entries()) {
            const check = validatePostLink(row.post_url, row.media_type)
            if (!check.ok) return alertWarning({ text: t('postLinksDialog.errNoMatchPlatform', { row: index + 1 }) })
            const platformId = row.platform_id || platformIdFromUrl(check.url)
            if (!platformId || !row.media_type) {
                return alertWarning({ text: t('postLinksDialog.errNeedPlatformMedia') })
            }
            payload.push({
                platform_id: Number(platformId),
                post_url: check.url,
                media_type: row.media_type
            })
        }

        setSaving(true)
        try {
            await createPostLinks({
                campaign_uuid: campaignUuid,
                actor_id: Number(selectedActorId),
                links: payload
            }).unwrap()
            ToastComponent({ status: 'success', message: t('postLinksDialog.msgSaved', { count: rows.length }) })
            setConfirmOpen(false)
            setPendingRows([])
            setDrafts([emptyDraft()])
        } catch (error: any) {
            alertWarning({ text: error?.message || t('postLinksDialog.errFailedSave') })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (uuid: string) => {
        const confirmed = await confirmDelete({ text: t('postLinksDialog.errRemoveWarning') })
        if (!confirmed.isConfirmed) return
        try {
            const res = await deletePostLink({ campaign_uuid: campaignUuid, uuid }).unwrap()
            ToastComponent(res)
        } catch (error: any) {
            alertWarning({ text: error?.data?.message || t('postLinksDialog.errFailedRemove') })
        }
    }

    const startEdit = (uuid: string, platformId: number, postUrl: string, mediaType?: PostMediaType) => {
        setEditingUuid(uuid)
        setEditPlatformId(String(platformId))
        setEditUrl(postUrl)
        setEditMediaType(mediaType || inferPostMediaType(postUrl, platformName(String(platformId))))
    }

    const handleUpdate = async () => {
        if (!editingUuid) return
        const check = validatePostLink(editUrl, editMediaType)
        if (!check.ok) return alertWarning({ text: check.error })
        const platformId = platformIdFromUrl(check.url) || editPlatformId
        if (!platformId) {
            return alertWarning({ text: t('postLinksDialog.errDomainMustBe') })
        }
        const urlKey = normalizePostUrl(check.url)
        const duplicate = existingLinks.some((link) => link.uuid !== editingUuid && normalizePostUrl(link.post_url) === urlKey)
        if (duplicate) return alertWarning({ text: t('postLinksDialog.errAlreadySavedSingle') })
        if (editMediaType !== 'photo' && editMediaType !== 'video') {
            return alertWarning({ text: t('postLinksDialog.errChooseMedia') })
        }
        try {
            const result = await updatePostLink({
                campaign_uuid: campaignUuid,
                uuid: editingUuid,
                platform_id: Number(platformId),
                post_url: check.url,
                media_type: editMediaType
            }).unwrap()
            ToastComponent(result)
            setEditingUuid(null)
        } catch (error: any) {
            alertWarning({ text: error?.data?.message || t('postLinksDialog.errFailedUpdate') })
        }
    }

    const editErrors = editingUuid ? fieldErrors(editUrl, editMediaType) : { url: '', media_type: '' }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[90vh] w-[min(48rem,calc(100vw-1.5rem))] max-w-3xl flex-col gap-4 overflow-hidden p-6">
                    <DialogHeader className="shrink-0 pr-8">
                        <DialogTitle className="truncate">
                            {t('postLinksDialog.title')}
                            {selectedInfluencer?.actor?.name
                                ? ` — ${selectedInfluencer.actor.name}`
                                : campaign
                                    ? ` — ${campaign.title}`
                                    : ''}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden pr-1">
                        <p className="text-sm text-muted-foreground">
                            {t('postLinksDialog.description')}
                        </p>

                        <div className="grid gap-2 px-2">
                            <Label>{t('postLinksDialog.influencer')}</Label>
                            {lockedActorId ? (
                                <div className="rounded-xl border bg-muted/30 px-3 py-2.5 text-sm font-medium">
                                    {selectedInfluencer?.actor?.name || t('postLinksDialog.selectedInfluencer')}
                                </div>
                            ) : (
                                <Select value={actorId || undefined} onValueChange={setActorId}>
                                    <SelectTrigger className="h-10 bg-background">
                                        <SelectValue placeholder={t('postLinksDialog.selectInfluencer')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {influencers.map((item) => (
                                            <SelectItem key={item.uuid} value={String(item.actor_id)}>
                                                {item.actor?.name || `${t('postLinksDialog.influencer')} #${item.actor_id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {influencers.length === 0 && (
                            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                                {t('postLinksDialog.addInfluencerFirst')}
                            </p>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>{t('postLinksDialog.newLinks')}</Label>
                                <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={addDraft}>
                                    <Plus className="size-3.5" />
                                    {t('postLinksDialog.addAnother')}
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {drafts.map((row, index) => {
                                    const showErrors = Boolean(row.post_url.trim() || row.media_type)
                                    const errors = showErrors ? fieldErrors(row.post_url, row.media_type) : { url: '', media_type: '' }
                                    return (
                                        <div key={row.key} className="space-y-3 rounded-xl border bg-muted/20 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <fieldset className="space-y-1.5">
                                                    <legend className="text-xs font-medium">[{index + 1}] {t('postLinksDialog.mediaType')} </legend>
                                                    <div className="flex flex-wrap gap-2">
                                                        <RadioChip
                                                            name={`media-${row.key}`}
                                                            value="photo"
                                                            checked={row.media_type === 'photo'}
                                                            onChange={(value) => updateDraft(row.key, { media_type: value as PostMediaType })}
                                                        >
                                                            {t('postLinksDialog.photo')}
                                                        </RadioChip>
                                                        <RadioChip
                                                            name={`media-${row.key}`}
                                                            value="video"
                                                            checked={row.media_type === 'video'}
                                                            onChange={(value) => updateDraft(row.key, { media_type: value as PostMediaType })}
                                                        >
                                                            {t('postLinksDialog.video')}
                                                        </RadioChip>
                                                    </div>
                                                    {errors.media_type ? (
                                                        <p className="text-[11px] text-destructive">{errors.media_type}</p>
                                                    ) : null}
                                                </fieldset>
                                                <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => removeDraft(row.key)}>
                                                    <Trash2 className="size-4" />
                                                </Button>

                                            </div>
                                            <div className="grid gap-1.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <Label htmlFor={`url-${row.key}`} className="text-xs">{t('postLinksDialog.postUrl')}</Label>
                                                    {inferPlatformFromUrl(row.post_url) ? (
                                                        <Badge variant="secondary" className="text-[10px] capitalize">
                                                            {inferPlatformFromUrl(row.post_url)}
                                                        </Badge>
                                                    ) : row.post_url.trim() ? (
                                                        <span className="text-[10px] text-destructive">{t('postLinksDialog.unknownDomain')}</span>
                                                    ) : null}
                                                </div>
                                                <Input
                                                    id={`url-${row.key}`}
                                                    className={cn('h-9 bg-background', errors.url && 'border-destructive')}
                                                    placeholder={row.media_type === 'video' ? 'https://www.facebook.com/reel/...' : 'https://www.facebook.com/share/p/...'}
                                                    value={row.post_url}
                                                    onChange={(e) => updateDraft(row.key, { post_url: e.target.value })}
                                                    aria-invalid={Boolean(errors.url)}
                                                />
                                                {errors.url ? <p className="text-[11px] text-destructive">{errors.url}</p> : null}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('postLinksDialog.savedLinks', { count: existingLinks.length })}</Label>
                            {isFetching ? (
                                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="size-3.5 animate-spin" /> {t('postLinksDialog.loadingLinks')}
                                </p>
                            ) : existingLinks.length === 0 ? (
                                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">{t('postLinksDialog.noLinksYet')}</p>
                            ) : (
                                <div className="space-y-2">
                                    {existingLinks.map((link) => (
                                        <div key={link.uuid} className="flex items-start gap-2 overflow-hidden rounded-xl border bg-background p-3">
                                            <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0 flex-1 overflow-hidden">
                                                {editingUuid === link.uuid ? (
                                                    <div className="space-y-3">
                                                        <fieldset className="space-y-1.5">
                                                            <legend className="text-xs font-medium">{t('postLinksDialog.mediaType')}</legend>
                                                            <div className="flex flex-wrap gap-2">
                                                                <RadioChip
                                                                    name={`edit-media-${link.uuid}`}
                                                                    value="photo"
                                                                    checked={editMediaType === 'photo'}
                                                                    onChange={(value) => setEditMediaType(value as PostMediaType)}
                                                                >
                                                                    {t('postLinksDialog.photo')}
                                                                </RadioChip>
                                                                <RadioChip
                                                                    name={`edit-media-${link.uuid}`}
                                                                    value="video"
                                                                    checked={editMediaType === 'video'}
                                                                    onChange={(value) => setEditMediaType(value as PostMediaType)}
                                                                >
                                                                    {t('postLinksDialog.video')}
                                                                </RadioChip>
                                                            </div>
                                                            {editErrors.media_type ? (
                                                                <p className="text-[11px] text-destructive">{editErrors.media_type}</p>
                                                            ) : null}
                                                        </fieldset>
                                                        <div className="grid gap-1.5">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <Label className="text-xs">{t('postLinksDialog.postUrl')}</Label>
                                                                {inferPlatformFromUrl(editUrl) ? (
                                                                    <Badge variant="secondary" className="text-[10px] capitalize">
                                                                        {inferPlatformFromUrl(editUrl)}
                                                                    </Badge>
                                                                ) : editUrl.trim() ? (
                                                                    <span className="text-[10px] text-destructive">{t('postLinksDialog.unknownDomain')}</span>
                                                                ) : null}
                                                            </div>
                                                            <Input
                                                                className={cn('h-8 min-w-0', editErrors.url && 'border-destructive')}
                                                                value={editUrl}
                                                                onChange={(event) => setEditUrl(event.target.value)}
                                                                aria-invalid={Boolean(editErrors.url)}
                                                            />
                                                            {editErrors.url ? <p className="text-[11px] text-destructive">{editErrors.url}</p> : null}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <p className="text-sm font-medium">{link.influencer?.name || 'Influencer'}</p>
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                {link.platform?.name}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-[10px] capitalize">
                                                                {link.media_type || inferPostMediaType(link.post_url, link.platform?.name)}
                                                            </Badge>
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <Eye className="size-3" /> {Number(link.metrics?.views || 0).toLocaleString()}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <Heart className="size-3" /> {Number(link.metrics?.likes || 0).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <a
                                                            href={link.post_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mt-0.5 block max-w-full break-all text-xs text-primary hover:underline"
                                                        >
                                                            {link.post_url}
                                                            <ExternalLink className="ml-1 inline size-3 shrink-0 align-text-bottom" />
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 items-start gap-0.5">
                                                {editingUuid === link.uuid ? (
                                                    <>
                                                        <Button type="button" variant="ghost" size="icon" className="size-8" disabled={updating} onClick={handleUpdate}>
                                                            {updating ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                                        </Button>
                                                        <Button type="button" variant="ghost" size="icon" className="size-8" disabled={updating} onClick={() => setEditingUuid(null)}>
                                                            <X className="size-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => startEdit(link.uuid, link.platform.id, link.post_url, link.media_type)}>
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive"
                                                    disabled={deleting}
                                                    onClick={() => handleDelete(link.uuid)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="shrink-0">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                            {t('postLinksDialog.close')}
                        </Button>
                        <Button onClick={requestSave} disabled={saving || influencers.length === 0 || !selectedActorId}>
                            {t('postLinksDialog.saveLinks')}
                        </Button>
                    </DialogFooter>
                </DialogContent >
            </Dialog >

            <Dialog open={confirmOpen} onOpenChange={(next) => !saving && setConfirmOpen(next)}>
                <DialogContent className="flex max-h-[85vh] w-[min(28rem,calc(100vw-1.5rem))] flex-col gap-4 overflow-hidden">
                    <DialogHeader className="shrink-0 pr-8">
                        <DialogTitle>{t('postLinksDialog.confirmTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden text-sm">
                        <p className="text-muted-foreground">{t('postLinksDialog.confirmDescription')}</p>
                        <div className="rounded-xl border divide-y">
                            <div className="flex justify-between gap-3 px-3 py-2">
                                <span className="text-muted-foreground">{t('postLinksDialog.influencer')}</span>
                                <span className="min-w-0 break-all font-medium text-right">{selectedInfluencer?.actor?.name || '—'}</span>
                            </div>
                            <div className="flex justify-between gap-3 px-3 py-2">
                                <span className="text-muted-foreground">{t('postLinksDialog.postUrl')}</span>
                                <span className="font-medium">{t('postLinksDialog.items', { count: pendingRows.length })}</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            {pendingRows.map((row) => (
                                <div key={row.key} className="rounded-lg border bg-muted/20 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                                        {platformName(row.platform_id) || 'Platform'} · {row.media_type || '—'}
                                    </p>
                                    <p className="break-all text-xs" title={row.post_url}>
                                        {row.post_url}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter className="shrink-0">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={saving}>
                            {t('postLinksDialog.back')}
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {t('postLinksDialog.confirmSave')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
