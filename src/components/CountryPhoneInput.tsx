import React from 'react'
import { countries, getEmojiFlag, type TCountryCode } from 'countries-list'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface CountryOption {
    code: string
    name: string
    native: string
    dialCode: string
    flag: string
}

export const COUNTRIES: CountryOption[] = Object.entries(countries)
    .map(([code, item]) => ({
        code,
        name: item.name,
        native: item.native,
        dialCode: item.phone && item.phone.length > 0 ? `+${item.phone[0]}` : '',
        flag: getEmojiFlag(code as TCountryCode) || '🌐'
    }))
    .sort((a, b) => {
        if (a.code === 'LA') return -1
        if (b.code === 'LA') return 1
        return a.name.localeCompare(b.name)
    })

export function getCountryDialCode(countryCode: string = 'LA'): string {
    const found = COUNTRIES.find((c) => c.code === countryCode)
    return found?.dialCode || '+856'
}

/**
 * Cleans phone to numeric digits only (removing any + and non-digit characters)
 * and ensures exactly 10 digits if a 20/020 prefix is provided.
 */
export function formatPhoneWithoutPlus(phone: string): string {
    const numeric = (phone || '').replace(/\D/g, '')
    if (numeric.startsWith('020')) {
        return numeric.slice(1).slice(0, 10)
    }
    if (numeric.startsWith('85620')) {
        return numeric.slice(3).slice(0, 10)
    }
    return numeric.slice(0, 10)
}

/**
 * Validates if the phone number has exactly 10 digits and only numbers (no + or letters).
 */
export function isValid10DigitPhone(phone: string): boolean {
    const cleaned = formatPhoneWithoutPlus(phone)
    return cleaned.length === 10 && /^\d{10}$/.test(cleaned)
}

/**
 * Helper to return digits only for database submission without '+' sign.
 */
export function combinePhoneWithDialCode(phone: string, countryCode: string = 'LA'): string {
    return formatPhoneWithoutPlus(phone)
}

/**
 * Parses a phone number that might already include a dial code (e.g. '+85691116465' or '02091116465')
 * and returns the best matching country code and local phone number.
 */
export function parsePhoneAndCountry(rawPhone: string, fallbackCountry: string = 'LA'): { phone: string; country: string } {
    if (!rawPhone || rawPhone === '-' || rawPhone === '—') {
        return { phone: '', country: fallbackCountry }
    }

    const trimmed = rawPhone.trim()

    // If starts with +, try to match known dial codes (longest dialCode first)
    if (trimmed.startsWith('+')) {
        const sortedByDialLength = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
        for (const c of sortedByDialLength) {
            if (c.dialCode && trimmed.startsWith(c.dialCode)) {
                let local = trimmed.slice(c.dialCode.length).replace(/\D/g, '')
                if (c.code === 'LA') {
                    if (local.startsWith('020')) local = local.slice(1) // 020... -> 20...
                    if (local.length > 10) local = local.slice(-10)
                }
                return { phone: local, country: c.code }
            }
        }
    }

    const numeric = trimmed.replace(/\D/g, '')
    // Standard Lao phone often recorded as 8 digits or with 020/20 prefix (10 digits)
    if (fallbackCountry === 'LA') {
        if (numeric.startsWith('85620')) {
            const local = numeric.slice(3) // 20XXXXXXXX (10 digits)
            return { phone: local.slice(0, 10), country: 'LA' }
        }
        if (numeric.startsWith('020')) {
            const local = numeric.slice(1) // 20XXXXXXXX (10 digits)
            return { phone: local.slice(0, 10), country: 'LA' }
        }
        if (numeric.length > 10) {
            return { phone: numeric.slice(-10), country: 'LA' }
        }
        return { phone: numeric, country: 'LA' }
    }

    return {
        phone: numeric.slice(0, 10),
        country: fallbackCountry
    }
}

export interface CountryPhoneInputProps {
    id?: string
    name?: string
    phone: string
    country: string
    onPhoneChange: (phone: string) => void
    onCountryChange: (country: string) => void
    label?: React.ReactNode
    required?: boolean
    placeholder?: string
    disabled?: boolean
    className?: string
    inputClassName?: string
    triggerClassName?: string
    error?: string | null
    maxLength?: number
    hint?: React.ReactNode
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
    id = 'phone',
    phone,
    country = 'LA',
    onPhoneChange,
    onCountryChange,
    label,
    required = false,
    placeholder = '20XXXXXXXX',
    disabled = false,
    className = '',
    inputClassName = '',
    triggerClassName = '',
    error,
    maxLength = 10,
    hint
}) => {
    const selectedCountry = COUNTRIES.find((c) => c.code === country) || COUNTRIES.find((c) => c.code === 'LA')

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numericOnly = e.target.value.replace(/\D/g, '').slice(0, maxLength)
        onPhoneChange(numericOnly)
    }

    return (
        <div className={`grid gap-2 ${className}`}>
            {label ? (
                <div className="flex items-center justify-between">
                    <Label htmlFor={id} className="text-sm font-medium flex items-center gap-1">
                        <span>{label}</span>
                        {required && <span className="text-destructive font-semibold">*</span>}
                    </Label>
                    {hint ? (
                        <span className="text-xs text-muted-foreground font-mono">{hint}</span>
                    ) : maxLength ? (
                        <span className="text-xs text-muted-foreground font-mono">
                            {phone?.length || 0}/{maxLength}
                        </span>
                    ) : null}
                </div>
            ) : null}

            <div className="flex gap-2">
                <Select value={country || 'LA'} onValueChange={onCountryChange} disabled={disabled}>
                    <SelectTrigger className={`w-[115px] sm:w-[130px] shrink-0 px-2.5 ${triggerClassName}`}>
                        <SelectValue>
                            {selectedCountry ? (
                                <span className="flex items-center gap-1.5 truncate text-xs sm:text-sm">
                                    <span className="text-base leading-none">{selectedCountry.flag}</span>
                                    <span className="font-mono text-xs">{selectedCountry.dialCode}</span>
                                </span>
                            ) : (
                                '🇱🇦 +856'
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                        {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                                <div className="flex items-center gap-2 py-0.5">
                                    <span className="text-base leading-none">{c.flag}</span>
                                    <span className="font-medium text-xs sm:text-sm truncate">
                                        {c.name} {c.code === 'LA' ? `(${c.native})` : ''}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono ml-auto pl-2">{c.dialCode}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input
                    id={id}
                    type="tel"
                    inputMode="numeric"
                    maxLength={maxLength}
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`flex-1 font-mono tracking-wider ${error ? 'border-amber-500 focus-visible:ring-amber-500' : ''} ${inputClassName}`}
                    required={required}
                />
            </div>

            {error && <p className="text-xs text-amber-600 dark:text-amber-400">{error}</p>}
        </div>
    )
}

export default CountryPhoneInput
