<script setup lang="ts">
/**
 * Registration page
 */
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const showPassword = ref(false)
const isSubmitting = ref(false)

const error = computed(() => authStore.error)
const fieldErrors = computed(() => authStore.fieldErrors)

async function handleSubmit() {
  // Client-side validation
  if (form.password !== form.password_confirmation) {
    authStore.error = 'Passwords do not match'
    return
  }

  isSubmitting.value = true
  
  const success = await authStore.register(form)

  isSubmitting.value = false

  if (success) {
    router.push('/')
  }
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
          Create your account
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Join us and start shopping
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

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full name
            </label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.name"
                type="text"
                required
                autocomplete="name"
                placeholder="John Doe"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
                :class="{ 'ring-2 ring-red-500': fieldErrors.name }"
              >
            </div>
            <p v-if="fieldErrors.name" class="mt-1 text-sm text-red-500">
              {{ fieldErrors.name }}
            </p>
          </div>

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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
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
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              At least 8 characters with letters and numbers
            </p>
          </div>

          <!-- Confirm password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm password
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
            Create Account
          </button>
        </form>

        <!-- Terms -->
        <p class="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          By creating an account, you agree to our
          <NuxtLink to="/terms" class="text-primary-600 dark:text-primary-400 hover:underline">
            Terms of Service
          </NuxtLink>
          and
          <NuxtLink to="/privacy" class="text-primary-600 dark:text-primary-400 hover:underline">
            Privacy Policy
          </NuxtLink>
        </p>

        <!-- Divider -->
        <div class="my-6 flex items-center">
          <div class="flex-1 border-t border-gray-200 dark:border-gray-700" />
          <span class="px-4 text-sm text-gray-500 dark:text-gray-400">Already have an account?</span>
          <div class="flex-1 border-t border-gray-200 dark:border-gray-700" />
        </div>

        <!-- Login link -->
        <NuxtLink
          to="/auth/login"
          class="w-full flex items-center justify-center py-3 px-4 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Sign In
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

