import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export type PostLinkMetrics = {
    views: number
    viewers: number | null
    likes: number
    comments: number | null
    shares: number | null
    saves: number | null
    reposts: number | null
    source: string | null
    checked_at: string | null
    metrics_error?: string | null
    last_fetch_failed_at?: string | null
    metrics_stale?: boolean
}

export type PostMediaType = 'photo' | 'video'

export type PostLinkCampaignRef = {
    id: number
    uuid: string
    title: string
    campaign_code: string | null
}

export type CampaignPostLink = {
    id: number
    uuid: string
    media_type: PostMediaType
    post_url: string
    canonical_post_url?: string | null
    platform: { id: number; name: string }
    influencer: { id: number; uuid: string; name: string; profile_url: string | null } | null
    campaign?: PostLinkCampaignRef | null
    campaign_influencer_uuid: string | null
    view_log_id: string | null
    metrics: PostLinkMetrics
    metrics_error: string | null
    last_fetch_failed_at?: string | null
    created_at: string
    updated_at: string
}

export type PostLinksResponse = {
    campaign: { id: number; uuid: string; title: string }
    items: CampaignPostLink[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
}

export type PostLinksMonitorMetricsStatus = 'all' | 'error' | 'ok' | 'pending'

export type PostLinksMonitorResponse = {
    items: CampaignPostLink[]
    summary: { total: number; error: number; ok: number; pending: number }
    pagination: { page: number; limit: number; total: number; totalPages: number }
}

export const postLinksApi = createApi({
    reducerPath: 'postLinksApi',
    tagTypes: ['PostLinks'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getPostLinksMonitor: builder.query<
            { status: string; data: PostLinksMonitorResponse },
            {
                campaign_id?: number
                metrics_status?: PostLinksMonitorMetricsStatus
                q?: string
                page?: number
                limit?: number
            }
        >({
            query: ({ campaign_id, metrics_status, q, page, limit }) => {
                const params: Record<string, string | number> = {
                    page: page ?? 1,
                    limit: limit ?? 25,
                    metrics_status: metrics_status ?? 'all'
                }
                if (campaign_id != null && campaign_id > 0) params.campaign_id = campaign_id
                const term = q?.trim()
                if (term) params.q = term
                return { url: '/v1/post-links', params }
            },
            providesTags: ['PostLinks']
        }),
        getCampaignPostLinks: builder.query<
            { status: string; data: PostLinksResponse },
            { campaign_uuid: string; actor_id?: number; page?: number; limit?: number }
        >({
            query: ({ campaign_uuid, ...params }) => ({
                url: `/v1/campaigns/${campaign_uuid}/post-links`,
                params
            }),
            providesTags: (_result, _error, arg) => [{ type: 'PostLinks', id: arg.campaign_uuid }]
        }),
        createCampaignPostLinks: builder.mutation<
            { status: string; data: CampaignPostLink[]; message?: string },
            { campaign_uuid: string; actor_id: number; links: Array<{ platform_id: number; post_url: string; media_type?: PostMediaType }> }
        >({
            query: ({ campaign_uuid, ...body }) => ({
                url: `/v1/campaigns/${campaign_uuid}/post-links`,
                method: 'POST',
                body
            }),
            invalidatesTags: (_result, _error, arg) => [{ type: 'PostLinks', id: arg.campaign_uuid }]
        }),
        updateCampaignPostLink: builder.mutation<
            { status: string; data: CampaignPostLink; message?: string },
            { campaign_uuid: string; uuid: string; platform_id?: number; post_url?: string; media_type?: PostMediaType }
        >({
            query: ({ uuid, campaign_uuid: _campaignUuid, ...body }) => ({
                url: `/v1/post-links/${uuid}`,
                method: 'PATCH',
                body
            }),
            invalidatesTags: (_result, _error, arg) => [{ type: 'PostLinks', id: arg.campaign_uuid }]
        }),
        deleteCampaignPostLink: builder.mutation<
            { status: string; message?: string },
            { campaign_uuid: string; uuid: string }
        >({
            query: ({ uuid }) => ({ url: `/v1/post-links/${uuid}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, arg) => [{ type: 'PostLinks', id: arg.campaign_uuid }]
        })
    })
})

export const {
    useGetPostLinksMonitorQuery,
    useGetCampaignPostLinksQuery,
    useCreateCampaignPostLinksMutation,
    useUpdateCampaignPostLinkMutation,
    useDeleteCampaignPostLinkMutation
} = postLinksApi
