import React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'

const statusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    if (status === 'ACTIVE') return 'default'
    if (status === 'SUSPENDED') return 'outline'
    return 'secondary'
}

interface CustomerStatusBadgeProps {
    status: string
}

const CustomerStatusBadge: React.FC<CustomerStatusBadgeProps> = ({ status }) => {
    const { t } = useTranslation('app')

    return (
        <Badge variant={statusBadgeVariant(status)}>
            {t(`customers.status.${status.toLowerCase()}`, { defaultValue: status })}
        </Badge>
    )
}

export default CustomerStatusBadge
