import { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { User, UserCreate } from '../type'
import UserModal from './UserModal'
import { Card } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface Props {
    data: User[]
    refetch: () => void
    onUpdate: (data: UserCreate) => void
}

export default function TableComponent({ data, refetch, onUpdate }: Props): ReactElement {
    const { t } = useTranslation('app')
    return (
        <Card className="my-4">
            <div className="max-h-[75vh] overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-20">#</TableHead>
                            <TableHead className="min-w-[200px]">{t('users.fullName')}</TableHead>
                            <TableHead className="min-w-[150px]">{t('users.email')}</TableHead>
                            <TableHead className="min-w-[150px]">{t('users.phoneNumber')}</TableHead>
                            <TableHead className="min-w-[140px]">{t('users.role')}</TableHead>
                            <TableHead className="min-w-[300px]">{t('users.notes')}</TableHead>
                            <TableHead className="min-w-[200px]">{t('common:status')}</TableHead>
                            <TableHead className="min-w-[300px]">{t('common:actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow key={row.id}>
                                <TableCell>{(row as any).indexNo ?? index + 1}</TableCell>
                                <TableCell>
                                    <span className="text-sm">[{row.id}] {row.name}</span>
                                </TableCell>
                                <TableCell>{(row as any).email}</TableCell>
                                <TableCell>{(row as any).tel ?? '—'}</TableCell>
                                <TableCell>{row.role}</TableCell>
                                <TableCell>{(row as any).comments ?? '—'}</TableCell>
                                <TableCell>
                                    {row.status === 'ACTIVE' ? (
                                        <span className="text-green-600">✅ {t('users.active')}</span>
                                    ) : (
                                        <span className="text-red-600">🚫 {t('users.inactive')}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <UserModal
                                        mode="update"
                                        onSubmit={onUpdate}
                                        refetch={refetch}
                                        initialValues={row}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    )
}
