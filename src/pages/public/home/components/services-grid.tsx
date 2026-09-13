import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Target, Megaphone, RefreshCw, Video, MessageSquare, MapPin, Gift } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { localizePath } from '@/seo/paths'
import { SERVICE_KEY_TO_SLUG } from '@/seo/pages'
import type { AppLang } from '@/i18n'

export function ServicesGrid({ lang }: { lang: AppLang }) {
    const { t } = useTranslation('home')
    const reduceMotion = useReducedMotion()
    
    const fadeUp: Variants = {
        hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    }

    const stagger: Variants = {
        hidden: {},
        show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
    }

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
        >
            {/* Consumer Research - Large Card */}
            <motion.div variants={fadeUp} className="md:col-span-2 lg:col-span-2 lg:row-span-2">
                <Link 
                    to={localizePath('/consumer-research', lang)} 
                    className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-[#1a0a00] to-[#0f0f0f] p-8 transition-all duration-500 hover:-translate-y-1 hover:border-orange-500/60 hover:shadow-[0_8px_32px_rgba(255,107,0,0.35)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative z-10 flex flex-1 flex-col">
                        <div className="mb-8 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-[0_4px_20px_rgba(255,107,0,0.5)] transition-transform duration-500 group-hover:scale-110">
                            <Target className="size-7" />
                        </div>
                        <h3 className="mb-5 font-cre8 text-3xl font-bold text-white transition-colors group-hover:text-orange-300">{t('consumerResearch')}</h3>
                        <div className="mt-auto space-y-4 text-sm text-white/80">
                            <p className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" /> <span><strong className="text-white">{t('quantitative')}:</strong> {t('quantitativeBody')}</span></p>
                            <p className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" /> <span><strong className="text-white">{t('qualitative')}:</strong> {t('qualitativeBody')}</span></p>
                            <p className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" /> <span><strong className="text-white">{t('experimental')}:</strong> {t('experimentalBody')}</span></p>
                            <p className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" /> <span><strong className="text-white">{t('businessAnalysis')}:</strong> {t('businessAnalysisBody')}</span></p>
                        </div>
                    </div>
                </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="md:col-span-1 lg:col-span-1">
                <Link to={localizePath(`/${SERVICE_KEY_TO_SLUG['svcInfluencer']}`, lang)} className="group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-[2rem] border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-[#0f0f0f] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-purple-400/60 hover:shadow-[0_8px_32px_rgba(168,85,247,0.35)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="mb-auto inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 text-white shadow-[0_4px_16px_rgba(168,85,247,0.4)] transition-transform duration-500 group-hover:scale-110">
                        <Megaphone className="size-6" />
                    </div>
                    <h3 className="relative z-10 mt-6 font-cre8 text-xl font-bold leading-tight text-white transition-colors group-hover:text-purple-200">{t('svcInfluencer')}</h3>
                </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="md:col-span-1 lg:col-span-1">
                <Link to={localizePath(`/${SERVICE_KEY_TO_SLUG['svc360']}`, lang)} className="group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-[2rem] border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-[#0f0f0f] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-blue-400/60 hover:shadow-[0_8px_32px_rgba(59,130,246,0.35)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="mb-auto inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-[0_4px_16px_rgba(59,130,246,0.4)] transition-transform duration-500 group-hover:scale-110">
                        <RefreshCw className="size-6" />
                    </div>
                    <h3 className="relative z-10 mt-6 font-cre8 text-xl font-bold leading-tight text-white transition-colors group-hover:text-blue-200">{t('svc360')}</h3>
                </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="md:col-span-2 lg:col-span-2">
                <Link to={localizePath(`/${SERVICE_KEY_TO_SLUG['svcVideo']}`, lang)} className="group relative flex h-full min-h-[160px] items-center overflow-hidden rounded-[2rem] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-[#0f0f0f] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-[0_8px_32px_rgba(16,185,129,0.35)]">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative z-10 flex w-full items-center gap-6">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)] transition-transform duration-500 group-hover:scale-110">
                            <Video className="size-6" />
                        </div>
                        <h3 className="font-cre8 text-xl font-bold leading-tight text-white transition-colors group-hover:text-emerald-200">{t('svcVideo')}</h3>
                    </div>
                </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="md:col-span-1 lg:col-span-1">
                <Link to={localizePath(`/${SERVICE_KEY_TO_SLUG['svcPr']}`, lang)} className="group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-[2rem] border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-[#0f0f0f] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-indigo-400/60 hover:shadow-[0_8px_32px_rgba(99,102,241,0.35)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="mb-auto inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-transform duration-500 group-hover:scale-110">
                        <MessageSquare className="size-6" />
                    </div>
                    <h3 className="relative z-10 mt-6 font-cre8 text-xl font-bold leading-tight text-white transition-colors group-hover:text-indigo-200">{t('svcPr')}</h3>
                </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="md:col-span-1 lg:col-span-1">
                <Link to={localizePath(`/${SERVICE_KEY_TO_SLUG['svcRoadshow']}`, lang)} className="group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-[2rem] border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-[#0f0f0f] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_8px_32px_rgba(245,158,11,0.35)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="mb-auto inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_4px_16px_rgba(245,158,11,0.4)] transition-transform duration-500 group-hover:scale-110">
                        <MapPin className="size-6" />
                    </div>
                    <h3 className="relative z-10 mt-6 font-cre8 text-xl font-bold leading-tight text-white transition-colors group-hover:text-amber-200">{t('svcRoadshow')}</h3>
                </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="md:col-span-2 lg:col-span-2">
                <Link to={localizePath(`/${SERVICE_KEY_TO_SLUG['svcPremiums']}`, lang)} className="group relative flex h-full min-h-[160px] items-center overflow-hidden rounded-[2rem] border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/20 to-[#0f0f0f] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-fuchsia-400/60 hover:shadow-[0_8px_32px_rgba(217,70,239,0.35)]">
                    <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative z-10 flex w-full items-center gap-6">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-400 to-rose-500 text-white shadow-[0_4px_16px_rgba(217,70,239,0.4)] transition-transform duration-500 group-hover:scale-110">
                            <Gift className="size-6" />
                        </div>
                        <h3 className="font-cre8 text-xl font-bold leading-tight text-white transition-colors group-hover:text-fuchsia-200">{t('svcPremiums')}</h3>
                    </div>
                </Link>
            </motion.div>
        </motion.div>
    )
}
