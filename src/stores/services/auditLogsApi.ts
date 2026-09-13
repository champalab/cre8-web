import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export const auditLogsApi = createApi({
    reducerPath: 'auditLogsApi',
    tagTypes: ['auditLogsApi'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getAuditLogs: builder.query<any, { page?: number; action?: string }>({
            query: ({ page = 1, action = '' }) =>
                `/v1/audit-logs?page=${page}${action ? `&action=${encodeURIComponent(action)}` : ''}`,
            providesTags: ['auditLogsApi']
        })
    })
})

export const { useGetAuditLogsQuery } = auditLogsApi
