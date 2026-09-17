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
  <div class="flex flex-col h-full min-h-0">
    <div ref="list" class="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3" aria-live="polite">
      <p v-if="!messages.length" class="text-sm text-gray-400 text-center mt-8">
        Messages are visible to everyone in the meeting and disappear when it ends.
      </p>
      <div v-for="m in messages" :key="m.id" class="flex flex-col" :class="m.isLocal ? 'items-end' : 'items-start'">
        <div class="text-xs text-gray-400 mb-0.5">
          {{ m.isLocal ? 'You' : m.name }} <span class="ml-1">{{ time(m.at) }}</span>
        </div>
        <div class="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm"
          :class="m.isLocal ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm'">
          {{ m.text }}
        </div>
      </div>
    </div>
    <form class="flex gap-2 p-3 border-t border-gray-700/60" @submit.prevent="send">
      <UInput v-model="draft" placeholder="Send a message" variant="soft" class="flex-1" maxlength="1000"
        aria-label="Message" />
      <UButton type="submit" icon="i-lucide-send-horizontal" aria-label="Send" :disabled="!draft.trim()" />
    </form>
  </div>
</template>
