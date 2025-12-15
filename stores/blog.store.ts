/**
 * Blog Store
 * Handles blog categories, posts listing, and single post
 * SSR-safe for SEO
 */

import { defineStore } from 'pinia'
import type { 
  BlogPost, 
  BlogCategory, 
  BlogState, 
  BlogPostsParams,
  BlogPostsResponse,
  BlogPostResponse,
  Pagination,
  ApiResponse,
} from '~/types'
import { getErrorMessage } from '~/utils/errors'

interface BlogStoreState extends BlogState {
  // Additional state if needed
}

export const useBlogStore = defineStore('blog', {
  state: (): BlogStoreState => ({
    categories: [],
    posts: [],
    currentPost: null,
    currentCategory: null,
    pagination: {
      page: 1,
      perPage: 10,
      total: 0,
      lastPage: 1,
    },
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Check if there are posts
     */
    hasPosts: (state): boolean => {
      return state.posts.length > 0
    },

    /**
     * Check if there are categories
     */
    hasCategories: (state): boolean => {
      return state.categories.length > 0
    },

    /**
     * Get posts count
     */
    postsCount: (state): number => {
      return state.pagination.total
    },
  },

  actions: {
    /**
     * Fetch blog categories
     */
    async fetchCategories(): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const categories = await api.get<BlogCategory[]>('/blog/categories')
        this.categories = categories
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch blog categories error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch single category by slug
     * @param skipLoading - If true, don't manage loading state (useful when called from other methods)
     */
    async fetchCategory(slug: string, skipLoading = false): Promise<BlogCategory | null> {
      const api = useApi()
      if (!skipLoading) {
        this.loading = true
        this.error = null
      }

      try {
        console.log('Fetching category by slug:', slug)
        const response = await api.get<BlogCategory | { data: BlogCategory }>(`/blog/categories/${slug}`)
        
        // Handle both direct response and wrapped response
        const category = 'data' in response && response.data ? response.data : response as BlogCategory
        
        console.log('Category API response:', response)
        console.log('Parsed category:', category)
        
        this.currentCategory = category
        return category
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch blog category error:', error)
        return null
      } finally {
        if (!skipLoading) {
          this.loading = false
        }
      }
    },

    /**
     * Fetch blog posts
     */
    async fetchPosts(params?: BlogPostsParams): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        // Clear posts before fetching to avoid showing stale data
        this.posts = []

        // Build query params, only including defined values
        const queryParams: Record<string, string | number> = {
          page: params?.page || this.pagination.page,
          per_page: params?.per_page || this.pagination.perPage,
        }

        // Only add category_id if it's defined
        if (params?.category_id !== undefined && params.category_id !== null) {
          queryParams.category_id = params.category_id
        }

        // Only add search if it's defined and not empty
        if (params?.search) {
          queryParams.search = params.search
        }

        // Only add sort if it's defined
        if (params?.sort) {
          queryParams.sort = params.sort
        }

        console.log('Fetching blog posts with query params:', queryParams)

        const response = await api.get<BlogPostsResponse>(
          '/blog/posts',
          queryParams
        )

        this.posts = response.data
        this.pagination = {
          page: response.meta.pagination.current_page,
          perPage: response.meta.pagination.per_page,
          total: response.meta.pagination.total,
          lastPage: response.meta.pagination.last_page,
        }
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch blog posts error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch single blog post by slug
     */
    async fetchPost(slug: string): Promise<BlogPost | null> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const response = await api.get<BlogPostResponse | ApiResponse<BlogPost> | BlogPost>(`/blog/posts/${slug}`)
        
        // Handle wrapped response - check for BlogPostResponse first (data wrapper)
        let post: BlogPost
        if ('data' in response && response.data) {
          // Handle BlogPostResponse or ApiResponse wrapper
          post = response.data as BlogPost
        } else {
          // Direct response
          post = response as BlogPost
        }
        
        console.log('Fetched blog post:', { 
          id: post.id, 
          title: post.title, 
          hasContent: !!post.content,
          contentLength: post.content?.length || 0 
        })
        
        // Normalize featured_image: extract URL if it's an object
        if (post.featured_image && typeof post.featured_image === 'object' && 'url' in post.featured_image) {
          const imageUrl = post.featured_image.url
          // Keep the object for type safety, but also set image for backward compatibility
          if (!post.image) {
            post.image = imageUrl
          }
        } else if (post.featured_image && typeof post.featured_image === 'string') {
          // If it's a string, use it directly
          if (!post.image) {
            post.image = post.featured_image
          }
        }
        
        // Ensure backward compatibility: map category.title to category.name if name doesn't exist
        if (post.category && post.category.title && !post.category.name) {
          post.category.name = post.category.title
        }
        
        this.currentPost = post
        return post
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch blog post error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch posts by category
     */
    async fetchPostsByCategory(categorySlug: string, page = 1): Promise<void> {
      this.loading = true
      this.error = null

      try {
        // First fetch the category to get its ID (skip loading state management)
        const category = await this.fetchCategory(categorySlug, true)
        
        if (!category) {
          this.error = 'Category not found'
          this.posts = []
          this.loading = false
          console.error('Category not found for slug:', categorySlug)
          return
        }

        if (!category.id) {
          this.error = 'Category ID is missing'
          this.posts = []
          this.loading = false
          console.error('Category ID is missing for category:', category)
          return
        }

        console.log('Fetching posts for category:', { slug: categorySlug, id: category.id, page })

        // Now fetch posts with the category_id
        // fetchPosts will handle loading state and clearing posts
        await this.fetchPosts({ category_id: category.id, page })
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch posts by category error:', error)
        this.posts = []
        this.loading = false
      }
    },

    /**
     * Go to page
     */
    async goToPage(page: number): Promise<void> {
      this.pagination.page = page
      await this.fetchPosts({ page })
    },

    /**
     * Reset pagination
     */
    resetPagination(): void {
      this.pagination = {
        page: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
      }
    },

    /**
     * Clear current post
     */
    clearPost(): void {
      this.currentPost = null
    },

    /**
     * Clear current category
     */
    clearCategory(): void {
      this.currentCategory = null
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.categories = []
      this.posts = []
      this.currentPost = null
      this.currentCategory = null
      this.pagination = {
        page: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
      }
      this.loading = false
      this.error = null
    },
  },
})

