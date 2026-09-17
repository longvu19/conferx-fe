import type { FetchError } from 'ofetch'
import type { MeResponse, ParticipantInfo, RoomStatus, SessionResponse } from '~/types/room'

const BASE = '/api/v1/rooms'
const tokenKey = (roomId: string) => `conferx:token:${roomId}`

export class SessionExpiredError extends Error {}

/** Human readable message from an API error. */
export const apiErrorMessage = (error: unknown, fallback = 'Something went wrong. Try again.') => {
  const e = error as FetchError<{ error?: string }>
  if (e?.statusCode === 429) return 'Too many attempts. Wait a minute and try again.'
  return e?.data?.error ?? (e?.statusCode ? fallback : 'Cannot reach the server. Check your connection.')
}

export const apiStatus = (error: unknown) => (error as FetchError)?.statusCode

export const useRoomApi = () => {
  const { userId } = useIdentity()

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
    const res = await $fetch<SessionResponse>(BASE, {
      method: 'POST',
      credentials: 'include',
      body: {
        user_id: userId.value,
        name: input.name,
        admin_password: input.adminPassword,
        status: input.requireApproval ? 'private' : 'open'
      }
    })
    setToken(res.room_id, res.token)
    return res
  }

  const joinRoom = async (roomId: string, input: { name: string, password: string }) => {
    const res = await $fetch<SessionResponse>(`${BASE}/${roomId}/join`, {
      method: 'POST',
      credentials: 'include',
      body: { user_id: userId.value, name: input.name, password: input.password }
    })
    setToken(roomId, res.token)
    return res
  }

  return {
    getToken,
    clearToken,
    refresh,
    createRoom,
    joinRoom,
    getRoomInfo: (roomId: string) => $fetch<{ room_id: string, status: RoomStatus, participant_count: number }>(`${BASE}/${roomId}`),
    getMe: (roomId: string) => authed<MeResponse>(roomId, '/me'),
    getParticipants: (roomId: string) => authed<ParticipantInfo[]>(roomId, '/participants'),
    setParticipantStatus: (roomId: string, uid: string, status: 'approved' | 'rejected') =>
      authed<ParticipantInfo>(roomId, `/participants/${uid}`, { method: 'PATCH', body: { status } }),
    removeParticipant: (roomId: string, uid: string) => authed<void>(roomId, `/participants/${uid}`, { method: 'DELETE' }),
    setRoomStatus: (roomId: string, status: 'open' | 'private') => authed(roomId, '', { method: 'PATCH', body: { status } }),
    endRoom: (roomId: string) => authed<void>(roomId, '/end', { method: 'POST' }),
    getMediaToken: (roomId: string) => authed<{ token: string, url: string }>(roomId, '/media-token', { method: 'POST' })
  }
}
