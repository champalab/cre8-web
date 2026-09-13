import { Role } from '../app/users/type.d'

export interface ResAuth {
    token?: string | null
    id: number | null
    uuid?: string | null
    username: string | null
    email?: string | null
    name: string | null
    role: Role | null
    isLogin?: boolean
    isHydrated?: boolean
}

export type SignIn = {
    email: string
    password?: string
    otp?: string
}
