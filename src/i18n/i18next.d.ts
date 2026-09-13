import 'i18next'
import type enApp from './locales/en/app.json'
import type enAuth from './locales/en/auth.json'
import type enCommon from './locales/en/common.json'
import type enHome from './locales/en/home.json'
import type enNav from './locales/en/nav.json'
import type enSeo from './locales/en/seo.json'
import type enSidebar from './locales/en/sidebar.json'

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common'
        resources: {
            common: typeof enCommon
            nav: typeof enNav
            auth: typeof enAuth
            sidebar: typeof enSidebar
            home: typeof enHome
            app: typeof enApp
            seo: typeof enSeo
        }
    }

    interface TFunction {
        (key: `${string}:${string}` | (string & {}), options?: any): any
        (key: `${string}:${string}` | (string & {}), defaultValue?: string, options?: any): any
    }
}
