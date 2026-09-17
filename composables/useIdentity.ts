// Anonymous identity kept in the browser until user accounts exist.
const NAME_KEY = 'conferx:name'

export const useIdentity = () => {
  const userId = useState<string>('identity:user-id', () => '')
  const displayName = useState<string>('identity:name', () => '')

  if (import.meta.client) {
    if (!userId.value) userId.value = localStorage.getItem('autoId') ?? ''
    if (!displayName.value) displayName.value = localStorage.getItem(NAME_KEY) ?? ''
  }

  const rememberName = (name: string) => {
    displayName.value = name
    if (import.meta.client) localStorage.setItem(NAME_KEY, name)
  }

  return { userId, displayName, rememberName }
}
