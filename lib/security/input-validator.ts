/**
 * Input validation utilities for security
 */
export class InputValidator {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' }
    }
    
    if (password.length > 128) {
      return { isValid: false, message: 'Password must be less than 128 characters' }
    }
    
    // Check for at least one letter and one number (basic strength)
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    
    if (!hasLetter || !hasNumber) {
      return { isValid: false, message: 'Password must contain at least one letter and one number' }
    }
    
    return { isValid: true }
  }

  /**
   * Validate post content
   */
  static isValidPostContent(content: string): { isValid: boolean; message?: string } {
    const trimmed = content.trim()
    
    if (trimmed.length === 0) {
      return { isValid: false, message: 'Post content cannot be empty' }
    }
    
    if (trimmed.length > 500) {
      return { isValid: false, message: 'Post content must be less than 500 characters' }
    }
    
    // Check for potentially harmful content patterns
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript URLs
      /on\w+\s*=/gi, // Event handlers
    ]
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return { isValid: false, message: 'Post content contains invalid characters' }
      }
    }
    
    return { isValid: true }
  }

  /**
   * Validate image file
   */
  static isValidImageFile(mimeType: string, fileSize?: number): { isValid: boolean; message?: string } {
    // Allowed image types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ]
    
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      return { 
        isValid: false, 
        message: 'Invalid file type. Please select a JPEG, PNG, WebP, or GIF image.' 
      }
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (fileSize && fileSize > maxSize) {
      return { 
        isValid: false, 
        message: 'File size too large. Please select an image smaller than 5MB.' 
      }
    }
    
    return { isValid: true }
  }

  /**
   * Sanitize text input to prevent XSS
   */
  static sanitizeText(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim()
  }

  /**
   * Validate user name
   */
  static isValidUserName(name: string): { isValid: boolean; message?: string } {
    const trimmed = name.trim()
    
    if (trimmed.length === 0) {
      return { isValid: false, message: 'Name cannot be empty' }
    }
    
    if (trimmed.length < 2) {
      return { isValid: false, message: 'Name must be at least 2 characters long' }
    }
    
    if (trimmed.length > 50) {
      return { isValid: false, message: 'Name must be less than 50 characters' }
    }
    
    // Only allow letters, numbers, spaces, and basic punctuation
    const nameRegex = /^[a-zA-Z0-9\s\-_.]+$/
    if (!nameRegex.test(trimmed)) {
      return { isValid: false, message: 'Name contains invalid characters' }
    }
    
    return { isValid: true }
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  /**
   * Rate limiting check (simple client-side implementation)
   */
  static checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now()
    const storageKey = `rate_limit_${key}`
    
    try {
      const stored = localStorage.getItem(storageKey)
      const attempts = stored ? JSON.parse(stored) : []
      
      // Remove old attempts outside the window
      const validAttempts = attempts.filter((timestamp: number) => now - timestamp < windowMs)
      
      // Check if we've exceeded the limit
      if (validAttempts.length >= maxAttempts) {
        return false
      }
      
      // Add current attempt
      validAttempts.push(now)
      localStorage.setItem(storageKey, JSON.stringify(validAttempts))
      
      return true
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // If we can't check rate limit, allow the operation
      return true
    }
  }

  /**
   * Clear rate limit for a key
   */
  static clearRateLimit(key: string): void {
    try {
      localStorage.removeItem(`rate_limit_${key}`)
    } catch (error) {
      console.error('Failed to clear rate limit:', error)
    }
  }

  /**
   * Enhanced rate limiting with exponential backoff
   */
  static checkAdvancedRateLimit(
    key: string,
    maxAttempts: number,
    windowMs: number,
    exponentialBackoff: boolean = true
  ): { allowed: boolean; retryAfter?: number; attemptsRemaining?: number } {
    const now = Date.now()
    const storageKey = `advanced_rate_limit_${key}`
    
    try {
      const stored = localStorage.getItem(storageKey)
      const data = stored ? JSON.parse(stored) : { attempts: [], consecutiveFailures: 0 }
      
      // Remove old attempts outside the window
      const validAttempts = data.attempts.filter((timestamp: number) => now - timestamp < windowMs)
      
      // Calculate backoff time if exponential backoff is enabled
      let backoffMs = 0
      if (exponentialBackoff && data.consecutiveFailures > 0) {
        backoffMs = Math.min(windowMs * Math.pow(2, data.consecutiveFailures - 1), 3600000) // Max 1 hour
      }
      
      const lastAttempt = validAttempts.length > 0 ? Math.max(...validAttempts) : 0
      const timeSinceLastAttempt = now - lastAttempt
      
      // Check if we're still in backoff period
      if (backoffMs > 0 && timeSinceLastAttempt < backoffMs) {
        return {
          allowed: false,
          retryAfter: Math.ceil((backoffMs - timeSinceLastAttempt) / 1000),
          attemptsRemaining: 0
        }
      }
      
      // Check if we've exceeded the limit
      if (validAttempts.length >= maxAttempts) {
        // Increment consecutive failures for exponential backoff
        data.consecutiveFailures = (data.consecutiveFailures || 0) + 1
        data.attempts = validAttempts
        localStorage.setItem(storageKey, JSON.stringify(data))
        
        return {
          allowed: false,
          retryAfter: Math.ceil(windowMs / 1000),
          attemptsRemaining: 0
        }
      }
      
      // Add current attempt
      validAttempts.push(now)
      data.attempts = validAttempts
      localStorage.setItem(storageKey, JSON.stringify(data))
      
      return {
        allowed: true,
        attemptsRemaining: maxAttempts - validAttempts.length
      }
    } catch (error) {
      console.error('Advanced rate limit check failed:', error)
      // If we can't check rate limit, allow the operation
      return { allowed: true }
    }
  }

  /**
   * Reset rate limit and consecutive failures
   */
  static resetRateLimit(key: string): void {
    try {
      localStorage.removeItem(`rate_limit_${key}`)
      localStorage.removeItem(`advanced_rate_limit_${key}`)
    } catch (error) {
      console.error('Failed to reset rate limit:', error)
    }
  }

  /**
   * Token expiration utilities
   */
  static isTokenExpired(tokenTimestamp: number, expirationMs: number = 3600000): boolean {
    const now = Date.now()
    return (now - tokenTimestamp) > expirationMs
  }

  /**
   * Generate secure token with expiration
   */
  static generateSecureToken(): { token: string; timestamp: number; expiresAt: number } {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    const timestamp = Date.now()
    const expiresAt = timestamp + 3600000 // 1 hour expiration
    
    return { token, timestamp, expiresAt }
  }
}