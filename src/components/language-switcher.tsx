import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { SUPPORTED_LANGS, type AppLang } from '@/i18n'
import { isPublicMarketingPath, localizePath } from '@/seo/paths'

type Props = {
    variant?: 'public' | 'app'
    className?: string
}

function LaoFlag({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            className={cn(
                'size-4 shrink-0 rounded-full overflow-hidden shadow-xs ring-1 ring-black/15 dark:ring-white/20',
                className
            )}
            aria-hidden="true"
        >
            <rect width="32" height="8" fill="#CE1126" />
            <rect y="8" width="32" height="16" fill="#002868" />
            <rect y="24" width="32" height="8" fill="#CE1126" />
            <circle cx="16" cy="16" r="5.5" fill="#FFFFFF" />
        </svg>
    )
}

function UkFlag({ className }: { className?: string }) {
    const clipId = useId()
    return (
        <svg
            viewBox="0 0 32 32"
            className={cn(
                'size-4 shrink-0 rounded-full overflow-hidden shadow-xs ring-1 ring-black/15 dark:ring-white/20',
                className
            )}
            aria-hidden="true"
        >
            <clipPath id={clipId}>
                <circle cx="16" cy="16" r="16" />
            </clipPath>
            <g clipPath={`url(#${clipId})`}>
                <path fill="#012169" d="M0 0h32v32H0z" />
                <path stroke="#FFFFFF" strokeWidth="4" d="M0 0l32 32M32 0L0 32" />
                <path stroke="#C8102E" strokeWidth="2.2" d="M0 0l32 32M32 0L0 32" />
                <path stroke="#FFFFFF" strokeWidth="6" d="M16 0v32M0 16h32" />
                <path stroke="#C8102E" strokeWidth="3.6" d="M16 0v32M0 16h32" />
            </g>
        </svg>
    )
}

export function LanguageSwitcher({ variant = 'app', className }: Props) {
    const { i18n, t } = useTranslation()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const current = (i18n.resolvedLanguage === 'en' ? 'en' : 'lo') as AppLang

    const selectLang = (lang: AppLang) => {
        if (current === lang) return
        void i18n.changeLanguage(lang)
        if (variant === 'public' && isPublicMarketingPath(pathname)) {
            const next = localizePath(pathname, lang)
            if (next !== pathname) navigate(next)
        }
    }

    const isPublic = variant === 'public'

    return (
        <div
            role="group"
            aria-label={t('language')}
            className={cn(
                'inline-flex h-8 items-center rounded-full p-0.5 text-xs transition-all duration-200 select-none',
                isPublic
                    ? 'bg-white/10 border border-white/15 backdrop-blur-md shadow-xs hover:bg-white/[0.14]'
                    : 'bg-muted/80 hover:bg-muted dark:bg-muted/50 border border-border/60 shadow-xs',
                className
            )}
        >
            {SUPPORTED_LANGS.map((lang) => {
                const active = current === lang
                const label = lang === 'lo' ? t('lao') : t('english')
                const Flag = lang === 'lo' ? LaoFlag : UkFlag

                return (
                    <button
                        key={lang}
                        type="button"
                        onClick={() => selectLang(lang)}
                        aria-pressed={active}
                        className={cn(
                            'relative inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isPublic
                                ? active
                                    ? 'bg-gradient-to-r from-orange to-amber-500 font-bold text-black shadow-sm shadow-orange/30'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                                : active
                                  ? 'bg-background font-semibold text-foreground shadow-xs ring-1 ring-border/25'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                        )}
                    >
                        <Flag className="size-3.5" />
                        <span className="leading-none">{label}</span>
                    </button>
                )
            })}
        </div>
    )
}
