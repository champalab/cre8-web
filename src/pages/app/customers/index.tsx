import CopyPhone from './components/CopyPhone'
import { Card } from '@/components/ui/card'
import PaginationComponent from '@/components/PaginationComponent'
import CustomerStatusBadge from './components/CustomerStatusBadge'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, LayoutGrid, Table2, Building2, Trash2 } from 'lucide-react'
import BackdropComponent from '@/components/BackdropComponent'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { alertWarning, confirmDelete } from '../../../utils/alerts'
import {
    useCreateCustomerMutation,
    useDeleteCustomerMutation,
    useGetCustomersQuery,
    useUpdateCustomerMutation,
} from '../../../stores/services/customerApi'
import { Customer } from '../users/type.d'
import ToastComponent from '../../../components/ToastComponent'
import { getMutationPayload, isMutationSuccess } from '../../../utils/mutation-response'
import CustomersTable, {
    getCustomerFullName,
    getCustomerEmail,
    getCustomerPhone,
    getCustomerComment,
} from './components/CustomersTable'
import CustomerFormDialog, { CustomerFormData } from './components/CustomerFormDialog'

const emptyForm: CustomerFormData = {
    full_name: '',
    email: '',
    phone: '',
    comment: '',
    status: 'ACTIVE',
}

const CUSTOMER_VIEW_KEY = 'customers:display-mode'
type CustomerView = 'table' | 'cards'

const CustomersPage: React.FC = () => {
    const { t } = useTranslation('app')
    const [keyword, setKeyword] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [viewMode, setViewMode] = useState<CustomerView>(() => {
        try { return localStorage.getItem(CUSTOMER_VIEW_KEY) === 'cards' ? 'cards' : 'table' }
        catch { return 'table' }
    })
    const changeViewMode = (mode: CustomerView) => {
        setViewMode(mode)
        try { localStorage.setItem(CUSTOMER_VIEW_KEY, mode) } catch { /* Storage may be unavailable. */ }
    }
    const { currentData: data, isFetching: isLoading, isError } = useGetCustomersQuery({ keyword: search, page })
    const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation()
    const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation()
    const [deleteCustomer, { isLoading: deleting }] = useDeleteCustomerMutation()

    const customers = data?.success && Array.isArray(data.data) ? data.data : []
    const totalPages = Math.max(1, data?.meta?.totalPages ?? 1)
    useEffect(() => {
        if (data?.success && page > totalPages) setPage(totalPages)
    }, [data, page, totalPages])
    const [open, setOpen] = useState(false)
    const [editUuid, setEditUuid] = useState<string | null>(null)
    const [form, setForm] = useState<CustomerFormData>(emptyForm)

    useEffect(() => {
        const timer = setTimeout(() => { setSearch(keyword.trim()); setPage(1) }, 300)
        return () => clearTimeout(timer)
    }, [keyword])

    const resetForm = () => {
        setEditUuid(null)
        setForm(emptyForm)
    }

    const openCreate = () => {
        resetForm()
        setOpen(true)
    }

    const openEdit = (customer: Customer) => {
        setEditUuid(customer.uuid)
        setForm({
            full_name: getCustomerFullName(customer) === '-' ? '' : getCustomerFullName(customer),
            email: getCustomerEmail(customer) === '-' ? '' : getCustomerEmail(customer),
            phone: getCustomerPhone(customer) === '-' ? '' : getCustomerPhone(customer),
            comment: getCustomerComment(customer) === '-' ? '' : getCustomerComment(customer),
            status: customer.status,
        })
        setOpen(true)
    }

    const handleSubmit = async () => {
        if (!form.full_name?.trim()) {
            return alertWarning({ text: t('customers.enterFullName') })
        }

        const payload = {
            full_name: form.full_name.trim(),
            email: form.email?.trim() || undefined,
            phone: form.phone?.trim() || undefined,
            comment: form.comment?.trim() || undefined,
            status: form.status,
        }

        const response = editUuid
            ? await updateCustomer({ uuid: editUuid, body: payload })
            : await createCustomer(payload)

        const result = getMutationPayload(response)
        if (result) ToastComponent(result)
        if (!isMutationSuccess(result)) return

        setOpen(false)
        resetForm()

    }

    const handleDelete = async (customer: Customer) => {
        const confirmation = await confirmDelete({
            title: t('customers.deleteTitle'),
            text: t('customers.deleteText', { name: getCustomerFullName(customer) }),
        })
        if (!confirmation.isConfirmed) return

        const response = await deleteCustomer(customer.uuid)
        const data = getMutationPayload(response)
        if (data) ToastComponent(data)

    }

    return (
        <div>
            <BackdropComponent open={isLoading || creating || updating || deleting} />
            <PageHeader
                title={t('customers.title')}
                actions={
                    <>
                        <Input
                            placeholder={t('customers.searchPlaceholder')}
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-64"
                        />
                        <Button onClick={openCreate}>
                            <Plus />
                            {t('customers.create')}
                        </Button>
                    </>
                }
            />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{data?.meta?.limit ? t('customers.rowsPerPage', { count: data.meta.limit }) : ''}</p>
                <div role="group" aria-label={t('customers.displayMode')} className="flex gap-1 rounded-lg border p-1">
                    <Button type="button" size="sm" variant={viewMode === 'table' ? 'default' : 'ghost'} aria-pressed={viewMode === 'table'} onClick={() => changeViewMode('table')}>
                        <Table2 className="size-4" />{t('customers.tableView')}
                    </Button>
                    <Button type="button" size="sm" variant={viewMode === 'cards' ? 'default' : 'ghost'} aria-pressed={viewMode === 'cards'} onClick={() => changeViewMode('cards')}>
                        <LayoutGrid className="size-4" />{t('customers.cardView')}
                    </Button>
                </div>
            </div>
            {(isError || (data && !data.success)) && <p role="alert" className="mb-4 text-sm text-destructive">{t('customers.loadFailed')}</p>}
            {viewMode === 'table' ? (
                <CustomersTable customers={customers} onEdit={openEdit} onDelete={handleDelete} />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {customers.map(customer => (
                        <Card key={customer.uuid} className="min-w-0 space-y-4 p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">{customer.customer_code}</p>
                                    <h2 className="break-words font-semibold">{getCustomerFullName(customer)}</h2>
                                </div>
                                <CustomerStatusBadge status={customer.status} />
                            </div>
                            <dl className="space-y-3 text-sm">
                                {[
                                    ['email', getCustomerEmail(customer)], ['phone', getCustomerPhone(customer)], ['comment', getCustomerComment(customer)],
                                ].map(([label, value]) => (
                                    <div key={label}><dt className="text-xs text-muted-foreground">{t(`common:${label}`)}</dt><dd className="break-words whitespace-pre-wrap">{label === 'phone' ? <CopyPhone phone={value} /> : value}</dd></div>
                                ))}
                            </dl>
                            <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                                <Button size="sm" variant="outline" onClick={() => openEdit(customer)}><Building2 className="size-4" />{t('common:edit')}</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(customer)}><Trash2 className="size-4" />{t('common:delete')}</Button>
                            </div>
                        </Card>
                    ))}
                    {!customers.length && !isLoading && <Card className="col-span-full p-8 text-center text-muted-foreground">{t('customers.empty')}</Card>}
                </div>
            )}
            <PaginationComponent page={page} setPage={setPage} total={{ totalItems: data?.meta?.total ?? 0, totalPages }} />

            <CustomerFormDialog
                open={open}
                onOpenChange={setOpen}
                isEditing={!!editUuid}
                form={form}
                onChange={setForm}
                onSubmit={handleSubmit}
            />
        </div>
    )
}

export default CustomersPage
