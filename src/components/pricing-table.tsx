import type { LucideIcon } from 'lucide-react'
import { ArrowRight, Building2, Check, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PricingTier = {
  id: string
  name: string
  description: string
  price: string
  period?: string
  features: string[]
  ctaLabel: string
  href: string
  highlighted?: boolean
  icon?: LucideIcon
}

export type PricingTableProps = {
  title?: string
  subtitle?: string
  tiers: PricingTier[]
  className?: string
}

export const DEFAULT_PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For brands testing a first campaign.',
    price: '$1,200',
    period: '/project',
    features: ['Campaign briefing', '5 influencer shortlist', 'Basic performance report'],
    ctaLabel: 'Get started',
    href: '#contact',
    icon: Zap,
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Full-service content and ads management.',
    price: '$3,800',
    period: '/month',
    features: [
      'Content strategy & posting',
      'Paid social management',
      'Monthly insight report',
      'Priority support',
    ],
    ctaLabel: 'Choose Growth',
    href: '#contact',
    highlighted: true,
    icon: Sparkles,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom retainers for multi-market brands.',
    price: 'Custom',
    features: [
      'Dedicated account team',
      '360° campaign management',
      'Research & production',
      'SLA & quarterly reviews',
    ],
    ctaLabel: 'Talk to us',
    href: '#contact',
    icon: Building2,
  },
]

function PricingCard({ tier }: { tier: PricingTier }) {
  const Icon = tier.icon ?? Check

  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-2xl border p-6 shadow-sm backdrop-blur-xl transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-lg',
        tier.highlighted
          ? 'border-orange/50 bg-orange/10 dark:bg-orange/15'
          : 'border-white/15 bg-white/10 dark:border-white/10 dark:bg-white/5'
      )}
    >
      {tier.highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
          Popular
        </span>
      ) : null}

      <div className="mb-5 flex items-center gap-3">
        <span
          className={cn(
            'inline-flex size-10 items-center justify-center rounded-xl',
            tier.highlighted ? 'bg-orange text-black' : 'bg-white/10 text-orange'
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="font-cre8 text-lg font-bold text-foreground dark:text-white">{tier.name}</h3>
          <p className="text-sm text-muted-foreground dark:text-white/70">{tier.description}</p>
        </div>
      </div>

      <p className="mb-6 font-cre8 text-3xl font-bold text-foreground dark:text-white">
        {tier.price}
        {tier.period ? (
          <span className="ml-1 text-sm font-medium text-muted-foreground dark:text-white/60">{tier.period}</span>
        ) : null}
      </p>

      <ul className="mb-8 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground dark:text-white/80">
            <Check className="mt-0.5 size-4 shrink-0 text-orange" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href={tier.href}
        className={cn(
          'inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors',
          tier.highlighted
            ? 'bg-orange text-black hover:bg-orange/90'
            : 'border border-white/15 bg-white/10 text-foreground hover:bg-white/20 dark:text-white'
        )}
      >
        {tier.ctaLabel}
        <ArrowRight className="size-4" />
      </a>
    </article>
  )
}

export function PricingTable({
  title = 'Pricing',
  subtitle = 'Choose a plan that matches your campaign goals.',
  tiers,
  className,
}: PricingTableProps) {
  if (tiers.length === 0) {
    return (
      <section className={cn('w-full py-16', className)}>
        <p className="text-center text-sm text-muted-foreground">No pricing plans available.</p>
      </section>
    )
  }

  return (
    <section className={cn('w-full py-16', className)}>
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="mb-10 text-center">
          <h2 className="font-cre8 text-3xl font-bold text-foreground dark:text-white md:text-4xl">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-muted-foreground dark:text-white/70">{subtitle}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tiers.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  )
}
