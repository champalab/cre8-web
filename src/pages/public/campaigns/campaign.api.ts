import env from '../../../env'

export interface CampaignPostLink {
    post_url: string
    platform_name: string
    count: number
}

export interface CampaignInfluencer {
    actor_name: string
    profile_url: string
    campaign_post_links: CampaignPostLink[]
}

export interface ViewsByPlatform {
    platform_name: string
    count: number
}

export interface CampaignPerformanceData {
    uuid: string
    description: string
    total_views: number
    views_by_platform: ViewsByPlatform[]
    campaign_influencers: CampaignInfluencer[]
}

export interface CampaignPerformanceResponse {
    status: string
    data: CampaignPerformanceData
}

export const fetchCampaignPerformance = async (slug: string): Promise<CampaignPerformanceData | null> => {
    try {
        const response = await fetch(`${env.VITE_APP_API_PATH}/v1/public/campaign/${encodeURIComponent(slug)}`)
        if (!response.ok) {
            console.error('Failed to fetch campaign performance', await response.text())
            return null
        }
        
        const json: CampaignPerformanceResponse = await response.json()
        return json.data || null
    } catch (e) {
        console.error('Error fetching campaign performance:', e)
        return null
    }
}
