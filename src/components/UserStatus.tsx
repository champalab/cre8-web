import React from 'react'
import { useTranslation } from 'react-i18next'

const STATUS = [
    { label: 'active', value: 'ACTIVE' },
    { label: 'inactive', value: 'INACTIVE' }
]

type Props = {
    values: any
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function UserStatus({ values, handleChange }: Props) {
    const { t } = useTranslation(['app', 'auth'])

    const currentStatus = typeof values === 'string' ? values : values?.status

    return (
        <div>
            <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t('users.access')}</legend>
                <div className="flex flex-wrap gap-4">
                    {STATUS.map((status) => (
                        <label key={status.value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                            <input
                                type="radio"
                                name="status"
                                value={status.value}
                                checked={currentStatus === status.value}
                                onChange={handleChange}
                                className="size-4 cursor-pointer"
                            />
                            {t(`auth:${status.label}`)}
                        </label>
                    ))}
                </div>
            </fieldset>
        </div>
    )
}

export default UserStatus
