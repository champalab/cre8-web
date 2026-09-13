export const SEO_SLUGS = [
    'influencer-marketing',
    'digital-marketing-laos',
    'facebook-tiktok-management',
    'video-production',
    'campaign-management',
    'public-relations',
    'consumer-research',
    'contact'
] as const

export type SeoSlug = (typeof SEO_SLUGS)[number]
export type SeoPageKey = 'home' | 'services' | SeoSlug

export const HOME_RELATED_SLUGS: SeoSlug[] = [
    'influencer-marketing',
    'digital-marketing-laos',
    'facebook-tiktok-management',
    'campaign-management'
]

export const SERVICE_KEY_TO_SLUG: Record<string, SeoSlug> = {
    svcInfluencer: 'influencer-marketing',
    svc360: 'campaign-management',
    svcVideo: 'video-production',
    svcPr: 'public-relations',
    svcRoadshow: 'campaign-management',
    svcPremiums: 'campaign-management'
}

export const SEO_PAGE_META: Record<
    SeoPageKey,
    { changefreq: 'weekly' | 'monthly'; priority: number }
> = {
    home: { changefreq: 'weekly', priority: 1 },
    services: { changefreq: 'weekly', priority: 0.9 },
    'influencer-marketing': { changefreq: 'weekly', priority: 0.9 },
    'digital-marketing-laos': { changefreq: 'weekly', priority: 0.8 },
    'facebook-tiktok-management': { changefreq: 'weekly', priority: 0.8 },
    'video-production': { changefreq: 'monthly', priority: 0.7 },
    'campaign-management': { changefreq: 'monthly', priority: 0.7 },
    'public-relations': { changefreq: 'monthly', priority: 0.6 },
    'consumer-research': { changefreq: 'monthly', priority: 0.6 },
    contact: { changefreq: 'monthly', priority: 0.7 }
}

export function isSeoSlug(value: string | undefined): value is SeoSlug {
    return Boolean(value && (SEO_SLUGS as readonly string[]).includes(value))
}

export function pageKeyFromBarePath(barePath: string): SeoPageKey | null {
    if (barePath === '/') return 'home'
    if (barePath === '/services') return 'services'
    const slug = barePath.replace(/^\//, '')
    return isSeoSlug(slug) ? slug : null
}
