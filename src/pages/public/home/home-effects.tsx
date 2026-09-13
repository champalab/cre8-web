import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { AppWindow, Globe, Heart, Monitor, Plus, Smartphone, Smile, ThumbsUp } from 'lucide-react'
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  type MotionValue,
  type Variants,
} from 'framer-motion'
import { cn } from '@/lib/utils'

type GlowCardProps = {
  children: ReactNode
  className?: string
  variants?: Variants
}

export function GlowCard({ children, className, variants }: GlowCardProps) {
  return (
    <motion.div variants={variants} className={cn('group relative rounded-xl p-px', className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <motion.div
          className="absolute inset-[-80%] bg-[conic-gradient(from_90deg,transparent_40%,var(--color-orange)_62%,white_72%,transparent_82%)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <div
        className={cn(
          'relative h-full rounded-[11px] border border-white/15 bg-card p-6 transition-all duration-300',
          'group-hover:border-orange/40 group-hover:shadow-[0_0_32px_rgba(255,107,0,0.2)]'
        )}
      >
        {children}
      </div>
    </motion.div>
  )
}

type GlowRowProps = {
  children: ReactNode
  variants?: Variants
}

export function GlowRow({ children, variants }: GlowRowProps) {
  return (
    <motion.div variants={variants} className="group relative rounded-2xl p-px">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <motion.div
          className="absolute inset-[-80%] bg-[conic-gradient(from_90deg,transparent_40%,var(--color-orange)_62%,white_72%,transparent_82%)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <div className="relative flex items-center gap-4 rounded-[15px] border border-white/10 bg-card/50 px-4 py-3 transition-all duration-300 group-hover:border-orange/40 group-hover:shadow-[0_0_28px_rgba(255,107,0,0.2)]">
        {children}
      </div>
    </motion.div>
  )
}

type HeroAmbientProps = {
  reduceMotion: boolean | null
  spotlight: MotionValue<string>
}

export function HeroAmbient({ reduceMotion, spotlight }: HeroAmbientProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-orange)_0%,color-mix(in_srgb,var(--color-orange)_42%,black)_28%,transparent_68%)]"
        animate={reduceMotion ? undefined : { scale: [1, 1.1, 1], opacity: [0.78, 1, 0.78] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: 'center' }}
      />
      <motion.div
        aria-hidden
        className="absolute -inset-[18%] opacity-70"
        style={{ backgroundImage: spotlight }}
        animate={reduceMotion ? undefined : { x: ['-6%', '6%', '-6%'], y: ['-4%', '5%', '-4%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,black_78%)]"
      />
    </div>
  )
}

type MagneticLinkProps = {
  href: string
  className?: string
  children: ReactNode
}

export function MagneticLink({ href, className, children }: MagneticLinkProps) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 260, damping: 16, mass: 0.35 })
  const springY = useSpring(y, { stiffness: 260, damping: 16, mass: 0.35 })

  const onMove = (event: MouseEvent<HTMLAnchorElement>) => {
    if (reduceMotion) return
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    x.set((event.clientX - rect.left - rect.width / 2) * 0.32)
    y.set((event.clientY - rect.top - rect.height / 2) * 0.32)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.a
      ref={ref}
      href={href}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.a>
  )
}

type ScrollTimelineProps = {
  children: ReactNode
}

export function ScrollTimeline({ children }: ScrollTimelineProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.78', 'end 0.28'],
  })
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 })

  return (
    <div ref={ref} className="relative pl-5">
      <div className="absolute bottom-1 left-0 top-1 w-0.5 rounded-full bg-white/15" />
      <motion.div
        className="absolute bottom-1 left-0 top-1 w-0.5 origin-top rounded-full bg-gradient-to-b from-orange via-orange to-orange-soft shadow-[0_0_12px_rgba(255,107,0,0.55)]"
        style={{ scaleY: fill }}
      />
      <div className="space-y-4">{children}</div>
    </div>
  )
}

type ContentStep = {
  id: string
  titleKey: 'planTitle' | 'executeTitle' | 'analyseTitle'
  featured: boolean
  itemKeys: readonly string[]
  itemClassName: string
  bulletClassName: string
}

const CONTENT_STEPS: ContentStep[] = [
  {
    id: 'plan',
    titleKey: 'planTitle',
    featured: false,
    itemKeys: ['planPillars', 'planStrategy', 'planBoosting', 'planTimeline'],
    itemClassName: 'text-white',
    bulletClassName: 'bg-orange',
  },
  {
    id: 'execute',
    titleKey: 'executeTitle',
    featured: true,
    itemKeys: ['executeArtwork', 'executeMotion', 'executeVideo', 'executeCaption', 'executePosting', 'executeBoosting', 'executeReplies'],
    itemClassName: 'text-white',
    bulletClassName: 'bg-white',
  },
  {
    id: 'analyse',
    titleKey: 'analyseTitle',
    featured: false,
    itemKeys: ['analyseContent', 'analyseAds', 'analyseCompetitors', 'analyseFeedback', 'analyseTrends'],
    itemClassName: 'text-orange',
    bulletClassName: 'bg-orange',
  },
]

function ChannelMark({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="inline-flex size-10 items-center justify-center rounded-full bg-white shadow-md" aria-label={label}>
      {children}
    </span>
  )
}

export function ContentManagementShowcase() {
  const { t } = useTranslation('home')
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-6 md:p-8">
      <div className="mb-8 flex items-center gap-4">
        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange shadow-[0_8px_24px_rgba(255,107,0,0.28)]">
          <span className="grid grid-cols-2 gap-0.5 text-white">
            <ThumbsUp className="size-3.5 stroke-[2]" />
            <Smile className="size-3.5 stroke-[2]" />
            <Heart className="size-3.5 stroke-[2]" />
            <Plus className="size-3.5 stroke-[2]" />
          </span>
        </span>
        <h3 className="font-cre8 text-2xl font-bold text-white md:text-3xl">{t('contentTitle')}</h3>
      </div>

      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
        {CONTENT_STEPS.map((step, index) => (
          <div key={step.id} className="contents">
            <motion.div
              className={cn(
                'w-full flex-1 rounded-2xl p-5',
                step.featured
                  ? 'bg-orange shadow-[0_12px_36px_rgba(255,107,0,0.35)] lg:min-h-[22rem] lg:scale-[1.04]'
                  : 'border border-white/10 bg-[#2a2a2a]'
              )}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <h4 className="mb-4 text-lg font-bold text-white">{t(step.titleKey)}</h4>
              <ul className="space-y-2">
                {step.itemKeys.map((key) => (
                  <li key={key} className={cn('flex items-start gap-2 text-sm', step.itemClassName)}>
                    <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', step.bulletClassName)} />
                    {t(key as 'planPillars')}
                  </li>
                ))}
              </ul>
            </motion.div>
            {index < CONTENT_STEPS.length - 1 ? (
              <span className="mx-auto rotate-90 text-white lg:mx-0 lg:rotate-0" aria-hidden>
                <svg viewBox="0 0 24 24" className="size-7 fill-white">
                  <path d="M13.2 5.2 20 12l-6.8 6.8V14H4v-4h9.2V5.2Z" />
                </svg>
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-white">{t('keyChannels')}</p>
        <div className="flex items-center gap-3">
          <ChannelMark label="Facebook">
            <svg viewBox="0 0 24 24" className="size-5 fill-[#1877F2]">
              <path d="M14.5 8.5V6.8c0-.8.2-1.3 1.4-1.3h1.1V3h-1.9C12.6 3 11 4.5 11 7v1.5H9v2.6h2V21h3.5v-9.9h2.3l.5-2.6h-2.8Z" />
            </svg>
          </ChannelMark>
          <ChannelMark label="Instagram">
            <svg viewBox="0 0 24 24" className="size-5">
              <defs>
                <linearGradient id="ig" x1="0" y1="24" x2="24" y2="0">
                  <stop stopColor="#F58529" />
                  <stop offset=".5" stopColor="#DD2A7B" />
                  <stop offset="1" stopColor="#8134AF" />
                </linearGradient>
              </defs>
              <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="url(#ig)" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="3.6" fill="none" stroke="url(#ig)" strokeWidth="1.8" />
              <circle cx="16.6" cy="7.4" r="1" fill="#DD2A7B" />
            </svg>
          </ChannelMark>
          <ChannelMark label="YouTube">
            <svg viewBox="0 0 24 24" className="size-5 fill-[#FF0000]">
              <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8ZM10.2 15.2V8.8L15.4 12l-5.2 3.2Z" />
            </svg>
          </ChannelMark>
          <ChannelMark label="TikTok">
            <svg viewBox="0 0 24 24" className="size-5 fill-black">
              <path d="M15.6 4c.5 2.4 2 4 4.4 4.3v2.4c-1.5 0-2.9-.5-4.1-1.3v5.7a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v2.6a3.2 3.2 0 1 0 2.3 3.1V4h2.3Z" />
            </svg>
          </ChannelMark>
        </div>
      </div>
    </div>
  )
}

const ADS_CHANNELS = [
  {
    id: 'social',
    titleKey: 'channelSocial' as const,
    icons: (
      <>
        <ChannelMark label="Facebook">
          <svg viewBox="0 0 24 24" className="size-5 fill-[#1877F2]">
            <path d="M14.5 8.5V6.8c0-.8.2-1.3 1.4-1.3h1.1V3h-1.9C12.6 3 11 4.5 11 7v1.5H9v2.6h2V21h3.5v-9.9h2.3l.5-2.6h-2.8Z" />
          </svg>
        </ChannelMark>
        <ChannelMark label="Instagram">
          <svg viewBox="0 0 24 24" className="size-5">
            <defs>
              <linearGradient id="ig-ads" x1="0" y1="24" x2="24" y2="0">
                <stop stopColor="#F58529" />
                <stop offset=".5" stopColor="#DD2A7B" />
                <stop offset="1" stopColor="#8134AF" />
              </linearGradient>
            </defs>
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="url(#ig-ads)" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="3.6" fill="none" stroke="url(#ig-ads)" strokeWidth="1.8" />
            <circle cx="16.6" cy="7.4" r="1" fill="#DD2A7B" />
          </svg>
        </ChannelMark>
        <ChannelMark label="TikTok">
          <svg viewBox="0 0 24 24" className="size-5 fill-black">
            <path d="M15.6 4c.5 2.4 2 4 4.4 4.3v2.4c-1.5 0-2.9-.5-4.1-1.3v5.7a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v2.6a3.2 3.2 0 1 0 2.3 3.1V4h2.3Z" />
          </svg>
        </ChannelMark>
      </>
    ),
  },
  {
    id: 'google',
    titleKey: 'channelGoogle' as const,
    icons: (
      <>
        <ChannelMark label="Google">
          <svg viewBox="0 0 24 24" className="size-5">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2h3.2c1.9-1.7 3-4.2 3-7.2Z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.8 19.7 8.1 22 12 22Z" />
            <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.6L6.4 14Z" />
            <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 2.9 14.7 2 12 2 8.1 2 4.8 4.3 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z" />
          </svg>
        </ChannelMark>
        <ChannelMark label="YouTube">
          <svg viewBox="0 0 24 24" className="size-5 fill-[#FF0000]">
            <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8ZM10.2 15.2V8.8L15.4 12l-5.2 3.2Z" />
          </svg>
        </ChannelMark>
      </>
    ),
  },
  {
    id: 'web',
    titleKey: 'channelWeb' as const,
    icons: (
      <>
        <span className="inline-flex size-12 items-center justify-center rounded-lg bg-[#2f2f2f] text-orange" aria-label="Website">
          <Monitor className="size-7 stroke-[1.6]" />
        </span>
        <span className="inline-flex size-12 flex-col items-center justify-center rounded-lg bg-[#c4b5fd] text-[#3b0764]" aria-label="Apps">
          <AppWindow className="size-6 stroke-[1.6]" />
          <span className="text-[8px] font-bold leading-none">APP</span>
        </span>
      </>
    ),
  },
  {
    id: 'music',
    titleKey: 'channelMusic' as const,
    icons: (
      <>
        <span className="inline-flex size-11 items-center justify-center rounded-md bg-[#7AC143]" aria-label="JOOX">
          <svg viewBox="0 0 24 24" className="size-7 fill-black">
            <circle cx="12" cy="12" r="5.5" fill="none" stroke="black" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="1.5" />
          </svg>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-black px-2 py-1" aria-label="Spotify">
          <svg viewBox="0 0 24 24" className="size-6 fill-[#1DB954]">
            <circle cx="12" cy="12" r="10" />
            <path fill="black" d="M16.7 16.3c-.2.4-.7.5-1 .2-2.8-1.7-6.3-2.1-10.4-1.1-.5.1-.9-.2-1-.6-.1-.5.2-.9.6-1 4.5-1 8.4-.6 11.6 1.3.4.2.5.7.2 1.2Zm.9-2.7c-.3.4-.8.6-1.2.3-3.2-2-8-2.6-11.8-1.4-.5.1-1-.2-1.1-.7-.1-.5.2-1 .7-1.1 4.3-1.3 9.6-.6 13.3 1.6.4.3.6.8.1 1.3Zm.1-2.8C13.8 8.6 8 8.4 5 9.3c-.6.2-1.2-.2-1.3-.8-.2-.6.2-1.2.8-1.3 3.5-1.1 10-.8 14.2 1.7.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.4Z" />
          </svg>
          <span className="pr-1 text-xs font-bold text-[#1DB954]">Spotify</span>
        </span>
      </>
    ),
  },
] as const

export function DigitalAdsShowcase() {
  const { t } = useTranslation('home')
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-6 md:p-8">
      <div className="mb-3 flex items-center gap-4">
        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange shadow-[0_8px_24px_rgba(255,107,0,0.28)]">
          <span className="grid grid-cols-2 gap-0.5 text-white">
            <ThumbsUp className="size-3.5 stroke-[2]" />
            <Smile className="size-3.5 stroke-[2]" />
            <Heart className="size-3.5 stroke-[2]" />
            <Plus className="size-3.5 stroke-[2]" />
          </span>
        </span>
        <h3 className="font-cre8 text-2xl font-bold md:text-3xl">
          <Trans
            i18nKey="digitalHeading"
            ns="home"
            components={{ white: <span className="text-white" />, orange: <span className="text-orange" /> }}
          />
        </h3>
      </div>
      <p className="mb-8 text-sm text-white/80">{t('onlineMediaBuying')}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ADS_CHANNELS.map((channel, index) => (
          <motion.article
            key={channel.id}
            className="rounded-2xl border border-white/10 bg-[#2a2a2a] p-5"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, boxShadow: '0 0 28px rgba(255,107,0,0.2)' }}
          >
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wide text-[#f5c542]">{t(channel.titleKey)}</h4>
            <div className="flex flex-wrap items-center gap-3">{channel.icons}</div>
          </motion.article>
        ))}
      </div>
    </div>
  )
}

type CountUpProps = {
  value: number
  suffix?: string
  decimals?: number
}

function CountUp({ value, suffix = '', decimals = 0 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 70, damping: 22 })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (inView) motionValue.set(value)
  }, [inView, motionValue, value])

  useEffect(() => {
    return spring.on('change', (latest) => {
      setDisplay(latest.toFixed(decimals))
    })
  }, [decimals, spring])

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  )
}

const MEDIA_PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook',
    users: 4.3,
    suffix: 'M',
    icon: (
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-[#1877F2]">
        <svg viewBox="0 0 24 24" className="size-6 fill-white">
          <path d="M14.5 8.5V6.8c0-.8.2-1.3 1.4-1.3h1.1V3h-1.9C12.6 3 11 4.5 11 7v1.5H9v2.6h2V21h3.5v-9.9h2.3l.5-2.6h-2.8Z" />
        </svg>
      </span>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    users: 0.52,
    suffix: 'M',
    decimals: 2,
    icon: (
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]">
        <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-white stroke-[1.8]">
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <circle cx="12" cy="12" r="3.4" />
          <circle cx="16.4" cy="7.6" r="0.8" fill="white" stroke="none" />
        </svg>
      </span>
    ),
  },
  {
    id: 'youtube',
    name: 'YouTube',
    users: 2.4,
    suffix: 'M',
    icon: (
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-[#FF0000]">
        <svg viewBox="0 0 24 24" className="size-6 fill-white">
          <path d="M9.8 8.6v6.8L16 12 9.8 8.6Z" />
        </svg>
      </span>
    ),
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    users: 3.5,
    suffix: 'M',
    icon: (
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-black ring-1 ring-white/20">
        <svg viewBox="0 0 24 24" className="size-6 fill-white">
          <path d="M15.6 4c.5 2.4 2 4 4.4 4.3v2.4c-1.5 0-2.9-.5-4.1-1.3v5.7a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v2.6a3.2 3.2 0 1 0 2.3 3.1V4h2.3Z" />
        </svg>
      </span>
    ),
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    users: 180,
    suffix: 'K',
    decimals: 0,
    icon: (
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-[#0A66C2] text-sm font-bold text-white">
        in
      </span>
    ),
  },
  {
    id: 'x',
    name: 'X',
    users: 282,
    suffix: 'K',
    decimals: 0,
    icon: (
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-black ring-1 ring-white/20 text-lg font-bold text-white">
        X
      </span>
    ),
  },
  {
    id: 'messenger',
    name: 'Messenger',
    users: 2.8,
    suffix: 'M',
    icon: (
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-[#0084FF]">
        <svg viewBox="0 0 24 24" className="size-6 fill-white">
          <path d="M12 3C6.9 3 3 6.6 3 11.2c0 2.7 1.3 5.1 3.5 6.7V21l3.2-1.8c.7.2 1.5.3 2.3.3 5.1 0 9-3.6 9-8.3S17.1 3 12 3Zm.9 11.1-2.3-2.5-4.5 2.5 4.9-5.2 2.4 2.5 4.4-2.5-4.9 5.2Z" />
        </svg>
      </span>
    ),
  },
] as const

export function MediaLandscapeShowcase() {
  const { t } = useTranslation('home')
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-6 md:p-8">
      <div className="mb-8 flex items-center gap-4">
        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange shadow-[0_8px_24px_rgba(255,107,0,0.28)]">
          <span className="grid grid-cols-2 gap-0.5 text-white">
            <ThumbsUp className="size-3.5 stroke-[2]" />
            <Smile className="size-3.5 stroke-[2]" />
            <Heart className="size-3.5 stroke-[2]" />
            <Plus className="size-3.5 stroke-[2]" />
          </span>
        </span>
        <h3 className="font-cre8 text-2xl font-bold text-white md:text-3xl">{t('mediaLandscape')}</h3>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.2fr] lg:items-center">
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p className="font-cre8 text-5xl font-bold text-white md:text-6xl">
              <CountUp value={7.8} suffix="M" decimals={1} />
            </p>
            <p className="mt-1 text-white/80">{t('fbPopulation')}</p>
            <p className="text-sm text-white/55">{t('urbanisation')}</p>
          </motion.div>
          <motion.div
            className="flex items-start gap-3"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <Smartphone className="mt-1 size-7 stroke-[1.4] text-white" />
            <div>
              <p className="text-white/80">{t('mobileConnection')}</p>
              <p className="font-cre8 text-4xl font-bold text-white">
                <CountUp value={5.8} suffix="M" decimals={1} />
              </p>
              <p className="text-sm text-white/55">{t('mobilePenetration')}</p>
            </div>
          </motion.div>
          <motion.div
            className="flex items-start gap-3"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.16 }}
          >
            <Globe className="mt-1 size-7 stroke-[1.4] text-white" />
            <div>
              <p className="text-white/80">{t('internetUsers')}</p>
              <p className="font-cre8 text-4xl font-bold text-white">
                <CountUp value={3.55} suffix="M" decimals={2} />
              </p>
              <p className="text-sm text-white/55">{t('internetPenetration')}</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {MEDIA_PLATFORMS.map((platform, index) => (
            <motion.div
              key={platform.id}
              className="flex flex-col items-center gap-2 text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.04 }}
            >
              {platform.icon}
              <p className="font-cre8 text-xl font-bold text-white">
                <CountUp value={platform.users} suffix={platform.suffix} decimals={'decimals' in platform ? platform.decimals : 1} />
              </p>
              <p className="text-xs text-white/60">{t('users')}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
