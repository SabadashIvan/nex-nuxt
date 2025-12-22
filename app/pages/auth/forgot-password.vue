<script setup lang="ts">
/**
 * Forgot password page
 */
import { Mail, ArrowLeft, CheckCircle } from 'lucide-vue-next'

const authStore = useAuthStore()

const email = ref('')
const isSubmitting = ref(false)

const error = computed(() => authStore.error)
const status = computed(() => authStore.passwordResetStatus)

async function handleSubmit() {
  isSubmitting.value = true
  await authStore.forgotPassword({ email: email.value })
  isSubmitting.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="text-3xl font-bold text-primary-600 dark:text-primary-400">
          Nexora
        </NuxtLink>
        <h1 class="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Reset your password
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <!-- Form -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <!-- Success message -->
        <div 
          v-if="status === 'sent'" 
          class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <div class="flex items-start gap-3">
            <CheckCircle class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-green-700 dark:text-green-300">Check your email</p>
              <p class="text-sm text-green-600 dark:text-green-400">
                We've sent a password reset link to {{ email }}
              </p>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div 
          v-else-if="error" 
          class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email address
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="you@example.com"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isSubmitting || status === 'sent'"
            class="w-full flex items-center justify-center py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UiSpinner v-if="isSubmitting" size="sm" class="mr-2" />
            {{ status === 'sent' ? 'Email Sent' : 'Send Reset Link' }}
          </button>
        </form>

        <!-- Back to login -->
        <NuxtLink
          to="/auth/login"
          class="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to Sign In
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

