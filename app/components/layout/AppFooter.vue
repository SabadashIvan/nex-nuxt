<script setup lang="ts">
/**
 * Main application footer
 */
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-gray-900 text-gray-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Brand -->
        <div>
          <h3 class="text-2xl font-bold text-white mb-4">Nexora</h3>
          <p class="text-sm text-gray-400 mb-6">
            Your trusted e-commerce destination. Quality products, fast delivery, excellent service.
          </p>
          <div class="flex space-x-4">
            <a href="#" class="text-gray-400 hover:text-white transition-colors">
              <Facebook class="h-5 w-5" />
            </a>
            <a href="#" class="text-gray-400 hover:text-white transition-colors">
              <Twitter class="h-5 w-5" />
            </a>
            <a href="#" class="text-gray-400 hover:text-white transition-colors">
              <Instagram class="h-5 w-5" />
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Shop
          </h4>
          <ul class="space-y-3">
            <li>
              <NuxtLink to="/catalog" class="text-sm hover:text-white transition-colors">
                All Products
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/catalog?sort=newest" class="text-sm hover:text-white transition-colors">
                New Arrivals
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/catalog?sort=price_desc" class="text-sm hover:text-white transition-colors">
                Best Sellers
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/catalog?sale=true" class="text-sm hover:text-white transition-colors">
                Sale
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Customer Service -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Customer Service
          </h4>
          <ul class="space-y-3">
            <li>
              <NuxtLink to="/profile/orders" class="text-sm hover:text-white transition-colors">
                Track Order
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/shipping" class="text-sm hover:text-white transition-colors">
                Shipping Info
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/returns" class="text-sm hover:text-white transition-colors">
                Returns & Exchanges
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/faq" class="text-sm hover:text-white transition-colors">
                FAQ
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Contact Us
          </h4>
          <ul class="space-y-3">
            <li class="flex items-center gap-3">
              <Mail class="h-5 w-5 text-gray-400" />
              <a href="mailto:support@nexora.shop" class="text-sm hover:text-white transition-colors">
                support@nexora.shop
              </a>
            </li>
            <li class="flex items-center gap-3">
              <Phone class="h-5 w-5 text-gray-400" />
              <a href="tel:+1234567890" class="text-sm hover:text-white transition-colors">
                +1 (234) 567-890
              </a>
            </li>
            <li class="flex items-start gap-3">
              <MapPin class="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span class="text-sm">
                123 Commerce Street<br>
                New York, NY 10001
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="mt-12 pt-8 border-t border-gray-800">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-400">
            © {{ currentYear }} Nexora. All rights reserved.
          </p>
          <div class="flex items-center gap-6">
            <NuxtLink to="/privacy" class="text-sm text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </NuxtLink>
            <NuxtLink to="/terms" class="text-sm text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

