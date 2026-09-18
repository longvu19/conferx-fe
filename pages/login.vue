<script setup lang="ts">
import * as z from 'zod'

useHead({ title: 'Sign in – ConferX' })
definePageMeta({ layout: false })

const auth = useAuth()
const route = useRoute()
const toast = useToast()

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password')
})
const state = reactive({ email: '', password: '' })
const submitting = ref(false)

// Only allow in-app redirects.
const redirectTo = computed(() => {
  const target = String(route.query.redirect ?? '/')
  return target.startsWith('/') && !target.startsWith('//') ? target : '/'
})

const points = [
  'Your rooms listed in one place',
  'Rejoin without the admin password',
  'Guests still join without an account'
]

const submit = async () => {
  submitting.value = true
  try {
    await auth.login(state.email, state.password)
    await navigateTo(redirectTo.value)
  } catch (e) {
    toast.add({ title: 'Could not sign in', description: apiErrorMessage(e), color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>
<template>
  <div v-spotlight class="relative min-h-dvh bg-canvas grid lg:grid-cols-[minmax(0,1fr)_560px]">
    <div class="grid-spot z-0" />

    <!-- Cột thương hiệu: chỉ hiện từ lg trở lên, dưới đó nhường chỗ cho form. -->
    <section
      class="relative z-10 hidden lg:flex flex-col justify-between overflow-hidden border-r border-white/6 px-14 pt-14 pb-12">
      <div
        class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.022)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(180deg,#000_0,transparent_78%)]" />
      <div
        class="absolute -bottom-55 -left-20 h-130 w-190 bg-[radial-gradient(ellipse_at_center,rgba(70,128,202,.18),rgba(70,128,202,0)_65%)]" />

      <NuxtLink to="/" class="relative self-start"><img src="/conferx-logo.svg" alt="ConferX" class="h-6.5 w-auto block"></NuxtLink>

      <div class="relative">
        <h2 class="text-[46px] leading-[1.06] font-semibold tracking-[-.035em] text-display text-balance">
          An account only<br>keeps the keys.
        </h2>
        <p class="mt-4.5 max-w-105 text-[17px] leading-[1.6] text-muted">
          Meetings work without one. Sign in when you want your rooms remembered.
        </p>
        <div class="mt-8 flex flex-col gap-3">
          <div v-for="p in points" :key="p" class="flex items-center gap-2.5 text-[15px] text-dim">
            <span class="flex-none flex items-center justify-center w-4 h-4 rounded-full border border-signal-500/50">
              <span class="w-[5px] h-[5px] rounded-full bg-signal-500" />
            </span>{{ p }}
          </div>
        </div>
      </div>

      <div class="relative font-mono text-[11px] tracking-[.12em] text-muted">CONFERX · FREE MEETING PLATFORM</div>
    </section>

    <!-- Cột form -->
    <section class="relative z-10 flex flex-col justify-center bg-chrome px-6 py-14 sm:px-12">
      <div class="w-full max-w-100 mx-auto">
        <NuxtLink to="/" class="lg:hidden inline-block mb-10"><img src="/conferx-logo.svg" alt="ConferX" class="h-6 w-auto block"></NuxtLink>

        <div class="eyebrow">SIGN IN</div>
        <h1 class="mt-3 mb-2 text-[28px] font-semibold tracking-[-.025em]">Welcome back</h1>
        <p class="mb-7.5 text-[15px] leading-[1.6] text-muted">
          See your meetings and rejoin them without the admin password.
        </p>

        <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="submit">
          <UFormField name="email" :ui="{ error: 'mt-2 text-[13px] text-danger-soft' }">
            <label for="email" class="label-mono mb-1.75">EMAIL</label>
            <input id="email" v-model="state.email" type="email" autocomplete="email" placeholder="you@company.com"
              class="field">
          </UFormField>

          <UFormField name="password" :ui="{ error: 'mt-2 text-[13px] text-danger-soft' }">
            <div class="flex items-center justify-between mb-1.75">
              <label for="password" class="label-mono">PASSWORD</label>
              <NuxtLink to="/login" class="text-[13px] text-signal-300 hover:text-signal-200">Forgot?</NuxtLink>
            </div>
            <input id="password" v-model="state.password" type="password" autocomplete="current-password"
              class="field">
          </UFormField>

          <button type="submit" :disabled="submitting"
            class="btn-signal mt-1.5 w-full rounded-xl py-3.5 text-base">
            <UIcon v-if="submitting" name="i-lucide-loader-circle" class="text-base animate-spin" />
            {{ submitting ? 'Signing in…' : 'Sign in' }}
          </button>
        </UForm>

        <div class="my-7 flex items-center gap-3.5">
          <div class="flex-1 h-px bg-white/8" />
          <span class="font-mono text-[10px] tracking-[.12em] text-muted">NO ACCOUNT NEEDED TO JOIN</span>
          <div class="flex-1 h-px bg-white/8" />
        </div>

        <p class="text-[15px] text-muted text-center">
          New to ConferX?
          <NuxtLink :to="{ path: '/register', query: route.query }" class="font-medium text-signal-300 hover:text-signal-200">Create an account</NuxtLink>
        </p>
      </div>
    </section>
  </div>
</template>
