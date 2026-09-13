import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export type FacebookScrapeStatus = {
    connected: boolean
    connecting: boolean
    connect_error: string | null
    display_name: string | null
    platform_user_id: string | null
    last_used_at: string | null
    last_checked_at: string | null
    connected_at: string | null
    status: string
}

export const facebookScrapeApi = createApi({
    reducerPath: 'facebookScrapeApi',
    tagTypes: ['facebookScrape'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getFacebookScrapeStatus: builder.query<{ status: string; data: FacebookScrapeStatus }, void>({
            query: () => ({ url: '/v1/integrations/facebook/scrape-session/status' }),
            providesTags: ['facebookScrape'],
        }),
        connectFacebookScrape: builder.mutation<
            { status: string; data: { connecting: boolean }; message?: string },
            void
        >({
            query: () => ({
                url: '/v1/integrations/facebook/scrape-session/connect',
                method: 'POST',
            }),
            invalidatesTags: ['facebookScrape'],
        }),
        refreshFacebookScrape: builder.mutation<
            { status: string; data: { connected: boolean; expired?: boolean }; message?: string },
            void
        >({
            query: () => ({
                url: '/v1/integrations/facebook/scrape-session/refresh',
                method: 'POST',
            }),
            invalidatesTags: ['facebookScrape'],
        }),
        disconnectFacebookScrape: builder.mutation<{ status: string; message?: string }, void>({
            query: () => ({
                url: '/v1/integrations/facebook/scrape-session/disconnect',
                method: 'POST',
            }),
            invalidatesTags: ['facebookScrape'],
        }),
    }),
})

export const {
    useGetFacebookScrapeStatusQuery,
    useConnectFacebookScrapeMutation,
    useRefreshFacebookScrapeMutation,
    useDisconnectFacebookScrapeMutation,
} = facebookScrapeApi
