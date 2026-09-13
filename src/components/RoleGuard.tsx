import React, { Suspense } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import Loader from './Loader'
import { canAccess, NavItem } from '../config/navigation'
import { RootState } from '../stores'

type Props = {
    item: NavItem
}

const RoleGuard = ({ item }: Props): React.ReactElement => {
    const auth = useSelector((state: RootState) => state.auth)

    if (!item.component) {
        return <Navigate to="/app" replace />
    }

    if (!canAccess(auth.role, item.roles, item.strictRoles ? { strict: true } : undefined)) {
        return <Navigate to="/app" replace />
    }

    const Page = item.component

    return (
        <Suspense fallback={<Loader />}>
            <Page />
        </Suspense>
    )
}

export default RoleGuard
