import { expect, mock, test } from 'bun:test'

mock.module('../src/env', () => ({ default: { LOCAL_TOKEN: 'test-token', VITE_APP_API_PATH: 'http://localhost' } }))
const failure = { error: { status: 401, data: { message: 'Invalid login or password' } } }
mock.module('@reduxjs/toolkit/query/react', () => ({ fetchBaseQuery: () => async () => failure }))
const { customBaseQuery } = await import('../src/stores/baseQuery')

function setup(pathname: string) {
    const location = { pathname, href: pathname }
    Object.assign(globalThis, { window: { location }, localStorage: { removeItem() {}, getItem() { return null } } })
    return location
}

test('failed login returns the API message without logging out or navigating', async () => {
    const location = setup('/login')
    const dispatch = mock(() => {})
    const result = await customBaseQuery('/v1/auth/login', { dispatch } as any, { skipAuthRedirect: true })
    expect(result).toEqual(failure)
    expect(dispatch).not.toHaveBeenCalled()
    expect(location.href).toBe('/login')
})

test('expired protected session redirects to login instead of home', async () => {
    const location = setup('/app/users')
    const dispatch = mock(() => {})
    await customBaseQuery('/v1/users', { dispatch } as any, {})
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(location.href).toBe('/login')
})
