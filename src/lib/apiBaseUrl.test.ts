import { expect, it } from 'vitest'
import { DEFAULT_DEV_BASE_URL, getApiBaseUrl } from './apiBaseUrl'

it('uses dev default when unset', () => {
  expect(getApiBaseUrl({ DEV: true })).toBe(DEFAULT_DEV_BASE_URL)
})

it('returns empty string when configured for production', () => {
  expect(getApiBaseUrl({ PROD: true, VITE_BACKEND_URL: '' })).toBe('')
})

it('prefers configured value', () => {
  expect(getApiBaseUrl({ DEV: true, VITE_BACKEND_URL: 'https://api.example.com' })).toBe(
    'https://api.example.com',
  )
})
