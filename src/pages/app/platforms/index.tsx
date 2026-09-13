import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, RefreshCw, Unplug } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useCreatePlatformMutation, useDeletePlatformMutation, useGetPlatformsQuery, useUpdatePlatformMutation } from '../../../stores/services/platformApi'
import {
    useDisconnectFacebookBusinessMutation,
    useGetFacebookBusinessStatusQuery,
    useGetFacebookManagedPagesQuery,
    useSyncFacebookManagedPagesMutation,
} from '../../../stores/services/facebookBusinessApi'
import {
    useConnectFacebookScrapeMutation,
    useDisconnectFacebookScrapeMutation,
    useGetFacebookScrapeStatusQuery,
    useRefreshFacebookScrapeMutation,
} from '../../../stores/services/facebookScrapeApi'
import BackdropComponent from '@/components/BackdropComponent'
import ToastComponent from '@/components/ToastComponent'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { alertWarning, confirmDelete } from '../../../utils/alerts'
import env from '@/env'
import type { RootState } from '@/stores'
import { formatDateTime } from '@/utils/datetime'

const PlatformsPage: React.FC = () => {
    const { t } = useTranslation(['app', 'common'])
    const role = useSelector((state: RootState) => state.auth.role)
    const canManageBusiness = role === 'SUPER_ADMIN' || role === 'ADMIN'
    const [searchParams, setSearchParams] = useSearchParams()

    const { data, isLoading, refetch } = useGetPlatformsQuery()
    const [createPlatform, { isLoading: creating }] = useCreatePlatformMutation()
    const [updatePlatform, { isLoading: updating }] = useUpdatePlatformMutation()
    const [, { isLoading: deleting }] = useDeletePlatformMutation()

    const {
        data: businessStatusRes,
        isLoading: loadingBusiness,
        refetch: refetchBusiness,
    } = useGetFacebookBusinessStatusQuery()
    const { data: managedPagesRes } = useGetFacebookManagedPagesQuery(undefined, {
        skip: !businessStatusRes?.data?.connected,
    })
    const [syncPages, { isLoading: syncingPages }] = useSyncFacebookManagedPagesMutation()
    const [disconnectBusiness, { isLoading: disconnectingBusiness }] =
        useDisconnectFacebookBusinessMutation()

    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState(
        searchParams.get('facebook_business') || searchParams.get('tab') === 'business'
            ? 'business'
            : searchParams.get('tab') === 'viewer'
                ? 'viewer'
                : 'platforms'
    )

    const {
        data: scrapeStatusRes,
        isLoading: loadingScrape,
        refetch: refetchScrape,
    } = useGetFacebookScrapeStatusQuery(undefined, {
        pollingInterval: tab === 'viewer' ? 2000 : 0,
    })
    const [connectScrape, { isLoading: connectingScrape }] = useConnectFacebookScrapeMutation()
    const [refreshScrape, { isLoading: refreshingScrape }] = useRefreshFacebookScrapeMutation()
    const [disconnectScrape, { isLoading: disconnectingScrape }] = useDisconnectFacebookScrapeMutation()

    const platforms = data?.data ?? []
    const business = businessStatusRes?.data
    const managedPages = managedPagesRes?.data ?? []
    const scrape = scrapeStatusRes?.data
    const [editId, setEditId] = useState<number | null>(null)
    const [name, setName] = useState('')
    const wasConnecting = useRef(false)

    useEffect(() => {
        if (wasConnecting.current && !scrape?.connecting) {
            if (scrape?.connected) {
                ToastComponent({ status: 'success', message: t('platforms.viewerConnected') })
            } else if (scrape?.connect_error) {
                ToastComponent({ status: 'error', message: scrape.connect_error })
            }
        }
        wasConnecting.current = Boolean(scrape?.connecting)
    }, [scrape?.connecting, scrape?.connected, scrape?.connect_error, t])

    useEffect(() => {
        const fbStatus = searchParams.get('facebook_business')
        const tabParam = searchParams.get('tab')

        if (fbStatus || tabParam === 'business') {
            setTab('business')
        } else if (tabParam === 'viewer') {
            setTab('viewer')
        }

        if (fbStatus === 'success') {
            ToastComponent({ status: 'success', message: t('platforms.businessConnected') })
            void refetchBusiness()
        } else if (fbStatus === 'error') {
            ToastComponent({
                status: 'error',
                message: `${t('platforms.businessConnectFailed')}${searchParams.get('reason') ? `: ${searchParams.get('reason')}` : ''}`,
            })
        }

        if (fbStatus || searchParams.has('reason')) {
            searchParams.delete('facebook_business')
            searchParams.delete('reason')
            setSearchParams(searchParams, { replace: true })
        }
    }, [searchParams, setSearchParams, refetchBusiness, t])

    const openCreate = () => {
        setEditId(null)
        setName('')
        setOpen(true)
    }
    const openEdit = (id: number, n: string) => {
        setEditId(id)
        setName(n)
        setOpen(true)
    }
    const handleClose = () => setOpen(false)

    const handleSubmit = async () => {
        if (!name.trim()) return alertWarning({ text: t('platforms.enterName') })
        if (editId) {
            await updatePlatform({ id: editId, name })
        } else {
            await createPlatform({ name })
        }
        handleClose()
        refetch()
    }

    const handleConnectBusiness = () => {
        window.open(
            `${env.VITE_APP_API_PATH}/v1/integrations/facebook/business/connect?redirect=1`,
            '_blank',
            'noopener,noreferrer'
        )
    }

    const handleSyncPages = async () => {
        try {
            const res = await syncPages().unwrap()
            ToastComponent({
                status: 'success',
                message: res.message || t('platforms.pagesSynced'),
            })
            void refetchBusiness()
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || t('platforms.syncFailed'),
            })
        }
    }

    const handleConnectViewer = async () => {
        try {
            const res = await connectScrape().unwrap()
            ToastComponent({
                status: 'success',
                message: res.message || t('platforms.viewerConnectHint'),
            })
            void refetchScrape()
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || t('platforms.viewerConnectFailed'),
            })
        }
    }

    const handleRefreshViewer = async () => {
        try {
            const res = await refreshScrape().unwrap()
            ToastComponent({
                status: res.data?.connected ? 'success' : 'error',
                message: res.message || (res.data?.connected ? t('platforms.viewerRefreshed') : t('platforms.sessionExpired')),
            })
            void refetchScrape()
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || t('platforms.refreshFailed'),
            })
        }
    }

    const handleDisconnectViewer = async () => {
        const confirmation = await confirmDelete({
            title: t('platforms.disconnectViewerTitle'),
            text: t('platforms.disconnectViewerText'),
        })
        if (!confirmation.isConfirmed) return
        try {
            await disconnectScrape().unwrap()
            ToastComponent({ status: 'success', message: t('platforms.viewerDisconnected') })
            void refetchScrape()
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || t('platforms.disconnectViewerFailed'),
            })
        }
    }

    const handleDisconnectBusiness = async () => {
        const confirmation = await confirmDelete({
            title: t('platforms.disconnectBusinessTitle'),
            text: t('platforms.disconnectBusinessText'),
        })
        if (!confirmation.isConfirmed) return
        try {
            await disconnectBusiness().unwrap()
            ToastComponent({ status: 'success', message: t('platforms.businessDisconnected') })
            void refetchBusiness()
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || t('platforms.disconnectFailed'),
            })
        }
    }

    return (
        <div className="space-y-6">
            <BackdropComponent
                open={
                    isLoading ||
                    creating ||
                    updating ||
                    deleting ||
                    loadingBusiness ||
                    loadingScrape ||
                    syncingPages ||
                    disconnectingBusiness ||
                    connectingScrape ||
                    refreshingScrape ||
                    disconnectingScrape
                }
            />
            <PageHeader
                title={t('platforms.title')}
                actions={
                    tab === 'platforms' && platforms.length < 3 ? (
                        <Button onClick={openCreate}>
                            <Plus />
                            {t('common:create')}
                        </Button>
                    ) : null
                }
            />

            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <div className="overflow-x-auto">
                    <TabsList className="h-auto w-max min-w-full justify-start">
                        <TabsTrigger value="platforms">{t('platforms.tabPlatforms')}</TabsTrigger>
                        <TabsTrigger value="business">{t('platforms.tabBusiness')}</TabsTrigger>
                        <TabsTrigger value="viewer">{t('platforms.tabViewer')}</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="platforms">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-primary [&_th]:text-primary-foreground">
                                    <TableRow>
                                        {['#', t('platforms.colName'), ''].map((h) => (
                                            <TableHead key={h} className={h === '' ? 'text-right' : undefined}>
                                                {h}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {platforms.map((row, i) => (
                                        <TableRow key={row.id}>
                                            <TableCell>{i + 1}</TableCell>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell className="text-right">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEdit(row.id, row.name)}
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{t('common:edit')}</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {platforms.length === 0 && !isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                                                {t('common:noDataShort')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="business">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('platforms.businessTitle')}</CardTitle>
                            <CardDescription>
                                {t('platforms.businessDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1 text-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant={business?.connected ? 'default' : 'secondary'}>
                                            {business?.connected ? t('platforms.statusConnected') : t('platforms.statusNotConnected')}
                                        </Badge>
                                        {business?.display_name ? (
                                            <span className="font-medium">{business.display_name}</span>
                                        ) : null}
                                    </div>
                                    <p className="text-muted-foreground">
                                        {t('platforms.managedPages', { count: business?.pages_count ?? 0 })}
                                        {business?.last_synced_at
                                            ? ` · ${t('platforms.lastSync', { date: formatDateTime(business.last_synced_at) })}`
                                            : ''}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {business?.connected ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => void handleSyncPages()}
                                                disabled={!canManageBusiness || syncingPages}
                                            >
                                                <RefreshCw className="size-3.5" />
                                                {t('platforms.syncPages')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => void handleDisconnectBusiness()}
                                                disabled={!canManageBusiness || disconnectingBusiness}
                                            >
                                                <Unplug className="size-3.5" />
                                                {t('platforms.disconnect')}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={handleConnectBusiness}
                                            disabled={!canManageBusiness}
                                        >
                                            {t('platforms.connectBusiness')}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {business?.connected && managedPages.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('platforms.colPage')}</TableHead>
                                                <TableHead>{t('platforms.colPageId')}</TableHead>
                                                <TableHead>{t('platforms.colTasks')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {managedPages.map((page) => (
                                                <TableRow key={page.uuid}>
                                                    <TableCell>{page.page_name || '—'}</TableCell>
                                                    <TableCell className="font-mono text-xs">{page.page_id}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {page.tasks || '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="viewer">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('platforms.viewerTitle')}</CardTitle>
                            <CardDescription>
                                {t('platforms.viewerDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1 text-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant={
                                                scrape?.connecting
                                                    ? 'secondary'
                                                    : scrape?.connected
                                                        ? 'default'
                                                        : 'secondary'
                                            }
                                        >
                                            {scrape?.connecting
                                                ? t('platforms.waitingForLogin')
                                                : scrape?.connected
                                                    ? t('platforms.statusConnected')
                                                    : scrape?.status === 'expired'
                                                        ? t('platforms.statusExpired')
                                                        : t('platforms.statusNotConnected')}
                                        </Badge>
                                        {scrape?.display_name ? (
                                            <span className="font-medium">{scrape.display_name}</span>
                                        ) : null}
                                    </div>
                                    <p className="text-muted-foreground">
                                        {t('platforms.chromeOpensHint')}
                                        {scrape?.last_used_at
                                            ? ` · ${t('platforms.lastUsed', { date: formatDateTime(scrape.last_used_at) })}`
                                            : ''}
                                        {scrape?.connected_at
                                            ? ` · ${t('platforms.connectedAt', { date: formatDateTime(scrape.connected_at) })}`
                                            : ''}
                                    </p>
                                    {scrape?.connect_error ? (
                                        <p className="text-destructive">{scrape.connect_error}</p>
                                    ) : null}
                                    {scrape?.status === 'expired' ? (
                                        <p className="text-destructive">
                                            {t('platforms.sessionExpiredNotice')}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {scrape?.connected && !scrape.connecting ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => void handleRefreshViewer()}
                                                disabled={!canManageBusiness || refreshingScrape}
                                            >
                                                <RefreshCw className="size-3.5" />
                                                {t('platforms.refreshSession')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => void handleDisconnectViewer()}
                                                disabled={!canManageBusiness || disconnectingScrape}
                                            >
                                                <Unplug className="size-3.5" />
                                                {t('platforms.disconnect')}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => void handleConnectViewer()}
                                            disabled={!canManageBusiness || connectingScrape || scrape?.connecting}
                                        >
                                            {scrape?.connecting ? t('platforms.waitingInChrome') : t('platforms.connectViewer')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{editId ? t('platforms.editTitle') : t('platforms.createTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="platform_name">{t('platforms.colName')} *</Label>
                            <Input
                                id="platform_name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('platforms.namePlaceholder')}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                            {t('common:cancel')}
                        </Button>
                        <Button onClick={handleSubmit} disabled={creating || updating}>
                            {t('common:save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default PlatformsPage
