/**
 * Thin fetch wrapper shared by every composable.
 *
 * - Base URL defaults to a relative `/api` so dev requests ride the Vite
 *   proxy (vite.config.ts) as same-origin calls — the backend issues a
 *   cookie-based session with no CORS policy configured, so a direct
 *   cross-origin fetch would be silently rejected by the browser.
 * - Every call sends credentials so the `lms.auth` cookie is attached.
 * - Errors are normalized from ASP.NET's ProblemDetails / ValidationProblemDetails
 *   shapes into a single `ApiError` with a human-readable message.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Backend requires this on every cookie-authenticated state-changing request
 * (see the CSRF-mitigation middleware in Program.cs) — a plain cross-site
 * form can't attach a custom header, and a cross-origin fetch trying to
 * would fail preflight since the API has no permissive CORS policy for
 * unapproved origins. Harmless to send on GET too, so it's applied globally.
 */
const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' } as const

/**
 * Fired when an authenticated call comes back 401 while the app still thinks
 * it has a session (e.g. the cookie expired mid-use). `/auth/*` calls never
 * fire this — `/auth/login` legitimately 401s on bad credentials, and
 * `/auth/me` is the session probe itself; both are handled locally by
 * useAuth. A listener installed once in main.ts clears local session state
 * and redirects to the login page (see lib/sessionGuard.ts).
 */
export const SESSION_EXPIRED_EVENT = 'lms:session-expired'

function isAuthEndpoint(path: string): boolean {
  return path.startsWith('/auth/') || path.startsWith('auth/')
}

export class ApiError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string[]>

  constructor(status: number, message: string, code?: string, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Send as multipart/form-data instead of JSON (body must be a FormData). */
  raw?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function parseError(response: Response): Promise<ApiError> {
  let title = response.statusText || 'Request failed'
  let code: string | undefined
  let fieldErrors: Record<string, string[]> | undefined

  try {
    const data = await response.clone().json()
    if (data && typeof data === 'object') {
      if (typeof data.title === 'string') title = data.title
      if (typeof data.detail === 'string') title = data.detail
      if (data.errors && typeof data.errors === 'object') {
        fieldErrors = data.errors as Record<string, string[]>
        const firstKey = Object.keys(fieldErrors)[0]
        if (firstKey && !data.detail) {
          title = fieldErrors[firstKey]?.[0] ?? title
        }
      }
      code = data.title
    }
  } catch {
    // Non-JSON error body (e.g. plain 401/404) — keep the status text.
  }

  return new ApiError(response.status, title, code, fieldErrors)
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, raw, query, headers, ...rest } = options

  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: raw
      ? { ...CSRF_HEADER, ...headers }
      : { 'Content-Type': 'application/json', ...CSRF_HEADER, ...(headers as Record<string, string> | undefined) },
  }

  if (body !== undefined) {
    init.body = raw ? (body as BodyInit) : JSON.stringify(body)
  }

  const response = await fetch(buildUrl(path, query), init)

  if (!response.ok) {
    if (response.status === 401 && !isAuthEndpoint(path)) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    }
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  return undefined as T
}

/** For endpoints that return binary payloads (PDF, xlsx). */
export async function apiFetchBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const { body, query, ...rest } = options
  const init: RequestInit = { ...rest, credentials: 'include' }
  if (body !== undefined) {
    init.method ??= 'POST'
    init.headers = { 'Content-Type': 'application/json', ...CSRF_HEADER }
    init.body = JSON.stringify(body)
  } else {
    init.headers = { ...CSRF_HEADER }
  }
  const response = await fetch(buildUrl(path, query), init)
  if (!response.ok) {
    if (response.status === 401 && !isAuthEndpoint(path)) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    }
    throw await parseError(response)
  }
  return response.blob()
}

/** Resolves a media asset id to its servable URL. */
export function mediaUrl(assetId: string): string {
  return buildUrl(`/media/${assetId}`)
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export { API_BASE_URL }
