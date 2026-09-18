import type { FetchError } from 'ofetch'

export interface AuthUser {
  id: string
  email: string
  display_name: string
  created_at: string
}

interface AuthResponse { user: AuthUser, token: string }

const BASE = '/api/v1/auth'

// Shared across callers so concurrent 401s trigger a single refresh (the refresh token rotates).
let refreshInFlight: Promise<boolean> | null = null

/**
 * Account state. The access token lives only in memory; the HttpOnly refresh cookie
 * restores the session after a reload.
 */
export const useAuth = () => {
  const user = useState<AuthUser | null>('auth:user', () => null)
  const token = useState<string | null>('auth:token', () => null)
  const ready = useState('auth:ready', () => false)

  const setSession = (res: AuthResponse) => {
    user.value = res.user
    token.value = res.token
  }

  const clear = () => {
    user.value = null
    token.value = null
  }

  const refresh = (): Promise<boolean> => {
    refreshInFlight ??= (async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          setSession(await $fetch<AuthResponse>(`${BASE}/refresh`, { method: 'POST', credentials: 'include' }))
          return true
        } catch (e) {
          // 409: another tab rotated the token a moment ago; the new cookie is already set.
          if ((e as FetchError).statusCode === 409 && attempt === 0) {
            await new Promise(r => setTimeout(r, 300))
            continue
          }
          clear()
          return false
        }
      }
      return false
    })().finally(() => {
      refreshInFlight = null
      ready.value = true
    })
    return refreshInFlight
  }

  /** Authenticated request to auth-service, refreshing the access token once on 401. */
  const request = async <T>(path: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> => {
    const call = () =>
      $fetch<T>(`${BASE}${path}`, {
        ...options,
        credentials: 'include',
        headers: { ...(options.headers as Record<string, string>), Authorization: `Bearer ${token.value}` }
      } as Parameters<typeof $fetch>[1]) as Promise<T>
    if (!token.value && !(await refresh())) throw new Error('Not signed in')
    try {
      return await call()
    } catch (e) {
      if ((e as FetchError).statusCode !== 401 || !(await refresh())) throw e
      return await call()
    }
  }

  const register = async (input: { email: string, password: string, displayName: string }) => {
    setSession(await $fetch<AuthResponse>(`${BASE}/register`, {
      method: 'POST',
      credentials: 'include',
      body: { email: input.email, password: input.password, display_name: input.displayName }
    }))
  }

  const login = async (email: string, password: string) => {
    setSession(await $fetch<AuthResponse>(`${BASE}/login`, { method: 'POST', credentials: 'include', body: { email, password } }))
  }

  const logout = async () => {
    await $fetch(`${BASE}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    clear()
  }

  const updateProfile = async (displayName: string) => {
    setSession(await request<AuthResponse>('/me', { method: 'PATCH', body: { display_name: displayName } }))
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await request('/me/password', { method: 'POST', body: { current_password: currentPassword, new_password: newPassword } })
  }

  return { user, token, ready, refresh, register, login, logout, updateProfile, changePassword }
}
