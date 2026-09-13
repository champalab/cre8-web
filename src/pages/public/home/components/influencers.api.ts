export interface InfluencerSocialAccount {
    handle: string | null;
    follower_count: number | null;
    profile_url: string | null;
    platform: string | null;
}

export interface Influencer {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    influencerSocialAccounts: InfluencerSocialAccount[];
}

import env from '../../../../env'

// Call the public backend API to fetch real influencers
export const fetchInfluencers = async (limit: number = 4): Promise<Influencer[]> => {
    try {
        const response = await fetch(`${env.VITE_APP_API_PATH}/v1/public/influencers?limit=${limit}`)
        if (!response.ok) {
            console.error('Failed to fetch influencers', await response.text())
            return []
        }
        
        const json = await response.json()
        return json.data || []
    } catch (e) {
        console.error('Error fetching influencers:', e)
        return []
    }
}
