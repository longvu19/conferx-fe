<script setup lang="ts">
const open = defineModel<boolean>('open')
const props = defineProps<{ roomId: string, password?: string }>()
const toast = useToast()

const link = computed(() => (import.meta.client ? `${location.origin}/room/${props.roomId}` : ''))
const inviteText = computed(() =>
  `Join my ConferX meeting\n${link.value}\nMeeting password: ${props.password ?? '(ask the host)'}`
)

const copy = async (text: string, what: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: `${what} copied`, color: 'success', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Copy failed. Select the text and copy it manually.', color: 'error' })
  }
}
</script>
<template>
  <UModal v-model:open="open" title="Invite people" class="w-[480px] max-w-full">
    <template #description>
      <span>Share the link and the meeting password. Keep your admin password private.</span>
    </template>
    <template #body>
      <dl class="space-y-4">
        <div>
          <dt class="text-sm text-gray-400 mb-1">Link</dt>
          <dd class="flex gap-2">
            <UInput :model-value="link" readonly variant="soft" class="flex-1" aria-label="Meeting link" />
            <UButton icon="i-lucide-copy" color="neutral" variant="soft" aria-label="Copy link" @click="copy(link, 'Link')" />
          </dd>
        </div>
        <div>
          <dt class="text-sm text-gray-400 mb-1">Meeting password</dt>
          <dd class="flex gap-2">
            <UInput :model-value="password ?? 'Only the admin can see this'" readonly variant="soft"
              class="flex-1 font-medium tracking-widest" aria-label="Meeting password" />
            <UButton v-if="password" icon="i-lucide-copy" color="neutral" variant="soft" aria-label="Copy password"
              @click="copy(password, 'Password')" />
          </dd>
        </div>
      </dl>
    </template>
    <template #footer>
      <UButton label="Copy invitation" icon="i-lucide-clipboard-copy" block @click="copy(inviteText, 'Invitation')" />
    </template>
  </UModal>
</template>
