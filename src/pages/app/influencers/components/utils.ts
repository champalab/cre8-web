export type ActorFormValues = {
    name: string
    email: string
    phone_number: string
    profile_url: string
    profile_urls: string[]
    status: 'ACTIVE' | 'INACTIVE'
    gender: 'Male' | 'Female' | ''
    code: string
    source: 'Rizz' | 'Freelance' | ''
    date_of_birth: string
    marital_status: 'Single' | 'Married without kids' | 'Married with kids' | ''
    tags: string
    standard_price: number | ''
    province_id: number | ''
    address_express: string
    bank_account_number: string
    bank_account_name: string
    price_photo: number | ''
    price_video: number | ''
    price_video_photo: number | ''
    client_repost: boolean
    additional_charge_amount: number | ''
}

export const emptyActorForm: ActorFormValues = {
    name: '',
    email: '',
    phone_number: '',
    profile_url: '',
    profile_urls: [],
    status: 'ACTIVE',
    gender: '',
    code: '',
    source: '',
    date_of_birth: '2000',
    marital_status: '',
    tags: '',
    standard_price: '',
    province_id: '',
    address_express: '',
    bank_account_number: '',
    bank_account_name: '',
    price_photo: '',
    price_video: '',
    price_video_photo: '',
    client_repost: false,
    additional_charge_amount: '',
}

export const emptyForm = emptyActorForm

export const formatCount = (value: string | number | null | undefined) => {
    if (value == null || value === '') return '—'
    return Number(value).toLocaleString()
}

export const getActorStatus = (status?: string | null): 'ACTIVE' | 'INACTIVE' =>
    status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'

export const actorStatusClass = (status?: string | null) =>
    getActorStatus(status) === 'ACTIVE'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        : 'border-slate-400/30 bg-slate-500/10 text-slate-600 dark:text-slate-400'

export const formatHandle = (account?: {
    handle?: string | null
    profile_url?: string | null
    platform?: string
} | null) => {
    if (!account) return 'Not connected'
    if (account.handle?.trim()) {
        return account.handle.startsWith('@') ? account.handle : `@${account.handle}`
    }

    const url = account.profile_url || ''
    try {
        const path = new URL(url).pathname.split('/').filter(Boolean)[0]
        if (!path) return 'Connected'
        return path.startsWith('@') ? path : `@${path}`
    } catch {
        return 'Connected'
    }
}

export const PLATFORM_META = {
    facebook: {
        label: 'Facebook',
        short: 'f',
        iconClass: 'bg-[#1877F2] text-white',
        panelClass: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20',
    },
    instagram: {
        label: 'Instagram',
        short: 'IG',
        iconClass: 'bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 text-white',
        panelClass: 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20',
    },
    tiktok: {
        label: 'TikTok',
        short: '♪',
        iconClass: 'bg-slate-950 text-white dark:bg-white dark:text-slate-950',
        panelClass: 'hover:bg-slate-50 dark:hover:bg-slate-900/50',
    },
} as const

export type ActorPlatform = keyof typeof PLATFORM_META
