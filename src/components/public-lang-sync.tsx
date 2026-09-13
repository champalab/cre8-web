import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import i18n from '@/i18n'
import { isPublicMarketingPath, langFromPath } from '@/seo/paths'

export function PublicLangSync() {
    const { pathname } = useLocation()

    useEffect(() => {
        if (!isPublicMarketingPath(pathname)) return
        const explicitLang = langFromPath(pathname)
        if (explicitLang && i18n.resolvedLanguage !== explicitLang) {
            void i18n.changeLanguage(explicitLang)
        }
    }, [pathname])

    return null
}
