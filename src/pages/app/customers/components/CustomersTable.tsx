import CopyPhone from './CopyPhone'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Customer } from '../../users/type.d'
import CustomerStatusBadge from './CustomerStatusBadge'

const getCustomerFullName = (customer: Customer) => customer.full_name || customer.company_name || '-'
const getCustomerEmail = (customer: Customer) => customer.email || customer.company_email || '-'
const getCustomerPhone = (customer: Customer) => customer.phone || customer.company_phone || '-'
const getCustomerComment = (customer: Customer) => customer.comment || customer.internal_note || '-'

interface CustomersTableProps {
    customers: Customer[]
    onEdit: (customer: Customer) => void
    onDelete: (customer: Customer) => void
}

const CustomersTable: React.FC<CustomersTableProps> = ({ customers, onEdit, onDelete }) => {
    const { t } = useTranslation('app')

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('common:code')}</TableHead>
                            <TableHead>{t('customers.fullName')}</TableHead>
                            <TableHead>{t('common:email')}</TableHead>
                            <TableHead>{t('common:phone')}</TableHead>
                            <TableHead>{t('common:comment')}</TableHead>
                            <TableHead>{t('common:status')}</TableHead>
                            <TableHead className="text-right">{t('common:actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow key={customer.uuid}>
                                <TableCell>{customer.customer_code}</TableCell>
                                <TableCell>{getCustomerFullName(customer)}</TableCell>
                                <TableCell>{getCustomerEmail(customer)}</TableCell>
                                <TableCell><CopyPhone phone={getCustomerPhone(customer)} /></TableCell>
                                <TableCell className="max-w-[220px] truncate">
                                    {getCustomerComment(customer)}
                                </TableCell>
                                <TableCell>
                                    <CustomerStatusBadge status={customer.status} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={() => onEdit(customer)}>
                                            <Building2 />
                                            {t('common:edit')}
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => onDelete(customer)}>
                                            <Trash2 />
                                            {t('common:delete')}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!customers.length && (
                            <TableRow>
                                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                    {t('customers.empty')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export { getCustomerFullName, getCustomerEmail, getCustomerPhone, getCustomerComment }
export default CustomersTable
