import { createApi } from '@reduxjs/toolkit/query/react'
import { customBaseQuery } from '../baseQuery'
import { Customer, CustomerListResponse } from '../../pages/app/users/type.d'

export const customerApi = createApi({
    reducerPath: 'customerApi',
    tagTypes: ['customerApi'],
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getCustomers: builder.query<
            CustomerListResponse,
            { page?: number; limit?: number; keyword?: string }
        >({
            query: ({ page = 1, limit, keyword = '' }) => ({
                url: '/v1/customers',
                params: { page, ...(limit != null ? { limit } : {}), ...(keyword ? { keyword } : {}) },
                method: 'GET'
            }),
            providesTags: ['customerApi']
        }),
        createCustomer: builder.mutation<{ success: boolean; data: Customer }, Partial<Customer>>({
            query: (body) => ({
                url: '/v1/customers',
                method: 'POST',
                body
            }),
            invalidatesTags: ['customerApi']
        }),
        updateCustomer: builder.mutation<{ success: boolean; data: Customer }, { uuid: string; body: Partial<Customer> }>({
            query: ({ uuid, body }) => ({
                url: `/v1/customers/${uuid}`,
                method: 'PATCH',
                body
            }),
            invalidatesTags: ['customerApi']
        }),
        deleteCustomer: builder.mutation<{ success: boolean; data: Customer }, string>({
            query: (uuid) => ({
                url: `/v1/customers/${uuid}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['customerApi']
        })
    })
})

export const {
    useGetCustomersQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation
} = customerApi
