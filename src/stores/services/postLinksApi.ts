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
}

export type PostMediaType = 'photo' | 'video'

export type CampaignPostLink = {
    id: number
    uuid: string
    media_type: PostMediaType
    post_url: string
    platform: { id: number; name: string }
    influencer: { id: number; uuid: string; name: string; profile_url: string | null } | null
    campaign_influencer_uuid: string | null
    view_log_id: string | null
    metrics: PostLinkMetrics
    metrics_error: string | null
    created_at: string
    updated_at: string
}

export type PostLinksResponse = {
    campaign: { id: number; uuid: string; title: string }
    items: CampaignPostLink[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
}

export const postLinksApi = createApi({
    reducerPath: 'postLinksApi',
    tagTypes: ['PostLinks'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
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
    useGetCampaignPostLinksQuery,
    useCreateCampaignPostLinksMutation,
    useUpdateCampaignPostLinkMutation,
    useDeleteCampaignPostLinkMutation
} = postLinksApi
