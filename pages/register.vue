<script setup lang="ts">
import * as z from 'zod'

useHead({ title: 'Create account – ConferX' })
definePageMeta({ layout: false })

const auth = useAuth()
const route = useRoute()
const toast = useToast()

const schema = z.object({
  displayName: z.string().trim().min(1, 'Enter your name').max(64, 'Use at most 64 characters'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(128)
})
const state = reactive({ displayName: '', email: '', password: '' })
const submitting = ref(false)

const redirectTo = computed(() => {
  const target = String(route.query.redirect ?? '/')
  return target.startsWith('/') && !target.startsWith('//') ? target : '/'
})

// Bốn vạch dưới ô mật khẩu: mỗi tiêu chí đạt được thắp một vạch.
const strength = computed(() => {
  const v = state.password
  if (!v) return 0
  return [v.length >= 8, /[a-z]/.test(v) && /[A-Z]/.test(v), /\d/.test(v), v.length >= 12 || /[^\w\s]/.test(v)]
    .filter(Boolean).length
})

const submit = async () => {
  submitting.value = true
  try {
    await auth.register({ email: state.email, password: state.password, displayName: state.displayName })
    toast.add({ title: `Welcome, ${auth.user.value?.display_name}`, color: 'success', icon: 'i-lucide-party-popper' })
    await navigateTo(redirectTo.value)
  } catch (e) {
    toast.add({ title: 'Could not create the account', description: apiErrorMessage(e), color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>
<template>
  <div v-spotlight class="relative min-h-dvh bg-canvas flex flex-col items-center justify-center px-4 py-16">
    <div class="grid-veil" />
    <div class="grid-spot" />
    <div class="glow-spot" />

    <NuxtLink to="/" class="relative z-10 mb-10"><img src="/conferx-logo.svg" alt="ConferX" class="h-6.5 w-auto block"></NuxtLink>

    <div class="card relative z-10 w-full max-w-130 p-8">
      <div class="eyebrow">CREATE ACCOUNT</div>
      <h1 class="mt-3 mb-2 text-[26px] font-semibold tracking-[-.025em]">Keep your rooms</h1>
      <p class="mb-6.5 text-[15px] leading-[1.6] text-muted">Three fields. No card, no plan, no verification wait.</p>

      <UForm :schema="schema" :state="state" class="flex flex-col gap-3.75" @submit="submit">
        <UFormField name="displayName" :ui="{ error: 'mt-2 text-[13px] text-danger-soft' }">
          <label for="displayName" class="label-mono mb-1.75">DISPLAY NAME</label>
          <input id="displayName" v-model="state.displayName" autocomplete="name" placeholder="How others will see you"
            class="field">
        </UFormField>

        <UFormField name="email" :ui="{ error: 'mt-2 text-[13px] text-danger-soft' }">
          <label for="email" class="label-mono mb-1.75">EMAIL</label>
          <input id="email" v-model="state.email" type="email" autocomplete="email" placeholder="you@company.com"
            class="field">
        </UFormField>

        <UFormField name="password" :ui="{ error: 'mt-2 text-[13px] text-danger-soft' }">
          <label for="password" class="label-mono mb-1.75">PASSWORD</label>
          <input id="password" v-model="state.password" type="password" autocomplete="new-password"
            placeholder="At least 8 characters" class="field">
          <div class="mt-2.25 flex gap-1.25" aria-hidden="true">
            <span v-for="i in 4" :key="i" class="flex-1 h-[3px] rounded-sm transition-colors"
              :class="i <= strength ? 'bg-online' : 'bg-white/10'" />
          </div>
        </UFormField>

        <button type="submit" :disabled="submitting" class="btn-signal mt-1.5 w-full rounded-xl py-3.5 text-base">
          <UIcon v-if="submitting" name="i-lucide-loader-circle" class="text-base animate-spin" />
          {{ submitting ? 'Creating…' : 'Create account' }}
        </button>
      </UForm>

      <p class="mt-6 text-sm text-muted text-center">
        Already have one?
        <NuxtLink :to="{ path: '/login', query: route.query }" class="font-medium text-signal-300 hover:text-signal-200">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>
