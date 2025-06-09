<script setup lang="ts">
import { useWatchMediaDevices } from '@/composables/useMedia';
const open = defineModel<boolean>('open');
const userMicEnabled = ref(true);
const userCameraEnabled = ref(true);
const webcamVideo = useTemplateRef<HTMLVideoElement>('webcamVideo');
const streamRef = ref<MediaStream | null>(null);
const cameraLoaded = ref(false);
const toggleCamera = () => {
  userCameraEnabled.value = !userCameraEnabled.value;
  cameraLoaded.value = !cameraLoaded.value;
}
const toggleMic = () => {
  userMicEnabled.value = !userMicEnabled.value;
}
watch(streamRef, () => {
  if (streamRef.value) {
    if (webcamVideo.value) {
      webcamVideo.value.srcObject = streamRef.value;
    }
    webcamVideo.value?.play().catch((error) => {
      console.error('Error playing video:', error);
    });
  }
})
watch([userCameraEnabled], async () => {
  const videoTrack = streamRef.value?.getVideoTracks();
  if (!userCameraEnabled.value && videoTrack && videoTrack.length > 0) {
    // If camera is disabled, stop the video track
    videoTrack[0].stop();
  } else {
    // If camera is enabled, ensure the video track is active
    await initWebcam();
  }
});
watch([userMicEnabled], async () => {
  const audioTrack = streamRef.value?.getAudioTracks();
  if (!userMicEnabled.value && audioTrack && audioTrack.length > 0) {
    // If mic is disabled, stop the audio track
    audioTrack[0].stop();
  } else {
    await initWebcam();
  }
});
const initWebcam = async () => {
  // Initialize webcam and controls
  if (!userCameraEnabled.value && !userMicEnabled.value) {
    return
  }
  const stream = await useWatchMediaDevices();

  if (stream) {
    cameraLoaded.value = userCameraEnabled.value;
    streamRef.value = stream;
  } else {
    console.error('Error accessing webcam');
    const toast = useToast();
    toast.add({
      title: 'Uh oh! Something went wrong.',
      description: 'We were unable to access your devices. Please check your permissions and try again.',
      color: 'error'
    });
  }
}
const turnoffWebcam = () => {
  // Turn off webcam and stop the stream
  if (streamRef.value) {
    streamRef.value.getTracks().forEach((track) => track.stop());
    streamRef.value = null;
    cameraLoaded.value = false;
  }
  if (webcamVideo.value) {
    webcamVideo.value.srcObject = null;
  }
}
</script>
<template>
  <UModal v-model:open="open" title="Create Room" description="" :ui="{ footer: 'justify-between' }"
    class="w-[600px] max-w-full" @after:enter="initWebcam" @after:leave="turnoffWebcam">
    <template #description />
    <template #body>
      <div id="webcam-section" class="mb-6">
        <div class="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
          <!-- Webcam Preview -->
          <div id="webcam-preview"
            class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 relative">
            <div v-if="!cameraLoaded" class="text-center relative z-10">
              <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon class="text-3xl text-white" name="fluent:video-person-sparkle-48-filled" />
              </div>
              <p class="text-gray-400 text-sm">Webcam preview</p>
            </div>
            <video id="webcam-video" ref="webcamVideo" class="w-full h-full object-cover absolute inset-0"
              :class="[cameraLoaded ? 'opacity-100' : 'opacity-0']" />
          </div>

          <!-- Webcam Controls Overlay -->
          <div id="webcam-controls" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
            <button id="toggle-mic"
              class="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-700 hover:cursor-pointer transition-all border border-gray-600"
              :class="[userMicEnabled ? 'bg-gray-900' : 'bg-red-500']" @click="toggleMic">
              <Icon v-if="userMicEnabled" class="text-white" name="fluent:mic-on-48-filled" />
              <Icon v-else class="text-white" name="fluent:mic-off-48-filled" />
            </button>
            <button id="toggle-camera"
              class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-700 hover:cursor-pointer transition-all border border-gray-600"
              :class="[cameraLoaded ? 'bg-gray-900' : 'bg-red-500']" @click="toggleCamera">
              <Icon v-if="cameraLoaded" class="text-white" name="fluent:video-28-filled" />
              <Icon v-else class="text-white" name="fluent:video-off-28-filled" />
            </button>
          </div>
        </div>
      </div>
      <FormRoomSettings />
    </template>
    <template #footer>
      <UButton label="Cancel" size="lg" color="neutral" variant="outline" @click="open = false" />
      <UButton label="Submit" size="lg" color="primary" />
    </template>
  </UModal>
</template>