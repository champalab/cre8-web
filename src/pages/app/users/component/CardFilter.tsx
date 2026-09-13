import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter } from '../type'

type Props = {
    setQuery: Function
    query: Filter
    onClick: () => void
}

const CardFilter = ({ query, setQuery, onClick }: Props) => {
    const { t } = useTranslation('app')
    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            onClick()
        }
    }

    return (
        <div
            className="my-2 rounded-xl border border-border p-4 shadow-sm"
            onKeyDown={handleKeyPress}
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                    <Label htmlFor="user-keyword">{t('users.searchLabel')}</Label>
                    <Input
                        id="user-keyword"
                        placeholder={t('users.searchPlaceholder')}
                        onChange={(e) =>
                            setQuery({
                                ...query,
                                keyword: e.target.value,
                            })
                        }
                    />
                </div>
                <div className="flex items-end">
                    <Button onClick={onClick}>
                        <Search className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CardFilter
