import env from '../env'

const LOGIN_PATH = '/login'

export function clearAuthToken() {
    localStorage.removeItem(env.LOCAL_TOKEN)
}

export function redirectToLogin() {
    if (window.location.pathname !== LOGIN_PATH) {
        window.location.href = LOGIN_PATH
    }
}

export function isUnauthorizedPayload(payload: unknown) {
    if (!payload || typeof payload !== 'object') return false

    const data = payload as {
        authorized?: boolean
        error?: { code?: string }
        isExpired?: boolean
    }

    return (
        data.authorized === false ||
        data.error?.code === 'SESSION_EXPIRED' ||
        data.error?.code === 'UNAUTHORIZED' ||
        Boolean(data.isExpired)
    )
}
