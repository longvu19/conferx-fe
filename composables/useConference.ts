import {
  ConnectionState,
  DisconnectReason,
  Room,
  RoomEvent,
  Track,
  VideoPresets,
  type Participant,
  type RemoteTrack,
  type TrackPublication
} from 'livekit-client'
import type { ChatMessage } from '~/types/room'
import type { MediaPreferences } from './useMediaPreferences'

export interface Tile {
  key: string
  identity: string
  name: string
  isLocal: boolean
  isScreen: boolean
  isSpeaking: boolean
  micOn: boolean
  camOn: boolean
  handRaised: boolean
  /** Data URL of a whiteboard doodle submitted to this tile, or '' for none. */
  doodle: string
  track?: Track
}

export type EndReason = 'left' | 'ended' | 'removed' | 'lost' | null

const CHAT_TOPIC = 'lk.chat'

/** LiveKit room wrapper exposing plain reactive state for the meeting UI. */
export const useConference = () => {
  const room = shallowRef<Room | null>(null)
  const tiles = shallowRef<Tile[]>([])
  const messages = ref<ChatMessage[]>([])
  const connection = ref<ConnectionState>(ConnectionState.Disconnected)
  const endReason = ref<EndReason>(null)
  const micOn = ref(false)
  const camOn = ref(false)
  const screenOn = ref(false)
  const handRaised = ref(false)
  const handRaisedEvent = ref<{ name: string } | null>(null)
  const canPlayAudio = ref(true)
  const deviceError = ref<string | null>(null)
  const audioElements = new Map<string, HTMLMediaElement>()

  const rebuild = () => {
    const r = room.value
    if (!r) return (tiles.value = [])
    const people: Participant[] = [r.localParticipant, ...r.remoteParticipants.values()]
    const next: Tile[] = []
    for (const p of people) {
      const cam = p.getTrackPublication(Track.Source.Camera)
      const mic = p.getTrackPublication(Track.Source.Microphone)
      const screen = p.getTrackPublication(Track.Source.ScreenShare)
      const base = {
        identity: p.identity,
        name: p.name || 'Guest',
        isLocal: p.isLocal,
        isSpeaking: p.isSpeaking,
        micOn: !!mic && !mic.isMuted,
        camOn: !!cam?.track && !cam.isMuted,
        handRaised: p.attributes.hand === '1',
        doodle: p.attributes.doodle || ''
      }
      next.push({ ...base, key: `${p.identity}:camera`, isScreen: false, track: base.camOn ? markRaw(cam!.track!) : undefined })
      if (screen?.track) next.push({ ...base, key: `${p.identity}:screen`, isScreen: true, track: markRaw(screen.track) })
    }
    tiles.value = next
    micOn.value = r.localParticipant.isMicrophoneEnabled
    camOn.value = r.localParticipant.isCameraEnabled
    screenOn.value = r.localParticipant.isScreenShareEnabled
    handRaised.value = r.localParticipant.attributes.hand === '1'
  }

  const attachAudio = (track: RemoteTrack, publication: TrackPublication) => {
    if (track.kind !== Track.Kind.Audio) return
    const el = track.attach()
    el.style.display = 'none'
    document.body.appendChild(el)
    audioElements.set(publication.trackSid, el)
  }

  const detachAudio = (track: RemoteTrack, publication: TrackPublication) => {
    track.detach().forEach(el => el.remove())
    audioElements.delete(publication.trackSid)
  }

  const describeDeviceError = (e: unknown) => {
    const name = (e as DOMException)?.name
    if (name === 'NotAllowedError') return 'Permission denied. Allow access in your browser\'s site settings.'
    if (name === 'NotFoundError') return 'Device not found.'
    if (name === 'NotReadableError') return 'The device is in use by another app.'
    return 'Could not access the device.'
  }

  const connect = async (url: string, token: string, prefs: MediaPreferences) => {
    endReason.value = null
    const r = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: { deviceId: prefs.audioInput || undefined, echoCancellation: true, noiseSuppression: true },
      videoCaptureDefaults: { deviceId: prefs.videoInput || undefined, resolution: VideoPresets.h720.resolution },
      audioOutput: prefs.audioOutput ? { deviceId: prefs.audioOutput } : undefined
    })
    room.value = markRaw(r)

    r.on(RoomEvent.ConnectionStateChanged, (state) => {
      connection.value = state
    })
      .on(RoomEvent.ParticipantConnected, rebuild)
      .on(RoomEvent.ParticipantDisconnected, rebuild)
      // Publication state (not just subscription) so a remote unpublish - e.g. the host
      // stopping a screen share - clears the tile immediately for every viewer.
      .on(RoomEvent.TrackPublished, rebuild)
      .on(RoomEvent.TrackUnpublished, rebuild)
      .on(RoomEvent.TrackSubscribed, (track, pub) => {
        attachAudio(track, pub)
        rebuild()
      })
      .on(RoomEvent.TrackUnsubscribed, (track, pub) => {
        detachAudio(track, pub)
        rebuild()
      })
      .on(RoomEvent.LocalTrackPublished, rebuild)
      .on(RoomEvent.LocalTrackUnpublished, rebuild)
      .on(RoomEvent.TrackMuted, rebuild)
      .on(RoomEvent.TrackUnmuted, rebuild)
      .on(RoomEvent.ActiveSpeakersChanged, rebuild)
      .on(RoomEvent.ParticipantNameChanged, rebuild)
      .on(RoomEvent.ParticipantAttributesChanged, (changed, participant) => {
        rebuild()
        if (changed.hand === '1' && !participant.isLocal) handRaisedEvent.value = { name: participant.name || 'Guest' }
      })
      .on(RoomEvent.AudioPlaybackStatusChanged, () => {
        canPlayAudio.value = r.canPlaybackAudio
      })
      .on(RoomEvent.Disconnected, (reason) => {
        if (endReason.value !== 'left') {
          endReason.value = reason === DisconnectReason.ROOM_DELETED
            ? 'ended'
            : reason === DisconnectReason.PARTICIPANT_REMOVED
              ? 'removed'
              : reason === DisconnectReason.CLIENT_INITIATED ? 'left' : 'lost'
        }
        audioElements.forEach(el => el.remove())
        audioElements.clear()
        rebuild()
      })

    r.registerTextStreamHandler(CHAT_TOPIC, async (reader, info) => {
      const text = await reader.readAll()
      const sender = r.getParticipantByIdentity(info.identity)
      messages.value.push({
        id: reader.info.id,
        from: info.identity,
        name: sender?.name || 'Guest',
        text,
        at: reader.info.timestamp,
        isLocal: false
      })
    })

    await r.connect(url, token)
    canPlayAudio.value = r.canPlaybackAudio
    rebuild()

    // Publishing failures should not kick the user out of the meeting.
    if (prefs.micEnabled) await toggleMic(true)
    if (prefs.camEnabled) await toggleCamera(true)
  }

  const toggleMic = async (enabled = !micOn.value) => {
    try {
      deviceError.value = null
      await room.value?.localParticipant.setMicrophoneEnabled(enabled)
    } catch (e) {
      deviceError.value = `Microphone: ${describeDeviceError(e)}`
    }
    rebuild()
  }

  const toggleCamera = async (enabled = !camOn.value) => {
    try {
      deviceError.value = null
      await room.value?.localParticipant.setCameraEnabled(enabled)
    } catch (e) {
      deviceError.value = `Camera: ${describeDeviceError(e)}`
    }
    rebuild()
  }

  const toggleScreenShare = async () => {
    try {
      await room.value?.localParticipant.setScreenShareEnabled(!screenOn.value, { audio: true })
    } catch (e) {
      // User closing the browser picker is not an error worth showing.
      if ((e as DOMException)?.name !== 'NotAllowedError') deviceError.value = 'Screen sharing is not available in this browser.'
    }
    rebuild()
  }

  const switchDevice = (kind: MediaDeviceKind, deviceId: string) => room.value?.switchActiveDevice(kind, deviceId)

  const toggleHand = async () => {
    await room.value?.localParticipant.setAttributes({ hand: handRaised.value ? '0' : '1' })
    rebuild()
  }

  /** Post (or clear, with '') a whiteboard doodle snapshot to your own tile. */
  const setDoodle = async (dataUrl: string) => {
    await room.value?.localParticipant.setAttributes({ doodle: dataUrl })
    rebuild()
  }

  const sendMessage = async (text: string) => {
    const r = room.value
    const trimmed = text.trim()
    if (!r || !trimmed) return
    const info = await r.localParticipant.sendText(trimmed, { topic: CHAT_TOPIC })
    messages.value.push({
      id: info.id,
      from: r.localParticipant.identity,
      name: r.localParticipant.name || 'You',
      text: trimmed,
      at: info.timestamp,
      isLocal: true
    })
  }

  const startAudio = () => room.value?.startAudio()

  const disconnect = async () => {
    endReason.value = 'left'
    await room.value?.disconnect()
  }

  onBeforeUnmount(() => {
    room.value?.disconnect()
  })

  return {
    room,
    tiles,
    messages,
    connection,
    endReason,
    micOn,
    camOn,
    screenOn,
    handRaised,
    handRaisedEvent,
    canPlayAudio,
    deviceError,
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    toggleHand,
    setDoodle,
    switchDevice,
    sendMessage,
    startAudio
  }
}
