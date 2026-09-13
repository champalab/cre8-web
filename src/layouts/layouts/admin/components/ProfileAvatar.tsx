import { alertSuccess } from '@/utils/alerts'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogOut, User, Mail, Phone, Eye, EyeOff, Loader2, Check, Circle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RootState } from '@/stores'
import { onLogout, onRefresh } from '@/stores/features/auth'
import { useLogoutMutation, useUpdateProfileMutation } from '@/stores/services/userApi'
import { useState } from 'react'

export default function ProfileAvatar() {
  const { t } = useTranslation('auth')
  const auth = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [logoutRequest] = useLogoutMutation()

  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation()
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const passwordRules = [
    { key: 'passwordLength', valid: Array.from(password).length >= 8 },
    { key: 'passwordUppercase', valid: /[A-Z]/.test(password) },
    { key: 'passwordLowercase', valid: /[a-z]/.test(password) },
    { key: 'passwordNumber', valid: /[0-9]/.test(password) },
    { key: 'passwordSymbol', valid: /[^\p{L}\p{N}\s]/u.test(password) },
    { key: 'passwordMaxBytes', valid: password.length > 0 && new TextEncoder().encode(password).length <= 72 },
  ]
  const passwordValid = !password || passwordRules.every(rule => rule.valid)
  const openProfile = () => {
    setName(auth.name || '')
    setCurrentPassword(''); setPassword(''); setConfirmation(''); setMessage(''); setShowPassword(false)
    setProfileOpen(true)
  }
  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving || !name.trim() || !passwordValid || password !== confirmation) return
    setMessage('')
    try {
      const result = await updateProfile({ name: name.trim(), ...(password ? { password, currentPassword } : {}) }).unwrap()
      if (!result.success) { setMessage(result.message || t('profileSaveFailed')); return }
      dispatch(onRefresh(result.data.user))
      setPassword(''); setCurrentPassword(''); setConfirmation(''); setShowPassword(false)
      setProfileOpen(false)
      void alertSuccess({ title: t('profileSaved'), text: result.message })
    } catch (error: any) {
      setMessage(error?.data?.message || t('profileSaveFailed'))
    }
  }

  const initials = auth.username
    ? auth.username
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  const logout = async () => {
    try {
      await logoutRequest().unwrap()
    } catch {
      // ignore network errors during logout
    }
    dispatch(onLogout())
    navigate('/')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative size-9 rounded-full p-0">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{auth.name || auth.username}</p>
              <p className="text-xs text-muted-foreground">{auth.email || '—'}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openProfile}>
            <User className="mr-2 size-4" />
            {t('account')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 size-4" />
            {t('logOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={profileOpen} onOpenChange={(open) => { if (!saving) { setProfileOpen(open); setPassword(''); setCurrentPassword(''); setConfirmation('') } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('account')}</DialogTitle>
            <DialogDescription>{t('profileEditHint')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
              <User className="size-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t('currentName')}</p>
                <p className="text-sm">{auth.name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
              <Phone className="size-4 text-primary" />
              <span className="text-sm">{auth?.username || '—'}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
              <Mail className="size-4 text-primary" />
              <span className="text-sm">{auth?.email || '—'}</span>
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">{t('profileName')}</Label>
              <Input id="profile-name" value={name} onChange={e => setName(e.target.value)} required maxLength={255} autoComplete="name" disabled={saving} />
            </div>
            <p className="text-xs text-muted-foreground">{t('profilePasswordHint')}</p>
            {[
              { id: 'profile-current-password', label: 'currentPassword', value: currentPassword, setter: setCurrentPassword, autoComplete: 'current-password' },
              { id: 'profile-password', label: 'newPassword', value: password, setter: setPassword, autoComplete: 'new-password' },
              { id: 'profile-confirm-password', label: 'confirmPassword', value: confirmation, setter: setConfirmation, autoComplete: 'new-password' },
            ].map(field => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{t(field.label)}</Label>
                <Input id={field.id} type={showPassword ? 'text' : 'password'} value={field.value} onChange={e => field.setter(e.target.value)} autoComplete={field.autoComplete} disabled={saving}
                  aria-describedby={field.id === 'profile-password' ? 'profile-password-rules profile-password-status' : undefined}
                  aria-invalid={field.id === 'profile-password' ? Boolean(password && !passwordValid) : undefined} />
                {field.id === 'profile-password' && (
                  <div className="rounded-lg border p-3 space-y-2">
                    <ul id="profile-password-rules" className="grid gap-2 text-xs sm:grid-cols-2">
                      {passwordRules.map(rule => (
                        <li key={rule.key} className={`flex items-center gap-2 ${rule.valid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {rule.valid ? <Check aria-hidden="true" className="size-3.5 shrink-0" /> : <Circle aria-hidden="true" className="size-3.5 shrink-0" />}
                          <span className="sr-only">{t(rule.valid ? 'passwordRuleMet' : 'passwordRuleUnmet')}: </span>
                          {t(rule.key)}
                        </li>
                      ))}
                    </ul>
                    <p id="profile-password-status" role="status" className={`text-xs ${password && passwordValid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {password ? t(passwordValid ? 'passwordValid' : 'passwordProgress', { count: passwordRules.filter(rule => rule.valid).length, total: passwordRules.length }) : ''}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <Button type="button" variant="ghost" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {t(showPassword ? 'hidePassword' : 'showPassword')}
            </Button>
            <p className={`text-xs ${password && !passwordValid ? 'text-destructive' : 'text-muted-foreground'}`}>{t('passwordPolicy')}</p>
            {confirmation && confirmation !== password && <p className="text-sm text-destructive">{t('passwordMismatch')}</p>}
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <Button type="submit" disabled={saving || !name.trim() || !passwordValid || password !== confirmation}>
              {saving && <Loader2 className="size-4 animate-spin" />}{t('common:save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
