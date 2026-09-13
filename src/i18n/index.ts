import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/lo'
import enApp from './locales/en/app.json'
import enAuth from './locales/en/auth.json'
import enCommon from './locales/en/common.json'
import enHome from './locales/en/home.json'
import enNav from './locales/en/nav.json'
import enSeo from './locales/en/seo.json'
import enSidebar from './locales/en/sidebar.json'
import loApp from './locales/lo/app.json'
import loAuth from './locales/lo/auth.json'
import loCommon from './locales/lo/common.json'
import loHome from './locales/lo/home.json'
import loNav from './locales/lo/nav.json'
import loSeo from './locales/lo/seo.json'
import loSidebar from './locales/lo/sidebar.json'

export const SUPPORTED_LANGS = ['en', 'lo'] as const
export type AppLang = (typeof SUPPORTED_LANGS)[number]

export const defaultNS = 'common'
export const resources = {
    en: { common: enCommon, nav: enNav, auth: enAuth, sidebar: enSidebar, home: enHome, app: enApp, seo: enSeo },
    lo: { common: loCommon, nav: loNav, auth: loAuth, sidebar: loSidebar, home: loHome, app: loApp, seo: loSeo }
} as const

const getInitialLang = (): AppLang => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('influ.lang') as AppLang | null
        if (stored && SUPPORTED_LANGS.includes(stored)) {
            return stored
        }
    }
    return 'en'
}

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: getInitialLang(),
        fallbackLng: 'en',
        supportedLngs: [...SUPPORTED_LANGS],
        defaultNS,
        ns: ['common', 'nav', 'auth', 'sidebar', 'home', 'app', 'seo'],
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage'],
            caches: ['localStorage'],
            lookupLocalStorage: 'influ.lang'
        }
    })

const syncDocumentLang = (lng?: string) => {
    const lang = lng === 'lo' ? 'lo' : 'en'
    document.documentElement.lang = lang
    dayjs.locale(lang)
}

i18n.on('languageChanged', syncDocumentLang)
syncDocumentLang(i18n.resolvedLanguage || getInitialLang())

export default i18n
