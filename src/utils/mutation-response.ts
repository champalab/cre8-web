type MutationResult = { data?: unknown; error?: unknown }

export function getMutationPayload(result: MutationResult): any {
    if ('data' in result && result.data) return result.data
    if ('error' in result && result.error && typeof result.error === 'object' && 'data' in result.error) {
        return (result.error as { data?: unknown }).data
    }
    return null
}

export function isMutationSuccess(payload: any): boolean {
    return payload?.status === 'success' || payload?.success === true
}
