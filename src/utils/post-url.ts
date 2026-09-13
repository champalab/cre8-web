/** Post Link validation for content tasks. */

const FACEBOOK_HOSTS = new Set(['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com', 'fb.watch', 'fb.com', 'www.fb.com'])

export type InferredPlatform = 'facebook' | 'tiktok' | 'instagram'

export function inferPlatformFromUrl(url: string): InferredPlatform | null {
    let parsed: URL
    try {
        parsed = new URL(url.trim())
    } catch {
        return null
    }
    const host = parsed.hostname.toLowerCase()
    if (FACEBOOK_HOSTS.has(host) || host.endsWith('.facebook.com') || host === 'fb.watch' || host.endsWith('.fb.com')) {
        return 'facebook'
    }
    if (host.includes('tiktok.com')) return 'tiktok'
    if (host.includes('instagram.com')) return 'instagram'
    return null
}

function isAllowedFacebookPostPath(parsed: URL): boolean {
    const path = (parsed.pathname || '/').toLowerCase()
    if (/^\/(share|reel|watch|photo)(\/|$|\.php)/i.test(path)) return true
    if (path.includes('/photos/') || path.includes('/posts/')) return true
    if (path.endsWith('/permalink.php') || path.endsWith('/story.php') || path.endsWith('/photo.php')) return true
    if (parsed.searchParams.get('fbid') || parsed.searchParams.get('story_fbid')) return true
    return false
}

function normalizePlatform(value?: string | null) {
    if (!value) return ''
    const key = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
    if (key === 'facebook' || key === 'fb') return 'facebook'
    if (key === 'tiktok') return 'tiktok'
    if (key === 'instagram' || key === 'ig') return 'instagram'
    if (key === 'youtube' || key === 'yt') return 'youtube'
    return key
}

export type PostUrlValidationResult = { ok: true; url: string } | { ok: false; error: string }

export const POST_MEDIA_TYPES = ['photo', 'video'] as const
export type PostMediaType = (typeof POST_MEDIA_TYPES)[number]

export function inferPostMediaType(url: string, platform?: string | null): PostMediaType {
    const platformName = normalizePlatform(platform)
    if (platformName === 'tiktok') return 'video'

    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        return 'video'
    }

    const host = parsed.hostname.toLowerCase()
    const path = (parsed.pathname || '/').toLowerCase()

    if (platformName === 'instagram' || host.includes('instagram.com')) {
        if (/\/p\//.test(path)) return 'photo'
        return 'video'
    }

    if (platformName === 'facebook' || FACEBOOK_HOSTS.has(host)) {
        if (/\/share\/[vr]\//.test(path) || /\/(reel|watch)\b/.test(path) || path.includes('/videos/')) {
            return 'video'
        }
        if (
            /\/share\/p\//.test(path) ||
            /\/photo(\.php|\/|$)/.test(path) ||
            path.includes('/photos/') ||
            path.includes('/posts/') ||
            path.endsWith('/permalink.php') ||
            path.endsWith('/story.php') ||
            parsed.searchParams.has('fbid') ||
            parsed.searchParams.has('story_fbid')
        ) {
            return 'photo'
        }
    }

    return 'video'
}

/** Explicit photo/video from the URL path, or null when the user must choose. */
export function detectPostMediaType(url: string, platform?: string | null): PostMediaType | null {
    const platformName = normalizePlatform(platform) || inferPlatformFromUrl(url) || ''
    let parsed: URL
    try {
        parsed = new URL(url.trim())
    } catch {
        return null
    }
    const path = (parsed.pathname || '/').toLowerCase()

    if (platformName === 'tiktok' || parsed.hostname.toLowerCase().includes('tiktok.com')) {
        return /\/(video|t)\//.test(path) ? 'video' : null
    }
    if (platformName === 'instagram' || parsed.hostname.toLowerCase().includes('instagram.com')) {
        if (/\/p\//.test(path)) return 'photo'
        if (/\/reels?\//.test(path)) return 'video'
        return null
    }
    if (platformName === 'facebook' || FACEBOOK_HOSTS.has(parsed.hostname.toLowerCase()) || parsed.hostname.toLowerCase().endsWith('.facebook.com')) {
        if (/\/share\/p\//.test(path) || /\/photo(\.php|\/|$)/.test(path) || path.includes('/photos/') || path.includes('/posts/') || path.endsWith('/permalink.php') || path.endsWith('/story.php') || parsed.searchParams.has('fbid')) {
            return 'photo'
        }
        if (/\/share\/[vr]\//.test(path) || /\/(reel|watch)\b/.test(path) || path.includes('/videos/')) {
            return 'video'
        }
    }
    return null
}

export function validatePostLink(
    rawUrl: string | null | undefined,
    mediaType?: PostMediaType | '' | null
): PostUrlValidationResult & { field?: 'url' | 'media_type' } {
    const url = `${rawUrl ?? ''}`.trim()
    if (!url) return { ok: false, error: 'Please enter a post URL', field: 'url' }

    const platform = inferPlatformFromUrl(url)
    if (!platform) {
        return { ok: false, error: 'URL must be facebook.com, tiktok.com, or instagram.com', field: 'url' }
    }

    const base = validatePostUrl(url, platform)
    if (!base.ok) return { ...base, field: 'url' }

    if (platform === 'tiktok') {
        try {
            const path = new URL(base.url).pathname.toLowerCase()
            if (!/\/(video|t)\//.test(path)) {
                return { ok: false, error: 'TikTok link must be a video URL (e.g. /@user/video/...)', field: 'url' }
            }
        } catch {
            return { ok: false, error: 'Please enter a valid Post Link', field: 'url' }
        }
    }

    if (platform === 'instagram') {
        try {
            const path = new URL(base.url).pathname.toLowerCase()
            if (!/\/(p|reels?)\//.test(path)) {
                return { ok: false, error: 'Instagram link must be /p/... or /reel/...', field: 'url' }
            }
        } catch {
            return { ok: false, error: 'Please enter a valid Post Link', field: 'url' }
        }
    }

    if (mediaType !== 'photo' && mediaType !== 'video') {
        return { ok: false, error: 'Please choose Photo or Video', field: 'media_type' }
    }

    if (platform === 'facebook' && mediaType === 'video') {
        try {
            const path = new URL(base.url).pathname.toLowerCase()
            if (/^\/share(\/|$)/i.test(path) || !/^\/reel\/\d+/i.test(path)) {
                return {
                    ok: false,
                    error: 'Video only accepts Facebook reel links (https://www.facebook.com/reel/...)',
                    field: 'url'
                }
            }
        } catch {
            return { ok: false, error: 'Please enter a valid Post Link', field: 'url' }
        }
    }

    const detected = detectPostMediaType(base.url, platform)
    if (detected && detected !== mediaType) {
        return {
            ok: false,
            error: `This URL is a ${detected}. Choose ${detected === 'photo' ? 'Photo' : 'Video'}.`,
            field: 'media_type'
        }
    }

    return { ok: true, url: base.url }
}

export function validatePostUrl(rawUrl: string | null | undefined, platform?: string | null): PostUrlValidationResult {
    if (rawUrl == null || `${rawUrl}`.trim() === '') {
        return { ok: true, url: '' }
    }

    const url = `${rawUrl}`.trim()
    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        return { ok: false, error: 'Please enter a valid Post Link (e.g. https://...)' }
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { ok: false, error: 'Post Link must use HTTP or HTTPS' }
    }

    const platformName = normalizePlatform(platform)
    const hostIsFacebook = FACEBOOK_HOSTS.has(parsed.hostname.toLowerCase())

    if (platformName === 'facebook' || hostIsFacebook) {
        if (parsed.protocol !== 'https:') {
            return { ok: false, error: 'Facebook Post Link must use HTTPS' }
        }
        if (!hostIsFacebook) {
            return { ok: false, error: 'Facebook Post Link must be a facebook.com URL' }
        }
        if (!isAllowedFacebookPostPath(parsed)) {
            return {
                ok: false,
                error: 'Facebook Post Link must be a photo, reel, or share URL (e.g. https://www.facebook.com/photo/?fbid=... or https://www.facebook.com/share/p/...)'
            }
        }
        if (platformName && platformName !== 'facebook') {
            return {
                ok: false,
                error: 'Facebook URLs can only be used for Facebook content tasks'
            }
        }
    }

    return { ok: true, url }
}
