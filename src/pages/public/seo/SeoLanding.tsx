import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { HOME_RELATED_SLUGS, SEO_SLUGS, isSeoSlug, type SeoSlug } from '@/seo/pages'
import { localizePath } from '@/seo/paths'
import { SITE_EMAIL, SITE_PHONE_DISPLAY } from '@/seo/site'
import type { AppLang } from '@/i18n'

type Faq = { q: string; a: string }

function relatedSlugs(slug: SeoSlug): SeoSlug[] {
    const pool = slug === 'contact' ? HOME_RELATED_SLUGS : SEO_SLUGS.filter((item) => item !== slug && item !== 'contact')
    return pool.slice(0, 4)
}

export default function SeoLanding() {
    const { slug } = useParams<{ slug: string }>()
    const { t, i18n } = useTranslation('seo')
    const lang = (i18n.resolvedLanguage === 'en' ? 'en' : 'lo') as AppLang

    if (!isSeoSlug(slug)) {
        return <Navigate to={localizePath('/', lang)} replace />
    }

    const body = t(`pages.${slug}.body` as never, { returnObjects: true })
    const offers = t(`pages.${slug}.offers` as never, { returnObjects: true })
    const audience = t(`pages.${slug}.audience` as never, { returnObjects: true })
    const faqs = t(`pages.${slug}.faqs` as never, { returnObjects: true })
    const bodyList = Array.isArray(body) ? (body as string[]) : []
    const offerList = Array.isArray(offers) ? (offers as string[]) : []
    const audienceList = Array.isArray(audience) ? (audience as string[]) : []
    const faqList = Array.isArray(faqs) ? (faqs as Faq[]) : []
    const contactPath = localizePath('/contact', lang)
    const servicesPath = localizePath('/services', lang)

    return (
        <article className="mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-orange">CRE8</p>
            <h1 className="mb-4 max-w-4xl font-cre8 text-4xl font-bold leading-tight text-white md:text-5xl">
                {t(`pages.${slug}.h1`)}
            </h1>
            <p className="mb-10 max-w-3xl text-lg leading-relaxed text-white/80">{t(`pages.${slug}.lead`)}</p>

            <div className="mb-12 flex flex-col gap-4 sm:flex-row">
                <Link
                    to={contactPath}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 font-semibold text-black transition-colors hover:bg-orange/90"
                >
                    {t('ctaContact')}
                    <ArrowRight className="size-4" />
                </Link>
                <Link
                    to={servicesPath}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                >
                    {t('ctaServices')}
                </Link>
            </div>

            {bodyList.length > 0 && (
                <div className="mb-12 max-w-3xl space-y-4 text-base leading-relaxed text-white/75">
                    {bodyList.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>
            )}

            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                {offerList.length > 0 && (
                    <section className="rounded-xl border border-white/15 bg-card p-6">
                        <h2 className="mb-4 font-cre8 text-xl font-bold text-white">{t('offersTitle')}</h2>
                        <ul className="list-inside list-disc space-y-2 text-sm text-white/75">
                            {offerList.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </section>
                )}
                {audienceList.length > 0 && (
                    <section className="rounded-xl border border-white/15 bg-card p-6">
                        <h2 className="mb-4 font-cre8 text-xl font-bold text-white">{t('audienceTitle')}</h2>
                        <ul className="list-inside list-disc space-y-2 text-sm text-white/75">
                            {audienceList.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            {slug === 'contact' && (
                <section className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <a
                        href="tel:02022241188"
                        className="rounded-xl border border-white/15 bg-card p-6 transition-colors hover:border-orange/60"
                    >
                        <p className="mb-1 text-xs font-bold uppercase text-white/60">Tel / WhatsApp</p>
                        <p className="text-lg font-bold text-white">{SITE_PHONE_DISPLAY}</p>
                    </a>
                    <a
                        href={`mailto:${SITE_EMAIL}`}
                        className="rounded-xl border border-white/15 bg-card p-6 transition-colors hover:border-orange/60"
                    >
                        <p className="mb-1 text-xs font-bold uppercase text-white/60">Email</p>
                        <p className="text-lg font-bold text-white">{SITE_EMAIL}</p>
                    </a>
                </section>
            )}

            {faqList.length > 0 && (
                <section className="mb-12">
                    <h2 className="mb-6 font-cre8 text-2xl font-bold text-white">{t('faqTitle')}</h2>
                    <div className="space-y-4">
                        {faqList.map((faq) => (
                            <div key={faq.q} className="rounded-xl border border-white/10 bg-muted/40 p-5">
                                <h3 className="mb-2 text-base font-bold text-white">{faq.q}</h3>
                                <p className="text-sm leading-relaxed text-white/70">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <h2 className="mb-4 font-cre8 text-xl font-bold text-white">{t('relatedTitle')}</h2>
                <div className="flex flex-wrap gap-3">
                    {relatedSlugs(slug).map((item) => (
                        <Link
                            key={item}
                            to={localizePath(`/${item}`, lang)}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:border-orange/60 hover:text-white"
                        >
                            {t(`pages.${item}.h1`)}
                        </Link>
                    ))}
                </div>
            </section>
        </article>
    )
}
