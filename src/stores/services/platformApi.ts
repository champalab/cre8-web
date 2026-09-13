import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export interface Platform {
    id: number
    name: string
}

export const platformApi = createApi({
    reducerPath: 'platformApi',
    tagTypes: ['platformApi'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getPlatforms: builder.query<{ status: string; data: Platform[] }, void>({
            query: () => ({ url: `/v1/social-platforms`, method: 'GET' }),
        }),
        createPlatform: builder.mutation<{ status: string; data: Platform }, { name: string }>({
            query: (body) => ({
                url: `/v1/social-platforms`,
                method: 'POST',
                body,
            }),
        }),
        updatePlatform: builder.mutation<{ status: string; data: Platform }, { id: number; name: string }>({
            query: ({ id, ...body }) => ({
                url: `/v1/social-platforms/${id}`,
                method: 'PUT',
                body,
            }),
        }),
        deletePlatform: builder.mutation<{ status: string }, number>({
            query: (id) => ({
                url: `/v1/social-platforms/${id}`,
                method: 'DELETE',
            }),
        }),
    }),
})

export const {
    useGetPlatformsQuery,
    useCreatePlatformMutation,
    useUpdatePlatformMutation,
    useDeletePlatformMutation,
} = platformApi
