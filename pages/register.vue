<script setup lang="ts">
import * as z from 'zod'

useHead({ title: 'Create account – ConferX' })
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
  <div class="min-h-[calc(100dvh-6rem)] flex flex-col items-center justify-center px-4 py-16">
    <LogoHeader class="!py-8" />
    <UCard class="w-full max-w-sm">
      <h1 class="text-xl font-semibold mb-1">Create an account</h1>
      <p class="text-sm text-gray-400 mb-6">Keep a list of the meetings you host.</p>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="submit">
        <UFormField label="Your name" name="displayName">
          <UInput v-model="state.displayName" autocomplete="name" class="w-full" />
        </UFormField>
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" autocomplete="email" class="w-full" />
        </UFormField>
        <UFormField label="Password" name="password" help="At least 8 characters">
          <UInput v-model="state.password" type="password" autocomplete="new-password" class="w-full" />
        </UFormField>
        <UButton type="submit" label="Create account" block :loading="submitting" />
      </UForm>
      <p class="text-sm text-gray-400 mt-6 text-center">
        Already have an account? <NuxtLink :to="{ path: '/login', query: route.query }" class="text-primary hover:underline">Sign in</NuxtLink>
      </p>
    </UCard>
  </div>
</template>
