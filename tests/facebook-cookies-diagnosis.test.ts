import { describe, expect, it } from 'bun:test'
import { diagnoseAndNormalizeCookies } from '../src/pages/app/platforms/components/FacebookConnectModal'

describe('Facebook Cookies Diagnosis & Normalization', () => {
    it('detects empty input and flags Step 4', () => {
        const res = diagnoseAndNormalizeCookies('')
        expect(res.valid).toBe(false)
        expect(res.errorStep).toBe(4)
        expect(res.errorKey).toBe('platforms.cookieErrorStep4Empty')
    })

    it('detects URL input and flags Step 2', () => {
        const res = diagnoseAndNormalizeCookies('https://www.facebook.com/watch')
        expect(res.valid).toBe(false)
        expect(res.errorStep).toBe(2)
        expect(res.errorKey).toBe('platforms.cookieErrorStep2NotCookie')
    })

    it('detects missing c_user and flags Step 1 (not logged in)', () => {
        const res = diagnoseAndNormalizeCookies('datr=abcdef; sb=12345; fr=zzz')
        expect(res.valid).toBe(false)
        expect(res.errorStep).toBe(1)
        expect(res.errorKey).toBe('platforms.cookieErrorStep1NotLoggedIn')
    })

    it('detects missing xs and flags Step 3 (incomplete cookies)', () => {
        const res = diagnoseAndNormalizeCookies('c_user=100088991122; datr=abcdef')
        expect(res.valid).toBe(false)
        expect(res.errorStep).toBe(3)
        expect(res.userId).toBe('100088991122')
        expect(res.errorKey).toBe('platforms.cookieErrorStep3MissingXs')
    })

    it('successfully parses valid cookie string', () => {
        const res = diagnoseAndNormalizeCookies('c_user=100088991122; xs=2%3Asecret%3A2; datr=abcdef')
        expect(res.valid).toBe(true)
        expect(res.userId).toBe('100088991122')
        expect(res.sanitizedCookie).toBe('c_user=100088991122; xs=2%3Asecret%3A2; datr=abcdef')
    })

    it('successfully parses Cookie-Editor JSON format', () => {
        const jsonInput = JSON.stringify([
            { name: 'c_user', value: '100088991122' },
            { name: 'xs', value: '2%3Asecret%3A2' },
            { name: 'datr', value: 'abcdef' },
        ])
        const res = diagnoseAndNormalizeCookies(jsonInput)
        expect(res.valid).toBe(true)
        expect(res.userId).toBe('100088991122')
        expect(res.sanitizedCookie).toContain('c_user=100088991122')
        expect(res.sanitizedCookie).toContain('xs=2%3Asecret%3A2')
    })

    it('strips "Cookie: " HTTP header prefix', () => {
        const res = diagnoseAndNormalizeCookies('Cookie: c_user=100088991122; xs=2%3Asecret%3A2')
        expect(res.valid).toBe(true)
        expect(res.sanitizedCookie).toBe('c_user=100088991122; xs=2%3Asecret%3A2')
    })
})
