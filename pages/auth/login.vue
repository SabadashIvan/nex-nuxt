<script setup lang="ts">
/**
 * Login page
 * Uses session-based authentication (Laravel Sanctum)
 */
import { Mail, Lock, Eye, EyeOff } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth.store'

const route = useRoute()
const router = useRouter()

const form = reactive({
  email: '',
  password: '',
  remember: true,
})

const showPassword = ref(false)
const isSubmitting = ref(false)

// Access store inside computed
const error = computed(() => {
  try {
    return useAuthStore().error
  } catch {
    return null
  }
})
const fieldErrors = computed(() => {
  try {
    return useAuthStore().fieldErrors
  } catch {
    return {}
  }
})

async function handleSubmit() {
  isSubmitting.value = true
  const authStore = useAuthStore()
  
  const success = await authStore.login({
    email: form.email,
    password: form.password,
    remember: form.remember,
  })

  isSubmitting.value = false

  if (success) {
    // Redirect to intended page or home
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
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
          Welcome back
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Sign in to your account to continue
        </p>
      </div>

      <!-- Form -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <!-- Error message -->
        <div 
          v-if="error" 
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
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                placeholder="you@example.com"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
                :class="{ 'ring-2 ring-red-500': fieldErrors.email }"
              >
            </div>
            <p v-if="fieldErrors.email" class="mt-1 text-sm text-red-500">
              {{ fieldErrors.email }}
            </p>
          </div>

          <!-- Password -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <NuxtLink 
                to="/auth/forgot-password" 
                class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Forgot password?
              </NuxtLink>
            </div>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full pl-10 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
                :class="{ 'ring-2 ring-red-500': fieldErrors.password }"
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
            <p v-if="fieldErrors.password" class="mt-1 text-sm text-red-500">
              {{ fieldErrors.password }}
            </p>
          </div>

          <!-- Remember me -->
          <div class="flex items-center">
            <input
              id="remember"
              v-model="form.remember"
              type="checkbox"
              class="h-4 w-4 text-primary-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
            >
            <label for="remember" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Remember me
            </label>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full flex items-center justify-center py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UiSpinner v-if="isSubmitting" size="sm" class="mr-2" />
            Sign In
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center">
          <div class="flex-1 border-t border-gray-200 dark:border-gray-700" />
          <span class="px-4 text-sm text-gray-500 dark:text-gray-400">New here?</span>
          <div class="flex-1 border-t border-gray-200 dark:border-gray-700" />
        </div>

        <!-- Register link -->
        <NuxtLink
          to="/auth/register"
          class="w-full flex items-center justify-center py-3 px-4 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Create an Account
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

