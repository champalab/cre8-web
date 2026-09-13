import { useEffect, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
import i18n from '@/i18n'
import type { SeoPageKey } from '@/seo/pages'
import { pageKeyFromBarePath } from '@/seo/pages'
import { absoluteUrl, isAppPath, isLoginPath, localizePath, stripLangPrefix } from '@/seo/paths'
import {
    SITE_COUNTRY,
    SITE_EMAIL,
    SITE_LEGAL_NAME,
    SITE_LOCALITY,
    SITE_NAME,
    SITE_OG_IMAGE,
    SITE_PHONE_E164,
    SITE_SAME_AS,
    SITE_URL
} from '@/seo/site'

type Faq = { q: string; a: string }

export const SERVICE_TYPES = [
    'Influencer marketing',
    'Digital marketing',
    'Social media management',
    'Video production',
    'Public relations',
    'Consumer research'
] as const

export type ServiceType = typeof SERVICE_TYPES[number]

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
    if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
    }
    el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string, hreflang?: string) {
    const selector = hreflang
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]:not([hreflang])`
    let el = document.head.querySelector(selector) as HTMLLinkElement | null
    if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        if (hreflang) el.setAttribute('hreflang', hreflang)
        document.head.appendChild(el)
    }
    el.setAttribute('href', href)
}

function upsertJsonLd(id: string, data: Record<string, unknown> | null) {
    const existing = document.getElementById(id)
    if (!data) {
        existing?.remove()
        return
    }
    let el = existing as HTMLScriptElement | null
    if (!el) {
        el = document.createElement('script')
        el.id = id
        el.type = 'application/ld+json'
        document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(data)
}

function seoT(key: string, options?: Record<string, unknown>) {
    return i18n.t(key, { ns: 'seo', ...options }) as string
}

function pageCopy(key: SeoPageKey) {
    return {
        title: seoT(`pages.${key}.title`),
        description: seoT(`pages.${key}.description`)
    }
}

function subscribeLanguage(onStoreChange: () => void) {
    i18n.on('languageChanged', onStoreChange)
    return () => {
        i18n.off('languageChanged', onStoreChange)
    }
}

function getLanguage() {
    return i18n.resolvedLanguage === 'en' ? 'en' : 'lo'
}

export function SeoHead() {
    const { pathname } = useLocation()
    const lang = useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage)
    const bare = stripLangPrefix(pathname)
    const pageKey = pageKeyFromBarePath(bare)
    const noIndex = isAppPath(pathname) || isLoginPath(pathname)

    useEffect(() => {
        const copy = pageKey
            ? pageCopy(pageKey)
            : noIndex
                ? {
                    title: `${SITE_NAME} | Sign in`,
                    description: 'Sign in to the CRE8 influencer marketing workspace.'
                }
                : pageCopy('home')

        document.title = copy.title
        upsertMeta('name', 'title', copy.title)
        upsertMeta('name', 'description', copy.description)
        upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
        upsertMeta('property', 'og:type', 'website')
        upsertMeta('property', 'og:site_name', SITE_LEGAL_NAME)
        upsertMeta('property', 'og:title', copy.title)
        upsertMeta('property', 'og:description', copy.description)
        upsertMeta('property', 'og:image', SITE_OG_IMAGE)
        upsertMeta('property', 'og:locale', lang === 'en' ? 'en_US' : 'lo_LA')
        upsertMeta('property', 'og:locale:alternate', lang === 'en' ? 'lo_LA' : 'en_US')
        upsertMeta('property', 'twitter:card', 'summary_large_image')
        upsertMeta('property', 'twitter:title', copy.title)
        upsertMeta('property', 'twitter:description', copy.description)
        upsertMeta('property', 'twitter:image', SITE_OG_IMAGE)

        if (noIndex || !pageKey) {
            const canonical = absoluteUrl(pathname === '/en' ? '/en' : pathname, SITE_URL)
            upsertMeta('property', 'og:url', canonical)
            upsertMeta('property', 'twitter:url', canonical)
            upsertLink('canonical', canonical)
            upsertJsonLd('seo-jsonld', null)
            upsertJsonLd('seo-jsonld-faq', null)
            return
        }

        const loPath = localizePath(bare, 'lo')
        const enPath = localizePath(bare, 'en')
        const canonicalPath = lang === 'en' ? enPath : loPath
        const canonical = absoluteUrl(canonicalPath, SITE_URL)
        const loUrl = absoluteUrl(loPath, SITE_URL)
        const enUrl = absoluteUrl(enPath, SITE_URL)

        upsertMeta('property', 'og:url', canonical)
        upsertMeta('property', 'twitter:url', canonical)
        upsertLink('canonical', canonical)
        upsertLink('alternate', loUrl, 'lo')
        upsertLink('alternate', enUrl, 'en')
        upsertLink('alternate', loUrl, 'x-default')

        const faqs = i18n.t(`pages.${pageKey}.faqs`, { ns: 'seo', returnObjects: true })
        const faqList = Array.isArray(faqs) ? (faqs as Faq[]) : []

        const organization = {
            '@type': 'ProfessionalService',
            '@id': `${SITE_URL}/#organization`,
            name: SITE_LEGAL_NAME,
            alternateName: SITE_NAME,
            url: SITE_URL,
            image: SITE_OG_IMAGE,
            email: SITE_EMAIL,
            telephone: SITE_PHONE_E164,
            areaServed: { '@type': 'Country', name: 'Laos' },
            address: {
                '@type': 'PostalAddress',
                addressLocality: SITE_LOCALITY,
                addressCountry: SITE_COUNTRY
            },
            sameAs: [...SITE_SAME_AS],
            knowsLanguage: ['lo', 'en'],
            serviceType: [...SERVICE_TYPES]
        }

        const website = {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: SITE_URL,
            name: SITE_LEGAL_NAME,
            inLanguage: ['lo', 'en'],
            publisher: { '@id': `${SITE_URL}/#organization` }
        }

        const breadcrumbs = [
            { name: seoT('breadcrumbHome'), path: localizePath('/', lang) },
            ...(pageKey !== 'home'
                ? pageKey === 'services' || pageKey === 'contact'
                    ? [{ name: copy.title, path: canonicalPath }]
                    : [
                        { name: seoT('breadcrumbServices'), path: localizePath('/services', lang) },
                        { name: copy.title, path: canonicalPath }
                    ]
                : [])
        ]

        upsertJsonLd('seo-jsonld', {
            '@context': 'https://schema.org',
            '@graph': [
                organization,
                website,
                {
                    '@type': 'WebPage',
                    '@id': `${canonical}#webpage`,
                    url: canonical,
                    name: copy.title,
                    description: copy.description,
                    inLanguage: lang,
                    isPartOf: { '@id': `${SITE_URL}/#website` },
                    about: { '@id': `${SITE_URL}/#organization` },
                    breadcrumb: {
                        '@type': 'BreadcrumbList',
                        itemListElement: breadcrumbs.map((item, index) => ({
                            '@type': 'ListItem',
                            position: index + 1,
                            name: item.name,
                            item: absoluteUrl(item.path, SITE_URL)
                        }))
                    }
                }
            ]
        })

        upsertJsonLd(
            'seo-jsonld-faq',
            faqList.length
                ? {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: faqList.map((faq) => ({
                        '@type': 'Question',
                        name: faq.q,
                        acceptedAnswer: { '@type': 'Answer', text: faq.a }
                    }))
                }
                : null
        )
    }, [lang, noIndex, pageKey, pathname])

    return null
}
