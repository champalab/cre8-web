import { useTranslation } from 'react-i18next'

export default function CampaignViewProgress({ actual, target }: { actual: number; target?: number | null }) {
    const { t } = useTranslation('app')
    const percent = target && target > 0 ? Math.max(0, Number(actual || 0)) / target * 100 : null
    return (
        <div className="my-3 min-w-0 space-y-2 rounded-xl border bg-muted/30 p-3">
            <div className="flex flex-wrap justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{t('campaigns.viewProgress')}</span>
                <span className="font-semibold tabular-nums">{percent == null ? t('campaigns.noViewTarget') : `${percent.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`}</span>
            </div>
            {percent != null && <>
                <p className="text-sm font-semibold tabular-nums">{Number(actual || 0).toLocaleString()} / {target!.toLocaleString()} {t('metrics.views')}</p>
                <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${Math.min(100, percent)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{percent >= 100 ? t('campaigns.viewTargetReached') : t('campaigns.viewsRemaining', { count: Math.max(0, target! - Number(actual || 0)), formattedCount: Math.max(0, target! - Number(actual || 0)).toLocaleString('en-US') })}</p>
            </>}
        </div>
    )
}
