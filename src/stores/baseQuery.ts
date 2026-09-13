import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import env from '../env'
import { onLogout } from './features/auth'
import { isUnauthorizedPayload, redirectToLogin } from '../utils/authSession'

const baseQuery = fetchBaseQuery({
    baseUrl: env.VITE_APP_API_PATH,
    credentials: 'include',
})

export const customBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, { skipAuthRedirect?: boolean }> = async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions)

    const isUnauthorized = result.error?.status === 401 || isUnauthorizedPayload(result.data)

    if (isUnauthorized && !extraOptions?.skipAuthRedirect) {
        api.dispatch(onLogout())
        redirectToLogin()
    }

    return result
}
