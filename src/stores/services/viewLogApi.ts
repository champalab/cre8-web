import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export interface ViewLog {
    id: number
    post_link_id: number
    views_count: number | null
    viewers_count?: number | string | null
    likes_count: number | null
    comments_count?: number | null
    shares_count?: number | null
    saves_count?: number | null
    reposts_count?: number | null
    source?: string | null
    checked_at: string
    campaign_post_links?: {
        uuid: string
        post_url: string | null
        campaign_influencers?: {
            actors?: { id: number; name: string }
            campaigns?: { id: number; title: string }
        }
        social_platforms?: { id: number; name: string }
    }
}

export interface ViewLogRes {
    status: string
    data: ViewLog[]
    pagination: { totalItems: number; totalPages: number }
}

export interface FetchMetricsRes {
    status: string
    message: string
    data: {
        views_count: string | null
        likes_count: number | null
        comments_count: number | null
        shares_count: number | null
        saves_count: number | null
        reposts_count: number | null
        source: string
    }
}

export interface FetchAllMetricsRes {
    status: string
    message: string
    data: {
        batch_id: string
        total: number
        queued: number
        skipped: number
    }
}

export interface MetricsBatchStatusRes {
    status: string
    data: {
        batch_id: string
        total: number
        waiting: number
        active: number
        completed: number
        failed: number
        delayed: number
        finished: number
        pending: number
        done: boolean
    }
}

export const viewLogApi = createApi({
    reducerPath: 'viewLogApi',
    tagTypes: ['viewLogApi'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getViewLogCampaigns: builder.query<{ status: string; data: { id: number; title: string; campaign_code: string | null }[] }, void>({
            query: () => ({ url: '/v1/view-logs/campaigns', method: 'GET' })
        }),
        getViewLogs: builder.query<ViewLogRes, { page?: number; post_link_id?: number; campaign_id?: number }>({
            query: (params) => ({
                url: `/v1/view-logs`,
                method: 'GET',
                params,
            }),
        }),
        fetchMetrics: builder.mutation<FetchMetricsRes, number>({
            query: (post_link_id) => ({
                url: `/v1/view-logs/fetch/${post_link_id}`,
                method: 'POST',
            }),
        }),
        fetchAllMetrics: builder.mutation<
            FetchAllMetricsRes,
            { campaign_id?: number | null; post_link_ids?: number[] }
        >({
            query: ({ campaign_id, post_link_ids }) => ({
                url: `/v1/view-logs/fetch-all`,
                method: 'POST',
                params: campaign_id != null ? { campaign_id } : undefined,
                body: post_link_ids?.length ? { post_link_ids } : undefined,
            }),
        }),
        getMetricsBatchStatus: builder.mutation<MetricsBatchStatusRes, string>({
            query: (batch_id) => ({
                url: `/v1/view-logs/fetch-all/status/${batch_id}`,
                method: 'GET',
            }),
        }),
    }),
})

export const {
    useGetViewLogsQuery,
    useGetViewLogCampaignsQuery,
    useFetchMetricsMutation,
    useFetchAllMetricsMutation,
    useGetMetricsBatchStatusMutation,
} = viewLogApi
