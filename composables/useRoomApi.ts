import type { FetchError } from 'ofetch'
import type { MeResponse, ParticipantInfo, RoomStatus, SessionResponse } from '~/types/room'

const BASE = '/api/v1/rooms'
const tokenKey = (roomId: string) => `conferx:token:${roomId}`

export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message)
    // Nuxt DevTools wraps auto-imported classes for metrics, which breaks `instanceof`
    // checks against the auto-imported binding. Callers should check `.name` instead.
    this.name = 'SessionExpiredError'
  }
}

/** Human readable message from an API error. */
export const apiErrorMessage = (error: unknown, fallback = 'Something went wrong. Try again.') => {
  if (error instanceof Error && error.name === 'SessionExpiredError') return error.message
  const e = error as FetchError<{ error?: string }>
  if (e?.statusCode === 429) return 'Too many attempts. Wait a minute and try again.'
  return e?.data?.error ?? (e?.statusCode ? fallback : 'Cannot reach the server. Check your connection.')
}

export const apiStatus = (error: unknown) => (error as FetchError)?.statusCode

export interface MyRoom {
  room_id: string
  status: RoomStatus
  room_password: string
  created_at: string
}

export const useRoomApi = () => {
  const { userId } = useIdentity()
  const auth = useAuth()

  /**
   * Create/join/list send the account token when signed in; otherwise the guest browser id.
   * If the account token expired, refresh once; if the session is gone, continue as a guest.
   */
  const asCaller = async <T>(send: (headers: Record<string, string>, guest: { user_id?: string }) => Promise<T>) => {
    const attempt = () =>
      auth.token.value
        ? send({ Authorization: `Bearer ${auth.token.value}` }, {})
        : send({}, { user_id: userId.value })
    try {
      return await attempt()
    } catch (e) {
      if (apiStatus(e) !== 401 || !auth.token.value) throw e
      await auth.refresh()
      return await attempt()
    }
  }

  const getToken = (roomId: string) => (import.meta.client ? sessionStorage.getItem(tokenKey(roomId)) : null)
  const setToken = (roomId: string, token: string) => sessionStorage.setItem(tokenKey(roomId), token)
  const clearToken = (roomId: string) => sessionStorage.removeItem(tokenKey(roomId))

  const refresh = async (roomId: string) => {
    try {
      const res = await $fetch<SessionResponse>(`${BASE}/${roomId}/refresh-token`, { method: 'POST', credentials: 'include' })
      setToken(roomId, res.token)
      return res
    } catch (error) {
      clearToken(roomId)
      throw new SessionExpiredError(apiErrorMessage(error))
    }
  }

  /** Authenticated request that refreshes the access token once on 401. */
  const authed = async <T>(roomId: string, path: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> => {
    const call = (token: string | null) =>
      $fetch<T>(`${BASE}/${roomId}${path}`, {
        ...options,
        credentials: 'include',
        headers: { ...(options.headers as Record<string, string>), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      } as Parameters<typeof $fetch>[1]) as Promise<T>

    let token = getToken(roomId)
    if (!token) token = (await refresh(roomId)).token
    try {
      return await call(token)
    } catch (error) {
      if (apiStatus(error) !== 401) throw error
      const fresh = await refresh(roomId)
      return await call(fresh.token)
    }
  }

  const createRoom = async (input: { name: string, adminPassword: string, requireApproval: boolean }) => {
    const res = await asCaller((headers, guest) => $fetch<SessionResponse>(BASE, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: { ...guest, name: input.name, admin_password: input.adminPassword, status: input.requireApproval ? 'private' : 'open' }
    }))
    setToken(res.room_id, res.token)
    return res
  }

  /** Password may be omitted when the signed-in account owns the room. */
  const joinRoom = async (roomId: string, input: { name?: string, password?: string }) => {
    const res = await asCaller((headers, guest) => $fetch<SessionResponse>(`${BASE}/${roomId}/join`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: { ...guest, name: input.name, password: input.password || undefined }
    }))
    setToken(roomId, res.token)
    return res
  }

  const listMyRooms = () => asCaller(headers => $fetch<MyRoom[]>(BASE, { headers }))

  return {
    getToken,
    clearToken,
    refresh,
    createRoom,
    joinRoom,
    listMyRooms,
    getRoomInfo: (roomId: string) => $fetch<{ room_id: string, status: RoomStatus, participant_count: number }>(`${BASE}/${roomId}`),
    getMe: (roomId: string) => authed<MeResponse>(roomId, '/me'),
    getParticipants: (roomId: string) => authed<ParticipantInfo[]>(roomId, '/participants'),
    setParticipantStatus: (roomId: string, uid: string, status: 'approved' | 'rejected') =>
      authed<ParticipantInfo>(roomId, `/participants/${uid}`, { method: 'PATCH', body: { status } }),
    removeParticipant: async (roomId: string, uid: string): Promise<void> => {
      await authed(roomId, `/participants/${uid}`, { method: 'DELETE' })
    },
    setRoomStatus: (roomId: string, status: 'open' | 'private') => authed(roomId, '', { method: 'PATCH', body: { status } }),
    endRoom: async (roomId: string): Promise<void> => {
      await authed(roomId, '/end', { method: 'POST' })
    },
    getMediaToken: (roomId: string) => authed<{ token: string, url: string }>(roomId, '/media-token', { method: 'POST' })
  }
}
