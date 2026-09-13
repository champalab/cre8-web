import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export interface InfluencerSocialAccount {
    id: number
    uuid: string
    actor_id: number
    platform: string
    profile_url: string
    handle: string | null
    follower_count: string | number | null
    following_count: string | number | null
    follower_source: string
    status: string
    last_scraped_at: string | null
    last_error_code: string | null
    last_error_message?: string | null
    created_at: string
    updated_at: string
}

export interface ProfileMetricSnapshot {
    id: number
    uuid: string
    actor_id: number
    social_account_id: number
    platform: string
    profile_url: string
    follower_count: string | number | null
    following_count: string | number | null
    source: string
    status: string
    error_code: string | null
    error_message: string | null
    fetched_at: string
    created_at: string
}

export interface ProfileMetricsBatchStatus {
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

export interface Actor {
    id: number
    uuid: string
    name: string
    email: string | null
    social_handle: string | null
    profile_url: string | null
    profile_urls?: string[] | null
    phone_number: string | null
    status?: 'ACTIVE' | 'INACTIVE' | string | null
    user_id?: number | null
    created_at?: string | null
    updated_at?: string | null
    influencer_social_accounts?: InfluencerSocialAccount[]
    users?: { id: number; uuid: string; email: string | null; role: string; status: string } | null
    gender?: 'Male' | 'Female' | null
    code?: string | null
    source?: 'Rizz' | 'Freelance' | null
    date_of_birth?: string | null
    family_status?: 'Single' | 'Married without kids' | 'Married with kids' | null
    tags?: string[] | null
    standard_price?: number | null
    province_id?: number | null
    address_express?: string | null
    bank_account_number?: string | null
    bank_account_name?: string | null
    price_photo?: number | null
    price_video?: number | null
    price_video_photo?: number | null
    client_repost_allowed?: boolean | null
    client_repost_additional_charge?: number | null
}

export interface ActorRes {
    status: string
    data: Actor[]
    pagination: { totalItems: number; totalPages: number }
}

export const SOCIAL_PLATFORMS = ['facebook', 'tiktok', 'instagram'] as const
export const PROFILE_METRIC_PLATFORMS = ['facebook', 'tiktok', 'instagram'] as const

export type OAuthPlatform = 'facebook' | 'tiktok'

export interface OAuthConnectionStatus {
    connected: boolean
    status?: string | null
    display_name?: string | null
    avatar_url?: string | null
    platform_user_id?: string | null
    scopes?: string[]
    connected_at?: string | null
    access_token_expires_at?: string | null
    last_refreshed_at?: string | null
    expiring_soon?: boolean
    metrics_source?: string | null
}

export const actorApi = createApi({
    reducerPath: 'actorApi',
    tagTypes: ['actorApi', 'influencerSocialAccounts', 'profileMetricSnapshots', 'oauthConnections'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getActors: builder.mutation<
            ActorRes,
            {
                page?: number
                keyword?: string | null
                gender?: string | null
                family?: string | null
                province?: number | null
                standard?: string | null
                tags?: string | null
                source?: string | null
            }
        >({
            query: (params) => ({
                url: `/v1/actors`,
                method: 'GET',
                params,
            }),
        }),
        getActorById: builder.query<{ status: string; data: Actor }, number>({
            query: (id) => ({ url: `/v1/actors/${id}`, method: 'GET' }),
            providesTags: ['actorApi'],
        }),
        getOAuthConnectionStatus: builder.query<
            { status: string; data: OAuthConnectionStatus },
            { platform: OAuthPlatform; actorId: number }
        >({
            query: ({ platform, actorId }) => ({
                url: `/v1/integrations/${platform}/status`,
                params: { actor_id: actorId },
            }),
            providesTags: (_result, _error, arg) => [
                { type: 'oauthConnections', id: `${arg.platform}-${arg.actorId}` },
            ],
        }),
        disconnectOAuthConnection: builder.mutation<
            { status: string; message?: string },
            { platform: OAuthPlatform; actorId: number }
        >({
            query: ({ platform, actorId }) => ({
                url: `/v1/integrations/${platform}/disconnect`,
                method: 'POST',
                body: { actor_id: actorId },
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'oauthConnections', id: `${arg.platform}-${arg.actorId}` },
            ],
        }),
        createActor: builder.mutation<
            { status: string; data: Actor; message?: string },
            Pick<Actor, 'name' | 'email' | 'profile_url' | 'profile_urls' | 'phone_number' | 'status'>
        >({
            query: (body) => ({
                url: `/v1/actors`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['actorApi'],
        }),
        updateActor: builder.mutation<
            { status: string; data: Actor; message?: string },
            Partial<Actor> & { id: number }
        >({
            query: ({ id, ...body }) => ({
                url: `/v1/actors/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['actorApi'],
        }),
        deleteActor: builder.mutation<{ status: string; message?: string }, number>({
            query: (id) => ({
                url: `/v1/actors/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['actorApi'],
        }),
        getInfluencerSocialAccounts: builder.query<
            { status: string; data: InfluencerSocialAccount[] },
            string
        >({
            query: (uuid) => `/v1/influencers/${uuid}/social-accounts`,
            providesTags: ['influencerSocialAccounts'],
        }),
        upsertInfluencerSocialAccount: builder.mutation<
            { status: string; data: InfluencerSocialAccount; message?: string },
            {
                uuid: string
                body: {
                    platform: string
                    profile_url: string
                    handle?: string
                    follower_count?: number | string
                    following_count?: number | string
                }
            }
        >({
            query: ({ uuid, body }) => ({
                url: `/v1/influencers/${uuid}/social-accounts`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['influencerSocialAccounts', 'actorApi'],
        }),
        refreshInfluencerSocialAccount: builder.mutation<
            { status: string; data: InfluencerSocialAccount; message?: string },
            { uuid: string; accountUuid: string }
        >({
            query: ({ uuid, accountUuid }) => ({
                url: `/v1/influencers/${uuid}/social-accounts/${accountUuid}/refresh`,
                method: 'POST',
            }),
            invalidatesTags: ['influencerSocialAccounts', 'actorApi', 'profileMetricSnapshots'],
        }),
        refreshAllInfluencerSocialAccounts: builder.mutation<
            {
                status: string
                data: { batch_id: string; total: number; queued: number; skipped: number; actors?: number }
                message?: string
            },
            string
        >({
            query: (uuid) => ({
                url: `/v1/influencers/${uuid}/social-accounts/refresh-all`,
                method: 'POST',
            }),
            invalidatesTags: ['influencerSocialAccounts', 'actorApi'],
        }),
        refreshAllActorsSocialAccounts: builder.mutation<
            {
                status: string
                data: { batch_id: string; total: number; queued: number; skipped: number; actors: number }
                message?: string
            },
            void
        >({
            query: () => ({
                url: `/v1/actors/social-accounts/refresh-all`,
                method: 'POST',
            }),
            invalidatesTags: ['influencerSocialAccounts', 'actorApi'],
        }),
        getProfileMetricsBatchStatus: builder.mutation<
            { status: string; data: ProfileMetricsBatchStatus },
            { uuid?: string; batchId: string }
        >({
            query: ({ uuid, batchId }) => ({
                url: uuid
                    ? `/v1/influencers/${uuid}/social-accounts/refresh-all/status/${batchId}`
                    : `/v1/actors/social-accounts/refresh-all/status/${batchId}`,
                method: 'GET',
            }),
        }),
        getProfileMetricSnapshots: builder.query<
            {
                status: string
                data: ProfileMetricSnapshot[]
                meta?: { pagination?: { totalItems: number; totalPages: number; page: number; limit: number } }
            },
            {
                uuid: string
                page?: number
                limit?: number
                platform?: string
                account_uuid?: string
            }
        >({
            query: ({ uuid, ...params }) => ({
                url: `/v1/influencers/${uuid}/social-accounts/history`,
                params,
            }),
            providesTags: ['profileMetricSnapshots'],
        }),
    }),
})

export const {
    useGetActorsMutation,
    useGetActorByIdQuery,
    useCreateActorMutation,
    useUpdateActorMutation,
    useDeleteActorMutation,
    useGetInfluencerSocialAccountsQuery,
    useUpsertInfluencerSocialAccountMutation,
    useRefreshInfluencerSocialAccountMutation,
    useRefreshAllInfluencerSocialAccountsMutation,
    useRefreshAllActorsSocialAccountsMutation,
    useGetProfileMetricsBatchStatusMutation,
    useGetProfileMetricSnapshotsQuery,
    useGetOAuthConnectionStatusQuery,
    useDisconnectOAuthConnectionMutation,
} = actorApi
