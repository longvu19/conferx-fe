<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  name: z.string().min(3, 'Must be at least 3 characters'),
  password: z.string().min(8, 'Must be at least 8 characters'),
  microphone: z.string(),
  camera: z.string(),
  speaker: z.string()
})
const microItems = ref<{ kind: string; label: string; value: string }[]>([]);
const cameraItems = ref<{ kind: string; label: string; value: string }[]>([]);
const speakerItems = ref<{ kind: string; label: string; value: string }[]>([]);
const selectedMicrophone = ref('');
const selectedCamera = ref('');
const selectedSpeaker = ref('');

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: undefined,
  password: undefined,
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log(event.data)
}

const getDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const items = devices.map(device => ({
        kind: device.kind,
        label: device.label || 'Unknown Device',
        value: device.deviceId
      }))
    microItems.value = items.filter(device => device.kind === 'audioinput');
    cameraItems.value = items.filter(device => device.kind === 'videoinput');
    speakerItems.value = items.filter(device => device.kind === 'audiooutput');
    if (microItems.value.length > 0) {
      selectedMicrophone.value = microItems.value[0].value;
    }
    if (cameraItems.value.length > 0) {
      selectedCamera.value = cameraItems.value[0].value;
    }
    if (speakerItems.value.length > 0) {
      selectedSpeaker.value = speakerItems.value[0].value;
    }
  } catch (error) {
    console.error('Error fetching devices:', error)
  }
}

onMounted(async () => {
  await getDevices();
})
</script>
<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit">
    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Name" required class="w-full">
        <UInput v-model="state.name" name="name" color="primary" variant="soft" placeholder="Enter your name"
          class="w-full" />
      </UFormField>
      <UFormField label="Password" required class="w-full">
        <UInput v-model="state.password" name="password" type="password" color="primary" variant="soft"
          placeholder="Enter your password" class="w-full" />
      </UFormField>
    </div>
    <div class="grid grid-cols-3 gap-4 mt-3">
      <UFormField label="Microphone" class="w-full">
        <USelect v-model="selectedMicrophone" icon="heroicons:microphone-solid" size="lg" color="primary" variant="soft"
          :items="microItems" class="w-full" />
      </UFormField>
      <UFormField label="Camera" class="w-full">
        <USelect v-model="selectedCamera" icon="heroicons:camera-solid" size="lg" color="primary" variant="soft"
          :items="cameraItems" class="w-full" />
      </UFormField>
      <UFormField label="Speaker" class="w-full">
        <USelect v-model="selectedSpeaker" icon="heroicons:speaker-wave-16-solid" size="lg" color="primary" variant="soft"
          :items="speakerItems" class="w-full" />
      </UFormField>
    </div>
  </UForm>
</template>