import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { localizePath } from '@/seo/paths'
import type { AppLang } from '@/i18n'

export default function TermsPage() {
    const { i18n } = useTranslation()
    const lang = (i18n.resolvedLanguage === 'en' ? 'en' : 'lo') as AppLang
    const homePath = localizePath('/', lang)
    const isLao = lang === 'lo'

    return (
        <article className="mx-auto w-full max-w-4xl px-6 py-12 text-white/90 md:px-10">
            <Link
                to={homePath}
                className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-orange"
            >
                <ArrowLeft className="size-4" />
                {isLao ? 'ກັບຄືນໜ້າຫຼັກ' : 'Back to Home'}
            </Link>

            <div className="mb-8 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-orange/15 text-orange">
                    <FileText className="size-6" />
                </div>
                <div>
                    <h1 className="font-cre8 text-3xl font-bold tracking-tight text-white md:text-4xl">
                        {isLao ? 'ເງື່ອນໄຂການໃຫ້ບໍລິການ (Terms of Service)' : 'Terms of Service'}
                    </h1>
                    <p className="text-sm text-white/60">
                        {isLao ? 'ອັບເດດລ້າສຸດ: 27 ຕຸລາ 2026' : 'Last updated: October 27, 2026'}
                    </p>
                </div>
            </div>

            <div className="space-y-8 text-sm leading-relaxed text-white/80 md:text-base">
                <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-xl font-semibold text-white">1. Agreement to Terms</h2>
                    <p>
                        By accessing or using CRE8 (located at <a href="https://cre8.la" className="text-orange underline underline-offset-4">https://cre8.la</a>),
                        you agree to be bound by these Terms of Service. If you do not agree with any part of these terms,
                        you must not use our platform or services.
                    </p>
                </section>

                <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-xl font-semibold text-white">2. Description of Platform Services</h2>
                    <p>
                        CRE8 is an influencer marketing and creator campaign analytics platform. We enable brands and marketing agencies
                        to discover, collaborate with, manage, and measure the performance of influencer marketing campaigns.
                    </p>
                    <p>
                        Our platform provides performance tracking, reporting, and analytics across social media platforms including TikTok,
                        Facebook, and Instagram.
                    </p>
                </section>

                <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-xl font-semibold text-white">3. Third-Party Platforms & TikTok Integration</h2>
                    <p>
                        CRE8 integrates with third-party social media platforms, including TikTok for Developers APIs (Login Kit and Display API).
                        By connecting your TikTok account to CRE8:
                    </p>
                    <ul className="list-inside list-disc space-y-2 text-white/75">
                        <li>You authorize CRE8 to access your public profile information (name, avatar, and open_id) and public video performance metrics (views, likes, comments, shares).</li>
                        <li>You confirm that you are the lawful owner or authorized representative of the connected social account.</li>
                        <li>You acknowledge that your use of third-party platforms remains subject to TikTok's Terms of Service and Community Guidelines.</li>
                        <li>You may disconnect your TikTok account at any time via the CRE8 account settings or directly from your TikTok account permissions.</li>
                    </ul>
                </section>

                <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-xl font-semibold text-white">4. User Obligations & Content Conduct</h2>
                    <p>
                        Users of CRE8 (including brands and creators) agree:
                    </p>
                    <ul className="list-inside list-disc space-y-2 text-white/75">
                        <li>To provide accurate and up-to-date information during onboarding and campaign coordination.</li>
                        <li>Not to manipulate, falsify, or use automated bots to artificially inflate view counts, likes, or other engagement metrics.</li>
                        <li>Not to upload or connect content that infringes upon third-party intellectual property or violates applicable laws.</li>
                    </ul>
                </section>

                <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-xl font-semibold text-white">5. Account Disconnection & Data Rights</h2>
                    <p>
                        You maintain full control over your social account connections. Disconnecting a social media account revokes CRE8's
                        API access immediately. For permanent data deletion requests, please refer to our{' '}
                        <Link to={localizePath('/privacy', lang)} className="text-orange underline underline-offset-4">
                            Privacy Policy
                        </Link>{' '}
                        or contact our support team.
                    </p>
                </section>

                <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-xl font-semibold text-white">6. Limitation of Liability</h2>
                    <p>
                        CRE8 provides its software and analytics on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
                        We do not guarantee uninterrupted availability of third-party APIs. In no event shall CRE8 be liable for indirect,
                        consequential, or exemplary damages arising out of your use of the service.
                    </p>
                </section>

                <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-xl font-semibold text-white">7. Contact Information</h2>
                    <p>If you have any questions about these Terms of Service, please contact us at:</p>
                    <div className="mt-2 text-white/90">
                        <p className="font-semibold">CRE8 / Champa Lab</p>
                        <p>Email: <a href="mailto:cre8lao@gmail.com" className="text-orange">cre8lao@gmail.com</a></p>
                        <p>Tel / WhatsApp: +856 20 2224 1188</p>
                        <p>Website: <a href="https://cre8.la" className="text-orange">https://cre8.la</a></p>
                    </div>
                </section>
            </div>
        </article>
    )
}
