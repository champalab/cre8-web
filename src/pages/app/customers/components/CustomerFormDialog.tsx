import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export const CUSTOMER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const

export type CustomerFormData = {
    full_name: string
    email: string
    phone: string
    comment: string
    status: string
}

interface CustomerFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    isEditing: boolean
    form: CustomerFormData
    onChange: (form: CustomerFormData) => void
    onSubmit: () => void
}

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
    open,
    onOpenChange,
    isEditing,
    form,
    onChange,
    onSubmit,
}) => {
    const { t } = useTranslation('app')

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? t('customers.edit') : t('customers.create')}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="full_name">{t('customers.fullNameRequired')}</Label>
                        <Input
                            id="full_name"
                            value={form.full_name}
                            onChange={(e) => onChange({ ...form, full_name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('common:email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => onChange({ ...form, email: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">{t('common:phone')}</Label>
                        <Input
                            id="phone"
                            value={form.phone}
                            onChange={(e) => onChange({ ...form, phone: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="comment">{t('common:comment')}</Label>
                        <Textarea
                            id="comment"
                            value={form.comment}
                            onChange={(e) => onChange({ ...form, comment: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('common:status')}</Label>
                        <Select
                            value={form.status}
                            onValueChange={(value) => onChange({ ...form, status: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CUSTOMER_STATUSES.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {t(`customers.status.${status.toLowerCase()}`, { defaultValue: status })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common:cancel')}
                    </Button>
                    <Button onClick={onSubmit}>{t('common:save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CustomerFormDialog
