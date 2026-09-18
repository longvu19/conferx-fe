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
  <!-- Cùng lý do như RoomSettingsPopup: khung ngoài UModal tự vẽ bo góc 8px không clip,
       lộ vệt lưỡi liềm quanh 4 góc của .card bo 16px bên trong. Tắt hẳn trang trí ngoài. -->
  <UModal v-model:open="open" class="w-120 max-w-full bg-transparent rounded-none shadow-none ring-0">
    <template #content>
      <div class="card overflow-hidden">
        <div class="border-b border-white/7 px-6 py-5.5">
          <div class="eyebrow">INVITE PEOPLE</div>
          <p class="mt-2.5 text-sm leading-[1.55] text-muted">
            Share the link and the meeting password. Keep your admin password private.
          </p>
        </div>

        <dl class="flex flex-col gap-4.5 p-6">
          <div>
            <dt class="label-mono mb-1.75">LINK</dt>
            <dd class="flex gap-2">
              <div
                class="min-w-0 flex-1 truncate rounded-[10px] border border-white/10 bg-well px-3.25 py-3 font-mono text-[13px] text-dim">
                {{ link }}
              </div>
              <button type="button" aria-label="Copy link"
                class="btn-ghost w-11 flex-none rounded-[10px] text-ink" @click="copy(link, 'Link')">
                <UIcon name="i-lucide-copy" class="text-base" />
              </button>
            </dd>
          </div>

          <div>
            <dt class="label-mono mb-1.75">MEETING PASSWORD</dt>
            <dd class="flex gap-2">
              <div class="min-w-0 flex-1 truncate rounded-[10px] border bg-well px-3.25 py-3 font-mono"
                :class="password
                  ? 'border-signal-500/35 text-base tracking-[.3em] text-signal-300'
                  : 'border-white/10 text-[13px] text-muted'">
                {{ password ?? 'Only the admin can see this' }}
              </div>
              <button v-if="password" type="button" aria-label="Copy password"
                class="btn-ghost w-11 flex-none rounded-[10px] text-ink" @click="copy(password, 'Password')">
                <UIcon name="i-lucide-copy" class="text-base" />
              </button>
            </dd>
          </div>
        </dl>

        <div class="border-t border-white/7 bg-sunk px-6 py-4.5">
          <button type="button" class="btn-signal w-full rounded-[10px] py-3.25 text-[15px]"
            @click="copy(inviteText, 'Invitation')">
            <UIcon name="i-lucide-clipboard-copy" class="text-base" />Copy invitation
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>
