import type { AppLang } from '@/i18n'

export function isEnglishPath(pathname: string): boolean {
    return pathname === '/en' || pathname.startsWith('/en/')
}

export function stripLangPrefix(pathname: string): string {
    if (pathname === '/en') return '/'
    if (pathname.startsWith('/en/')) {
        const rest = pathname.slice(3)
        return rest.startsWith('/') ? rest : `/${rest}`
    }
    return pathname
}

export function localizePath(pathname: string, lang: AppLang): string {
    const bare = stripLangPrefix(pathname)
    if (lang === 'en') return bare === '/' ? '/en' : `/en${bare}`
    return bare || '/'
}

export function langFromPath(pathname: string): AppLang | null {
    if (isEnglishPath(pathname)) return 'en'
    return null
}

export function isAppPath(pathname: string): boolean {
    return pathname === '/app' || pathname.startsWith('/app/')
}

export function isLoginPath(pathname: string): boolean {
    return pathname === '/login' || pathname === '/en/login'
}

export function isPublicMarketingPath(pathname: string): boolean {
    return !isAppPath(pathname) && !isLoginPath(pathname) && !pathname.startsWith('/public/')
}

export function absoluteUrl(pathname: string, siteUrl: string): string {
    if (pathname === '/') return `${siteUrl}/`
    return `${siteUrl}${pathname}`
}
