import { useTranslation } from 'react-i18next'
import { Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetProvincesQuery } from '@/stores/services/provinceApi'
import { useState } from 'react'

interface ActorsSearchBarProps {
    keyword: string
    onKeywordChange: (keyword: string) => void
    onSearch: () => void
    genderFilter: string
    onGenderFilterChange: (gender: string) => void
    familyFilter: string
    onFamilyFilterChange: (family: string) => void
    provinceFilter: number | 'all'
    onProvinceFilterChange: (province: number | 'all') => void
    standardPriceFilter: string
    onStandardPriceFilterChange: (standard: string) => void
    tagsFilter: string
    onTagsFilterChange: (tags: string) => void
    sourceFilter: string
    onSourceFilterChange: (source: string) => void
}

export const ActorsSearchBar = ({
    keyword,
    onKeywordChange,
    onSearch,
    genderFilter,
    onGenderFilterChange,
    familyFilter,
    onFamilyFilterChange,
    provinceFilter,
    onProvinceFilterChange,
    standardPriceFilter,
    onStandardPriceFilterChange,
    tagsFilter,
    onTagsFilterChange,
    sourceFilter,
    onSourceFilterChange
}: ActorsSearchBarProps) => {
    const { t } = useTranslation('app')
    const { data: provincesResponse } = useGetProvincesQuery()
    const provinces = provincesResponse?.data || []
    const [showFilters, setShowFilters] = useState(false)

    const handleClearFilters = () => {
        onGenderFilterChange('all')
        onFamilyFilterChange('all')
        onProvinceFilterChange('all')
        onStandardPriceFilterChange('')
        onTagsFilterChange('')
        onSourceFilterChange('all')
    }

    const hasActiveFilters =
        genderFilter !== 'all' ||
        familyFilter !== 'all' ||
        provinceFilter !== 'all' ||
        standardPriceFilter !== '' ||
        tagsFilter !== '' ||
        sourceFilter !== 'all'

    return (
        <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                    placeholder={t('influencers.searchPlaceholder')}
                    value={keyword}
                    onChange={(event) => onKeywordChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') onSearch()
                    }}
                    className="w-full sm:flex-1"
                />
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={hasActiveFilters ? 'border-primary text-primary' : ''}>
                    <Filter className="size-4 mr-2" />
                    {t('common:filters')} {hasActiveFilters && <span className="ml-1 flex h-2 w-2 rounded-full bg-primary"></span>}
                </Button>
                <Button onClick={onSearch}>
                    <Search className="size-4 mr-2" />
                    {t('common:search')}
                </Button>
            </div>

            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{t('influencers.gender')}</label>
                        <Select value={genderFilter} onValueChange={onGenderFilterChange}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('influencers.allGenders')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('influencers.allGenders')}</SelectItem>
                                <SelectItem value="Male">{t('influencers.male')}</SelectItem>
                                <SelectItem value="Female">{t('influencers.female')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{t('influencers.family')}</label>
                        <Select value={familyFilter} onValueChange={onFamilyFilterChange}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('influencers.allFamily')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('influencers.allStatus')}</SelectItem>
                                <SelectItem value="Single">{t('influencers.single')}</SelectItem>
                                <SelectItem value="Married without kids">{t('influencers.marriedNoKids')}</SelectItem>
                                <SelectItem value="Married with kids">{t('influencers.marriedWithKids')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{t('influencers.province')}</label>
                        <Select value={provinceFilter.toString()} onValueChange={(val) => onProvinceFilterChange(val === 'all' ? 'all' : Number(val))}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('influencers.allProvinces')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('influencers.allProvinces')}</SelectItem>
                                {provinces.map((prov) => (
                                    <SelectItem key={prov.id} value={prov.id.toString()}>
                                        {prov.nameLao}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{t('influencers.source')}</label>
                        <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('influencers.allSources')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('influencers.allSources')}</SelectItem>
                                <SelectItem value="Freelance">Freelance</SelectItem>
                                <SelectItem value="Rizz">Rizz</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{t('influencers.standardPrice')}</label>
                        <Input
                            type="number"
                            placeholder={t('influencers.maxPrice')}
                            value={standardPriceFilter === 'all' ? '' : standardPriceFilter}
                            onChange={(e) => onStandardPriceFilterChange(e.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') onSearch()
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{t('influencers.tags')}</label>
                        <div className="relative">
                            <Input
                                placeholder={t('influencers.searchTags')}
                                value={tagsFilter}
                                onChange={(e) => onTagsFilterChange(e.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') onSearch()
                                }}
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="col-span-full flex justify-end mt-2">
                            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground hover:text-foreground">
                                <X className="size-3 mr-1" />
                                {t('common:clearFilters')}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
