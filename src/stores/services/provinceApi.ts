import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'

export interface Province {
    id: number
    nameLao: string
    nameEng: string | null
    zipCode: string
}

export const provinceApi = createApi({
    reducerPath: 'provinceApi',
    tagTypes: ['provinceApi'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getProvinces: builder.query<{ data: Province[] }, void>({
            query: () => ({ url: `/v1/provinces`, method: 'GET' }),
        }),
    }),
})

export const {
    useGetProvincesQuery,
} = provinceApi
