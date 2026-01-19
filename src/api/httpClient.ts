export type ApiClient = {
  get: <T = unknown>(path: string, init?: RequestInit) => Promise<T>
  post: <T = unknown>(path: string, body?: unknown, init?: RequestInit) => Promise<T>
  request: <T = unknown>(path: string, init?: RequestInit & { json?: unknown }) => Promise<T>
}

export function createApiClient(
  baseUrl: string,
  getToken: () => string | undefined,
): ApiClient {
  const request: ApiClient['request'] = async <T = unknown>(
    path: string,
    init: RequestInit & { json?: unknown } = {},
  ) => {
    const headerBag = new Headers(init.headers)
    const headers: Record<string, string> = {}

    headerBag.forEach((value, key) => {
      headers[key] = value
    })
    const token = getToken()

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    let body = init.body
    if (init.json !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(init.json)
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      body,
    })

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`)
    }

    return (await response.json()) as T
  }

  const get: ApiClient['get'] = (path, init) => request(path, init)
  const post: ApiClient['post'] = (path, bodyData, init) =>
    request(path, { ...init, method: 'POST', json: bodyData })

  return { get, post, request }
}
