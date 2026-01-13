import { AuthGuard } from './auth-guard'
import { InputValidator } from './input-validator'

/**
 * Security utilities and helpers
 */
export class SecurityUtils {
  /**
   * Secure wrapper for async operations that require authentication
   */
  static async secureOperation<T>(
    operation: () => Promise<T>,
    options: {
      requireAuth?: boolean
      rateLimitKey?: string
      maxAttempts?: number
    } = {}
  ): Promise<T> {
    const { requireAuth = true, rateLimitKey, maxAttempts = 5 } = options

    // Check rate limiting if specified
    if (rateLimitKey) {
      const allowed = InputValidator.checkRateLimit(rateLimitKey, maxAttempts)
      if (!allowed) {
        throw new Error('Too many attempts. Please wait a moment and try again.')
      }
    }

    // Check authentication if required
    if (requireAuth) {
      await AuthGuard.requireAuth()
    }

    // Execute the operation
    return await operation()
  }

  /**
   * Validate and sanitize post creation data
   */
  static validatePostData(content: string, imageUri?: string): {
    isValid: boolean
    sanitizedContent: string
    message?: string
  } {
    // Check if we have either content or image
    if (!content.trim() && !imageUri) {
      return {
        isValid: false,
        sanitizedContent: '',
        message: 'Post must have either text content or an image'
      }
    }

    // Validate content if provided
    if (content.trim()) {
      const contentValidation = InputValidator.isValidPostContent(content)
      if (!contentValidation.isValid) {
        return {
          isValid: false,
          sanitizedContent: '',
          message: contentValidation.message
        }
      }
    }

    // Sanitize the content
    const sanitizedContent = InputValidator.sanitizeText(content)

    return {
      isValid: true,
      sanitizedContent
    }
  }

  /**
   * Validate user registration data
   */
  static validateRegistrationData(email: string, password: string, name?: string): {
    isValid: boolean
    message?: string
  } {
    // Validate email
    if (!InputValidator.isValidEmail(email)) {
      return {
        isValid: false,
        message: 'Please enter a valid email address'
      }
    }

    // Validate password
    const passwordValidation = InputValidator.isValidPassword(password)
    if (!passwordValidation.isValid) {
      return {
        isValid: false,
        message: passwordValidation.message
      }
    }

    // Validate name if provided
    if (name) {
      const nameValidation = InputValidator.isValidUserName(name)
      if (!nameValidation.isValid) {
        return {
          isValid: false,
          message: nameValidation.message
        }
      }
    }

    return { isValid: true }
  }

  /**
   * Check if user can perform action on resource
   */
  static async canPerformAction(
    action: 'create' | 'read' | 'update' | 'delete',
    resourceType: 'post' | 'user',
    resourceUserId?: string
  ): Promise<{ allowed: boolean; message?: string }> {
    try {
      // Check authentication first
      const isAuthenticated = await AuthGuard.isAuthenticated()
      if (!isAuthenticated) {
        return {
          allowed: false,
          message: 'Authentication required'
        }
      }

      // For create and read operations, just need to be authenticated
      if (action === 'create' || action === 'read') {
        return { allowed: true }
      }

      // For update and delete operations, need to own the resource
      if ((action === 'update' || action === 'delete') && resourceUserId) {
        const isOwner = await AuthGuard.isResourceOwner(resourceUserId)
        if (!isOwner) {
          return {
            allowed: false,
            message: 'You can only modify your own content'
          }
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Permission check failed:', error)
      return {
        allowed: false,
        message: 'Permission check failed'
      }
    }
  }

  /**
   * Generate secure random string for IDs
   */
  static generateSecureId(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
  }

  /**
   * Validate password strength with enhanced requirements
   */
  static validatePassword(password: string): {
    isValid: boolean
    message?: string
    score: number
    requirements: {
      minLength: boolean
      hasUppercase: boolean
      hasLowercase: boolean
      hasNumber: boolean
      hasSpecialChar: boolean
    }
  } {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const score = Object.values(requirements).filter(Boolean).length
    const isValid = score >= 4 && requirements.minLength

    let message: string | undefined
    if (!requirements.minLength) {
      message = 'Password must be at least 8 characters long'
    } else if (score < 4) {
      const missing = []
      if (!requirements.hasUppercase) missing.push('uppercase letter')
      if (!requirements.hasLowercase) missing.push('lowercase letter')
      if (!requirements.hasNumber) missing.push('number')
      if (!requirements.hasSpecialChar) missing.push('special character')
      message = `Password must include: ${missing.join(', ')}`
    }

    return {
      isValid,
      message,
      score,
      requirements
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
    const token = this.generateSecureId(32)
    const timestamp = Date.now()
    const expiresAt = timestamp + 3600000 // 1 hour expiration
    
    return { token, timestamp, expiresAt }
  }

  /**
   * Session invalidation utilities
   */
  static async invalidateAllSessions(): Promise<void> {
    try {
      // Clear all local storage related to authentication
      const keysToRemove = ['user', 'session', 'auth_token']
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to remove ${key} from localStorage:`, error)
        }
      })

      // Clear any cached authentication data
      sessionStorage.clear()
      
      this.logSecurityEvent('session_invalidation', {
        action: 'invalidate_all_sessions',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to invalidate sessions:', error)
      throw new Error('Failed to invalidate sessions')
    }
  }

  /**
   * Enhanced security monitoring
   */
  static logSecurityEvent(
    event: 'auth_success' | 'auth_failure' | 'unauthorized_access' | 'rate_limit_exceeded' | 
           'password_reset_success' | 'password_reset_failure' | 'session_invalidation' |
           'suspicious_activity' | 'token_expired' | 'multiple_failed_attempts' | 'profile_update',
    details: Record<string, any> = {}
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      sessionId: this.generateSecureId(16),
      severity: this.getEventSeverity(event)
    }

    // In production, this would be sent to a security monitoring service
    console.log('Security Event:', logEntry)

    // Store critical events locally for analysis
    if (logEntry.severity === 'high' || logEntry.severity === 'critical') {
      this.storeCriticalSecurityEvent(logEntry)
    }

    // Trigger security alerts for critical events
    if (logEntry.severity === 'critical') {
      this.triggerSecurityAlert(logEntry)
    }
  }

  /**
   * Get event severity level
   */
  private static getEventSeverity(event: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'auth_success': 'low',
      'auth_failure': 'medium',
      'unauthorized_access': 'high',
      'rate_limit_exceeded': 'medium',
      'password_reset_success': 'low',
      'password_reset_failure': 'medium',
      'session_invalidation': 'medium',
      'suspicious_activity': 'high',
      'token_expired': 'medium',
      'multiple_failed_attempts': 'critical',
      'profile_update': 'low'
    }
    
    return severityMap[event] || 'medium'
  }

  /**
   * Store critical security events for analysis
   */
  private static storeCriticalSecurityEvent(logEntry: any): void {
    try {
      const storageKey = 'critical_security_events'
      const stored = localStorage.getItem(storageKey)
      const events = stored ? JSON.parse(stored) : []
      
      events.push(logEntry)
      
      // Keep only last 100 critical events
      if (events.length > 100) {
        events.splice(0, events.length - 100)
      }
      
      localStorage.setItem(storageKey, JSON.stringify(events))
    } catch (error) {
      console.error('Failed to store critical security event:', error)
    }
  }

  /**
   * Trigger security alert for critical events
   */
  private static triggerSecurityAlert(logEntry: any): void {
    // In production, this would trigger real security alerts
    console.warn('🚨 CRITICAL SECURITY ALERT:', logEntry)
    
    // Could trigger notifications, emails, or other alert mechanisms
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Security Alert', {
          body: `Critical security event detected: ${logEntry.event}`,
          icon: '/security-alert-icon.png'
        })
      }
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  static detectSuspiciousActivity(userId?: string, action?: string): boolean {
    try {
      const key = userId ? `suspicious_${userId}` : 'suspicious_anonymous'
      const stored = localStorage.getItem(key)
      const data = stored ? JSON.parse(stored) : { actions: [], lastCheck: 0 }
      
      const now = Date.now()
      const windowMs = 300000 // 5 minutes
      
      // Remove old actions
      data.actions = data.actions.filter((timestamp: number) => now - timestamp < windowMs)
      
      // Add current action
      if (action) {
        data.actions.push(now)
      }
      
      // Check for suspicious patterns
      const actionsInWindow = data.actions.length
      const isSuspicious = actionsInWindow > 20 // More than 20 actions in 5 minutes
      
      if (isSuspicious) {
        this.logSecurityEvent('suspicious_activity', {
          userId,
          action,
          actionsInWindow,
          timeWindow: windowMs
        })
      }
      
      localStorage.setItem(key, JSON.stringify(data))
      return isSuspicious
    } catch (error) {
      console.error('Suspicious activity detection failed:', error)
      return false
    }
  }
}

// Export individual classes for convenience
export { AuthGuard, InputValidator }