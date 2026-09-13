import { PatternFormat } from 'react-number-format'
import { ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
    value?: any
    name: string
    size?: 'small' | 'medium'
    label?: string
    placeholder?: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

function PhoneNumber({ value, onChange, name, label, placeholder }: Props) {
    return (
        <div className="space-y-2">
            {label ? <Label htmlFor={name}>{label}</Label> : null}
            <PatternFormat
                customInput={Input}
                id={name}
                onChange={onChange}
                required
                format="#### ####"
                name={name}
                value={value}
                placeholder={placeholder}
            />
        </div>
    )
}

export default PhoneNumber
