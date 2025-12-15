<script setup lang="ts">
/**
 * Reset password page
 */
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  password: '',
  password_confirmation: '',
})

const showPassword = ref(false)
const isSubmitting = ref(false)

// Get token and email from URL
const token = computed(() => route.query.token as string)
const email = computed(() => route.query.email as string)

const error = computed(() => authStore.error)
const status = computed(() => authStore.passwordResetStatus)

// Redirect if no token
if (!token.value || !email.value) {
  router.push('/auth/forgot-password')
}

async function handleSubmit() {
  if (form.password !== form.password_confirmation) {
    authStore.error = 'Passwords do not match'
    return
  }

  isSubmitting.value = true
  
  const success = await authStore.resetPassword({
    token: token.value,
    email: email.value,
    password: form.password,
    password_confirmation: form.password_confirmation,
  })

  isSubmitting.value = false

  if (success) {
    // Redirect to login after short delay
    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)
  }
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
        <h1 class="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Set new password
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Enter your new password below
        </p>
      </div>

      <!-- Form -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <!-- Success message -->
        <div 
          v-if="status === 'reset'" 
          class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <div class="flex items-start gap-3">
            <CheckCircle class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-green-700 dark:text-green-300">Password reset successful!</p>
              <p class="text-sm text-green-600 dark:text-green-400">
                Redirecting to sign in...
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

        <form v-if="status !== 'reset'" @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New password
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full pl-10 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              At least 8 characters with letters and numbers
            </p>
          </div>

          <!-- Confirm password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm new password
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.password_confirmation"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full flex items-center justify-center py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UiSpinner v-if="isSubmitting" size="sm" class="mr-2" />
            Reset Password
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

