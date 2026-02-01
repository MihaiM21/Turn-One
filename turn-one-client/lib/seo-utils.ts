/**
 * SEO Utilities and Helper Functions
 */

/**
 * Generate reading time estimate from content
 */
export function calculateReadingTime(content: string, wordsPerMinute = 200): number {
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * Create SEO-friendly URL slug from title
 */
export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
}

/**
 * Truncate text for meta descriptions (optimal length: 150-160 characters)
 */
export function truncateDescription(text: string, maxLength = 155): string {
  if (text.length <= maxLength) return text
  
  // Try to cut at last complete word before maxLength
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}

/**
 * Extract keywords from content (simple implementation)
 */
export function extractKeywords(content: string, maxKeywords = 10): string[] {
  // Remove common words
  const commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
    'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
    'do', 'at', 'this', 'but', 'his', 'by', 'from', 'is', 'are',
  ])

  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))

  // Count word frequency
  const wordCount = new Map<string, number>()
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1)
  })

  // Sort by frequency and return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

/**
 * Validate and clean meta title (optimal length: 50-60 characters)
 */
export function validateTitle(title: string): {
  isValid: boolean
  length: number
  recommendation: string
} {
  const length = title.length

  if (length < 30) {
    return {
      isValid: false,
      length,
      recommendation: 'Title is too short. Aim for 50-60 characters.',
    }
  }

  if (length > 60) {
    return {
      isValid: false,
      length,
      recommendation: 'Title may be truncated in search results. Aim for 50-60 characters.',
    }
  }

  return {
    isValid: true,
    length,
    recommendation: 'Title length is optimal.',
  }
}

/**
 * Validate meta description
 */
export function validateDescription(description: string): {
  isValid: boolean
  length: number
  recommendation: string
} {
  const length = description.length

  if (length < 120) {
    return {
      isValid: false,
      length,
      recommendation: 'Description is too short. Aim for 150-160 characters.',
    }
  }

  if (length > 160) {
    return {
      isValid: false,
      length,
      recommendation: 'Description may be truncated. Aim for 150-160 characters.',
    }
  }

  return {
    isValid: true,
    length,
    recommendation: 'Description length is optimal.',
  }
}

/**
 * Generate alt text for images based on context
 */
export function generateAltText(
  subject: string,
  context?: string,
  action?: string
): string {
  let altText = subject

  if (action) {
    altText = `${subject} ${action}`
  }

  if (context) {
    altText += ` - ${context}`
  }

  return altText
}

/**
 * Create Open Graph image URL from relative path
 */
export function getFullImageUrl(imagePath: string, siteUrl?: string): string {
  if (imagePath.startsWith('http')) {
    return imagePath
  }

  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://turnonehub.com'
  return `${baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`
}

/**
 * Format date for structured data (ISO 8601)
 */
export function formatDateForSchema(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString()
}

/**
 * Calculate estimated video duration in ISO 8601 format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  let duration = 'PT'
  if (hours > 0) duration += `${hours}H`
  if (minutes > 0) duration += `${minutes}M`
  if (secs > 0) duration += `${secs}S`

  return duration || 'PT0S'
}

/**
 * Check if content is indexable (not too short, not duplicate)
 */
export function isContentIndexable(content: string, minLength = 300): {
  indexable: boolean
  reason?: string
} {
  const words = content.trim().split(/\s+/).length

  if (words < minLength / 5) { // Assuming average 5 chars per word
    return {
      indexable: false,
      reason: 'Content is too short for indexing',
    }
  }

  return { indexable: true }
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string, siteUrl?: string): string {
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://turnonehub.com'
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  // Remove trailing slash unless it's the root
  const canonicalPath = cleanPath === '/' ? cleanPath : cleanPath.replace(/\/$/, '')
  
  return `${baseUrl}${canonicalPath}`
}
