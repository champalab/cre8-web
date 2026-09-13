export interface DashboardSummary {
    totalActors: number
    totalCampaigns: number
    totalAssignments: number
    totalViewLogs: number
}

export interface TopActor {
    actor_id: number
    name: string
    total_views: number
    total_likes: number
}

export interface RecentAssignment {
    id: number
    campaign_id: number
    actor_id: number
    platform_id: number
    post_url: string
    view_log_id?: string | null
    latest_views: number
    latest_likes: number
    latest_comments?: number | null
    latest_shares?: number | null
    latest_saves?: number | null
    latest_reposts?: number | null
    updated_at: string
    actors?: { id: number; name: string }
    campaigns?: { id: number; title: string }
    social_platforms?: { id: number; name: string }
}

export interface ActiveCampaign {
    id: number
    title: string
    description: string | null
    start_date: string | null
    end_date: string | null
    _count: { post_links?: number }
}

export interface DashboardData {
    summary: DashboardSummary
    topActors: TopActor[]
    recentAssignments: RecentAssignment[]
    activeCampaigns: ActiveCampaign[]
}

export interface ResDashboard {
    status: string
    data: DashboardData
}
