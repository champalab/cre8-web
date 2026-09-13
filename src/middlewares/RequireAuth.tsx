import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { RootState } from '../stores'
import Loader from '../components/Loader'

const RequireAuth = (): React.ReactElement => {
    const auth = useSelector((state: RootState) => state.auth)

    if (!auth?.isHydrated) {
        return <Loader />
    }

    if (!auth?.isLogin) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}

export default RequireAuth
