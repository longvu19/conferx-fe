export type RoomStatus = 'open' | 'private' | 'closed'
export type ParticipantRole = 'admin' | 'member'
export type ParticipantStatus = 'pending' | 'approved' | 'rejected'

export interface ParticipantInfo {
  user_id: string
  name: string
  role: ParticipantRole
  status: ParticipantStatus
  joined_at: string
}

export interface MeResponse {
  room: { room_id: string, status: RoomStatus, room_password?: string }
  participant: ParticipantInfo
}

export interface SessionResponse {
  room_id: string
  user_id: string
  role: ParticipantRole
  participant_status: ParticipantStatus
  token: string
  room_password?: string
}

export interface ChatMessage {
  id: string
  from: string
  name: string
  text: string
  at: number
  isLocal: boolean
}
