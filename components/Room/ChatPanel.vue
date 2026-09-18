<script setup lang="ts">
import type { ChatMessage } from '~/types/room'

const props = defineProps<{ messages: ChatMessage[] }>()
const emit = defineEmits<{ send: [string] }>()
const draft = ref('')
const list = useTemplateRef<HTMLDivElement>('list')

const time = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const send = () => {
  if (!draft.value.trim()) return
  emit('send', draft.value)
  draft.value = ''
}

watch(() => props.messages.length, async () => {
  await nextTick()
  list.value?.scrollTo({ top: list.value.scrollHeight, behavior: 'smooth' })
})
</script>
<template>
  <div class="flex h-full min-h-0 flex-col">
    <div ref="list" class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4" aria-live="polite">
      <p v-if="!messages.length"
        class="rounded-lg border border-dashed border-white/8 px-3 py-2 text-center font-mono text-[11px] leading-[1.6] tracking-[.04em] text-faint">
        MESSAGES ARE VISIBLE TO EVERYONE AND DISAPPEAR WHEN THE MEETING ENDS
      </p>

      <div v-for="m in messages" :key="m.id" class="flex flex-col gap-1.25"
        :class="m.isLocal ? 'items-end' : 'items-start'">
        <div class="flex gap-2 font-mono text-[10px] tracking-[.08em] text-faint">
          <span>{{ m.isLocal ? 'YOU' : m.name.toUpperCase() }}</span><span>{{ time(m.at) }}</span>
        </div>
        <div class="max-w-[86%] whitespace-pre-wrap break-words border px-3.25 py-2.5 text-sm leading-[1.5]"
          :class="m.isLocal
            ? 'rounded-[12px_12px_4px_12px] border-signal-500/45 bg-signal-500/18 text-[#eaf2fc]'
            : 'rounded-[12px_12px_12px_4px] border-white/7 bg-[#0f141d] text-ink'">
          {{ m.text }}
        </div>
      </div>
    </div>

    <form class="flex flex-none gap-2 border-t border-white/6 p-3" @submit.prevent="send">
      <input v-model="draft" maxlength="1000" placeholder="Send a message" aria-label="Message"
        class="min-w-0 flex-1 rounded-[10px] border border-white/9 bg-raised px-3.25 py-2.75 text-sm text-ink outline-none placeholder:text-muted focus:border-signal-500/55">
      <button type="submit" aria-label="Send" :disabled="!draft.trim()"
        class="btn-signal w-10.5 flex-none rounded-[10px]">
        <UIcon name="i-lucide-send-horizontal" class="text-[17px]" />
      </button>
    </form>
  </div>
</template>
