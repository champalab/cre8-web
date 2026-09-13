import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import BackdropComponent from '@/components/BackdropComponent'
import ToastComponent from '@/components/ToastComponent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { getMutationPayload, isMutationSuccess } from '@/utils/mutation-response'
import { RootState } from '../../../../../stores'
import { useGetCustomersQuery } from '../../../../../stores/services/customerApi'
import { CampaignDetail, useUpdateCampaignMutation } from '../../../../../stores/services/campaignApi'
import { INTERNAL_ROLES, normalizeRole } from '../../../../../config/roles'
import { Customer } from '../../../users/type.d'

type Props = {
    campaign: CampaignDetail
    onChanged: () => void
}

const getCustomerFullName = (customer: Customer | any) =>
    customer.full_name || customer.company_name || '—'

const getCustomerEmail = (customer: Customer | any) =>
    customer.email || customer.company_email || '—'

const getCustomerPhone = (customer: Customer | any) =>
    customer.phone || customer.company_phone || '—'

const CustomersTab: React.FC<Props> = ({ campaign, onChanged }) => {
    const { t } = useTranslation('app')
    const auth = useSelector((state: RootState) => state.auth)
    const canManage = INTERNAL_ROLES.includes(normalizeRole(auth.role) as any)

    const linkedCustomers = useMemo(() => {
        const fromLinks =
            campaign?.campaign_customers?.map((item) => item.customers).filter(Boolean) ?? []
        if (fromLinks.length) return fromLinks
        return campaign?.customers ? [campaign.customers] : []
    }, [campaign])

    const selectedIds = useMemo(
        () => linkedCustomers.map((customer: any) => customer.id as number),
        [linkedCustomers]
    )

    const [draftIds, setDraftIds] = useState<number[]>(selectedIds)

    useEffect(() => {
        setDraftIds(selectedIds)
    }, [selectedIds])

    const { data, isLoading } = useGetCustomersQuery(
        { page: 1, limit: 100 },
        { skip: !canManage }
    )
    const customers = data?.data ?? []

    const options = useMemo(
        () =>
            customers.map((customer: any) => ({
                value: customer.id as number,
                label: getCustomerFullName(customer),
                description: [customer.customer_code, getCustomerEmail(customer)]
                    .filter(Boolean)
                    .join(' · '),
            })),
        [customers]
    )

    const [updateCampaign, { isLoading: updating }] = useUpdateCampaignMutation()

    const handleSaveAccess = async () => {
        if (!canManage) return

        const response = await updateCampaign({
            id: campaign.id,
            customer_ids: draftIds,
        })
        const payload = getMutationPayload(response)
        if (payload) ToastComponent(payload)
        if (!isMutationSuccess(payload)) return
        onChanged()
    }

    const hasChanges =
        draftIds.length !== selectedIds.length ||
        draftIds.some((id) => !selectedIds.includes(id))

    return (
        <div className="grid gap-4">
            <BackdropComponent open={isLoading || updating} />

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('campaignDetail.selectCustomersTitle')}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('campaignDetail.selectCustomersHint')}
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid gap-2">
                        <Label>{t('campaignDetail.customers')}</Label>
                        <MultiSelectCombobox
                            options={options}
                            selected={draftIds}
                            onChange={setDraftIds}
                            placeholder={t('campaigns.selectCustomers')}
                            searchPlaceholder={t('campaigns.searchCustomerFields')}
                            emptyText={t('campaigns.noCustomerFound')}
                            disabled={!canManage || updating}
                        />
                    </div>
                    {canManage && (
                        <div className="flex justify-end">
                            <Button
                                className="w-full sm:w-auto"
                                onClick={handleSaveAccess}
                                disabled={!hasChanges || updating}
                            >
                                {t('campaignDetail.saveAccess')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                        {t('campaignDetail.customersWithAccess', { count: linkedCustomers.length })}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:hidden">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {linkedCustomers.map((customer: any) => (
                            <div
                                key={customer.uuid || customer.id}
                                className="min-w-0 rounded-lg border bg-muted/20 p-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">
                                            {getCustomerFullName(customer)}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {customer.customer_code || '—'}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="shrink-0">
                                        {customer.status || '—'}
                                    </Badge>
                                </div>
                                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                                    <p className="break-all">{getCustomerEmail(customer)}</p>
                                    <p>{getCustomerPhone(customer)}</p>
                                </div>
                            </div>
                        ))}
                        {!linkedCustomers.length && (
                            <p className="py-6 text-center text-sm text-muted-foreground sm:col-span-2">
                                {t('campaignDetail.noCustomerSelected')}
                            </p>
                        )}
                    </div>
                </CardContent>
                <CardContent className="hidden p-0 md:block">
                    <Table className="min-w-[640px]">
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>{t('common:code')}</TableHead>
                                <TableHead>{t('campaignDetail.colName')}</TableHead>
                                <TableHead>{t('common:email')}</TableHead>
                                <TableHead>{t('common:phone')}</TableHead>
                                <TableHead>{t('common:status')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {linkedCustomers.map((customer: any) => (
                                <TableRow key={customer.uuid || customer.id}>
                                    <TableCell>{customer.customer_code || '—'}</TableCell>
                                    <TableCell>{getCustomerFullName(customer)}</TableCell>
                                    <TableCell className="max-w-[180px] break-all">
                                        {getCustomerEmail(customer)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {getCustomerPhone(customer)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{customer.status || '—'}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!linkedCustomers.length && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                        {t('campaignDetail.noCustomerSelected')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default CustomersTab
