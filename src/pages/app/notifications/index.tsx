import React from 'react'
import { useTranslation } from 'react-i18next'
import BackdropComponent from '../../../components/BackdropComponent'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
    useGetNotificationsQuery,
    useMarkAllNotificationsReadMutation,
    useMarkNotificationReadMutation
} from '../../../stores/services/notificationsApi'
import { formatDateTime } from '@/utils/datetime'

const NotificationsPage: React.FC = () => {
    const { t } = useTranslation('app')
    const { data, isLoading, refetch } = useGetNotificationsQuery({})
    const [markRead] = useMarkNotificationReadMutation()
    const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation()

    const notifications = data?.data?.notifications ?? []
    const unreadCount = data?.data?.unreadCount ?? 0

    const handleMarkAll = async () => {
        await markAllRead()
        refetch()
    }

    return (
        <div>
            <BackdropComponent open={isLoading || markingAll} />
            <PageHeader
                title={t('notifications.title')}
                description={
                    unreadCount > 0
                        ? t(unreadCount === 1 ? 'notifications.unreadOne' : 'notifications.unreadMany', { count: unreadCount })
                        : t('notifications.allCaughtUp')
                }
                actions={
                    <Button variant="outline" disabled={!unreadCount} onClick={handleMarkAll}>
                        {t('notifications.markAllRead')}
                    </Button>
                }
            />
            <Card className="divide-y">
                {notifications.map((item: any) => (
                    <div key={item.uuid} className="flex items-start justify-between gap-4 p-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className={item.read_at ? 'font-normal' : 'font-bold'}>{item.title}</p>
                                {!item.read_at && <Badge>{t('status.unread')}</Badge>}
                            </div>
                            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                                {item.message}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {formatDateTime(item.created_at)}
                            </p>
                        </div>
                        {!item.read_at && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                    await markRead(item.uuid)
                                    refetch()
                                }}
                            >
                                {t('notifications.markRead')}
                            </Button>
                        )}
                    </div>
                ))}
                {!notifications.length && (
                    <div className="p-6 text-center text-muted-foreground">{t('notifications.empty')}</div>
                )}
            </Card>
        </div>
    )
}

export default NotificationsPage
