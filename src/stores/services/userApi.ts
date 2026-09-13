import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'
import { ResAuth } from '@/pages/public/login/type';

type ApiUser = ResAuth & { name?: string | null }

export const userApi = createApi({
    reducerPath: 'userApi',
    tagTypes: ['userApi'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        updateProfile: builder.mutation<{ success: boolean; message: string; data: { user: ApiUser } }, { name: string; password?: string; currentPassword?: string }>({
            query: (body) => ({ url: '/v1/auth/me', method: 'PATCH', body })
        }),
        passwordLogin: builder.mutation<{ success: boolean; message: string; data: { user: ApiUser } }, { identifier: string; password: string }>({
            extraOptions: { skipAuthRedirect: true },
            query: (body) => ({ url: '/v1/auth/login', method: 'POST', body })
        }),
        requestOtp: builder.mutation<{ success: boolean; message: string; data?: { devOtp?: string } }, { email: string }>({
            extraOptions: { skipAuthRedirect: true },
            query: (body) => ({
                url: `/v1/auth/request-otp`,
                method: 'POST',
                body
            })
        }),
        verifyOtp: builder.mutation<{ success: boolean; message: string; data: { user: ApiUser } }, { email: string; otp: string }>({
            extraOptions: { skipAuthRedirect: true },
            query: (body) => ({
                url: `/v1/auth/verify-otp`,
                method: 'POST',
                body
            })
        }),
        logout: builder.mutation<{ success: boolean }, void>({
            query: () => ({
                url: `/v1/auth/logout`,
                method: 'POST'
            })
        }),
        me: builder.query<{ success: boolean; data: { user: ApiUser } }, void>({
            query: () => ({
                url: `/v1/auth/me`,
                method: 'GET'
            })
        }),
        fetchUsers: builder.mutation({
            query: (body) => ({
                url: '/v1/users',
                method: 'POST',
                body
            })
        }),
        createUser: builder.mutation({
            query: (body) => ({
                url: '/v1/users/create',
                method: 'POST',
                body
            })
        }),
        updateUser: builder.mutation({
            query: (body) => ({
                url: `/v1/users/${body.id}`,
                method: 'PUT',
                body
            })
        })
    })
})

export const {
    useLazyMeQuery,
    useUpdateProfileMutation,
    usePasswordLoginMutation,
    useRequestOtpMutation,
    useVerifyOtpMutation,
    useLogoutMutation,
    useCreateUserMutation,
    useUpdateUserMutation,
    useFetchUsersMutation
} = userApi
