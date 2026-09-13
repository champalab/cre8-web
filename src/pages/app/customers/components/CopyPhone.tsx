import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export default function CopyPhone({ phone }: { phone: string }) {
    const { t } = useTranslation('app')
    const [copied, setCopied] = useState(false)
    const [failed, setFailed] = useState(false)
    const [busy, setBusy] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => {
        setCopied(false)
        setFailed(false)
        return () => { if (timer.current) clearTimeout(timer.current) }
    }, [phone])

    const copy = async () => {
        if (busy) return
        setBusy(true)
        setFailed(false)
        try {
            await navigator.clipboard.writeText(phone)
            setCopied(true)
            if (timer.current) clearTimeout(timer.current)
            timer.current = setTimeout(() => setCopied(false), 2000)
        } catch {
            setCopied(false)
            setFailed(true)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div>
            <div className="flex flex-wrap items-center gap-1.5">
                <span>{phone || '-'}</span>
                {phone.trim() && phone !== '-' && phone !== '—' && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" disabled={busy} onClick={copy} aria-label={t('customers.copyPhone')}>
                        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                        <span role="status">{t(copied ? 'customers.phoneCopied' : 'customers.copy')}</span>
                    </Button>
                )}
            </div>
            {failed && <p role="alert" className="text-xs text-destructive">{t('customers.copyPhoneFailed')}</p>}
        </div>
    )
}
