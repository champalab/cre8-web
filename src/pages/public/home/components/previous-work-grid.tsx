import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion, type Variants, AnimatePresence } from 'framer-motion'
import {
    Play,
    Tv,
    ExternalLink,
    Copy,
    Check,
    Sparkles,
    Calendar,
    Building2,
    Film,
    Radio,
    Maximize2,
} from 'lucide-react'
import { ToastSuccess } from '@/utils/toasts'
import { cn } from '@/lib/utils'

export type WorkCategory = 'all' | 'auto' | 'tech' | 'health' | 'fmcg'

export interface PreviousWorkItem {
    id: string
    embedUrl: string
    title: string
    client: string
    year: string
    category: 'auto' | 'tech' | 'health' | 'fmcg'
    categoryLabelKey: string
    description: {
        en: string
        lo: string
    }
    youtubeUrl: string
}

export const PREVIOUS_WORKS: PreviousWorkItem[] = [
    {
        id: 'waR7_plGUjE',
        embedUrl: 'https://www.youtube.com/embed/waR7_plGUjE?si=wYEx_-BzV1fjg19V',
        title: 'YesPls TVC 2020',
        client: 'YesPls',
        year: '2020',
        category: 'tech',
        categoryLabelKey: 'categoryTech',
        description: {
            en: 'Fast-paced lifestyle commercial introducing on-demand food and grocery delivery across Vientiane.',
            lo: 'ວິດີໂອໂຄສະນາ TVC ສ້າງສັນ ແນະນຳການບໍລິການສັ່ງອາຫານ ແລະ ສິນຄ້າຈັດສົ່ງເຖິງທີ່ໃນນະຄອນຫຼວງ.'
        },
        youtubeUrl: 'https://www.youtube.com/watch?v=waR7_plGUjE'
    },
    {
        id: 'dN8jiOYHKbk',
        embedUrl: 'https://www.youtube.com/embed/dN8jiOYHKbk?si=IwfrWMaEi1yy_9wp',
        title: 'Yespls (Yeslao) TVC 2022',
        client: 'YesPls (Yeslao)',
        year: '2022',
        category: 'tech',
        categoryLabelKey: 'categoryTech',
        description: {
            en: 'Dynamic rebrand campaign highlighting convenience, upgraded features, and seamless daily life.',
            lo: 'ແຄມເປນຍົກລະດັບແບຣນໃໝ່ ເນັ້ນຄວາມສະດວກສະບາຍ, ຟັງຊັນທີ່ຄົບຄັນ ແລະ ຕອບໂຈດທຸກໄລຟ໌ສະໄຕລ໌.'
        },
        youtubeUrl: 'https://www.youtube.com/watch?v=dN8jiOYHKbk'
    },
    {
        id: 'aSIgutzQN8g',
        embedUrl: 'https://www.youtube.com/embed/aSIgutzQN8g?si=d890XLZFBtGJ28wa',
        title: 'Comfort TVC 2021',
        client: 'Comfort (Unilever)',
        year: '2021',
        category: 'fmcg',
        categoryLabelKey: 'categoryFmcg',
        description: {
            en: 'Sensory television campaign capturing lasting freshness, premium soft fragrance, and family warmth.',
            lo: 'ໂຄສະນາ TVC ລະດັບສາກົນ ສື່ເຖິງກິ່ນຫອມສົດຊື່ນຍາວນານ, ຄວາມນຸ່ມລະມຸນ ແລະ ຄວາມອົບອຸ່ນໃນຄອບຄົວ.'
        },
        youtubeUrl: 'https://www.youtube.com/watch?v=aSIgutzQN8g'
    },
    {
        id: 'xly9ICqv4hk',
        embedUrl: 'https://www.youtube.com/embed/xly9ICqv4hk?si=hX5yUD9RhV6-JB0Z',
        title: 'Toyota Football For Every One Season 2 Emotional TVC',
        client: 'Toyota Laos',
        year: '2022',
        category: 'auto',
        categoryLabelKey: 'categoryAuto',
        description: {
            en: 'Inspiring cinematic documentary-style TVC honoring young Lao football dreams, passion, and unity.',
            lo: 'ຜົນງານ TVC ແນວ Emotional ສຸດຊາບຊຶ້ງ ສະທ້ອນຄວາມຝັນ, ພະລັງຄວາມສາມັກຄີ ແລະ ແຮງບັນດານໃຈຂອງເຍົາວະຊົນລາວ.'
        },
        youtubeUrl: 'https://youtu.be/xly9ICqv4hk'
    },
    {
        id: 'FgqfHl-mGqA',
        embedUrl: 'https://www.youtube.com/embed/FgqfHl-mGqA?si=P_m5ZqPAZLMXSAl_',
        title: 'V.Rohto Emotional TVC Lao New Year',
        client: 'Rohto-Mentholatum',
        year: '2021',
        category: 'health',
        categoryLabelKey: 'categoryHealth',
        description: {
            en: 'Touching Lao New Year story emphasizing caring for elders, clear eyesight, and joyful homecoming moments.',
            lo: 'ເລື່ອງລາວອັນອົບອຸ່ນຕ້ອນຮັບປີໃໝ່ລາວ ເນັ້ນການດູແລສາຍຕາຂອງຄົນທີ່ຮັກ ແລະ ຊ່ວງເວລາແຫ່ງຄວາມສຸກໃນຄອບຄົວ.'
        },
        youtubeUrl: 'https://www.youtube.com/watch?v=FgqfHl-mGqA'
    },
    {
        id: 'GHGbySlH8Z0',
        embedUrl: 'https://www.youtube.com/embed/GHGbySlH8Z0?si=IsfFAdEwPOc5cvoh',
        title: 'Acnes TVC Laos',
        client: 'Acnes (Rohto)',
        year: '2021',
        category: 'health',
        categoryLabelKey: 'categoryHealth',
        description: {
            en: 'Vibrant and relatable commercial targeting teenagers and young adults for healthy, blemish-free skin.',
            lo: 'ໂຄສະນາ TVC ທີ່ສົດໃສ ເຂົ້າເຖິງໄວໜຸ່ມ ເສີມສ້າງຄວາມໝັ້ນໃຈດ້ວຍຜິວໜ້າທີ່ສະອາດໃສ ໄຮ້ສິວ.'
        },
        youtubeUrl: 'https://youtu.be/GHGbySlH8Z0'
    }
]

const CATEGORIES: { key: WorkCategory; labelKey: string }[] = [
    { key: 'all', labelKey: 'allWork' },
    { key: 'auto', labelKey: 'categoryAuto' },
    { key: 'tech', labelKey: 'categoryTech' },
    { key: 'health', labelKey: 'categoryHealth' },
    { key: 'fmcg', labelKey: 'categoryFmcg' },
]

export function PreviousWorkGrid() {
    const { t, i18n } = useTranslation('home')
    const lang = (i18n.resolvedLanguage === 'en' ? 'en' : 'lo') as 'en' | 'lo'
    const reduceMotion = useReducedMotion()

    const [selectedId, setSelectedId] = useState<string>('xly9ICqv4hk')
    const [selectedCategory, setSelectedCategory] = useState<WorkCategory>('all')
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const cinemaRef = useRef<HTMLDivElement>(null)

    const selectedItem = PREVIOUS_WORKS.find((item) => item.id === selectedId) || PREVIOUS_WORKS[0]

    const filteredItems = PREVIOUS_WORKS.filter((item) => {
        if (selectedCategory === 'all') return true
        return item.category === selectedCategory
    })

    const handleCopy = (item: PreviousWorkItem) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(item.youtubeUrl)
            setCopiedId(item.id)
            ToastSuccess(t('linkCopied'))
            setTimeout(() => setCopiedId(null), 2500)
        }
    }

    const handleSelectCinema = (id: string) => {
        setSelectedId(id)
        if (cinemaRef.current) {
            cinemaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }

    const fadeUp: Variants = {
        hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
    }

    const stagger: Variants = {
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
    }

    return (
        <div className="w-full space-y-12">
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat.key
                    return (
                        <button
                            key={cat.key}
                            type="button"
                            onClick={() => setSelectedCategory(cat.key)}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 sm:text-sm',
                                isActive
                                    ? 'bg-orange text-black shadow-[0_0_24px_rgba(255,107,0,0.5)] ring-2 ring-orange/60'
                                    : 'border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white'
                            )}
                        >
                            {cat.key === 'all' && <Sparkles className="size-3.5" />}
                            {cat.key === 'auto' && <Tv className="size-3.5" />}
                            {cat.key === 'tech' && <Radio className="size-3.5" />}
                            {cat.key === 'health' && <Sparkles className="size-3.5" />}
                            {cat.key === 'fmcg' && <Film className="size-3.5" />}
                            {t(cat.labelKey)}
                        </button>
                    )
                })}
            </div>

            {/* Featured Cinema Theater Spotlight Player */}
            <div ref={cinemaRef} className="relative mx-auto max-w-5xl scroll-mt-24">
                {/* Ambient Halo Behind Player */}
                <div
                    className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-r from-orange/20 via-orange/10 to-orange/25 opacity-70 blur-2xl transition-all duration-700"
                    aria-hidden="true"
                />

                <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/85 shadow-2xl backdrop-blur-xl">
                    {/* Cinema Window Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="relative flex size-3">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-75" />
                                <span className="relative inline-flex size-3 rounded-full bg-orange" />
                            </span>
                            <span className="font-cre8 text-xs font-bold uppercase tracking-wider text-orange sm:text-sm">
                                {t('featuredVideo')}
                            </span>
                            <span className="hidden text-xs text-white/40 sm:inline">•</span>
                            <span className="hidden truncate text-xs font-medium text-white/80 md:inline">
                                {selectedItem.title}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleCopy(selectedItem)}
                                title={t('copyLink')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                {copiedId === selectedItem.id ? (
                                    <>
                                        <Check className="size-3.5 text-green-400" />
                                        <span className="hidden sm:inline text-green-400">{t('linkCopied')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-3.5" />
                                        <span className="hidden sm:inline">{t('copyLink')}</span>
                                    </>
                                )}
                            </button>
                            <a
                                href={selectedItem.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-orange px-3 py-1.5 text-xs font-semibold text-black shadow-md transition-colors hover:bg-orange/90"
                            >
                                <ExternalLink className="size-3.5" />
                                <span>{t('watchOnYoutube')}</span>
                            </a>
                        </div>
                    </div>

                    {/* Responsive YouTube Iframe Theater */}
                    <div className="relative aspect-video w-full bg-black">
                        <iframe
                            key={selectedItem.id}
                            src={selectedItem.embedUrl}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                            className="absolute inset-0 h-full w-full border-0"
                        />
                    </div>

                    {/* Meta Bar Under Player */}
                    <div className="border-t border-white/10 bg-black/60 p-5 sm:p-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-full border border-orange/40 bg-orange/10 px-2.5 py-0.5 text-xs font-semibold text-orange-soft">
                                        <Building2 className="size-3" />
                                        {selectedItem.client}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/70">
                                        <Calendar className="size-3" />
                                        {selectedItem.year}
                                    </span>
                                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs uppercase tracking-wider text-white/60">
                                        TVC
                                    </span>
                                </div>
                                <h3 className="font-cre8 text-xl font-bold text-white sm:text-2xl">
                                    {selectedItem.title}
                                </h3>
                                <p className="max-w-3xl text-sm leading-relaxed text-white/75 sm:text-base">
                                    {selectedItem.description[lang]}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* All Works Grid Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Film className="size-5 text-orange" />
                        <h3 className="font-cre8 text-xl font-bold text-white sm:text-2xl">
                            {t('allProjectsTitle')}
                        </h3>
                    </div>
                    <span className="text-xs text-white/60 sm:text-sm">
                        {filteredItems.length} {lang === 'lo' ? 'ຜົນງານ' : 'Projects'}
                    </span>
                </div>

                <AnimatePresence mode="popLayout">
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {filteredItems.map((item) => {
                            const isCurrentSelected = item.id === selectedId

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    variants={fadeUp}
                                    className={cn(
                                        'group relative flex flex-col overflow-hidden rounded-2xl border bg-black/40 backdrop-blur-sm transition-all duration-300',
                                        isCurrentSelected
                                            ? 'border-orange shadow-[0_0_32px_rgba(255,107,0,0.3)] ring-1 ring-orange/60'
                                            : 'border-white/15 hover:border-orange/60 hover:shadow-[0_8px_32px_rgba(255,107,0,0.2)]'
                                    )}
                                >
                                    {/* Video Top Bar with quick badge */}
                                    <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2.5">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="truncate text-xs font-semibold text-white/80">
                                                {item.client}
                                            </span>
                                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
                                                {item.year}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleSelectCinema(item.id)}
                                            title={t('viewInCinema')}
                                            className={cn(
                                                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                                                isCurrentSelected
                                                    ? 'bg-orange text-black font-semibold'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            )}
                                        >
                                            <Maximize2 className="size-3" />
                                            <span>{isCurrentSelected ? t('playingNow') : t('viewInCinema')}</span>
                                        </button>
                                    </div>

                                    {/* Embedded Iframe Container */}
                                    <div className="relative aspect-video w-full bg-black">
                                        <iframe
                                            src={item.embedUrl}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                            allowFullScreen
                                            loading="lazy"
                                            className="absolute inset-0 h-full w-full border-0"
                                        />
                                    </div>

                                    {/* Card Footer Details */}
                                    <div className="flex flex-1 flex-col justify-between p-5">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="rounded-full border border-orange/30 bg-orange/10 px-2 py-0.5 text-[11px] font-medium text-orange-soft">
                                                    {t(item.categoryLabelKey)}
                                                </span>
                                                <span className="text-[11px] text-white/50 uppercase tracking-wider">
                                                    TVC / Video
                                                </span>
                                            </div>

                                            <h4 className="font-cre8 text-base font-bold text-white transition-colors group-hover:text-orange">
                                                {item.title}
                                            </h4>

                                            <p className="line-clamp-2 text-xs leading-relaxed text-white/70">
                                                {item.description[lang]}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSelectCinema(item.id)}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange transition-colors hover:text-orange/80"
                                            >
                                                <Play className="size-3 fill-current" />
                                                <span>{t('selectToPlay')}</span>
                                            </button>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(item)}
                                                    title={t('copyLink')}
                                                    className="inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                                >
                                                    {copiedId === item.id ? (
                                                        <Check className="size-3.5 text-green-400" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                </button>
                                                <a
                                                    href={item.youtubeUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={t('watchOnYoutube')}
                                                    className="inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                                >
                                                    <ExternalLink className="size-3.5" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
