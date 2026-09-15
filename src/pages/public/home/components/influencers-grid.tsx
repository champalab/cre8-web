import { useEffect, useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import SafeImage from '@/components/ui/SafeImage'
import { fetchInfluencers, type Influencer } from './influencers.api'


const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
)
const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
)
const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
)
const Tiktok = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
)

const platformIcons: Record<string, React.ReactNode> = {
    instagram: <Instagram className="size-4" />,
    youtube: <Youtube className="size-4" />,
    facebook: <Facebook className="size-4" />,
    tiktok: <Tiktok className="size-4" />,
}

function formatFollowers(num: number | null | undefined): string {
    if (!num) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
    return num.toString()
}

export function InfluencersGrid() {
    const reduceMotion = useReducedMotion()
    const [influencers, setInfluencers] = useState<Influencer[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        fetchInfluencers().then((data) => {
            if (mounted) {
                setInfluencers(data)
                setLoading(false)
            }
        })
        return () => {
            mounted = false
        }
    }, [])

    const fadeUp: Variants = {
        hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    }

    const stagger: Variants = {
        hidden: {},
        show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="size-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
        )
    }

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
            {influencers.map((influencer) => (
                <motion.div key={influencer.id} variants={fadeUp} className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 transition-all duration-500 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-[0_8px_32px_rgba(255,107,0,0.2)]">
                    <div className="aspect-[4/6] w-full overflow-hidden">
                        <SafeImage
                            src={influencer.imageUrl}
                            alt={influencer.name}
                            variant="avatar"
                            fallbackName={influencer.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />


                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-5">
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <span className="rounded-full bg-white/20 px-0 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md whitespace-nowrap">
                                {/* {influencer.category} */}
                            </span>
                            <div className="flex-wrap items-center justify-end gap-1.5">
                                {influencer.influencerSocialAccounts?.map((account, index) => {
                                    if (account.follower_count && account.follower_count > 0) {
                                        return (
                                            <div key={index} className="flex mb-2 items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                                                {account.platform && platformIcons[account.platform.toLowerCase()]}
                                                {formatFollowers(account.follower_count)}
                                            </div>
                                        )
                                    }
                                    return null
                                })}
                            </div>
                        </div>
                        <h3 className="font-cre8 text-xl font-bold text-white">{influencer.name}</h3>
                        {influencer.influencerSocialAccounts?.length > 0 && (
                            <p className="text-sm font-medium text-orange-400">{influencer.influencerSocialAccounts[0].handle}</p>
                        )}
                        {influencer.influencerSocialAccounts?.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {influencer.influencerSocialAccounts.map((account, index) => {
                                    if (!account.profile_url || !account.platform) return null
                                    return (
                                        <a
                                            key={index}
                                            href={account.profile_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-orange-500 hover:text-white backdrop-blur-md"
                                            title={account.handle || account.platform}
                                        >
                                            {platformIcons[account.platform.toLowerCase()]}
                                        </a>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    )
}
