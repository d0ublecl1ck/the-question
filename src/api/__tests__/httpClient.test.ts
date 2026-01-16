import { expect, it, vi } from 'vitest'
import { createApiClient } from '../httpClient'

it('adds base url and auth header', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  vi.stubGlobal('fetch', fetchMock)

  const client = createApiClient('https://api.example.com', () => 'token-1')
  await client.get('/ping')

  expect(fetchMock).toHaveBeenCalledWith(
    'https://api.example.com/ping',
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
    }),
  )
})
