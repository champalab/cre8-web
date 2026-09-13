import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Loader2, Mail, ShieldCheck, LockKeyhole, Eye, EyeOff } from 'lucide-react'
import { RootState } from '../../../stores'
import { usePasswordLoginMutation, useRequestOtpMutation, useVerifyOtpMutation } from '../../../stores/services/userApi'
import { onLogin } from '../../../stores/features/auth'
import { ToastSuccess, ToastError } from '../../../utils/toasts'
import { alertError, alertWarning } from '../../../utils/alerts'
import env from '../../../env'
import { APP_LOGIN_ROLES, normalizeRole } from '../../../config/roles'
import { getDefaultAppPath } from '../../../config/navigation'
import { cn } from '@/lib/utils'
import { SignIn } from './type'

const Login = () => {
  const { t } = useTranslation('auth')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const auth = useSelector((state: RootState) => state.auth)
  const [requestOtp, { isLoading: requestingOtp }] = useRequestOtpMutation()
  const [verifyOtpMutation, verifyState] = useVerifyOtpMutation()

  const [passwordLogin, passwordState] = usePasswordLoginMutation()
  const [method, setMethod] = useState<'password' | 'otp'>('password')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<SignIn>({ shouldUnregister: true })

  useEffect(() => {
    if (resendCooldown <= 0) return

    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendCooldown])

  const sendOtp = async (email: string) => {
    const { data, error }: any = await requestOtp({ email: email.trim() })

    if (data?.success) {
      setDevOtp(data?.data?.devOtp ?? null)
      setResendCooldown(data?.data?.resendAfterSeconds ?? 60)
      ToastSuccess(t('otpSentToast'), { autoClose: 2500 })
      return true
    }

    alertWarning({ text: data?.message || error?.data?.message || t('otpSendFailed') })
    return false
  }

  const handleRequestOtp = async ({ email }: SignIn) => {
    const trimmedEmail = email.trim()
    const sent = await sendOtp(trimmedEmail)
    if (!sent) return

    setLoginEmail(trimmedEmail)
    setStep('otp')
  }

  const handleResendOtp = async () => {
    const email = loginEmail || getValues('email')?.trim()
    if (!email || resendCooldown > 0 || requestingOtp) return
    await sendOtp(email)
  }

  const handleVerifyOtp = async ({ otp, password }: SignIn) => {
    const email = loginEmail || getValues('email')?.trim()
    if (!email) {
      alertWarning({ text: t(method === 'password' ? 'loginIdentifierRequired' : 'emailRequired') })
      return
    }

    const { data, error }: any = method === 'password'
      ? await passwordLogin({ identifier: email, password: password || '' })
      : await verifyOtpMutation({ email, otp: `${otp || ''}`.trim() })

    if (data?.success && data?.data?.user) {
      const role = normalizeRole(data.data.user.role)
      if (!role || !APP_LOGIN_ROLES.includes(role)) {
        alertError({ title: t('unauthorized') })
        return
      }

      dispatch(
        onLogin({
          id: data.data.user.id,
          uuid: data.data.user.uuid,
          username: data.data.user.username,
          email: data.data.user.email,
          role,
          token: null,
          name: data.data.user.name
        })
      )
      ToastSuccess(t('welcome', { name: data.data.user.name }), { autoClose: 2000 })
      navigate(getDefaultAppPath(role))
      return
    }

    ToastError(data?.message || error?.data?.message || t(method === 'password' ? 'invalidPassword' : 'invalidOtp'), { autoClose: 4000 })
  }

  useEffect(() => {
    if (auth?.isLogin && auth.role && APP_LOGIN_ROLES.includes(normalizeRole(auth.role) as any)) {
      navigate(getDefaultAppPath(normalizeRole(auth.role)))
    }
  }, [auth, navigate])

  const isLoading = requestingOtp || verifyState.isLoading || passwordState.isLoading

  const fieldClass =
    'h-11 w-full rounded-lg border border-white/15 bg-black pl-10 pr-3 text-sm text-white shadow-sm placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 disabled:cursor-not-allowed disabled:opacity-50'
  const primaryBtnClass =
    'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange font-cre8 text-sm font-semibold text-black shadow-md transition-all hover:bg-orange/90 disabled:pointer-events-none disabled:opacity-50'
  const ghostBtnClass =
    'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-secondary text-sm font-semibold text-white transition-all hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50'

  return (
    <div className="grid min-h-full flex-1 bg-black lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-muted lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,0,0.18),transparent_55%)]" />
        <div className="relative z-10 flex w-full flex-col justify-between p-10 md:p-14">
          <div>
            <div className="mb-6 inline-flex items-center rounded-full bg-secondary px-4 py-1 font-cre8 text-xs uppercase tracking-wider text-orange">
              {t('teamPortal')}
            </div>
            <h1 className="max-w-md font-cre8 text-4xl font-bold leading-tight tracking-tight text-white">
              {t('heroTitle')}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {t('heroSubtitle')}
            </p>
          </div>
          <div className="grid max-w-md grid-cols-3 gap-4">
            {[
              { letter: 'C', title: t('creativity'), color: 'text-orange-soft' },
              { letter: 'R', title: t('relevancy'), color: 'text-orange/80' },
              { letter: 'E', title: t('effectiveness'), color: 'text-orange' },
            ].map((item) => (
              <div key={item.letter} className="rounded-xl border border-white/15 bg-card p-4">
                <span className={cn('mb-1 block text-3xl font-bold', item.color)}>{item.letter}</span>
                <p className="text-xs font-semibold text-white">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md rounded-xl border border-white/15 bg-card p-8 shadow-lg">
          <div className="mb-8 text-center">
            <img src="/images/logo.png" alt="CRE8 Logo" />
            <h2 className="mt-3 font-cre8 text-2xl font-bold text-white">{t('signIn')}</h2>
            <p className="mt-2 text-sm text-white/70">{t('signInHint')}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2" role="group" aria-label={t('loginMethod')}>
            {(['password', 'otp'] as const).map((item) => (
              <button key={item} type="button" disabled={isLoading} aria-pressed={method === item}
                className={method === item ? primaryBtnClass : ghostBtnClass}
                onClick={() => { setMethod(item); setStep('email'); setLoginEmail(''); setDevOtp(null); setShowPassword(false); reset({ email: getValues('email') || loginEmail }) }}>
                {t(item === 'password' ? 'password' : 'otpLabel')}
              </button>
            ))}
          </div>
          {step === 'email' ? (
            <form className="space-y-4" onSubmit={handleSubmit(method === 'password' ? handleVerifyOtp : handleRequestOtp)} noValidate>
              <div className="space-y-2">
                <label htmlFor="email-input" className="text-sm font-semibold text-white">
                  {t(method === 'password' ? 'loginIdentifier' : 'email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/70" />
                  <input
                    id="email-input"
                    {...register('email', { required: t(method === 'password' ? 'loginIdentifierRequired' : 'emailRequired') })}
                    type={method === 'password' ? 'text' : 'email'}
                    autoFocus
                    autoComplete={method === 'password' ? 'username' : 'email'}
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={method === 'password' ? t('loginIdentifier') : 'name@company.com'}
                    className={fieldClass}
                    readOnly={isLoading}
                  />
                </div>
                {errors.email && <p className="text-sm text-orange">{errors.email.message}</p>}
              </div>

              {method === 'password' && (
                <div className="space-y-2">
                  <label htmlFor="password-input" className="text-sm font-semibold text-white">{t('password')}</label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/70" />
                    <input id="password-input" {...register('password', { required: t('passwordRequired') })}
                      type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                      className={cn(fieldClass, 'pr-12')} readOnly={isLoading} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={t(showPassword ? 'hidePassword' : 'showPassword')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-orange">{errors.password.message}</p>}
                  <p className="text-xs text-white/70">{t('passwordHelp')}</p>
                </div>
              )}
              <button id="login-submit-btn" type="submit" className={primaryBtnClass} disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : t(method === 'password' ? 'signIn' : 'sendOtp')}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit(handleVerifyOtp)} noValidate>
              {loginEmail && (
                <p className="text-sm text-white/70">
                  {t('otpSentTo', { email: loginEmail })}
                </p>
              )}

              <div className="space-y-2">
                <label htmlFor="otp-input" className="text-sm font-semibold text-white">
                  {t('otpLabel')}
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/70" />
                  <input
                    id="otp-input"
                    {...register('otp', { required: t('otpRequired'), minLength: 6, maxLength: 6 })}
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="000000"
                    className={cn(fieldClass, 'tracking-[0.3em]')}
                    readOnly={isLoading}
                  />
                </div>
                {errors.otp && <p className="text-sm text-orange">{errors.otp.message}</p>}
                {devOtp && (
                  <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-white/70">
                    {t('devOtp')} <span className="font-mono font-semibold text-orange">{devOtp}</span>
                  </p>
                )}
              </div>

              <button type="submit" className={primaryBtnClass} disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : t('confirmOtp')}
              </button>

              <button
                type="button"
                className={ghostBtnClass}
                disabled={isLoading || requestingOtp || resendCooldown > 0}
                onClick={handleResendOtp}
              >
                {requestingOtp ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : resendCooldown > 0 ? (
                  t('resendOtpIn', { seconds: resendCooldown })
                ) : (
                  t('resendOtp')
                )}
              </button>

              <button
                type="button"
                className={ghostBtnClass}
                onClick={() => {
                  setStep('email')
                  setResendCooldown(0)
                  setDevOtp(null)
                }}
              >
                {t('changeEmail')}
              </button>
            </form>
          )}

          <div className="mt-6 flex justify-center">
            <span className="rounded-full bg-secondary px-3 py-1 text-[10px] uppercase tracking-wider text-white/70">
              {env.NODE_ENV}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
