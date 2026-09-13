import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Save, Eye, EyeOff, Check, Circle } from 'lucide-react'
import { User, UserCreate } from '../type'
import ToastComponent from '../../../../components/ToastComponent'
import PhoneNumber from '../../../../components/PhoneNumber'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface UserModalProps {
    onSubmit: (values: UserCreate) => void
    refetch: () => void
    initialValues?: Partial<User>
    mode: 'create' | 'update'
}

const defaultValues: UserCreate = {
    name: '',
    username: '',
    email: '',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    id: 0,
    comments: null
}

const ROLES = ['ADMIN', 'FINANCE', 'EMPLOYEE', 'AGENT']
const STATUS = ['ACTIVE', 'INACTIVE']

const UserModal: React.FC<UserModalProps> = ({ onSubmit, refetch, initialValues, mode }) => {
    const { t } = useTranslation('app')
    const [values, setValues] = useState<UserCreate>(defaultValues)
    const [open, setOpen] = useState(false)

    const [showPassword, setShowPassword] = useState(false)
    const password = values.password || ''
    const passwordRules = [
        { key: 'passwordLength', valid: Array.from(password).length >= 8 },
        { key: 'passwordUppercase', valid: /[A-Z]/.test(password) },
        { key: 'passwordLowercase', valid: /[a-z]/.test(password) },
        { key: 'passwordNumber', valid: /[0-9]/.test(password) },
        { key: 'passwordSymbol', valid: /[^\p{L}\p{N}\s]/u.test(password) },
        { key: 'passwordMaxBytes', valid: password.length > 0 && new TextEncoder().encode(password).length <= 72 },
    ]
    const passwordValid = passwordRules.every(rule => rule.valid)

    useEffect(() => {
        setShowPassword(false)
        if (initialValues) {
            setValues({ ...defaultValues, ...initialValues })
        } else {
            setValues(defaultValues)
        }
    }, [initialValues, open])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (name === 'tel') {
            const val = value.replace(/[^0-9]/g, '')
            setValues((prev) => ({ ...prev, username: val }))
        } else {
            setValues((prev) => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password && !passwordValid) return
        const result = await onSubmit({ ...values, password: values.password || undefined })
        const data = (result as any)?.data
        ToastComponent(data)
        if (data && data.status === 'success') {
            handleClose()
            refetch()
        }
    }

    const handleClose = () => {
        setOpen(!open)
    }

    return (
        <>
            {mode === 'create' ? (
                <Button onClick={handleClose}>
                    <Plus className="size-4" />
                    {t('users.create')}
                </Button>
            ) : (
                <Button variant="outline" onClick={handleClose}>
                    <Pencil className="size-4" />
                    {t('common:edit')}
                </Button>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {mode === 'create' ? t('users.create') : t('users.edit')}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('users.fullName')}</Label>
                            <Input
                                id="name"
                                name="name"
                                value={values.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-password">{t('auth:password')}</Label>
                            <div className="relative">
                                <Input id="user-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                                    value={password} onChange={handleChange} className="pr-12"
                                    aria-describedby="user-password-hint user-password-rules user-password-status"
                                    aria-invalid={password.length > 0 && !passwordValid} />
                                <button type="button" onClick={() => setShowPassword(previous => !previous)}
                                    aria-label={t(showPassword ? 'auth:hidePassword' : 'auth:showPassword')}
                                    aria-pressed={showPassword}
                                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            <p id="user-password-hint" className="text-xs text-muted-foreground">{t('auth:passwordAdminHint')}</p>
                            <ul id="user-password-rules" className="grid gap-1 text-xs sm:grid-cols-2">
                                {passwordRules.map(rule => (
                                    <li key={rule.key} className={`flex items-center gap-2 ${rule.valid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                        {rule.valid ? <Check aria-hidden="true" className="size-3.5 shrink-0" /> : <Circle aria-hidden="true" className="size-3.5 shrink-0" />}
                                        <span className="sr-only">{t(rule.valid ? 'auth:passwordRuleMet' : 'auth:passwordRuleUnmet')}: </span>
                                        {t(`auth:${rule.key}`)}
                                    </li>
                                ))}
                            </ul>
                            <p id="user-password-status" role="status" aria-live="polite" className={`text-xs ${passwordValid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                {password ? t(passwordValid ? 'auth:passwordValid' : 'auth:passwordProgress', { count: passwordRules.filter(rule => rule.valid).length, total: passwordRules.length }) : ''}
                            </p>
                        </div>
                        <PhoneNumber
                            label={t('users.phoneNumber')}
                            placeholder="9999 9999"
                            name="tel"
                            value={values.username}
                            onChange={handleChange}
                        />
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('users.emailOtp')}</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={values.email || ''}
                                onChange={handleChange}
                                required={mode === 'create'}
                                placeholder=''

                            />
                            <p className="text-xs text-muted-foreground">
                                {t('users.emailHint')}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="comments">{t('users.notes')}</Label>
                            <Textarea
                                id="comments"
                                name="comments"
                                value={values.comments ?? ''}
                                onChange={handleChange}
                                rows={2}
                            />
                        </div>
                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium">{t('users.role')}</legend>
                            <div className="flex flex-wrap gap-4">
                                {ROLES.map((role) => (
                                    <label key={role} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            name="role"
                                            value={role}
                                            checked={values.role === role}
                                            onChange={handleChange}
                                            className="size-4"
                                        />
                                        {role}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium">{t('users.access')}</legend>
                            <div className="flex flex-wrap gap-4">
                                {STATUS.map((status) => (
                                    <label key={status} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            name="status"
                                            value={status}
                                            checked={values.status === status}
                                            onChange={handleChange}
                                            className="size-4"
                                        />
                                        {status}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={handleClose}>
                                {t('common:cancel')}
                            </Button>
                            <Button type="submit" disabled={password.length > 0 && !passwordValid}>
                                <Save className="size-4" />
                                {t('common:save')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default UserModal
