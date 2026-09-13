import dayjs from "dayjs"

export function formatDate(value?: string | null): string {
    if (!value) return '—'
    const parsed = dayjs(value)
    if (!parsed.isValid()) return '—'
    return parsed.format('DD/MM/YYYY')
}

/** Date + time for sync timestamps, audit logs, notifications */
export function formatDateTime(value?: string | null): string {
    if (!value) return '—'
    const parsed = dayjs(value)
    if (!parsed.isValid()) return '—'
    return parsed.format('DD/MM/YYYY HH:mm')
}

/** Convert API/ISO value to `yyyy-mm-dd` for `<input type="date">` */
export function toFormDate(value?: string | null): string {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

export function toApiDateTime(value?: string): string | undefined {
    if (!value?.trim()) return undefined

    const str = value.trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const date = new Date(`${str}T00:00:00`)
        if (Number.isNaN(date.getTime())) return undefined
        return date.toISOString()
    }

    const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str) ? `${str}:00` : str
    const date = new Date(normalized)

    if (Number.isNaN(date.getTime())) return undefined

    return date.toISOString()
}
