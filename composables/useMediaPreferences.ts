export interface MediaPreferences {
  micEnabled: boolean
  camEnabled: boolean
  audioInput: string
  videoInput: string
  audioOutput: string
}

const STORAGE_KEY = 'conferx:media'
const defaults: MediaPreferences = { micEnabled: true, camEnabled: true, audioInput: '', videoInput: '', audioOutput: '' }

/** Device choices shared between the pre-join dialog and the meeting, persisted per browser. */
export const useMediaPreferences = () => {
  const prefs = useState<MediaPreferences>('media:prefs', () => ({ ...defaults }))
  const loaded = useState('media:prefs-loaded', () => false)

  if (import.meta.client && !loaded.value) {
    loaded.value = true
    try {
      Object.assign(prefs.value, JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'))
    } catch { /* ignore corrupted value */ }
    watch(prefs, value => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true })
  }
  return prefs
}
