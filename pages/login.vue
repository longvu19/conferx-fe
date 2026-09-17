<script setup lang="ts">
import * as z from 'zod'

useHead({ title: 'Sign in – ConferX' })
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
  <div class="min-h-[calc(100dvh-6rem)] flex flex-col items-center justify-center px-4 py-16">
    <LogoHeader class="!py-8" />
    <UCard class="w-full max-w-sm">
      <h1 class="text-xl font-semibold mb-1">Sign in</h1>
      <p class="text-sm text-gray-400 mb-6">See your meetings and rejoin them without the admin password.</p>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="submit">
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" autocomplete="email" class="w-full" />
        </UFormField>
        <UFormField label="Password" name="password">
          <UInput v-model="state.password" type="password" autocomplete="current-password" class="w-full" />
        </UFormField>
        <UButton type="submit" label="Sign in" block :loading="submitting" />
      </UForm>
      <p class="text-sm text-gray-400 mt-6 text-center">
        New to ConferX? <NuxtLink :to="{ path: '/register', query: route.query }" class="text-primary hover:underline">Create an account</NuxtLink>
      </p>
    </UCard>
    <p class="text-sm text-gray-500 mt-6">You can still join meetings as a guest without an account.</p>
  </div>
</template>
