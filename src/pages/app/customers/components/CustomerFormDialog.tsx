import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Check, Circle, Sparkles, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { alertWarning } from '@/utils/alerts'
import { generateAutoPassword } from '@/utils/password'
import { ToastSuccess } from '@/utils/toasts'
import UserStatus from '@/components/UserStatus'
import CountryPhoneInput, { COUNTRIES, CountryOption } from '@/components/CountryPhoneInput'

export { COUNTRIES }
export type { CountryOption }

export type CustomerFormData = {
    full_name: string
    brand_name?: string
    business_type?: string
    website?: string
    address?: string
    email: string
    phone: string
    country?: string
    comment: string
    status: string
    password?: string
}

interface CustomerFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    isEditing: boolean
    form: CustomerFormData
    onChange: (form: CustomerFormData) => void
    onSubmit: () => void
}

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({ open, onOpenChange, isEditing, form, onChange, onSubmit }) => {
    const { t } = useTranslation(['app', 'auth', 'common'])
    const [showPassword, setShowPassword] = useState(false)
    const [copied, setCopied] = useState(false)

    const cleanPhone = (form.phone || '').replace(/\D/g, '')
    const isPhoneValid = cleanPhone.length === 10

    const password = form.password || ''
    const passwordRules = [
        { key: 'passwordLength', valid: Array.from(password).length >= 8 },
        { key: 'passwordUppercase', valid: /[A-Z]/.test(password) },
        { key: 'passwordLowercase', valid: /[a-z]/.test(password) },
        { key: 'passwordNumber', valid: /[0-9]/.test(password) },
        { key: 'passwordSymbol', valid: /[^\p{L}\p{N}\s]/u.test(password) },
        { key: 'passwordMaxBytes', valid: password.length > 0 && new TextEncoder().encode(password).length <= 72 }
    ]
    const passwordValid = passwordRules.every((rule) => rule.valid)
    const canSubmit = (!password || passwordValid) && Boolean(form.full_name?.trim()) && isPhoneValid

    useEffect(() => {
        if (!open) {
            setShowPassword(false)
            setCopied(false)
        }
    }, [open])

    const handleGeneratePassword = () => {
        const newPassword = generateAutoPassword(14)
        onChange({ ...form, password: newPassword })
        setShowPassword(true)
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard
                .writeText(newPassword)
                .then(() => {
                    ToastSuccess(t('auth:passwordCopied'))
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                })
                .catch(() => {})
        }
    }

    const handleCopyPassword = () => {
        if (!password) return
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard
                .writeText(password)
                .then(() => {
                    ToastSuccess(t('auth:passwordCopied'))
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                })
                .catch(() => {})
        }
    }

    const handleSave = () => {
        if (!form.full_name?.trim()) {
            return alertWarning({ text: t('customers.enterFullName') })
        }
        if (!isPhoneValid) {
            return alertWarning({ text: t('customers.phone10DigitsRequired') })
        }
        if (password && !passwordValid) return
        onSubmit()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? t('customers.edit') : t('customers.create')}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-3">
                    {/* Primary Info: Company Name & Brand Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full_name" className="text-sm font-medium">
                                {t('customers.fullNameRequired')}
                            </Label>
                            <Input
                                id="full_name"
                                value={form.full_name}
                                onChange={(e) => onChange({ ...form, full_name: e.target.value })}
                                placeholder={t('customers.fullNamePlaceholder')}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="brand_name" className="text-sm font-medium flex items-center justify-between">
                                <span>{t('customers.brandName')}</span>
                                <span className="text-xs text-muted-foreground font-normal">{t('common:optional')}</span>
                            </Label>
                            <Input
                                id="brand_name"
                                value={form.brand_name || ''}
                                onChange={(e) => onChange({ ...form, brand_name: e.target.value })}
                                placeholder={t('customers.brandNamePlaceholder')}
                            />
                        </div>
                    </div>

                    {/* Business Type & Website */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="business_type" className="text-sm font-medium flex items-center justify-between">
                                <span>{t('customers.businessType')}</span>
                                <span className="text-xs text-muted-foreground font-normal">{t('common:optional')}</span>
                            </Label>
                            <Input
                                id="business_type"
                                value={form.business_type || ''}
                                onChange={(e) => onChange({ ...form, business_type: e.target.value })}
                                placeholder={t('customers.businessTypePlaceholder')}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="website" className="text-sm font-medium flex items-center justify-between">
                                <span>{t('customers.website')}</span>
                                <span className="text-xs text-muted-foreground font-normal">{t('common:optional')}</span>
                            </Label>
                            <Input
                                id="website"
                                type="url"
                                value={form.website || ''}
                                onChange={(e) => onChange({ ...form, website: e.target.value })}
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>

                    {/* Contact Info: Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-sm font-medium flex items-center justify-between">
                                <span>{t('common:email')}</span>
                                <span className="text-xs text-muted-foreground font-normal">{t('common:optional')}</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) => onChange({ ...form, email: e.target.value })}
                                placeholder="name@company.com"
                            />
                        </div>
                        <CountryPhoneInput
                            id="phone"
                            phone={form.phone}
                            country={form.country || 'LA'}
                            onPhoneChange={(phone) => onChange({ ...form, phone })}
                            onCountryChange={(country) => onChange({ ...form, country })}
                            label={t('common:phone')}
                            required
                            placeholder={t('customers.phonePlaceholder')}
                            error={form.phone && !isPhoneValid ? `${t('customers.phone10DigitsRequired')} (${cleanPhone.length}/10)` : null}
                            hint={`${cleanPhone.length}/10 ${t('customers.digits')}`}
                            maxLength={10}
                        />
                    </div>

                    {/* Password Field with Auto Generate */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="customer-password" className="text-sm font-medium flex items-center gap-1.5">
                                <span>{t('auth:password')}</span>
                                <span className="text-xs text-muted-foreground font-normal">({t('common:optional')})</span>
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleGeneratePassword}
                                className="h-7 px-2.5 text-xs gap-1.5 font-normal text-muted-foreground hover:text-foreground"
                            >
                                <Sparkles className="size-3.5 text-primary" />
                                {t('auth:autoPassword')}
                            </Button>
                        </div>
                        <div className="relative">
                            <Input
                                id="customer-password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => onChange({ ...form, password: e.target.value })}
                                className={password ? 'pr-20' : 'pr-11'}
                                placeholder={t('customers.passwordPlaceholder')}
                                aria-describedby="customer-password-hint customer-password-rules customer-password-status"
                                aria-invalid={password.length > 0 && !passwordValid}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 gap-0.5">
                                {password && (
                                    <button
                                        type="button"
                                        onClick={handleCopyPassword}
                                        title={t('auth:copyPassword')}
                                        aria-label={t('auth:copyPassword')}
                                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {copied ? <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-3.5" />}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={t(showPassword ? 'auth:hidePassword' : 'auth:showPassword')}
                                    aria-pressed={showPassword}
                                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>
                        <p id="customer-password-hint" className="text-xs text-muted-foreground">
                            {t('auth:passwordAdminHint')}
                        </p>
                        <ul id="customer-password-rules" className="grid gap-1.5 text-xs sm:grid-cols-2 pt-1" aria-label={t('auth:passwordPolicy')}>
                            {passwordRules.map((rule) => (
                                <li
                                    key={rule.key}
                                    className={`flex items-center gap-2 transition-colors duration-150 ${
                                        rule.valid ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'
                                    }`}
                                >
                                    {rule.valid ? (
                                        <Check aria-hidden="true" className="size-3.5 shrink-0" />
                                    ) : (
                                        <Circle aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
                                    )}
                                    <span className="sr-only">{t(rule.valid ? 'auth:passwordRuleMet' : 'auth:passwordRuleUnmet')}: </span>
                                    <span>{t(`auth:${rule.key}`)}</span>
                                </li>
                            ))}
                        </ul>
                        <p
                            id="customer-password-status"
                            role="status"
                            aria-live="polite"
                            className={`text-xs transition-colors ${
                                passwordValid ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'
                            }`}
                        >
                            {password
                                ? t(passwordValid ? 'auth:passwordValid' : 'auth:passwordProgress', {
                                      count: passwordRules.filter((r) => r.valid).length,
                                      total: passwordRules.length
                                  })
                                : ''}
                        </p>
                    </div>

                    {/* Address Field */}
                    <div className="grid gap-2">
                        <Label htmlFor="address" className="text-sm font-medium flex items-center justify-between">
                            <span>{t('customers.address')}</span>
                            <span className="text-xs text-muted-foreground font-normal">{t('common:optional')}</span>
                        </Label>
                        <Input
                            id="address"
                            value={form.address || ''}
                            onChange={(e) => onChange({ ...form, address: e.target.value })}
                            placeholder={t('customers.addressPlaceholder')}
                        />
                    </div>

                    {/* Status & Comment */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <UserStatus values={form.status} handleChange={(value) => onChange({ ...form, status: value.target.value })} />

                        <div className="grid gap-2">
                            <Label htmlFor="comment" className="text-sm font-medium flex items-center justify-between">
                                <span>{t('common:comment')}</span>
                                <span className="text-xs text-muted-foreground font-normal">{t('common:optional')}</span>
                            </Label>
                            <Textarea
                                id="comment"
                                value={form.comment}
                                onChange={(e) => onChange({ ...form, comment: e.target.value })}
                                placeholder={t('customers.commentPlaceholder')}
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common:cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={!canSubmit}>
                        {t('common:save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CustomerFormDialog
