<script setup lang="ts">
/**
 * Email verification page
 */
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()

const isVerifying = ref(false)
const isResending = ref(false)

const status = computed(() => authStore.emailVerificationStatus)
const error = computed(() => authStore.error)

// Get verification params from URL
const id = computed(() => route.query.id as string)
const hash = computed(() => route.query.hash as string)

// Auto-verify if params are present
onMounted(async () => {
  if (id.value && hash.value) {
    isVerifying.value = true
    await authStore.verifyEmail(id.value, hash.value)
    isVerifying.value = false
  }
})

async function resendEmail() {
  isResending.value = true
  await authStore.resendVerificationEmail()
  isResending.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="text-3xl font-bold text-primary-600 dark:text-primary-400">
          DontWorry
        </NuxtLink>
      </div>

      <!-- Content -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center">
        <!-- Verifying state -->
        <template v-if="isVerifying">
          <UiSpinner size="lg" class="mx-auto mb-4" />
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            Verifying your email...
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Please wait while we verify your email address.
          </p>
        </template>

        <!-- Success state -->
        <template v-else-if="status === 'verified'">
          <div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle class="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            Email Verified!
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Your email has been successfully verified.
          </p>
          <NuxtLink
            to="/"
            class="mt-6 inline-flex items-center justify-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
          >
            Continue Shopping
          </NuxtLink>
        </template>

        <!-- Error state -->
        <template v-else-if="status === 'error'">
          <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <XCircle class="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            Verification Failed
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            {{ error || 'The verification link is invalid or has expired.' }}
          </p>
          <button
            :disabled="isResending"
            class="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            @click="resendEmail"
          >
            <RefreshCw v-if="!isResending" class="h-5 w-5" />
            <UiSpinner v-else size="sm" />
            Resend Verification Email
          </button>
        </template>

        <!-- Awaiting verification (no params) -->
        <template v-else-if="!id || !hash">
          <div class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
            <Mail class="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            Verify Your Email
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            We've sent a verification link to your email address. Click the link to verify your account.
          </p>

          <div v-if="status === 'sent'" class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="text-sm text-green-700 dark:text-green-300">
              A new verification email has been sent.
            </p>
          </div>

          <button
            :disabled="isResending"
            class="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            @click="resendEmail"
          >
            <RefreshCw v-if="!isResending" class="h-5 w-5" />
            <UiSpinner v-else size="sm" />
            Resend Email
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

