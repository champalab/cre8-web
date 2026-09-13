import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export type FacebookBusinessStatus = {
    connected: boolean
    status?: string
    display_name?: string | null
    platform_user_id?: string | null
    scopes?: string[]
    connected_at?: string
    access_token_expires_at?: string
    last_synced_at?: string | null
    pages_count?: number
    metrics_scope?: string
}

export type FacebookManagedPage = {
    uuid: string
    page_id: string
    page_name: string | null
    tasks: string | null
    last_synced_at: string | null
    status: string
}

export const facebookBusinessApi = createApi({
    reducerPath: 'facebookBusinessApi',
    tagTypes: ['facebookBusiness'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getFacebookBusinessStatus: builder.query<{ status: string; data: FacebookBusinessStatus }, void>({
            query: () => ({ url: '/v1/integrations/facebook/business/status' }),
            providesTags: ['facebookBusiness'],
        }),
        getFacebookManagedPages: builder.query<{ status: string; data: FacebookManagedPage[] }, void>({
            query: () => ({ url: '/v1/integrations/facebook/business/pages' }),
            providesTags: ['facebookBusiness'],
        }),
        syncFacebookManagedPages: builder.mutation<{ status: string; data: unknown; message?: string }, void>({
            query: () => ({
                url: '/v1/integrations/facebook/business/sync-pages',
                method: 'POST',
            }),
            invalidatesTags: ['facebookBusiness'],
        }),
        disconnectFacebookBusiness: builder.mutation<{ status: string; message?: string }, void>({
            query: () => ({
                url: '/v1/integrations/facebook/business/disconnect',
                method: 'POST',
            }),
            invalidatesTags: ['facebookBusiness'],
        }),
    }),
})

export const {
    useGetFacebookBusinessStatusQuery,
    useGetFacebookManagedPagesQuery,
    useSyncFacebookManagedPagesMutation,
    useDisconnectFacebookBusinessMutation,
} = facebookBusinessApi
