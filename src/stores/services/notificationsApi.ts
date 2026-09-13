import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export const notificationsApi = createApi({
    reducerPath: 'notificationsApi',
    tagTypes: ['notificationsApi'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getNotifications: builder.query<any, { unread?: boolean }>({
            query: ({ unread } = {}) => `/v1/notifications${unread ? '?unread=1' : ''}`,
            providesTags: ['notificationsApi']
        }),
        markNotificationRead: builder.mutation<any, string>({
            query: (uuid) => ({ url: `/v1/notifications/${uuid}/read`, method: 'PATCH' }),
            invalidatesTags: ['notificationsApi']
        }),
        markAllNotificationsRead: builder.mutation<any, void>({
            query: () => ({ url: '/v1/notifications/read-all', method: 'PATCH' }),
            invalidatesTags: ['notificationsApi']
        })
    })
})

export const {
    useGetNotificationsQuery,
    useMarkNotificationReadMutation,
    useMarkAllNotificationsReadMutation
} = notificationsApi
