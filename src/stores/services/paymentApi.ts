import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export type PayoutStatus = 'UNPAID' | 'PARTIAL' | 'PAID'

export type PaymentFile = {
    id: number
    uuid: string
    original_name: string
    mime_type: string
    public_url: string | null
    file_size: number
}

export type InfluencerPayment = {
    uuid: string
    amount: number
    paid_at: string
    reference: string | null
    notes: string | null
    payee_name: string | null
    payee_bank_account_name: string | null
    payee_bank_account_number: string | null
    created_at: string
    paid_by: { id: number; name: string | null; username: string } | null
    files: PaymentFile[]
}

export type PayoutRow = {
    uuid: string
    due: number
    paid: number
    remaining: number
    status: PayoutStatus
    last_paid_at: string | null
    actor: {
        uuid: string
        name: string
        profile_url: string | null
        bank_account_name: string | null
        bank_account_number: string | null
    }
    payments: InfluencerPayment[]
}

export type PayableCampaign = {
    uuid: string
    title: string
    campaign_code: string | null
}

export type PayoutsResponse = {
    campaign: PayableCampaign
    summary: { due: number; paid: number; remaining: number; count: number }
    items: PayoutRow[]
}

export const paymentApi = createApi({
    reducerPath: 'paymentApi',
    tagTypes: ['payments', 'payableCampaigns'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getPayableCampaigns: builder.query<{ status: string; data: PayableCampaign[] }, void>({
            query: () => ({ url: '/v1/payments/campaigns' }),
            providesTags: ['payableCampaigns']
        }),
        getCampaignPayouts: builder.query<
            { status: string; data: PayoutsResponse },
            { campaign_uuid: string; sort?: string; order?: 'asc' | 'desc' }
        >({
            query: (params) => ({ url: '/v1/payments', params }),
            providesTags: (_r, _e, arg) => [{ type: 'payments', id: arg.campaign_uuid }]
        }),
        createInfluencerPayment: builder.mutation<
            { status: string; data: InfluencerPayment; message?: string },
            {
                campaign_influencer_uuid: string
                amount: number
                paid_at?: string
                reference?: string
                notes?: string
                file_ids?: number[]
            }
        >({
            query: (body) => ({ url: '/v1/payments', method: 'POST', body }),
            invalidatesTags: ['payments']
        }),
        deleteInfluencerPayment: builder.mutation<{ status: string; data: { uuid: string } }, string>({
            query: (uuid) => ({ url: `/v1/payments/${uuid}`, method: 'DELETE' }),
            invalidatesTags: ['payments']
        })
    })
})

export const {
    useGetPayableCampaignsQuery,
    useGetCampaignPayoutsQuery,
    useCreateInfluencerPaymentMutation,
    useDeleteInfluencerPaymentMutation
} = paymentApi
