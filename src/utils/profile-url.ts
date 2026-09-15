/**
 * Social Profile URL validation & handle extraction utility.
 * Covers Facebook, TikTok, Instagram with strict checks against invalid links
 * such as bare profile.php without ID, post links, reel links, or home pages.
 */

export type PlatformType = 'facebook' | 'tiktok' | 'instagram' | string

export type ProfileUrlValidationResult = {
    ok: boolean
    normalizedUrl?: string
    handle?: string
    error?: string
}

const FACEBOOK_HOSTS = new Set([
    'facebook.com',
    'www.facebook.com',
    'm.facebook.com',
    'web.facebook.com',
    'fb.com',
    'www.fb.com',
    'l.facebook.com',
])

const TIKTOK_HOSTS = new Set([
    'tiktok.com',
    'www.tiktok.com',
    'vm.tiktok.com',
    'vt.tiktok.com',
    'm.tiktok.com',
])

const INSTAGRAM_HOSTS = new Set([
    'instagram.com',
    'www.instagram.com',
    'm.instagram.com',
])

const FB_BLOCKED_PREFIXES = [
    '/share',
    '/reel',
    '/reels',
    '/watch',
    '/photo',
    '/photos',
    '/posts',
    '/permalink.php',
    '/story.php',
    '/stories',
    '/groups',
    '/group',
    '/events',
    '/event',
    '/marketplace',
    '/messages',
    '/notifications',
    '/settings',
    '/help',
    '/login',
    '/login.php',
    '/home.php',
    '/recover',
    '/hashtag',
]

const IG_BLOCKED_PREFIXES = [
    '/p',
    '/reel',
    '/reels',
    '/tv',
    '/stories',
    '/explore',
    '/direct',
    '/accounts',
    '/login',
    '/emails',
    '/directory',
]

export function detectPlatformFromUrl(rawUrl: string): PlatformType | null {
    let urlStr = rawUrl.trim()
    if (!urlStr) return null
    if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = 'https://' + urlStr
    }
    try {
        const host = new URL(urlStr).hostname.toLowerCase()
        if (FACEBOOK_HOSTS.has(host) || host.endsWith('.facebook.com') || host.endsWith('.fb.com')) {
            return 'facebook'
        }
        if (TIKTOK_HOSTS.has(host) || host.endsWith('.tiktok.com')) {
            return 'tiktok'
        }
        if (INSTAGRAM_HOSTS.has(host) || host.endsWith('.instagram.com')) {
            return 'instagram'
        }
    } catch {
        return null
    }
    return null
}

export function validateProfileUrl(
    rawUrl: string,
    platform: string,
    t?: (key: string, options?: any) => string
): ProfileUrlValidationResult {
    const trimmed = (rawUrl || '').trim()
    if (!trimmed) {
        return {
            ok: false,
            error: t ? t('influencers.errProfileUrlRequired') : 'Please enter Profile URL',
        }
    }

    let urlStr = trimmed
    if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = 'https://' + urlStr
    }

    let parsed: URL
    try {
        parsed = new URL(urlStr)
    } catch {
        return {
            ok: false,
            error: t ? t('influencers.errInvalidUrl') : 'Invalid URL format',
        }
    }

    const host = parsed.hostname.toLowerCase()
    const pathname = (parsed.pathname || '/').replace(/\/+$/, '') || '/'
    const pathLower = pathname.toLowerCase()
    const targetPlatform = platform.toLowerCase()

    // Detect mismatched platforms
    const detected = detectPlatformFromUrl(urlStr)
    if (detected && detected !== targetPlatform) {
        return {
            ok: false,
            error: t
                ? t('influencers.errPlatformMismatch', { expected: platform, detected })
                : `This URL is for ${detected}, but you selected ${platform}.`,
        }
    }

    if (targetPlatform === 'facebook') {
        const isFb =
            FACEBOOK_HOSTS.has(host) ||
            host.endsWith('.facebook.com') ||
            host.endsWith('.fb.com')

        if (!isFb) {
            return {
                ok: false,
                error: t
                    ? t('influencers.errFbMustBeFacebook')
                    : 'Facebook Profile URL must be a facebook.com domain',
            }
        }

        // Profile.php rule
        if (pathLower === '/profile.php' || pathLower.startsWith('/profile.php/')) {
            const id = parsed.searchParams.get('id')?.trim()
            if (!id || !/^\d+$/.test(id)) {
                return {
                    ok: false,
                    error: t
                        ? t('influencers.errFbProfilePhpMissingId')
                        : 'Facebook profile.php is missing ID. Example: https://www.facebook.com/profile.php?id=100012345678',
                }
            }
            return {
                ok: true,
                normalizedUrl: `https://www.facebook.com/profile.php?id=${id}`,
                handle: id,
            }
        }

        // Root home page
        if (pathname === '/' || !pathname) {
            return {
                ok: false,
                error: t
                    ? t('influencers.errFbHomeNotProfile')
                    : 'Please enter the influencer profile link, not Facebook home page',
            }
        }

        // Blocked paths (posts, reels, groups, stories, etc.)
        for (const blocked of FB_BLOCKED_PREFIXES) {
            if (pathLower === blocked || pathLower.startsWith(blocked + '/')) {
                return {
                    ok: false,
                    error: t
                        ? t('influencers.errFbNotProfileLink')
                        : 'This link is a post, video, reel, or group, not a Facebook profile URL',
                }
            }
        }

        const segments = pathname.split('/').filter(Boolean)
        if (segments.length === 0) {
            return {
                ok: false,
                error: t
                    ? t('influencers.errFbHomeNotProfile')
                    : 'Please enter a valid Facebook profile URL',
            }
        }

        // People or p paths: e.g. /people/Name/100012345 or /p/Name-100012345
        let handle = segments[0]
        if (segments[0].toLowerCase() === 'people' && segments.length >= 2) {
            handle = segments[segments.length - 1]
        } else if (segments[0].toLowerCase() === 'p' && segments.length >= 2) {
            handle = segments[1]
        }

        return {
            ok: true,
            normalizedUrl: urlStr,
            handle,
        }
    }

    if (targetPlatform === 'tiktok') {
        const isTiktok = TIKTOK_HOSTS.has(host) || host.endsWith('.tiktok.com')
        if (!isTiktok) {
            return {
                ok: false,
                error: t
                    ? t('influencers.errTiktokDomain')
                    : 'TikTok Profile URL must be a tiktok.com domain',
            }
        }

        if (pathLower === '/' || !pathLower) {
            return {
                ok: false,
                error: t
                    ? t('influencers.errTiktokFormat')
                    : 'TikTok profile URL must be https://www.tiktok.com/@username',
            }
        }

        if (/^\/@[a-zA-Z0-9_.-]+\/video\//i.test(pathname)) {
            return {
                ok: false,
                error: t
                    ? t('influencers.errTiktokVideoNotProfile')
                    : 'This is a TikTok video link, not a profile URL',
            }
        }

        const match = pathname.match(/^\/@([a-zA-Z0-9_.-]+)/)
        if (!match || !match[1]) {
            return {
                ok: false,
                error: t
                    ? t('influencers.errTiktokFormat')
                    : 'TikTok profile URL must be https://www.tiktok.com/@username',
            }
        }

        return {
            ok: true,
            normalizedUrl: `https://www.tiktok.com/@${match[1]}`,
            handle: `@${match[1]}`,
        }
    }

    if (targetPlatform === 'instagram') {
        const isIg = INSTAGRAM_HOSTS.has(host) || host.endsWith('.instagram.com')
        if (!isIg) {
            return {
                ok: false,
                error: t
                    ? t('influencers.errIgDomain')
                    : 'Instagram Profile URL must be an instagram.com domain',
            }
        }

        if (pathLower === '/' || !pathLower) {
            return {
                ok: false,
                error: t
                    ? t('influencers.errIgFormat')
                    : 'Instagram profile URL must be https://www.instagram.com/username',
            }
        }

        for (const blocked of IG_BLOCKED_PREFIXES) {
            if (pathLower === blocked || pathLower.startsWith(blocked + '/')) {
                return {
                    ok: false,
                    error: t
                        ? t('influencers.errIgNotProfileLink')
                        : 'This link is an Instagram post, reel, or story, not a profile URL',
                }
            }
        }

        const match = pathname.match(/^\/([a-zA-Z0-9._]{1,30})$/)
        if (!match || !match[1]) {
            return {
                ok: false,
                error: t
                    ? t('influencers.errIgFormat')
                    : 'Instagram profile URL must be https://www.instagram.com/username',
            }
        }

        return {
            ok: true,
            normalizedUrl: `https://www.instagram.com/${match[1]}`,
            handle: match[1],
        }
    }

    // Generic fallback for any other platform
    return {
        ok: true,
        normalizedUrl: urlStr,
    }
}
