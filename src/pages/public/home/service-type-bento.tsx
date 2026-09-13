import { Users, Target, MessageSquare, Video, Mic2, Search } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { SERVICE_TYPES, type ServiceType } from '@/components/seo-head'
import type { AppLang } from '@/i18n'



const TRANSLATION_MAP: Record<ServiceType, string> = {
    'Influencer marketing': 'svcInfluencer',
    'Digital marketing': 'skillDigitalMarketing',
    'Social media management': 'contentTitle',
    'Video production': 'svcVideo',
    'Public relations': 'svcPr',
    'Consumer research': 'consumerResearch'
}

function NetworkArtwork() {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-30 mix-blend-screen transition-opacity duration-700 group-hover:opacity-60" aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <div className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 border-dashed" />
            <div className="absolute left-[30%] top-[40%] size-3 rounded-full bg-orange shadow-[0_0_12px_#ff6b00]" />
            <div className="absolute left-[60%] top-[25%] size-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            <div className="absolute left-[70%] top-[65%] size-4 rounded-full bg-orange/80 shadow-[0_0_16px_#ff6b00]" />
            <div className="absolute left-[40%] top-[70%] size-2.5 rounded-full bg-white/80" />

            <div className="absolute left-[30%] top-[40%] h-px w-[120px] origin-left -rotate-12 bg-gradient-to-r from-orange to-transparent opacity-50" />
            <div className="absolute left-[60%] top-[25%] h-px w-[100px] origin-left rotate-45 bg-gradient-to-r from-white to-transparent opacity-30" />
            <div className="absolute left-[40%] top-[70%] h-px w-[150px] origin-left -rotate-6 bg-gradient-to-r from-white to-transparent opacity-30" />
        </div>
    )
}

function PerformanceArtwork() {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-20 transition-opacity duration-700 group-hover:opacity-40" aria-hidden="true">
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-8 pb-4">
                {[40, 70, 45, 90, 65, 110].map((h, i) => (
                    <div key={i} className="w-8 rounded-t-sm bg-gradient-to-t from-blue-500/40 to-transparent" style={{ height: h }} />
                ))}
            </div>
            <svg className="absolute bottom-4 left-0 right-0 h-32 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,80 Q20,70 40,90 T80,30 T100,10" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="absolute right-[20%] top-[30%] size-4 rounded-full border-2 border-blue-500 bg-black shadow-[0_0_12px_#3b82f6]" />
        </div>
    )
}

function FeedArtwork() {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-20 transition-opacity duration-700 group-hover:opacity-40" aria-hidden="true">
            <div className="absolute right-4 top-12 w-3/4 translate-x-4 space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-white/20" />
                    <div className="space-y-1.5">
                        <div className="h-2 w-20 rounded-full bg-white/30" />
                        <div className="h-2 w-12 rounded-full bg-white/10" />
                    </div>
                </div>
                <div className="h-24 w-full rounded-lg bg-gradient-to-br from-white/10 to-transparent" />
            </div>
            <div className="absolute -right-8 top-48 w-3/4 space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md">
                <div className="h-32 w-full rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent" />
            </div>
        </div>
    )
}

function CinematicArtwork() {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-20 transition-opacity duration-700 group-hover:opacity-50" aria-hidden="true">
            <div className="absolute left-6 top-6 h-8 w-8 border-l-2 border-t-2 border-white/40" />
            <div className="absolute right-6 top-6 h-8 w-8 border-r-2 border-t-2 border-white/40" />
            <div className="absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2 border-white/40" />
            <div className="absolute bottom-6 right-6 h-8 w-8 border-b-2 border-r-2 border-white/40" />

            <div className="absolute bottom-12 left-1/2 flex w-3/4 -translate-x-1/2 items-center justify-between">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className={`w-0.5 bg-white/30 ${i % 5 === 0 ? 'h-4' : 'h-2'}`} />
                ))}
            </div>
            <div className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500/10 pl-1 ring-1 ring-emerald-500/30">
                <div className="border-y-[12px] border-l-[20px] border-y-transparent border-l-emerald-500" />
            </div>
        </div>
    )
}

function BroadcastArtwork() {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-20 transition-opacity duration-700 group-hover:opacity-50" aria-hidden="true">
            <div className="absolute -right-10 -top-10 size-[300px] rounded-full border border-white/10" />
            <div className="absolute -right-10 -top-10 size-[450px] rounded-full border border-pink-500/20" />
            <div className="absolute -right-10 -top-10 size-[600px] rounded-full border border-white/5" />
            <div className="absolute right-1/4 top-1/3 flex h-32 w-16 items-center justify-center gap-2 overflow-hidden">
                <div className="h-16 w-1 rounded-full bg-pink-500/40" />
                <div className="h-24 w-1 rounded-full bg-pink-500/60" />
                <div className="h-32 w-1 rounded-full bg-pink-500" />
            </div>
        </div>
    )
}

function ResearchArtwork() {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-20 transition-opacity duration-700 group-hover:opacity-50" aria-hidden="true">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute left-1/4 top-1/3 size-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            <div className="absolute left-[45%] top-[60%] size-3 rounded-full bg-amber-500 shadow-[0_0_12px_#f59e0b]" />
            <div className="absolute left-[70%] top-[20%] size-2 rounded-full bg-white/70" />

            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                <path d="M 25% 33% L 45% 60% L 70% 20%" fill="none" stroke="currentColor" strokeWidth="1" className="text-amber-500/50" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    )
}

const CONFIG: Record<ServiceType, {
    icon: typeof Users
    number: string
    spanClass: string
    Artwork: React.FC
    colors: {
        borderHover: string
        shadowHover: string
        bgHover: string
        textHover: string
        textHoverLight: string
        radialGradient: string
    }
}> = {
    'Influencer marketing': {
        icon: Users,
        number: '01',
        spanClass: 'col-span-1 md:col-span-12 lg:col-span-5 lg:row-span-2',
        Artwork: NetworkArtwork,
        colors: {
            borderHover: 'hover:border-orange-500/60',
            shadowHover: 'hover:shadow-[0_12px_40px_rgba(249,115,22,0.18)]',
            bgHover: 'group-hover:bg-orange-500/15',
            textHover: 'group-hover:text-orange-500',
            textHoverLight: 'group-hover:text-orange-500/50',
            radialGradient: 'bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.15),transparent_50%)]',
        }
    },
    'Digital marketing': {
        icon: Target,
        number: '02',
        spanClass: 'col-span-1 md:col-span-6 lg:col-span-4',
        Artwork: PerformanceArtwork,
        colors: {
            borderHover: 'hover:border-blue-500/60',
            shadowHover: 'hover:shadow-[0_12px_40px_rgba(59,130,246,0.18)]',
            bgHover: 'group-hover:bg-blue-500/15',
            textHover: 'group-hover:text-blue-500',
            textHoverLight: 'group-hover:text-blue-500/50',
            radialGradient: 'bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]',
        }
    },
    'Social media management': {
        icon: MessageSquare,
        number: '03',
        spanClass: 'col-span-1 md:col-span-6 lg:col-span-3 lg:row-span-2',
        Artwork: FeedArtwork,
        colors: {
            borderHover: 'hover:border-purple-500/60',
            shadowHover: 'hover:shadow-[0_12px_40px_rgba(168,85,247,0.18)]',
            bgHover: 'group-hover:bg-purple-500/15',
            textHover: 'group-hover:text-purple-500',
            textHoverLight: 'group-hover:text-purple-500/50',
            radialGradient: 'bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_50%)]',
        }
    },
    'Video production': {
        icon: Video,
        number: '04',
        spanClass: 'col-span-1 md:col-span-12 lg:col-span-4',
        Artwork: CinematicArtwork,
        colors: {
            borderHover: 'hover:border-emerald-500/60',
            shadowHover: 'hover:shadow-[0_12px_40px_rgba(16,185,129,0.18)]',
            bgHover: 'group-hover:bg-emerald-500/15',
            textHover: 'group-hover:text-emerald-500',
            textHoverLight: 'group-hover:text-emerald-500/50',
            radialGradient: 'bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_50%)]',
        }
    },
    'Public relations': {
        icon: Mic2,
        number: '05',
        spanClass: 'col-span-1 md:col-span-6 lg:col-span-4',
        Artwork: BroadcastArtwork,
        colors: {
            borderHover: 'hover:border-pink-500/60',
            shadowHover: 'hover:shadow-[0_12px_40px_rgba(236,72,153,0.18)]',
            bgHover: 'group-hover:bg-pink-500/15',
            textHover: 'group-hover:text-pink-500',
            textHoverLight: 'group-hover:text-pink-500/50',
            radialGradient: 'bg-[radial-gradient(ellipse_at_top_right,rgba(236,72,153,0.15),transparent_50%)]',
        }
    },
    'Consumer research': {
        icon: Search,
        number: '06',
        spanClass: 'col-span-1 md:col-span-6 lg:col-span-8',
        Artwork: ResearchArtwork,
        colors: {
            borderHover: 'hover:border-amber-500/60',
            shadowHover: 'hover:shadow-[0_12px_40px_rgba(245,158,11,0.18)]',
            bgHover: 'group-hover:bg-amber-500/15',
            textHover: 'group-hover:text-amber-500',
            textHoverLight: 'group-hover:text-amber-500/50',
            radialGradient: 'bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.15),transparent_50%)]',
        }
    }
}

export function ServiceTypeBento({ lang }: { lang: AppLang }) {
    const reduceMotion = useReducedMotion()
    const { t } = useTranslation('home')

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
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-5 md:grid-cols-12"
        >
            {SERVICE_TYPES.map((service) => {
                const conf = CONFIG[service]
                const Icon = conf.icon
                const Artwork = conf.Artwork
                const tKey = TRANSLATION_MAP[service]

                return (
                    <motion.div key={service} variants={fadeUp} className={conf.spanClass}>
                        <div
                            className={`group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#141414] p-8 transition-all duration-500 hover:-translate-y-1 ${conf.colors.borderHover} ${conf.colors.shadowHover}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            <div className={`absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 ${conf.colors.radialGradient}`} />

                            <Artwork />

                            <div className="relative z-10 flex flex-1 flex-col">
                                <div className="mb-auto flex items-start justify-between">
                                    <div className={`inline-flex size-14 items-center justify-center rounded-2xl bg-white/5 text-white/60 transition-colors duration-500 ${conf.colors.bgHover} ${conf.colors.textHover}`}>
                                        <Icon className="size-6 transition-transform duration-500 group-hover:scale-110" />
                                    </div>
                                    <span className={`font-cre8 text-lg font-bold text-white/20 transition-colors duration-500 ${conf.colors.textHoverLight}`}>
                                        {conf.number}
                                    </span>
                                </div>
                                <div className="mt-12 flex items-end justify-between gap-4">
                                    <h3 className="font-cre8 text-2xl font-bold leading-tight text-white transition-colors duration-500 group-hover:text-white md:text-3xl">
                                        {t(tKey)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </motion.div>
    )
}
