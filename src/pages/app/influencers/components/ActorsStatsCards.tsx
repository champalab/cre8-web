import { useTranslation } from 'react-i18next'
import { BarChart3, Link2, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ActorsStatsCardsProps {
    totalActors: number
    pageProfiles: number
    metricsReady: number
}

export const ActorsStatsCards = ({
    totalActors,
    pageProfiles,
    metricsReady,
}: ActorsStatsCardsProps) => {
    const { t } = useTranslation('app')
    return (
    <div className="mb-4 grid grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:gap-4">
        <Card className="border-primary/15 bg-gradient-to-br from-primary/10 to-background">
            <CardContent className="p-3 sm:p-4">
                <Users className="mb-2 size-5 text-primary" />
                <p className="text-xs text-muted-foreground">{t('influencers.statActors')}</p>
                <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">
                    {totalActors}
                </p>
            </CardContent>
        </Card>
        <Card className="border-sky-500/15 bg-gradient-to-br from-sky-500/10 to-background">
            <CardContent className="p-3 sm:p-4">
                <Link2 className="mb-2 size-5 text-sky-600" />
                <p className="text-xs text-muted-foreground">{t('influencers.statProfiles')}</p>
                <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">
                    {pageProfiles}
                </p>
            </CardContent>
        </Card>
        <Card className="border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 to-background">
            <CardContent className="p-3 sm:p-4">
                <BarChart3 className="mb-2 size-5 text-emerald-600" />
                <p className="text-xs text-muted-foreground">{t('influencers.statMetricsReady')}</p>
                <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">
                    {metricsReady}
                </p>
            </CardContent>
        </Card>
    </div>
    )
}
