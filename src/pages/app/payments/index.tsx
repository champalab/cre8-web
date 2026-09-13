import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Banknote,
    CircleCheck,
    Copy,
    Check,
    Clock3,
    Camera,
    ExternalLink,
    FileText,
    History,
    Loader2,
    LayoutGrid,
    Table2,
    Trash2,
    Wallet,
    X
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RootState } from '@/stores'
import { isADMINRole } from '@/config/roles'
import {
    PaymentFile,
    PayoutRow,
    PayoutStatus,
    useCreateInfluencerPaymentMutation,
    useDeleteInfluencerPaymentMutation,
    useGetCampaignPayoutsQuery,
    useGetPayableCampaignsQuery
} from '@/stores/services/paymentApi'
import { useConfirmUploadMutation, usePresignUploadMutation } from '@/stores/services/filesApi'
import { alertError, alertWarning, confirmDelete } from '@/utils/alerts'
import i18n from '@/i18n'
import { getMutationPayload, isMutationSuccess } from '@/utils/mutation-response'
import ToastComponent from '@/components/ToastComponent'
import env from '@/env'

const PAYMENT_VIEW_KEY = 'payments:display-mode'
type PaymentView = 'table' | 'cards'

type SortKey = 'name' | 'due' | 'paid' | 'remaining' | 'status' | 'last_paid_at'

const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount == null || amount === '') return '—'
    const num = Number(amount)
    if (Number.isNaN(num)) return '—'
    return `${num.toLocaleString('en-US')} LAK`
}

const parseAmountInput = (value: string) => value.replace(/,/g, '').trim()

const formatAmountInput = (value: string) => {
    if (!value) return ''
    const [whole, fraction] = parseAmountInput(value).split('.')
    if (!/^\d+$/.test(whole)) return value
    const grouped = Number(whole).toLocaleString('en-US')
    if (fraction == null) return grouped
    return `${grouped}.${fraction.slice(0, 2)}`
}

const todayInput = () => new Date().toISOString().slice(0, 10)

const statusBadge = (status: PayoutStatus) => {
    if (status === 'PAID') return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">{i18n.t('status.paid', { ns: 'app' })}</Badge>
    if (status === 'PARTIAL') return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">{i18n.t('status.partial', { ns: 'app' })}</Badge>
    return <Badge variant="secondary">{i18n.t('status.unpaid', { ns: 'app' })}</Badge>
}

const isPdfFile = (file: { mime_type?: string | null; original_name?: string | null }) =>
    file.mime_type === 'application/pdf' || (file.original_name || '').toLowerCase().endsWith('.pdf')

const isImageFile = (file: { mime_type?: string | null }) => Boolean(file.mime_type?.startsWith('image/'))

const formatFileSize = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const API_PATH = `${env.VITE_APP_API_PATH || ''}`.trim().replace(/\/$/, '')

/** Path prefix the API is mounted on, e.g. `/influencer`. */
const apiBasePath = (() => {
    try {
        if (API_PATH.includes('://')) return new URL(API_PATH).pathname.replace(/\/$/, '')
    } catch {
        /* fall through */
    }
    return API_PATH.startsWith('/') ? API_PATH : ''
})()

/** Keep API URLs same-origin so the dev proxy and session cookies still apply. */
function resolveUploadUrl(url: string) {
    if (!url) return ''
    const trimmed = url.trim()
    if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed)
            const apiOrigin = API_PATH.includes('://') ? new URL(API_PATH).origin : ''
            if (apiOrigin && parsed.origin !== apiOrigin) return trimmed
            return `${parsed.pathname}${parsed.search}`
        } catch {
            return trimmed
        }
    }

    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

/** Stored files may come back as a full URL, an `/uploads/...` path, or a bare storage key. */
function resolveFileUrl(url: string) {
    const resolved = resolveUploadUrl(url)
    if (!resolved || /^(https?:|blob:|data:)/i.test(resolved)) return resolved
    if (resolved.includes('/uploads/')) return resolved
    return `${apiBasePath}/uploads/${resolved.replace(/^\//, '')}`
}

const CopyBankAccount = ({ number }: { number?: string | null }) => {
    const { t } = useTranslation('app')
    const [copied, setCopied] = useState(false)
    const [copying, setCopying] = useState(false)
    const [failed, setFailed] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        setCopied(false)
        setFailed(false)
        return () => { if (timer.current) clearTimeout(timer.current) }
    }, [number])

    const copy = async () => {
        if (!number || copying) return
        setCopying(true)
        setFailed(false)
        try {
            await navigator.clipboard.writeText(number)
            setCopied(true)
            if (timer.current) clearTimeout(timer.current)
            timer.current = setTimeout(() => setCopied(false), 2000)
        } catch {
            setCopied(false)
            setFailed(true)
        } finally {
            setCopying(false)
        }
    }

    return (
        <div>
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="break-all font-mono text-muted-foreground">{number || '—'}</span>
                {number && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={copy} disabled={copying}
                        aria-label={t('payments.copyBankAccount')} title={t('payments.copyBankAccount')}>
                        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                        <span role="status">{t(copied ? 'payments.accountCopied' : 'payments.copyAccount')}</span>
                    </Button>
                )}
            </div>
            {failed && <p role="alert" className="text-xs text-destructive">{t('payments.copyAccountFailed')}</p>}
        </div>
    )
}

const PaymentsPage = () => {
    const { t } = useTranslation('app')
    const auth = useSelector((state: RootState) => state.auth)
    const canDelete = isADMINRole(auth.role)
    const [searchParams, setSearchParams] = useSearchParams()
    const campaignUuid = searchParams.get('campaign') || ''
    const [viewMode, setViewMode] = useState<PaymentView>(() => {
        try { return localStorage.getItem(PAYMENT_VIEW_KEY) === 'cards' ? 'cards' : 'table' }
        catch { return 'table' }
    })
    const changeViewMode = (mode: PaymentView) => {
        setViewMode(mode)
        try { localStorage.setItem(PAYMENT_VIEW_KEY, mode) } catch { /* Storage may be unavailable. */ }
    }
    const [sort, setSort] = useState<SortKey>('name')
    const [order, setOrder] = useState<'asc' | 'desc'>('asc')
    const [recordRow, setRecordRow] = useState<PayoutRow | null>(null)
    const [historyRow, setHistoryRow] = useState<PayoutRow | null>(null)
    const [previewFile, setPreviewFile] = useState<PaymentFile | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [paidAt, setPaidAt] = useState(todayInput())
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')
    const [proofFiles, setProofFiles] = useState<File[]>([])
    const [previewUrls, setPreviewUrls] = useState<string[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { data: campaignsData, isLoading: loadingCampaigns } = useGetPayableCampaignsQuery()
    const campaigns = Array.isArray(campaignsData?.data) ? campaignsData.data : []
    const { currentData: payoutsData, isFetching } = useGetCampaignPayoutsQuery(
        { campaign_uuid: campaignUuid, sort, order },
        { skip: !campaignUuid }
    )
    const payouts = payoutsData?.data
    const payoutItems = Array.isArray(payouts?.items) ? payouts.items : []
    const [createPayment, { isLoading: isSaving }] = useCreateInfluencerPaymentMutation()
    const [deletePayment, { isLoading: isDeleting }] = useDeleteInfluencerPaymentMutation()
    const [presignUpload] = usePresignUploadMutation()
    const [confirmUpload] = useConfirmUploadMutation()

    const summary = payouts?.summary
    const dueAmount = Number(summary?.due ?? 0)
    const percentageOfDue = (amount: number | undefined) =>
        dueAmount > 0 && amount != null && Number.isFinite(Number(amount))
            ? Number(amount) / dueAmount * 100
            : null
    const summaryCards = [
        { key: 'amountDue', amount: summary?.due, percent: percentageOfDue(summary?.due), icon: Wallet,
            color: 'text-indigo-600 dark:text-indigo-300', surface: 'from-indigo-500/10 to-indigo-500/[0.02] border-indigo-500/20', iconBg: 'bg-indigo-500/15', bar: 'bg-indigo-500' },
        { key: 'paid', amount: summary?.paid, percent: percentageOfDue(summary?.paid), icon: CircleCheck,
            color: 'text-emerald-600 dark:text-emerald-300', surface: 'from-emerald-500/10 to-emerald-500/[0.02] border-emerald-500/20', iconBg: 'bg-emerald-500/15', bar: 'bg-emerald-500' },
        { key: 'remaining', amount: summary?.remaining, percent: percentageOfDue(summary?.remaining), icon: Clock3,
            color: 'text-amber-600 dark:text-amber-300', surface: 'from-amber-500/10 to-amber-500/[0.02] border-amber-500/20', iconBg: 'bg-amber-500/15', bar: 'bg-amber-500' },
    ]

    const toggleSort = (key: SortKey) => {
        if (sort === key) setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        else {
            setSort(key)
            setOrder(key === 'name' ? 'asc' : 'desc')
        }
    }

    const SortHead = ({ field, children, className }: { field: SortKey; children: string; className?: string }) => (
        <TableHead className={className}>
            <button type="button" className="inline-flex items-center gap-1 font-semibold" onClick={() => toggleSort(field)}>
                {children}
                {sort === field ? (
                    order === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
                ) : (
                    <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
                )}
            </button>
        </TableHead>
    )

    const openRecord = (row: PayoutRow) => {
        setRecordRow(row)
        setAmount(row.remaining ? String(row.remaining) : '')
        setPaidAt(todayInput())
        setReference('')
        setNotes('')
        setProofFiles([])
        setConfirmOpen(false)
    }

    useEffect(() => {
        const urls = proofFiles.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : ''))
        setPreviewUrls(urls)
        return () => {
            urls.forEach((url) => {
                if (url) URL.revokeObjectURL(url)
            })
        }
    }, [proofFiles])

    const addProofFiles = (list: FileList | File[]) => {
        const next = Array.from(list).filter((file) => file.type.startsWith('image/') || file.type === 'application/pdf')
        if (!next.length) return alertWarning({ text: t('payments.attachSlip') })
        setProofFiles((prev) => [...prev, ...next])
    }

    const removeProofFile = (index: number) => {
        setProofFiles((prev) => prev.filter((_, idx) => idx !== index))
    }

    const uploadProofs = async () => {
        const ids: number[] = []
        for (const file of proofFiles) {
            const presignRes = await presignUpload({
                original_name: file.name,
                mime_type: file.type,
                file_size: file.size
            })
            const presign = getMutationPayload(presignRes)
            if (!isMutationSuccess(presign) || !presign?.data?.upload_url) {
                throw new Error(presign?.message || 'Presign failed')
            }
            const uploadResponse = await fetch(resolveUploadUrl(presign.data.upload_url), {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
                credentials: 'include'
            })
            if (!uploadResponse.ok) throw new Error('Upload to storage failed')
            const confirmRes = await confirmUpload({
                storage_key: presign.data.storage_key,
                original_name: file.name,
                mime_type: file.type,
                file_size: file.size
            })
            const confirmed = getMutationPayload(confirmRes)
            if (!isMutationSuccess(confirmed) || !confirmed?.data?.id) {
                throw new Error(confirmed?.message || 'Confirm upload failed')
            }
            ids.push(confirmed.data.id)
        }
        return ids
    }

    const requestSubmitPayment = () => {
        if (!recordRow) return
        const numericAmount = Number(parseAmountInput(amount))
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return alertWarning({ text: t('payments.enterAmount') })
        }
        if (numericAmount > recordRow.remaining) {
            return alertWarning({ text: t('payments.amountExceeds', { amount: formatCurrency(recordRow.remaining) }) })
        }
        setConfirmOpen(true)
    }

    const submitPayment = async () => {
        if (!recordRow) return
        const numericAmount = Number(parseAmountInput(amount))
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return alertWarning({ text: t('payments.enterAmount') })
        }
        if (numericAmount > recordRow.remaining) {
            return alertWarning({ text: t('payments.amountExceeds', { amount: formatCurrency(recordRow.remaining) }) })
        }
        try {
            const file_ids = proofFiles.length ? await uploadProofs() : []
            const res = await createPayment({
                campaign_influencer_uuid: recordRow.uuid,
                amount: numericAmount,
                paid_at: paidAt ? new Date(`${paidAt}T12:00:00`).toISOString() : undefined,
                reference: reference.trim() || undefined,
                notes: notes.trim() || undefined,
                file_ids
            }).unwrap()
            ToastComponent(res)
            setConfirmOpen(false)
            setRecordRow(null)
        } catch (error: any) {
            alertError({ text: error?.data?.message || error?.data?.error || error?.message || t('payments.recordFailed') })
        }
    }

    const removePayment = async (uuid: string) => {
        const confirmed = await confirmDelete({ text: t('payments.deleteText') })
        if (!confirmed.isConfirmed) return
        try {
            const res = await deletePayment(uuid).unwrap()
            ToastComponent(res)
            setHistoryRow((row) =>
                row ? { ...row, payments: (row.payments || []).filter((item) => item.uuid !== uuid) } : row
            )
        } catch (error: any) {
            alertError({ text: error?.data?.message || error?.message || t('payments.deleteFailed') })
        }
    }

    const selectedCampaignLabel = useMemo(() => {
        const found = campaigns.find((c) => c.uuid === campaignUuid)
        return found ? found.title : ''
    }, [campaigns, campaignUuid])

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('payments.title')}
                description={t('payments.description')}
            />

            <div className="max-w-xl">
                <Label className="mb-2 block">{t('payments.campaign')}</Label>
                <Select
                    value={campaignUuid || undefined}
                    onValueChange={(value) => setSearchParams({ campaign: value })}
                    disabled={loadingCampaigns}
                >
                    <SelectTrigger className="bg-background">
                        <SelectValue placeholder={loadingCampaigns ? t('payments.loadingCampaigns') : t('payments.selectCampaign')} />
                    </SelectTrigger>
                    <SelectContent>
                        {campaigns.map((campaign) => (
                            <SelectItem key={campaign.uuid} value={campaign.uuid}>
                                {campaign.title}
                                {campaign.campaign_code ? ` (${campaign.campaign_code})` : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
                {viewMode === 'cards' && campaignUuid && (
                    <div className="flex items-center gap-2">
                        <Label htmlFor="payment-sort">{t('payments.sortBy')}</Label>
                        <Select value={sort} onValueChange={value => setSort(value as SortKey)}>
                            <SelectTrigger id="payment-sort" className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {(['name', 'due', 'paid', 'remaining', 'status', 'last_paid_at'] as const).map(key => (
                                    <SelectItem key={key} value={key}>{t(key === 'status' ? 'common:status' : `payments.${key === 'name' ? 'influencer' : key === 'last_paid_at' ? 'lastPaid' : key}`)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" aria-label={t(order === 'asc' ? 'payments.ascending' : 'payments.descending')} onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}>
                            {order === 'asc' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
                        </Button>
                    </div>
                )}
                <div role="group" aria-label={t('payments.displayMode')} className="flex gap-1 rounded-lg border p-1">
                    <Button type="button" size="sm" variant={viewMode === 'table' ? 'default' : 'ghost'} aria-pressed={viewMode === 'table'} onClick={() => changeViewMode('table')}>
                        <Table2 className="size-4" />{t('payments.tableView')}
                    </Button>
                    <Button type="button" size="sm" variant={viewMode === 'cards' ? 'default' : 'ghost'} aria-pressed={viewMode === 'cards'} onClick={() => changeViewMode('cards')}>
                        <LayoutGrid className="size-4" />{t('payments.cardView')}
                    </Button>
                </div>
            </div>

            {!campaignUuid ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Wallet className="size-12 text-muted-foreground/30 mb-3" />
                        <p className="font-medium">{t('payments.chooseCampaign')}</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-3" aria-busy={isFetching}>
                        {summaryCards.map(item => (
                            <Card key={item.key} className={`min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br shadow-sm ${item.surface}`}>
                                <CardContent className="space-y-5 p-5 lg:p-6">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium text-muted-foreground">{t(`payments.${item.key}`)}</p>
                                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.color}`}>
                                            <item.icon className="size-5" aria-hidden="true" />
                                        </div>
                                    </div>
                                    <p className={`break-words text-2xl font-bold tracking-tight tabular-nums lg:text-3xl ${item.color}`}>
                                        {isFetching && !summary ? <span className="block h-9 w-3/4 animate-pulse rounded-md bg-muted" aria-label={t('payments.loading')} /> : formatCurrency(item.amount)}
                                    </p>
                                    <div className="space-y-2.5">
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                            <span className="text-muted-foreground">{t('payments.percentOfDue')}</span>
                                            <span className={`rounded-full px-2.5 py-1 font-semibold tabular-nums ${item.iconBg} ${item.color}`}>
                                                {item.percent == null ? '—' : `${item.percent.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`}
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                                            <div className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${item.bar}`}
                                                style={{ width: `${Math.max(0, Math.min(100, item.percent ?? 0))}%` }} />
                                        </div>
                                        {summary && dueAmount === 0 && <p className="text-xs text-muted-foreground">{t('payments.noAmountDue')}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {viewMode === 'cards' ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {isFetching && !payouts ? (
                                <Card className="col-span-full p-10 text-center"><Loader2 className="mx-auto size-5 animate-spin" aria-label={t('payments.loading')} /></Card>
                            ) : payoutItems.length === 0 ? (
                                <Card className="col-span-full p-10 text-center text-muted-foreground">{t('payments.emptyCampaign', { campaign: selectedCampaignLabel })}</Card>
                            ) : payoutItems.map(row => (
                                <Card key={row.uuid} className="min-w-0 space-y-4 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <button type="button" className="flex min-w-0 items-center gap-2 text-left" disabled={!row.actor.profile_url}
                                            onClick={() => { if (row.actor.profile_url) setPreviewFile({ id: 0, uuid: `profile-${row.actor.uuid}`, original_name: row.actor.name, mime_type: 'image/*', public_url: row.actor.profile_url, file_size: 0 }) }}>
                                            <Avatar className="size-10 shrink-0">
                                                <AvatarImage src={resolveFileUrl(row.actor.profile_url || '') || undefined} />
                                                <AvatarFallback>{row.actor.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="break-words font-semibold">{row.actor.name}</span>
                                        </button>
                                        {statusBadge(row.status)}
                                    </div>
                                    <div className="rounded-lg bg-muted/40 p-3 text-sm">
                                        <p className="text-xs text-muted-foreground">{t('payments.bank')}</p>
                                        <p className="break-words">{row.actor.bank_account_name || '—'}</p>
                                        <CopyBankAccount number={row.actor.bank_account_number} />
                                    </div>
                                    <dl className="space-y-2 text-sm">
                                        {(['due', 'paid', 'remaining'] as const).map(key => (
                                            <div key={key} className="flex flex-wrap justify-between gap-2">
                                                <dt className="text-muted-foreground">{t(`payments.${key}`)}</dt>
                                                <dd className={`font-semibold tabular-nums ${key === 'paid' ? 'text-emerald-600' : key === 'remaining' ? 'text-amber-600' : ''}`}>{formatCurrency(row[key])}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                    <p className="text-xs text-muted-foreground">{t('payments.lastPaid')}: {row.last_paid_at ? new Date(row.last_paid_at).toLocaleDateString() : '—'}</p>
                                    <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                                        <Button size="sm" variant="outline" onClick={() => setHistoryRow(row)} disabled={!row.payments?.length}>
                                            <History className="size-4" />{t('payments.historyTitle')}
                                        </Button>
                                        <Button size="sm" onClick={() => openRecord(row)} disabled={row.status === 'PAID' || row.due <= 0}>
                                            <Banknote className="size-4" />{t('payments.recordTitle')}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                    <Card>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortHead field="name">{t('payments.influencer')}</SortHead>
                                        <TableHead>{t('payments.bank')}</TableHead>
                                        <SortHead field="due">{t('payments.due')}</SortHead>
                                        <SortHead field="paid">{t('payments.paid')}</SortHead>
                                        <SortHead field="remaining">{t('payments.remaining')}</SortHead>
                                        <SortHead field="status">{t('common:status')}</SortHead>
                                        <SortHead field="last_paid_at">{t('payments.lastPaid')}</SortHead>
                                        <TableHead className="text-right">{t('common:actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isFetching && !payouts ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                                                <Loader2 className="size-4 animate-spin inline mr-2" /> Loading…
                                            </TableCell>
                                        </TableRow>
                                    ) : payoutItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                                                No approved influencers in {selectedCampaignLabel || 'this campaign'}.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        payoutItems.map((row) => (
                                            <TableRow key={row.uuid}>
                                                <TableCell>
                                                    <button
                                                        type="button"
                                                        className="flex items-center gap-2 text-left"
                                                        disabled={!row.actor.profile_url}
                                                        onClick={() => {
                                                            if (!row.actor.profile_url) return
                                                            setPreviewFile({
                                                                id: 0,
                                                                uuid: `profile-${row.actor.uuid}`,
                                                                original_name: row.actor.name,
                                                                mime_type: 'image/*',
                                                                public_url: row.actor.profile_url,
                                                                file_size: 0
                                                            })
                                                        }}
                                                    >
                                                        <Avatar className="size-8">
                                                            <AvatarImage src={resolveFileUrl(row.actor.profile_url || '') || undefined} />
                                                            <AvatarFallback>{row.actor.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{row.actor.name}</span>
                                                    </button>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <div>{row.actor.bank_account_name || '—'}</div>
                                                    <CopyBankAccount number={row.actor.bank_account_number} />
                                                </TableCell>
                                                <TableCell className="tabular-nums">{formatCurrency(row.due)}</TableCell>
                                                <TableCell className="tabular-nums">{formatCurrency(row.paid)}</TableCell>
                                                <TableCell className="tabular-nums font-semibold">{formatCurrency(row.remaining)}</TableCell>
                                                <TableCell>{statusBadge(row.status)}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {row.last_paid_at ? new Date(row.last_paid_at).toLocaleDateString() : '—'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8"
                                                            onClick={() => setHistoryRow(row)}
                                                            disabled={!(row.payments?.length)}
                                                        >
                                                            <History className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-8"
                                                            disabled={row.status === 'PAID' || row.due <= 0}
                                                            onClick={() => openRecord(row)}
                                                        >
                                                            Record
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    )}
                </>
            )}

            <Dialog
                open={Boolean(recordRow)}
                onOpenChange={(open) => {
                    if (!open && !confirmOpen) setRecordRow(null)
                }}
            >
                <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{recordRow ? t('payments.recordTitleNamed', { name: recordRow.actor.name }) : t('payments.recordTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <p className="text-sm text-muted-foreground">
                            Remaining: <span className="font-semibold text-foreground">{formatCurrency(recordRow?.remaining)}</span>
                        </p>
                        <div className="grid gap-2">
                            <Label htmlFor="pay_amount">{t('payments.amountRequired')}</Label>
                            <Input
                                id="pay_amount"
                                inputMode="decimal"
                                value={formatAmountInput(amount)}
                                onChange={(e) => {
                                    const raw = parseAmountInput(e.target.value)
                                    if (raw === '') {
                                        setAmount('')
                                        return
                                    }
                                    if (/^\d+(\.\d{0,2})?$/.test(raw)) setAmount(raw)
                                }}
                                className="tabular-nums text-right"
                                placeholder="0"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pay_date">{t('payments.paidOn')}</Label>
                            <Input id="pay_date" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pay_ref">{t('payments.reference')}</Label>
                            <Input id="pay_ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={t('payments.referencePlaceholder')} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pay_notes">{t('payments.notes')}</Label>
                            <Textarea id="pay_notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('payments.proof')}</Label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,application/pdf"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files) addProofFiles(e.target.files)
                                    e.target.value = ''
                                }}
                            />
                            <div
                                className={`rounded-xl border-2 border-dashed p-4 text-center cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-border/60'}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    setIsDragging(true)
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault()
                                    setIsDragging(false)
                                    addProofFiles(e.dataTransfer.files)
                                }}
                            >
                                <Camera className="size-6 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-sm">{t('payments.dropProof')}</p>
                            </div>
                            {proofFiles.length > 0 && (
                                <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                                    {proofFiles.map((file, index) => {
                                        const isImage = file.type.startsWith('image/')
                                        return (
                                            <div key={`${file.name}-${file.size}-${index}`} className="relative overflow-hidden rounded-lg border bg-muted/30">
                                                {isImage && previewUrls[index] ? (
                                                    <img src={previewUrls[index]} alt={file.name} className="h-28 w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-28 flex-col items-center justify-center gap-1 px-2">
                                                        <FileText className="size-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="space-y-0.5 border-t bg-background/90 px-2 py-1.5">
                                                    <p className="truncate text-xs font-medium" title={file.name}>
                                                        {file.name}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-background/90 text-destructive shadow-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        removeProofFile(index)
                                                    }}
                                                    aria-label={`Remove ${file.name}`}
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRecordRow(null)}
                            disabled={isSaving}
                        >
                            {t('common:cancel')}
                        </Button>
                        <Button onClick={requestSubmitPayment} disabled={isSaving}>
                            {t('common:save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmOpen} onOpenChange={(open) => !isSaving && setConfirmOpen(open)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('payments.confirmTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        <p className="text-muted-foreground">{t('payments.confirmHint')}</p>
                        <div className="rounded-xl border divide-y">
                            <div className="flex justify-between gap-3 px-3 py-2">
                                <span className="text-muted-foreground">{t('payments.influencer')}</span>
                                <span className="font-medium text-right">{recordRow?.actor.name}</span>
                            </div>
                            <div className="flex justify-between gap-3 px-3 py-2">
                                <span className="text-muted-foreground">{t('payments.amount')}</span>
                                <span className="font-semibold tabular-nums">{formatCurrency(Number(parseAmountInput(amount)))}</span>
                            </div>
                            <div className="flex justify-between gap-3 px-3 py-2">
                                <span className="text-muted-foreground">{t('payments.paidOn')}</span>
                                <span>{paidAt || '—'}</span>
                            </div>
                            <div className="flex justify-between gap-3 px-3 py-2">
                                <span className="text-muted-foreground">{t('payments.reference')}</span>
                                <span className="text-right">{reference.trim() || '—'}</span>
                            </div>
                            <div className="flex justify-between gap-3 px-3 py-2">
                                <span className="text-muted-foreground">{t('payments.remainingAfter')}</span>
                                <span className="tabular-nums">
                                    {formatCurrency(Math.max(0, Number(recordRow?.remaining || 0) - Number(parseAmountInput(amount) || 0)))}
                                </span>
                            </div>
                            <div className="flex justify-between gap-3 px-3 py-2">
                                <span className="text-muted-foreground">{t('payments.proofFiles')}</span>
                                <span>{proofFiles.length}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isSaving}>
                            {t('common:back')}
                        </Button>
                        <Button onClick={submitPayment} disabled={isSaving}>
                            {isSaving && <Loader2 className="size-4 mr-2 animate-spin" />}
                            {t('payments.confirmSave')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(historyRow)}
                onOpenChange={(open) => {
                    if (!open && !previewFile) setHistoryRow(null)
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{historyRow ? t('payments.historyTitleNamed', { name: historyRow.actor.name }) : t('payments.historyTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {(historyRow?.payments || []).map((payment) => (
                            <div key={payment.uuid} className="rounded-xl border p-3 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold tabular-nums">{formatCurrency(payment.amount)}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(payment.paid_at).toLocaleString()}</p>
                                    </div>
                                    {canDelete && (
                                        <Button size="icon" variant="ghost" className="size-8 text-destructive" disabled={isDeleting} onClick={() => removePayment(payment.uuid)}>
                                            <Trash2 className="size-4" />
                                        </Button>
                                    )}
                                </div>
                                {payment.reference && <p className="text-xs">{t('payments.ref', { ref: payment.reference })}</p>}
                                {payment.notes && <p className="text-xs text-muted-foreground">{payment.notes}</p>}
                                {payment.payee_bank_account_number && (
                                    <div className="text-[11px] text-muted-foreground">
                                        <p>{payment.payee_bank_account_name || payment.payee_name}</p>
                                        <CopyBankAccount number={payment.payee_bank_account_number} />
                                    </div>
                                )}
                                {(payment.files?.length ?? 0) > 0 && (
                                    <div className="grid grid-cols-3 gap-2 pt-1">
                                        {(payment.files || []).map((file) => {
                                            const src = file.public_url ? resolveFileUrl(file.public_url) : ''
                                            const pdf = isPdfFile(file)
                                            const image = isImageFile(file)
                                            return (
                                                <button
                                                    key={file.uuid}
                                                    type="button"
                                                    className="group relative overflow-hidden rounded-lg border bg-muted/40 text-left"
                                                    onClick={() => setPreviewFile(file)}
                                                    disabled={!src}
                                                >
                                                    {image && src ? (
                                                        <img src={src} alt={file.original_name} className="h-20 w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-20 flex-col items-center justify-center gap-1 px-1">
                                                            {pdf ? (
                                                                <FileText className="size-7 text-muted-foreground" />
                                                            ) : (
                                                                <Banknote className="size-7 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    )}
                                                    <p className="truncate border-t bg-background/90 px-1.5 py-1 text-[10px]" title={file.original_name}>
                                                        {file.original_name}
                                                    </p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(previewFile)} onOpenChange={(open) => !open && setPreviewFile(null)}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="pr-8 truncate">{previewFile?.original_name || t('payments.proof')}</DialogTitle>
                    </DialogHeader>
                    {previewFile?.public_url ? (
                        <div className="min-h-[50vh]">
                            {isImageFile(previewFile) ? (
                                <img
                                    src={resolveFileUrl(previewFile.public_url)}
                                    alt={previewFile.original_name}
                                    className="mx-auto max-h-[75vh] w-full object-contain"
                                />
                            ) : isPdfFile(previewFile) ? (
                                <iframe
                                    title={previewFile.original_name}
                                    src={resolveFileUrl(previewFile.public_url)}
                                    className="h-[75vh] w-full rounded-md border bg-muted"
                                />
                            ) : (
                                <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <FileText className="size-10" />
                                    <p>{t('payments.cannotPreview')}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('payments.fileUrlMissing')}</p>
                    )}
                    {previewFile?.public_url && (
                        <DialogFooter>
                            <Button asChild variant="outline">
                                <a href={resolveFileUrl(previewFile.public_url)} target="_blank" rel="noreferrer">
                                    <ExternalLink className="mr-2 size-4" />
                                    Open in new tab
                                </a>
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default PaymentsPage
