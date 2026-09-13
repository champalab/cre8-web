import { configureStore } from '@reduxjs/toolkit'
import drawer from './features/drawer'
import auth from './features/auth'
import { userApi } from './services/userApi'
import { dashboardApi } from './services/dashboardApi'
// Influencer Marketing APIs
import { actorApi } from './services/actorApi'
import { campaignApi } from './services/campaignApi'
import { platformApi } from './services/platformApi'
import { viewLogApi } from './services/viewLogApi'
import { customerApi } from './services/customerApi'
import { provinceApi } from './services/provinceApi'

import { auditLogsApi } from './services/auditLogsApi'
import { filesApi } from './services/filesApi'
import { paymentApi } from './services/paymentApi'
import { postLinksApi } from './services/postLinksApi'
import { notificationsApi } from './services/notificationsApi'
import { facebookBusinessApi } from './services/facebookBusinessApi'
import { facebookScrapeApi } from './services/facebookScrapeApi'

export const store = configureStore({
    reducer: {
        auth,
        drawer,
        [userApi.reducerPath]: userApi.reducer,
        [dashboardApi.reducerPath]: dashboardApi.reducer,
        // Influencer Marketing
        [actorApi.reducerPath]: actorApi.reducer,
        [campaignApi.reducerPath]: campaignApi.reducer,
        [platformApi.reducerPath]: platformApi.reducer,
        [viewLogApi.reducerPath]: viewLogApi.reducer,
        [customerApi.reducerPath]: customerApi.reducer,
        [provinceApi.reducerPath]: provinceApi.reducer,

        [auditLogsApi.reducerPath]: auditLogsApi.reducer,
        [filesApi.reducerPath]: filesApi.reducer,
        [paymentApi.reducerPath]: paymentApi.reducer,
        [postLinksApi.reducerPath]: postLinksApi.reducer,
        [notificationsApi.reducerPath]: notificationsApi.reducer,
        [facebookBusinessApi.reducerPath]: facebookBusinessApi.reducer,
        [facebookScrapeApi.reducerPath]: facebookScrapeApi.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        }).concat([
            userApi.middleware,
            dashboardApi.middleware,
            // Influencer Marketing
            actorApi.middleware,
            campaignApi.middleware,
            platformApi.middleware,
            viewLogApi.middleware,
            customerApi.middleware,
            provinceApi.middleware,

            auditLogsApi.middleware,
            filesApi.middleware,
            paymentApi.middleware,
            postLinksApi.middleware,
            notificationsApi.middleware,
            facebookBusinessApi.middleware,
            facebookScrapeApi.middleware
        ])
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
