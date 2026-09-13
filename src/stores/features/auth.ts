import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import env from '../../env'
import { ResAuth } from '@/pages/public/login/type'

const initialState: ResAuth = {
    isLogin: false,
    id: null,
    uuid: null,
    username: null,
    email: null,
    token: null,
    role: null,
    name: null
}

export const auth = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        onLogin: (state, { payload }: PayloadAction<ResAuth>) => {
            state.id = payload.id
            state.name = payload.name
            state.uuid = payload.uuid ?? null
            state.username = payload.username
            state.email = payload.email ?? null
            state.role = payload.role
            state.isLogin = true

            if (payload.token) {
                state.token = payload.token
                localStorage.setItem(env.LOCAL_TOKEN, payload.token)
            }
        },

        onRefresh: (state, { payload }: PayloadAction<ResAuth>) => {
            state.id = payload.id
            state.name = payload.name
            state.uuid = payload.uuid ?? null
            state.username = payload.username
            state.email = payload.email ?? null
            state.role = payload.role
            state.isLogin = Boolean(payload.id)
        },

        onLogout: (state) => {
            state.isLogin = false
            state.id = null
            state.name = null
            state.uuid = null
            state.username = null
            state.email = null
            state.token = null
            state.role = null
            localStorage.removeItem(env.LOCAL_TOKEN)
        }
    }
})

export const { onLogin, onLogout, onRefresh } = auth.actions
export default auth.reducer
