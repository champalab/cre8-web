import { createApi, } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'
import { ResDashboard } from '../../pages/app/dashboard/type'
export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    tagTypes: ['dashboardApi'],
    baseQuery: customBaseQuery,

    endpoints: (builder) => ({
        getDashboard: builder.query<ResDashboard, void>({
            query: () => ({
                url: `/v1/dashboard`,
                method: 'GET'
            }),
            providesTags: ['dashboardApi'],
        }),
    })
})

export const { useGetDashboardQuery } = dashboardApi
