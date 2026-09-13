import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { SEO_SLUGS } from '@/seo/pages'
import { localizePath } from '@/seo/paths'
import type { AppLang } from '@/i18n'

export default function ServicesHub() {
    const { t, i18n } = useTranslation('seo')
    const lang = (i18n.resolvedLanguage === 'en' ? 'en' : 'lo') as AppLang

    return (
        <article className="mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-orange">CRE8</p>
            <h1 className="mb-4 max-w-4xl font-cre8 text-4xl font-bold leading-tight text-white md:text-5xl">
                {t('pages.services.h1')}
            </h1>
            <p className="mb-4 max-w-3xl text-lg leading-relaxed text-white/80">{t('pages.services.lead')}</p>
            <p className="mb-12 max-w-3xl text-base text-white/65">{t('pages.services.intro')}</p>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {SEO_SLUGS.map((slug) => (
                    <Link
                        key={slug}
                        to={localizePath(`/${slug}`, lang)}
                        className="group rounded-xl border border-white/15 bg-card p-6 transition-all hover:border-orange/60"
                    >
                        <h2 className="mb-2 font-cre8 text-xl font-bold text-white group-hover:text-orange">
                            {t(`pages.${slug}.h1`)}
                        </h2>
                        <p className="mb-4 text-sm leading-relaxed text-white/70">{t(`pages.${slug}.lead`)}</p>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-orange">
                            {t(`pages.${slug}.title`)}
                            <ArrowRight className="size-4" />
                        </span>
                    </Link>
                ))}
            </div>
        </article>
    )
}
