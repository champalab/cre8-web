import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import { RootState } from '../../../stores'
import { getDefaultAppPath } from '../../../config/navigation'
import { APP_LOGIN_ROLES, normalizeRole } from '../../../config/roles'
import { LanguageSwitcher } from '@/components/language-switcher'
import { PublicLangSync } from '@/components/public-lang-sync'
import { localizePath } from '@/seo/paths'
import { cn } from '@/lib/utils'
import type { AppLang } from '@/i18n'

const NAV = [
  { href: '#hero', labelKey: 'home' },
  { href: '#about', labelKey: 'about' },
  { href: '#services', labelKey: 'ourServices' },
  { href: '#influencers', labelKey: 'ourInfluencers' },
  { href: '#previousWork', labelKey: 'ourPreviousWork' },
  { href: '#contact', labelKey: 'contact' },
] as const

function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState('#hero')

  useEffect(() => {
    if (!enabled) return

    const update = () => {
      const marker = 96
      const sections = NAV.map((item) => document.getElementById(item.href.slice(1)))
        .filter((el): el is HTMLElement => Boolean(el))
        .sort((a, b) => a.offsetTop - b.offsetTop)

      if (sections.length === 0) return

      let current = `#${sections[0].id}`
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= marker) {
          current = `#${section.id}`
        }
      }
      setActive(current)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [enabled])

  return active
}

function PublicHeader() {
  const { t, i18n } = useTranslation('nav')
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const lang = (i18n.resolvedLanguage === 'en' ? 'en' : 'lo') as AppLang
  const homePath = localizePath('/', lang)
  const isHome = pathname === '/' || pathname === '/en'
  const isLogin = pathname === '/login' || pathname === '/en/login'
  const activeSection = useActiveSection(isHome)
  const auth = useSelector((state: RootState) => state.auth)
  const role = normalizeRole(auth?.role)
  const isSignedIn = Boolean(auth?.isLogin && role && APP_LOGIN_ROLES.includes(role))
  const appPath = getDefaultAppPath(role)

  const sectionHref = (hash: string) => (isHome ? hash : `${homePath}${hash}`)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 md:h-20 md:px-10">
        <Link
          to={isHome ? `${homePath}#hero` : homePath}
          className="shrink-0 flex items-center"
        >
          <img src="/images/logo.png" alt="CRE8 Logo" className="h-10 sm:h-12 w-auto object-contain rounded-sm" />
        </Link>
        <nav className="hidden items-center gap-6 xl:gap-8 xl:flex">
          {NAV.map((item) => {
            const isActive = isHome && activeSection === item.href
            return (
              <a
                key={item.href}
                href={sectionHref(item.href)}
                className={cn(
                  'relative pb-1 text-sm uppercase tracking-wider transition-colors hover:text-white',
                  isActive ? 'font-bold text-orange' : 'text-white/70'
                )}
              >
                {t(item.labelKey)}
                <span
                  className={cn(
                    'absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-orange transition-transform duration-300',
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  )}
                />
              </a>
            )
          })}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguageSwitcher variant="public" />
          {(isSignedIn || !isLogin) && (
            <Link
              to={isSignedIn ? appPath : '/login'}
              className={cn(
                'hidden text-sm font-semibold uppercase tracking-wider transition-colors hover:text-white sm:inline',
                isLogin ? 'text-orange' : 'text-white/70'
              )}
            >
              {isSignedIn ? t('dashboard') : t('signIn')}
            </Link>
          )}
          <a
            href={sectionHref('#contact')}
            className={cn(
              'hidden items-center gap-2 rounded-lg bg-orange px-4 py-2 font-cre8 font-semibold text-black shadow-[0_8px_24px_rgba(255,107,0,0.28)] transition-all hover:bg-orange/90 whitespace-nowrap shrink-0 sm:inline-flex',
              activeSection === '#contact' && isHome && 'ring-2 ring-white/30'
            )}
          >
            {t('getInTouch')}
            <ArrowRight className="size-4" />
          </a>
          <button
            type="button"
            className="inline-flex size-9 sm:size-10 items-center justify-center rounded-lg border border-white/20 text-white transition-colors hover:bg-white/10 hover:border-white/30 xl:hidden shrink-0"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={t('openMenu', { ns: 'common' })}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="border-t border-white/10 bg-black/95 backdrop-blur-2xl px-5 py-5 xl:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-3">
            {NAV.map((item) => {
              const isActive = isHome && activeSection === item.href
              return (
                <a
                  key={item.href}
                  href={sectionHref(item.href)}
                  className={cn(
                    'relative w-fit py-1 text-base uppercase tracking-wider transition-colors',
                    isActive ? 'font-bold text-orange' : 'text-white/80 hover:text-white'
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  {t(item.labelKey)}
                  <span
                    className={cn(
                      'absolute inset-x-0 bottom-0 h-0.5 origin-left bg-orange transition-transform duration-300',
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    )}
                  />
                </a>
              )
            })}
            <div className="mt-2 pt-3 border-t border-white/10 flex flex-col gap-3">
              {(isSignedIn || !isLogin) && (
                <Link
                  to={isSignedIn ? appPath : '/login'}
                  className="py-1 text-sm font-semibold uppercase tracking-wider text-orange hover:underline"
                  onClick={() => setMenuOpen(false)}
                >
                  {isSignedIn ? t('dashboard') : t('signIn')}
                </Link>
              )}
              <a
                href={sectionHref('#contact')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange py-3 font-cre8 font-semibold text-black shadow-[0_8px_24px_rgba(255,107,0,0.28)] transition-all hover:bg-orange/90 active:scale-[0.98]"
                onClick={() => setMenuOpen(false)}
              >
                {t('getInTouch')}
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}

function PublicFooter() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'en' ? 'en' : 'lo') as AppLang
  return (
    <footer className="w-full border-t border-white/10 bg-black py-8 text-white/70">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-6 text-sm md:flex-row md:px-10">
        <p>{t('footerCopyright', { year: 2026 })}</p>
        <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          <Link to={localizePath('/services', lang)} className="hover:text-white">
            {t('services', { ns: 'nav' })}
          </Link>
          <Link to={localizePath('/influencer-marketing', lang)} className="hover:text-white">
            {t('pages.influencer-marketing.h1', { ns: 'seo' })}
          </Link>
          <Link to={localizePath('/contact', lang)} className="hover:text-white">
            {t('contact', { ns: 'nav' })}
          </Link>
          <span>Tel/WA: 020 2224 1188</span>
          <span>cre8lao@gmail.com</span>
        </nav>
      </div>
    </footer>
  )
}

export default function PublicLayout() {
  return (
    <div className="cre8-home dark flex min-h-screen flex-col bg-black text-white antialiased">
      <PublicLangSync />
      <PublicHeader />
      <div className="flex flex-1 flex-col pt-16 md:pt-20">
        <Outlet />
      </div>
      <PublicFooter />
    </div>
  )
}
