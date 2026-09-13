import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export const filesApi = createApi({
    reducerPath: 'filesApi',
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        presignUpload: builder.mutation<any, { original_name: string; mime_type: string; file_size: number }>({
            query: (body) => ({ url: '/v1/files/presign-upload', method: 'POST', body })
        }),
        confirmUpload: builder.mutation<any, Record<string, unknown>>({
            query: (body) => ({ url: '/v1/files/confirm', method: 'POST', body })
        }),
        uploadFiles: builder.mutation<{ status: string; data: string[] }, FormData>({
            query: (body) => ({ url: '/v1/files/upload', method: 'POST', body })
        })
    })
})

export const { usePresignUploadMutation, useConfirmUploadMutation, useUploadFilesMutation } = filesApi
