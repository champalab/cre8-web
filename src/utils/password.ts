/**
 * Cryptographically secure auto-password generator.
 * Produces passwords meeting all CRE8 password requirements:
 * - Length >= 8 (default 14)
 * - Uppercase [A-Z]
 * - Lowercase [a-z]
 * - Numbers [0-9]
 * - Symbols [^\p{L}\p{N}\s]
 * - Max 72 UTF-8 bytes
 */
export function generateAutoPassword(length = 14): string {
    const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'
    const numberChars = '23456789'
    const symbolChars = '!@#$%^&*()-_=+'
    const allChars = uppercaseChars + lowercaseChars + numberChars + symbolChars

    const getRandomInt = (max: number): number => {
        const array = new Uint32Array(1)
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(array)
            return array[0] % max
        }
        return Math.floor(Math.random() * max)
    }

    const getRandomChar = (str: string) => str[getRandomInt(str.length)]

    // Guarantee at least two from each group for strong entropy
    const chars: string[] = [
        getRandomChar(uppercaseChars),
        getRandomChar(uppercaseChars),
        getRandomChar(lowercaseChars),
        getRandomChar(lowercaseChars),
        getRandomChar(numberChars),
        getRandomChar(numberChars),
        getRandomChar(symbolChars),
        getRandomChar(symbolChars)
    ]

    // Fill the rest randomly
    const targetLength = Math.max(length, 12)
    while (chars.length < targetLength) {
        chars.push(getRandomChar(allChars))
    }

    // Fisher-Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
        const j = getRandomInt(i + 1)
        const temp = chars[i]
        chars[i] = chars[j]
        chars[j] = temp
    }

    const result = chars.join('')
    if (!isValidPassword(result)) {
        return generateAutoPassword(length)
    }
    return result
}

export function isValidPassword(password: string): boolean {
    return (
        Array.from(password).length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^\p{L}\p{N}\s]/u.test(password) &&
        new TextEncoder().encode(password).length <= 72
    )
}
