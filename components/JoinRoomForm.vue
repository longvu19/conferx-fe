<script setup lang="ts">
const roomCode = ref('');
const emit = defineEmits(['openModal']);
</script>
<template>
  <form id="join-room-form" class="flex gap-4" @submit.prevent="() => emit('openModal', roomCode)">
    <input v-model="roomCode" type="text" name="roomCode" placeholder="Enter room code"
      class="w-full bg-dark-100 border border-gray-600 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
    <button
      class="flex items-center w-auto justify-center gap-3 bg-gray-700 whitespace-nowrap hover:bg-gray-600 text-white font-normal hover:cursor-pointer py-4 px-6 rounded-xl transition-colors" type="submit">
      <svg width="16" height="16" class="svg-inline--fa fa-right-to-bracket" aria-hidden="true" data-prefix="fas"
        data-icon="right-to-bracket" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path fill="currentColor"
          d="m217.9 105.9 122.8 122.8c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L217.9 406.1c-6.4 6.4-15 9.9-24 9.9-18.7 0-33.9-15.2-33.9-33.9V320H32c-17.7 0-32-14.3-32-32v-64c0-17.7 14.3-32 32-32h128v-62.1c0-18.7 15.2-33.9 33.9-33.9 9 0 17.6 3.6 24 9.9M352 416h64c17.7 0 32-14.3 32-32V128c0-17.7-14.3-32-32-32h-64c-17.7 0-32-14.3-32-32s14.3-32 32-32h64c53 0 96 43 96 96v256c0 53-43 96-96 96h-64c-17.7 0-32-14.3-32-32s14.3-32 32-32" />
      </svg>
      <span>Join Room</span>
    </button>
  </form>
  {{ roomCode }}
</template>