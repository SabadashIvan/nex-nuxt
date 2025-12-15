import type { ImageValue } from '~/types'

/**
 * Safely extract image URL from backend response
 */
export function getImageUrl(image?: ImageValue): string | undefined {
  if (!image) {
    return undefined
  }

  if (typeof image === 'string') {
    return image
  }

  if (typeof image === 'object' && 'url' in image) {
    const url = image.url
    if (typeof url === 'string' && url.length > 0) {
      return url
    }
  }

  return undefined
}

