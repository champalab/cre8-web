import React from 'react'
import { useTranslation } from 'react-i18next'
import BackdropComponent from '../../../components/BackdropComponent'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useGetAuditLogsQuery } from '../../../stores/services/auditLogsApi'
import { formatDateTime } from '@/utils/datetime'

const AuditLogsPage: React.FC = () => {
    const { t } = useTranslation('app')
    const { data, isLoading } = useGetAuditLogsQuery({})
    const logs = data?.data ?? []

    return (
        <div>
            <BackdropComponent open={isLoading} />
            <PageHeader title={t('auditLogs.title')} />
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('auditLogs.time')}</TableHead>
                            <TableHead>{t('auditLogs.action')}</TableHead>
                            <TableHead>{t('auditLogs.entity')}</TableHead>
                            <TableHead>{t('auditLogs.user')}</TableHead>
                            <TableHead>{t('auditLogs.ip')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log: any) => (
                            <TableRow key={log.uuid}>
                                <TableCell>{formatDateTime(log.created_at)}</TableCell>
                                <TableCell>{log.action}</TableCell>
                                <TableCell>{log.entity_type} / {log.entity_id}</TableCell>
                                <TableCell>{log.users?.username || '-'}</TableCell>
                                <TableCell>{log.ip_address || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}

export default AuditLogsPage
