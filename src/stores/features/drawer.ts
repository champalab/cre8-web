import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface DrawerState {
    open: boolean
}

const initialState: DrawerState = {
    open: true,
}

export const drawer = createSlice({
    name: 'drawer',
    initialState,
    reducers: {
        setDrawerOpen: (state, { payload }: PayloadAction<DrawerState>) => {
            state.open = payload.open
            localStorage.setItem('drawer', JSON.stringify(payload.open))
        },
    },
})

export const { setDrawerOpen } = drawer.actions
export default drawer.reducer