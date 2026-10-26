import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Lock, Trash2, Database, Eye } from 'lucide-react'
import { localizePath } from '@/seo/paths'
import type { AppLang } from '@/i18n'

export default function PrivacyPage() {
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
                    <ShieldCheck className="size-6" />
                </div>
                <div>
                    <h1 className="font-cre8 text-3xl font-bold tracking-tight text-white md:text-4xl">
                        {isLao ? 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ (Privacy Policy)' : 'Privacy Policy'}
                    </h1>
                    <p className="text-sm text-white/60">
                        {isLao ? 'ອັບເດດລ້າສຸດ: 27 ຕຸລາ 2026' : 'Last updated: October 27, 2026'}
                    </p>
                </div>
            </div>

            <div className="space-y-8 text-sm leading-relaxed text-white/80 md:text-base">
                <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
                    <p>
                        CRE8 (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), operated by Champa Lab, respects your privacy.
                        This Privacy Policy describes how we collect, use, process, and protect your information when you access
                        <a href="https://cre8.la" className="text-orange underline underline-offset-4"> https://cre8.la</a>,
                        use our influencer marketing platform, or connect third-party accounts (such as TikTok, Facebook, and Instagram).
                    </p>
                </section>

                <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <div className="flex items-center gap-2 text-white">
                        <Eye className="size-5 text-orange" />
                        <h2 className="text-xl font-semibold">2. Information We Access via TikTok for Developers APIs</h2>
                    </div>
                    <p>
                        When a creator or influencer authorizes CRE8 via TikTok Login Kit and TikTok Display API, we request access
                        strictly to the following permissions (scopes):
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs md:text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white">
                                    <th className="py-2.5 pr-4 font-semibold">Scope</th>
                                    <th className="py-2.5 pr-4 font-semibold">Data Accessed</th>
                                    <th className="py-2.5 font-semibold">Purpose</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-white/70">
                                <tr>
                                    <td className="py-3 pr-4 font-mono text-orange">user.info.basic</td>
                                    <td className="py-3 pr-4">Open ID, Display Name, Profile Avatar URL</td>
                                    <td className="py-3">Authenticates creator identity and links their TikTok account to their influencer profile.</td>
                                </tr>
                                <tr>
                                    <td className="py-3 pr-4 font-mono text-orange">video.list</td>
                                    <td className="py-3 pr-4">Public video ID, video title, cover image, share link, and public counters (views, likes, comments, shares)</td>
                                    <td className="py-3">Monitors and reports public campaign performance metrics to authorized brand partners.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-white/60">
                        * Note: We never request, access, or store your TikTok password, direct messages, private videos, payment details, or personal contact lists.
                    </p>
                </section>

                <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <div className="flex items-center gap-2 text-white">
                        <Database className="size-5 text-orange" />
                        <h2 className="text-xl font-semibold">3. How We Use the Data</h2>
                    </div>
                    <p>We use the data obtained through TikTok APIs exclusively for:</p>
                    <ul className="list-inside list-disc space-y-1.5 text-white/75">
                        <li>Displaying the creator&apos;s verified public profile on marketing rosters.</li>
                        <li>Verifying that sponsored deliverables are published on the creator&apos;s channel.</li>
                        <li>Aggregating real-time campaign performance analytics (total views, reach, engagement rate).</li>
                        <li>Generating campaign summary reports for the campaign sponsor/brand.</li>
                    </ul>
                    <p className="font-medium text-white">
                        We do NOT sell, lease, or distribute TikTok user data to third-party data brokers or advertising networks.
                    </p>
                </section>

                <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <div className="flex items-center gap-2 text-white">
                        <Lock className="size-5 text-orange" />
                        <h2 className="text-xl font-semibold">4. Data Storage and Security</h2>
                    </div>
                    <p>
                        Security is paramount in our architecture:
                    </p>
                    <ul className="list-inside list-disc space-y-1.5 text-white/75">
                        <li><strong>Token Encryption:</strong> All OAuth access and refresh tokens are encrypted at rest using industry-standard <strong>AES-256-GCM</strong> authenticated encryption.</li>
                        <li><strong>Access Controls:</strong> Server secrets and encryption keys are segregated in Kubernetes Secrets and never exposed in client bundles or public repositories.</li>
                        <li><strong>Redaction:</strong> Authentication tokens are automatically redacted from all application logs.</li>
                    </ul>
                </section>

                <section className="space-y-4 rounded-2xl border border-orange/20 bg-orange/[0.03] p-6">
                    <div className="flex items-center gap-2 text-orange">
                        <Trash2 className="size-5" />
                        <h2 className="text-xl font-semibold text-white">5. User Data Deletion Instructions</h2>
                    </div>
                    <p>
                        In accordance with TikTok Developer Policies, creators have full autonomy to revoke permissions and delete their data from CRE8 at any time.
                    </p>
                    <div className="space-y-3 text-white/80">
                        <div>
                            <h3 className="font-semibold text-white">Option A: Instant Disconnect via CRE8 Platform</h3>
                            <p className="text-sm">
                                1. Log in to your CRE8 account.<br />
                                2. Navigate to <strong>Influencers</strong> &rarr; click your profile card &rarr; open <strong>Social Accounts</strong>.<br />
                                3. Under the TikTok section, click <strong>&ldquo;Disconnect TikTok&rdquo;</strong>.<br />
                                4. CRE8 immediately revokes your OAuth tokens and marks the integration disconnected.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Option B: Revoke via TikTok App</h3>
                            <p className="text-sm">
                                1. Open your TikTok Mobile App &rarr; go to <strong>Profile</strong>.<br />
                                2. Tap <strong>Settings and Privacy</strong> &rarr; <strong>Security &amp; Permissions</strong> &rarr; <strong>Apps and Services</strong>.<br />
                                3. Select <strong>CRE8</strong> and tap <strong>&ldquo;Remove Access&rdquo;</strong>.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Option C: Request Complete Data Purge</h3>
                            <p className="text-sm">
                                To permanently erase all historical metric snapshots, cached avatar URLs, and profile links associated with your account,
                                send an email with the subject &ldquo;Data Deletion Request&rdquo; to{' '}
                                <a href="mailto:cre8lao@gmail.com" className="text-orange underline underline-offset-4">
                                    cre8lao@gmail.com
                                </a>.
                                Requests are processed within 48 business hours.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-xl font-semibold text-white">6. Contact Us</h2>
                    <p>For any inquiries regarding this Privacy Policy or your personal data rights, please contact:</p>
                    <div className="mt-2 text-white/90">
                        <p className="font-semibold">CRE8 Privacy &amp; Data Protection</p>
                        <p>Email: <a href="mailto:cre8lao@gmail.com" className="text-orange">cre8lao@gmail.com</a></p>
                        <p>Tel / WhatsApp: +856 20 2224 1188</p>
                        <p>Address: Vientiane Capital, Lao PDR</p>
                    </div>
                </section>
            </div>
        </article>
    )
}
