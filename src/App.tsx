import React, { lazy, Suspense, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route, RouterProvider } from 'react-router-dom'
import { onAuthHydrated, onRefresh } from './stores/features/auth'
import { useLazyMeQuery } from './stores/services/userApi'
import { setDrawerOpen } from './stores/features/drawer'
import BackdropComponent from './components/BackdropComponent'
import PublicLayout from './layouts/layouts/public'
import ADMINLayout from './layouts/layouts/admin'
import RequireAuth from './middlewares/RequireAuth'
import RoleGuard from './components/RoleGuard'
import Loader from './components/Loader'
import { getAppRoutes, publicRoutes } from './config/navigation'
import { SeoHead } from './components/seo-head'
import { normalizeRole } from './config/roles'

interface Props {}

const appRoutes = getAppRoutes()
const HomePage = lazyPage(() => import('./pages/public/home/Home'))
const ServicesHub = lazyPage(() => import('./pages/public/seo/ServicesHub'))
const SeoLanding = lazyPage(() => import('./pages/public/seo/SeoLanding'))

function lazyPage(factory: () => Promise<{ default: React.ComponentType }>) {
    return lazy(factory)
}

function SeoRouteFrame() {
    return (
        <>
            <SeoHead />
            <Outlet />
        </>
    )
}

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route element={<SeoRouteFrame />}>
            <Route element={<PublicLayout />}>
                {publicRoutes.map((item) => (
                    <Route
                        key={item.name}
                        index={item.routePath === ''}
                        path={item.routePath === '' ? undefined : item.routePath}
                        element={
                            <Suspense fallback={<Loader />}>
                                <item.component />
                            </Suspense>
                        }
                    />
                ))}
                <Route
                    path="en"
                    element={
                        <Suspense fallback={<Loader />}>
                            <HomePage />
                        </Suspense>
                    }
                />
                <Route
                    path="services"
                    element={
                        <Suspense fallback={<Loader />}>
                            <ServicesHub />
                        </Suspense>
                    }
                />
                <Route
                    path="en/services"
                    element={
                        <Suspense fallback={<Loader />}>
                            <ServicesHub />
                        </Suspense>
                    }
                />
                <Route
                    path=":slug"
                    element={
                        <Suspense fallback={<Loader />}>
                            <SeoLanding />
                        </Suspense>
                    }
                />
                <Route
                    path="en/:slug"
                    element={
                        <Suspense fallback={<Loader />}>
                            <SeoLanding />
                        </Suspense>
                    }
                />
            </Route>

            <Route path="/app" element={<RequireAuth />}>
                <Route element={<ADMINLayout />}>
                    {appRoutes.map((item) =>
                        item.routePath === '' ? (
                            <Route key={item.path} index element={<RoleGuard item={item} />} />
                        ) : (
                            <Route key={item.path} path={item.routePath} element={<RoleGuard item={item} />} />
                        )
                    )}
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
    ),
    {
        basename: import.meta.env.BASE_URL
    }
)

const App: React.FC<Props> = () => {
    const dispatch = useDispatch()
    const [fetchMe] = useLazyMeQuery()
    // const link = window.location.pathname.replace('/app', '')
    // console.log(link)

    useEffect(() => {
        let isMounted = true
        const drawerState = Boolean(localStorage.getItem('drawer'))
        dispatch(setDrawerOpen({ open: drawerState }))
        const authToken = localStorage.getItem(import.meta.env.VITE_APP_LOCAL_TOKEN ?? 'INFLUENCER')

        const refreshAuth = async () => {
            if (!authToken) return
            try {
                const result = await fetchMe()
                if ('data' in result && result.data?.success && result.data.data?.user) {
                    const user = result.data.data.user
                    dispatch(
                        onRefresh({
                            id: user.id,
                            uuid: user.uuid ?? null,
                            username: user.username,
                            name: user.name ?? null,
                            email: user.email ?? null,
                            role: normalizeRole(user.role),
                            token: null
                        })
                    )
                }
            } catch (error) {
                localStorage.removeItem(import.meta.env.VITE_APP_LOCAL_TOKEN ?? 'INFLUENCER')
            } finally {
                if (isMounted) dispatch(onAuthHydrated())
            }
        }

        refreshAuth()

        return () => {
            isMounted = false
        }
    }, [dispatch, fetchMe])

    return (
        <Suspense fallback={<BackdropComponent open />}>
            <RouterProvider router={router} />
        </Suspense>
    )
}

export default App
