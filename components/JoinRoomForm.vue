<script setup lang="ts">
const roomCode = ref('')
defineProps<{ checking?: boolean }>()
const emit = defineEmits<{ openModal: [{ roomCode: string }] }>()

// Accept a bare code ("abc-defg-hij") or a pasted invite link.
const normalize = (value: string) => {
  const trimmed = value.trim()
  const fromUrl = trimmed.match(/\/room\/([a-z-]+)/i)?.[1]
  return (fromUrl ?? trimmed).toLowerCase()
}

const submit = () => {
  const code = normalize(roomCode.value)
  if (code) emit('openModal', { roomCode: code })
}
</script>
<template>
  <form id="join-room-form" class="flex gap-2.5" @submit.prevent="submit">
    <div
      class="flex flex-1 min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-well px-3.5 focus-within:border-signal-500/55">
      <span class="font-mono text-xs text-signal-500" aria-hidden="true">#</span>
      <input v-model="roomCode" type="text" required name="roomCode" placeholder="room code or link" autocomplete="off"
        spellcheck="false" :disabled="checking" aria-label="Room code or invite link"
        class="min-w-0 flex-1 border-0 bg-transparent py-3.75 font-mono text-sm tracking-[.04em] text-ink outline-none placeholder:text-muted disabled:opacity-60">
    </div>
    <button type="submit" :disabled="checking"
      class="btn-ghost shrink-0 rounded-xl px-5 text-[15px] font-medium text-ink whitespace-nowrap disabled:cursor-wait">
      <UIcon v-if="checking" name="i-lucide-loader-circle" class="text-base animate-spin" />
      {{ checking ? 'Checking…' : 'Join' }}
    </button>
  </form>
</template>
