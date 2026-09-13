export type Role =
    | 'SUPER_ADMIN'
    | 'ADMIN'
    | 'CAMPAIGN_MANAGER'
    | 'STAFF'
    | 'INFLUENCER'
    | 'CUSTOMER'
    | 'CUSTOMER_ADMIN'
    | 'CUSTOMER_REVIEWER'
    | 'CUSTOMER_VIEWER'
    | 'VIEWER'
    | 'OWNER'
    | 'FINANCE'
    | 'EMPLOYEE'
    | 'AGENT'

export interface User {
    id: number
    role: Role
    username: string
    status: string
    name: string
    companies: Company
}

export interface Company {
    name: string
    address: string
}

export interface ResUser {
    status: string
    data: User[]
    total: number
    page: number
    limit: number
}

export interface UserCreate {
    password?: string
    id: number
    role: Role
    username: string
    email?: string
    status: string
    name: string
    comments: string | null
}

export interface Filter {
    keyword: string | null
}



export interface Customer {
    id: number
    uuid: string

    customer_code: string
    full_name?: string
    company_name: string
    email?: string | null
    company_email?: string | null
    phone?: string | null
    company_phone?: string | null
    comment?: string | null
    internal_note?: string | null
    status: string
    country?: string | null
    province?: string | null

}

export interface CustomerListResponse {
    success: boolean
    data: Customer[]
    meta?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}
