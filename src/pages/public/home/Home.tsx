import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import type { AppLang } from '@/i18n'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
    ArrowRight,
    Building2,
    Car,
    GraduationCap,
    Handshake,
    Landmark,
    Mail,
    Palette,
    Phone,
    Pill,
    Plane,
    Quote,
    Rocket,
    ShoppingBag,
    Sparkles,
    Target,
    TrendingUp,
    Store,
    UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    ContentManagementShowcase,
    DigitalAdsShowcase,
    MediaLandscapeShowcase,
    GlowCard,
    GlowRow,
    HeroAmbient,
    MagneticLink,
    ScrollTimeline,
} from './home-effects'
import { useHeroAmbient } from './use-hero-ambient'
import { ServicesGrid } from './components/services-grid'
import { InfluencersGrid } from './components/influencers-grid'

const SKILL_KEYS = [
    'skillMarketResearch',
    'skillDataAnalysis',
    'skillStrategicMarketing',
    'skillBrandDevelopment',
    'skillDigitalMarketing'
] as const

const EDUCATION = [
    { titleKey: 'eduMa', placeKey: 'eduMaPlace' },
    { titleKey: 'eduBa', placeKey: 'eduBaPlace' },
    { titleKey: 'eduAlevel', placeKey: 'eduAlevelPlace' }
] as const

const EXPERIENCE = [
    { years: '2020 - Current', titleKey: 'expFounder', placeKey: 'expCre8', current: true },
    { years: '2020 - 2021', titleKey: 'expConsultant', placeKey: 'expWorldBank', current: false },
    { years: '2019 - 2020', titleKey: 'expCrm', placeKey: 'expGreenwich', current: false },
    { years: '2016 - 2019', titleKey: 'expBrandManager', placeKey: 'expUnilever', current: false },
    { years: '2014 - 2016', titleKey: 'expCampaignManager', placeKey: 'expAiesec', current: false },
    { years: '2011 - 2012', titleKey: 'expCreativeDirector', placeKey: 'expMeexay', current: false }
] as const

const ACHIEVEMENT_KEYS = ['achEcothon', 'achGrestartup', 'achHack4good', 'achEnterprise'] as const

const INDUSTRIES: { nameKey: 'indConsumerGoods' | 'indFnB' | 'indBeauty' | 'indPharma' | 'indHospitality' | 'indNgo' | 'indTech' | 'indAuto' | 'indFinance' | 'indRetail' | 'indEducation' | 'indServices'; icon: LucideIcon }[] = [
    { nameKey: 'indConsumerGoods', icon: ShoppingBag },
    { nameKey: 'indFnB', icon: UtensilsCrossed },
    { nameKey: 'indBeauty', icon: Sparkles },
    { nameKey: 'indPharma', icon: Pill },
    { nameKey: 'indHospitality', icon: Plane },
    { nameKey: 'indNgo', icon: Landmark },
    { nameKey: 'indTech', icon: Rocket },
    { nameKey: 'indAuto', icon: Car },
    { nameKey: 'indFinance', icon: Building2 },
    { nameKey: 'indRetail', icon: Store },
    { nameKey: 'indEducation', icon: GraduationCap },
    { nameKey: 'indServices', icon: Handshake },
]

const CRE_ITEMS = [
    { letter: 'C', titleKey: 'creativity', blurbKey: 'creativityBlurb', icon: Palette },
    { letter: 'R', titleKey: 'relevancy', blurbKey: 'relevancyBlurb', icon: Target },
    { letter: 'E', titleKey: 'effectiveness', blurbKey: 'effectivenessBlurb', icon: TrendingUp },
] as const

const headingComponents = {
    white: <span className="text-white" />,
    orange: <span className="text-orange" />,
}

const CARD_HOVER =
    'transition-all duration-300 hover:scale-[1.02] hover:border-orange/60 hover:shadow-[0_0_32px_rgba(255,107,0,0.18)]'

const viewport = { once: true, amount: 'some' as const, margin: '0px 0px -40px 0px' as const }

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
}

const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } }
}

const heroStagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } }
}

export default function Home() {
    const { t, i18n } = useTranslation('home')
    const lang = (i18n.resolvedLanguage === 'en' ? 'en' : 'lo') as AppLang
    const reduceMotion = useReducedMotion()
    const { spotlight, onMove } = useHeroAmbient(reduceMotion)

    useEffect(() => {
        const hash = window.location.hash
        if (!hash) return
        const el = document.querySelector(hash)
        el?.scrollIntoView()
    }, [])

    return (
        <div className="w-full">
            <section
                id="hero"
                className="relative isolate w-full scroll-mt-20 overflow-hidden bg-black"
                onMouseMove={onMove}
            >
                <HeroAmbient reduceMotion={reduceMotion} spotlight={spotlight} />
                <motion.div
                    className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[1440px] flex-col items-center justify-center px-6 py-20 text-center md:px-10"
                    variants={heroStagger}
                    initial="hidden"
                    animate="show"
                >
                    <motion.div
                        variants={fadeUp}
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-1 font-cre8 text-xs uppercase tracking-wider text-white backdrop-blur-sm"
                    >
                        {t('heroBadge')}
                    </motion.div>
                    <motion.h1
                        variants={fadeUp}
                        className="mb-6 max-w-4xl font-cre8 text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_0_36px_rgba(255,107,0,0.45)] md:text-6xl"
                    >
                        Cre8 Marketing & Advertising
                    </motion.h1>
                    <motion.p variants={fadeUp} className="mb-8 max-w-2xl text-lg leading-relaxed text-white/85">
                        {t('heroTagline')}
                    </motion.p>
                    <motion.div variants={fadeUp} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <MagneticLink
                            href="#services"
                            className="inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 font-semibold text-black shadow-[0_8px_32px_rgba(255,107,0,0.45)] transition-colors hover:bg-orange/90"
                        >
                            {t('ctaServices')}
                            <ArrowRight className="size-4" />
                        </MagneticLink>
                        <a
                            href="#contact"
                            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/40 px-6 py-3 font-semibold text-white shadow backdrop-blur-sm transition-all hover:bg-white/10"
                        >
                            {t('ctaContact')}
                        </a>
                    </motion.div>
                </motion.div>
            </section>

            <section id="about" className="w-full scroll-mt-20 overflow-hidden">
                <div id="vision" className="w-full bg-muted py-16">
                    <motion.div
                        className="mx-auto max-w-[1440px] px-6 md:px-10"
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewport}
                    >
                        <motion.div variants={fadeUp} className="mb-10">
                            <h2 className="mb-6 font-cre8 text-3xl font-bold md:text-4xl">
                                <Trans i18nKey="visionHeading" ns="home" components={headingComponents} />
                            </h2>
                            <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-black/30 p-6 md:flex-row md:items-start md:gap-6 md:p-8">
                                <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-orange shadow-[0_8px_24px_rgba(255,107,0,0.28)]">
                                    <Quote className="size-8 stroke-[1.6] text-white" />
                                </span>
                                <p className="text-xl leading-relaxed text-white md:text-2xl">
                                    &ldquo;
                                    <Trans
                                        i18nKey="visionQuote"
                                        ns="home"
                                        components={{ orange: <span className="font-semibold text-orange" /> }}
                                    />
                                    &rdquo;
                                </p>
                            </div>
                        </motion.div>
                        <motion.div variants={stagger} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {CRE_ITEMS.map((item) => {
                                const Icon = item.icon
                                return (
                                    <GlowCard key={item.letter} variants={fadeUp}>
                                        <span className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-orange shadow-[0_8px_24px_rgba(255,107,0,0.28)]">
                                            <Icon className="size-7 stroke-[1.6] text-white" />
                                        </span>
                                        <div className="mb-3 flex items-center gap-3">
                                            <span className="font-cre8 text-3xl font-extrabold tracking-tight text-orange drop-shadow-[0_2px_12px_rgba(255,107,0,0.3)] md:text-4xl">
                                                {item.letter}
                                            </span>
                                            <span className="h-0.5 w-4 shrink-0 rounded-full bg-orange/50" aria-hidden="true" />
                                            <h3 className="text-xl font-bold tracking-tight text-white">
                                                {t(item.titleKey)}
                                            </h3>
                                        </div>
                                        <p className="text-sm leading-relaxed text-white/70">{t(item.blurbKey)}</p>
                                    </GlowCard>
                                )
                            })}
                        </motion.div>
                    </motion.div>
                </div>

                <div id="founder" className="w-full py-16">
                    <motion.div
                        className="mx-auto max-w-[1440px] px-6 md:px-10"
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewport}
                    >
                        <motion.div variants={fadeUp} className="mb-10">
                            <h2 className="font-cre8 text-3xl font-bold md:text-4xl">
                                <Trans i18nKey="founderHeading" ns="home" components={headingComponents} />
                            </h2>
                        </motion.div>
                        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
                            <motion.div variants={fadeUp} className="lg:col-span-5">
                                <div className={cn('rounded-xl border border-white/15 bg-card p-6', CARD_HOVER)}>
                                    <img
                                        src="/images/luck.png"
                                        alt="Luckanong Souliyavong"
                                        className="mx-auto mb-5 size-40 rounded-full object-cover ring-2 ring-orange/70 ring-offset-4 ring-offset-card"
                                    />
                                    <h3 className="text-center font-cre8 text-2xl font-bold text-white">Luckanong Souliyavong</h3>
                                    <p className="mb-4 text-center font-semibold text-orange-soft">{t('founderRole')}</p>
                                    <h4 className="mb-2 text-sm font-bold uppercase text-white/70">{t('coreSkills')}</h4>
                                    <ul className="mb-6 list-inside list-disc space-y-1 text-sm text-white/70">
                                        {SKILL_KEYS.map((key) => (
                                            <li key={key}>{t(key)}</li>
                                        ))}
                                    </ul>
                                    <h4 className="mb-2 text-sm font-bold uppercase text-white/70">{t('education')}</h4>
                                    <ul className="space-y-3 text-sm text-white/70">
                                        {EDUCATION.map((item) => (
                                            <li key={item.titleKey}>
                                                <strong className="block text-white">{t(item.titleKey)}</strong>
                                                {t(item.placeKey)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                            <div className="flex flex-col gap-8 lg:col-span-7">
                                <motion.div variants={fadeUp}>
                                    <h3 className="mb-4 font-cre8 text-xl font-bold uppercase tracking-wider text-white">
                                        {t('experience')}
                                    </h3>
                                    <ScrollTimeline>
                                        {EXPERIENCE.map((item) => (
                                            <div
                                                key={`${item.years}-${item.titleKey}`}
                                                className={cn(
                                                    'rounded-r-lg border-l-2 py-2 pl-4 transition-all duration-300',
                                                    item.current ? 'border-orange bg-orange/5' : 'border-transparent',
                                                    'hover:border-orange hover:bg-orange/10'
                                                )}
                                            >
                                                <span className={`text-xs font-bold ${item.current ? 'text-orange-soft' : 'text-white/70'}`}>
                                                    {item.years}
                                                </span>
                                                <h4 className="text-lg font-bold text-white">{t(item.titleKey)}</h4>
                                                <p className="text-sm text-white/70">{t(item.placeKey)}</p>
                                            </div>
                                        ))}
                                    </ScrollTimeline>
                                </motion.div>
                                <motion.div variants={fadeUp}>
                                    <h3 className="mb-4 font-cre8 text-xl font-bold uppercase tracking-wider text-white">
                                        {t('achievements')}
                                    </h3>
                                    <ul className="list-inside list-disc space-y-2 text-sm text-white/70">
                                        {ACHIEVEMENT_KEYS.map((key) => (
                                            <li key={key}>{t(key)}</li>
                                        ))}
                                    </ul>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div id="industries" className="w-full bg-muted py-16">
                    <motion.div
                        className="mx-auto max-w-[1440px] px-6 md:px-10"
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewport}
                    >
                        <motion.div variants={fadeUp} className="mb-10">
                            <h2 className="mb-3 font-cre8 text-3xl font-bold md:text-4xl">
                                <Trans i18nKey="industriesHeading" ns="home" components={headingComponents} />
                            </h2>
                            <p className="max-w-3xl text-white/80">{t('industriesLead')}</p>
                        </motion.div>
                        <motion.div variants={stagger} className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                            {INDUSTRIES.map((item) => {
                                const Icon = item.icon
                                return (
                                    <GlowRow key={item.nameKey} variants={fadeUp}>
                                        <motion.span
                                            className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange shadow-[0_8px_24px_rgba(255,107,0,0.28)]"
                                            whileHover={{ scale: 1.08, rotate: 4 }}
                                            transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                                        >
                                            <Icon className="size-7 stroke-[1.6] text-white" />
                                        </motion.span>
                                        <p className="text-base font-medium leading-snug text-white transition-colors duration-300 group-hover:text-orange">
                                            {t(item.nameKey)}
                                        </p>
                                    </GlowRow>
                                )
                            })}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            <section id="services" className="w-full scroll-mt-20 py-16">
                <div className="mx-auto max-w-[1440px] px-6 md:px-10">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewport}
                        className="mb-12"
                    >
                        <h2 className="mb-2 font-cre8 text-3xl font-bold md:text-4xl">
                            <Trans i18nKey="servicesHeading" ns="home" components={headingComponents} />
                        </h2>
                        <p className="text-white/70">{t('servicesLead')}</p>
                    </motion.div>

                    <ServicesGrid lang={lang} />

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewport}
                        className="mb-8"
                    >
                        <ContentManagementShowcase />
                    </motion.div>
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewport}
                        className="mb-8"
                    >
                        <DigitalAdsShowcase />
                    </motion.div>
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewport}
                        className="mb-8"
                    >
                        <MediaLandscapeShowcase />
                    </motion.div>

                </div>
            </section>

            <section id="influencers" className="w-full scroll-mt-20 bg-muted py-16">
                <div className="mx-auto max-w-[1440px] px-6 md:px-10">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewport}
                        className="mb-12"
                    >
                        <h2 className="mb-2 font-cre8 text-3xl font-bold md:text-4xl">
                            <Trans i18nKey="influencersHeading" ns="home" components={headingComponents} />
                        </h2>
                        <p className="text-white/70">{t('influencersLead')}</p>
                    </motion.div>

                    <InfluencersGrid />
                </div>
            </section>

            <section id="contact" className="w-full scroll-mt-20 bg-muted py-16">
                <motion.div
                    className="mx-auto max-w-[1440px] px-6 md:px-10"
                    variants={stagger}
                    initial="hidden"
                    whileInView="show"
                    viewport={viewport}
                >
                    <motion.h2 variants={fadeUp} className="mb-8 font-cre8 text-3xl font-bold md:text-4xl">
                        <Trans i18nKey="contactHeading" ns="home" components={headingComponents} />
                    </motion.h2>
                    <motion.div variants={stagger} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <motion.a
                            href="tel:02022241188"
                            variants={fadeUp}
                            className={cn('rounded-xl border border-white/15 bg-card p-6', CARD_HOVER)}
                        >
                            <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-white/70">
                                <Phone className="size-3.5" /> {t('telWhatsapp')}
                            </span>
                            <span className="text-lg font-bold text-white">020 2224 1188</span>
                        </motion.a>
                        <motion.a
                            href="mailto:cre8lao@gmail.com"
                            variants={fadeUp}
                            className={cn('rounded-xl border border-white/15 bg-card p-6', CARD_HOVER)}
                        >
                            <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-white/70">
                                <Mail className="size-3.5" /> {t('email')}
                            </span>
                            <span className="text-lg font-bold text-white">cre8lao@gmail.com</span>
                        </motion.a>
                        <motion.a
                            href="https://www.cre8.la"
                            target="_blank"
                            rel="noreferrer"
                            variants={fadeUp}
                            className={cn('rounded-xl border border-white/15 bg-card p-6', CARD_HOVER)}
                        >
                            <span className="mb-1 block text-xs font-bold uppercase text-white/70">{t('website')}</span>
                            <span className="text-lg font-bold text-white">www.cre8.la</span>
                        </motion.a>
                    </motion.div>
                </motion.div>
            </section>
        </div>
    )
}
