/**
 * Orders Store
 * Handles user order history and order details
 * CSR-only - requires authentication
 */

import { defineStore } from 'pinia'
import type { Order, OrdersState, PaginatedResponse, Pagination } from '~/types'
import { getErrorMessage } from '~/utils/errors'

interface OrdersStoreState extends OrdersState {
  pagination: Pagination
}

export const useOrdersStore = defineStore('orders', {
  state: (): OrdersStoreState => ({
    orders: [],
    order: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      perPage: 10,
      total: 0,
      lastPage: 1,
    },
  }),

  getters: {
    /**
     * Check if there are orders
     */
    hasOrders: (state): boolean => {
      return state.orders.length > 0
    },

    /**
     * Get orders count
     */
    ordersCount: (state): number => {
      return state.pagination.total
    },
  },

  actions: {
    /**
     * Fetch user orders
     */
    async fetchOrders(page = 1): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const response = await api.get<PaginatedResponse<Order>>('/orders', {
          page,
          per_page: this.pagination.perPage,
        })

        this.orders = response.data
        this.pagination = {
          page: response.meta.current_page,
          perPage: response.meta.per_page,
          total: response.meta.total,
          lastPage: response.meta.last_page,
        }
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch orders error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch single order by ID
     */
    async fetchOrder(id: number): Promise<Order | null> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const order = await api.get<Order>(`/orders/${id}`)
        this.order = order
        return order
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch order error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Go to page
     */
    async goToPage(page: number): Promise<void> {
      await this.fetchOrders(page)
    },

    /**
     * Clear current order
     */
    clearOrder(): void {
      this.order = null
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.orders = []
      this.order = null
      this.loading = false
      this.error = null
      this.pagination = {
        page: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
      }
    },
  },
})

