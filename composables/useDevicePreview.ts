export interface DeviceOption { label: string, value: string }

/**
 * Camera/mic preview for the pre-join dialog.
 * - asks for permission first so device labels are available
 * - stops old tracks before opening new ones (no leaked streams / camera light)
 * - reacts to device changes and plug/unplug events
 */
export const useDevicePreview = () => {
  const prefs = useMediaPreferences()
  const stream = shallowRef<MediaStream | null>(null)
  const error = ref<string | null>(null)
  const active = ref(false)
  const microphones = ref<DeviceOption[]>([])
  const cameras = ref<DeviceOption[]>([])
  const speakers = ref<DeviceOption[]>([])

  const stopTracks = () => {
    stream.value?.getTracks().forEach(t => t.stop())
    stream.value = null
  }

  const currentDeviceId = (kind: 'audio' | 'video') => {
    const track = kind === 'audio' ? stream.value?.getAudioTracks()[0] : stream.value?.getVideoTracks()[0]
    return track?.getSettings().deviceId
  }

  const refreshDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const toOptions = (kind: MediaDeviceKind, fallback: string) =>
      devices
        .filter(d => d.kind === kind && d.deviceId)
        .map((d, i) => ({ value: d.deviceId, label: d.label || `${fallback} ${i + 1}` }))
    microphones.value = toOptions('audioinput', 'Microphone')
    cameras.value = toOptions('videoinput', 'Camera')
    speakers.value = toOptions('audiooutput', 'Speaker')

    // Reflect the device the browser actually opened, or fall back to the first available one.
    const ensure = (key: 'audioInput' | 'videoInput' | 'audioOutput', list: DeviceOption[], inUse?: string) => {
      if (inUse && list.some(d => d.value === inUse)) prefs.value[key] = inUse
      else if (!list.some(d => d.value === prefs.value[key])) prefs.value[key] = list[0]?.value ?? ''
    }
    ensure('audioInput', microphones.value, currentDeviceId('audio'))
    ensure('videoInput', cameras.value, currentDeviceId('video'))
    ensure('audioOutput', speakers.value)
  }

  const open = async () => {
    stopTracks()
    error.value = null
    const { micEnabled, camEnabled, audioInput, videoInput } = prefs.value
    if (!micEnabled && !camEnabled) {
      await refreshDevices().catch(() => {})
      return
    }
    try {
      stream.value = await navigator.mediaDevices.getUserMedia({
        audio: micEnabled ? (audioInput ? { deviceId: { ideal: audioInput } } : true) : false,
        video: camEnabled ? (videoInput ? { deviceId: { ideal: videoInput } } : true) : false
      })
    } catch (e) {
      const name = (e as DOMException)?.name
      error.value = name === 'NotAllowedError'
        ? 'Camera and microphone are blocked. Allow access in your browser\'s site settings.'
        : name === 'NotFoundError'
          ? 'No camera or microphone found.'
          : 'Could not start your camera or microphone.'
    }
    await refreshDevices().catch(() => {})
  }

  const start = async () => {
    active.value = true
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices)
    await open()
  }

  const stop = () => {
    active.value = false
    navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices)
    stopTracks()
  }

  // Reopen only when the running stream no longer matches the preferences.
  watch(
    () => [prefs.value.micEnabled, prefs.value.camEnabled, prefs.value.audioInput, prefs.value.videoInput],
    () => {
      if (!active.value) return
      const p = prefs.value
      const audio = currentDeviceId('audio')
      const video = currentDeviceId('video')
      const stale = (p.micEnabled ? audio !== p.audioInput : !!audio) || (p.camEnabled ? video !== p.videoInput : !!video)
      if (stale) open()
    }
  )

  onBeforeUnmount(stop)

  return { prefs, stream, error, microphones, cameras, speakers, start, stop }
}
