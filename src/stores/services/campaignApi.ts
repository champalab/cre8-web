import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export interface CampaignCustomerLink {
    customer_id: number
    customers?: {
        id: number
        uuid: string
        company_name?: string
        company_email?: string | null
        customer_code?: string
        brand_name?: string | null
        company_phone?: string | null
        tax_id?: string | null
        address?: string | null
        province?: string | null
        country?: string | null
        billing_name?: string | null
        billing_email?: string | null
        billing_phone?: string | null
        billing_address?: string | null
        status?: string | null
        full_name?: string
    }
}

export interface Campaign {
    target_views?: number | null
    id: number
    title: string
    description: string | null
    uuid?: string
    total_view: number
    total_like: number
    total_comment?: number
    total_share?: number
    total_save?: number
    total_repost?: number
    status?: string | null
    start_date: string | null
    end_date: string | null
    created_at: string
    customer_id?: number | null
    customer_ids?: number[]
    campaign_code?: string | null
    customers?: {
        id: number
        uuid: string
        company_name?: string
        company_email?: string | null
        full_name?: string
        customer_code?: string
        company_phone?: string | null
    } | null
    campaign_customers?: CampaignCustomerLink[]
}

export interface CampaignInfluencerSocialAccount {
    platform: string
    handle: string | null
    profile_url: string | null
    follower_count: number | null
}

export interface CampaignInfluencer {
    id: number
    uuid: string | null
    name: string
    email?: string | null
    phone_number?: string | null
    profile_url?: string | null
    follower_count: number | null
    social_accounts: CampaignInfluencerSocialAccount[]
}

export interface CampaignInfluencerItem {
    id: number
    uuid: string
    campaign_id: number
    actor_id: number
    offer_price: number | null
    display_price: number | null
    kpi: string | null
    post_date: string | null
    status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'REMOVED'
    customer_note: string | null
    created_at: string
    updated_at: string | null
    total_followers: number
    actor: {
        id: number
        uuid: string
        name: string
        email: string | null
        phone_number: string | null
        profile_url: string | null
        profile_urls?: string[] | null
        social_handle: string | null
        status?: string | null
        code?: string | null
        gender: string | null
        family_status?: string | null
        date_of_birth?: string | null
        source: string | null
        tags: any
        province_id?: number | null
        address_express?: string | null
        bank_account_name?: string | null
        bank_account_number?: string | null
        standard_price: number | null
        price_photo: number | null
        price_video: number | null
        price_video_photo: number | null
        client_repost_allowed?: boolean | null
        client_repost_additional_charge?: number | null
        provinces?: {
            id: number
            nameLao?: string
            nameEng?: string
            name?: string
        } | null
        influencer_social_accounts: {
            id: number
            uuid: string
            platform: string
            handle: string | null
            profile_url: string | null
            follower_count: number
            following_count: number
        }[]
    }
}

export interface CampaignDetail extends Campaign {
    overview?: {
        totals: Record<'views_count' | 'likes_count' | 'comments_count' | 'shares_count' | 'saves_count' | 'reposts_count', number | null>
        measured_posts: number; views_measured_posts: number; missing_posts: number; error_posts: number
        last_checked_at: string | null
        approved_influencers: number; pending_influencers: number; rejected_influencers: number
        platforms: { name: string; posts: number; measured: number; views_measured: number; interactions_measured: number; views: number; interactions: number }[]
        top_actors: { id: number; name: string; posts: number; measured: number; views_measured: number; interactions_measured: number; views: number; interactions: number }[]
    }
    post_link_summary?: { total: number; influencers: number }
}

export interface CampaignRes {
    status: string
    data: Campaign[]
    pagination: { totalItems: number; totalPages: number }
}

export const campaignApi = createApi({
    reducerPath: 'campaignApi',
    tagTypes: ['campaignApi', 'campaignInfluencers'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getCampaigns: builder.mutation<CampaignRes, { page?: number; keyword?: string | null }>({
            query: (params) => ({
                url: `/v1/campaigns`,
                method: 'GET',
                params,
            }),
        }),
        getCampaignDetailByUuid: builder.query<
            { status: string; data: CampaignDetail },
            { uuid: string }
        >({
            query: ({ uuid }) => ({
                url: `/v1/campaigns/${uuid}/detail`,
                method: 'GET'
            }),
            providesTags: ['campaignApi'],
        }),
        createCampaign: builder.mutation<
            { status: string; data: Campaign },
            Omit<
                Campaign,
                | 'id'
                | 'created_at'
                | 'total_view'
                | 'total_like'
                | 'total_comment'
                | 'total_share'
                | 'total_save'
                | 'total_repost'
            >
        >({
            query: (body) => ({
                url: `/v1/campaigns`,
                method: 'POST',
                body,
            }),
        }),
        updateCampaign: builder.mutation<
            { status: string; data: Partial<Campaign> },
            Partial<Campaign> & { id: number; customer_id?: number | null; customer_ids?: number[] }
        >({
            query: ({ id, ...body }) => ({
                url: `/v1/campaigns/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['campaignApi'],
        }),
        getCampaignInfluencers: builder.query<{ status: string; data: CampaignInfluencerItem[] }, string>({
            query: (uuid) => ({
                url: `/v1/campaigns/${uuid}/influencers`,
                method: 'GET',
            }),
            providesTags: ['campaignInfluencers'],
        }),
        addCampaignInfluencer: builder.mutation<
            { status: string; data: any },
            {
                campaignUuid: string
                actor_id: number
                offer_price?: number | null
                display_price?: number | null
                kpi?: string | null
                post_date?: string | null
            }
        >({
            query: ({ campaignUuid, ...body }) => ({
                url: `/v1/campaigns/${campaignUuid}/influencers`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['campaignInfluencers', 'campaignApi'],
        }),
        updateCampaignInfluencer: builder.mutation<
            { status: string; data: any },
            {
                campaignUuid: string
                influencerUuid: string
                offer_price?: number | null
                display_price?: number | null
                kpi?: string | null
                post_date?: string | null
                status?: string
                customer_note?: string | null
            }
        >({
            query: ({ campaignUuid, influencerUuid, ...body }) => ({
                url: `/v1/campaigns/${campaignUuid}/influencers/${influencerUuid}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['campaignInfluencers', 'campaignApi'],
        }),
        deleteCampaignInfluencer: builder.mutation<
            { status: string },
            { campaignUuid: string; influencerUuid: string }
        >({
            query: ({ campaignUuid, influencerUuid }) => ({
                url: `/v1/campaigns/${campaignUuid}/influencers/${influencerUuid}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['campaignInfluencers', 'campaignApi'],
        }),
        bulkReviewCampaignInfluencers: builder.mutation<
            { status: string; data: any },
            { campaignUuid: string; influencer_uuids: string[]; action: 'APPROVED' | 'REJECTED' }
        >({
            query: ({ campaignUuid, ...body }) => ({
                url: `/v1/campaigns/${campaignUuid}/influencers/bulk-review`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['campaignInfluencers', 'campaignApi'],
        }),
    }),
})

export const {
    useGetCampaignsMutation,
    useGetCampaignDetailByUuidQuery,
    useCreateCampaignMutation,
    useUpdateCampaignMutation,
    useGetCampaignInfluencersQuery,
    useAddCampaignInfluencerMutation,
    useUpdateCampaignInfluencerMutation,
    useDeleteCampaignInfluencerMutation,
    useBulkReviewCampaignInfluencersMutation,
} = campaignApi

