import { supabase } from '../supabase'
import { SecurityUtils, InputValidator } from '../security/security-utils'
import { securityMonitor } from '../security/security-monitor'

export interface PasswordResetRequest {
  email: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export interface PasswordResetResult {
  success: boolean
  message: string
}

export interface ResetTokenValidation {
  valid: boolean
  expired: boolean
  message: string
}

class PasswordResetService {
  /**
   * Request a password reset email for the given email address
   */
  async requestReset(email: string): Promise<PasswordResetResult> {
    try {
      // Validate email format
      if (!InputValidator.isValidEmail(email)) {
        SecurityUtils.logSecurityEvent('password_reset_failure', {
          action: 'request_reset',
          email: email.trim(),
          reason: 'Invalid email format'
        })
        return {
          success: false,
          message: 'Please enter a valid email address.'
        }
      }

      // Enhanced rate limiting with exponential backoff
      const rateLimitKey = `password_reset_${email.trim()}`
      const rateLimitResult = InputValidator.checkAdvancedRateLimit(rateLimitKey, 3, 900000, true) // 3 attempts per 15 minutes with backoff
      
      if (!rateLimitResult.allowed) {
        SecurityUtils.logSecurityEvent('rate_limit_exceeded', {
          action: 'password_reset_request',
          email: email.trim(),
          retryAfter: rateLimitResult.retryAfter
        })
        
        const retryMessage = rateLimitResult.retryAfter 
          ? `Please wait ${Math.ceil(rateLimitResult.retryAfter / 60)} minutes before trying again.`
          : 'Please wait 15 minutes and try again.'
          
        return {
          success: false,
          message: `Too many password reset attempts. ${retryMessage}`
        }
      }

      // Check for suspicious activity
      if (SecurityUtils.detectSuspiciousActivity(undefined, 'password_reset_request')) {
        SecurityUtils.logSecurityEvent('suspicious_activity', {
          action: 'password_reset_request',
          email: email.trim(),
          reason: 'Multiple rapid requests detected'
        })
        
        return {
          success: false,
          message: 'Suspicious activity detected. Please wait before trying again.'
        }
      }

      // Use Supabase's built-in password reset functionality
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `fragments://reset-password`,
      })

      if (error) {
        console.error('Password reset request error:', error)
        
        SecurityUtils.logSecurityEvent('password_reset_failure', {
          action: 'request_reset',
          email: email.trim(),
          error: error.message
        })

        // Handle specific error cases
        if (error.message.includes('rate limit')) {
          return {
            success: false,
            message: 'Too many requests. Please wait a moment and try again.'
          }
        }

        // For security, don't reveal if email exists or not
        // Always show success message to prevent email enumeration
        SecurityUtils.logSecurityEvent('password_reset_success', {
          action: 'request_reset',
          email: email.trim(),
          note: 'Success message shown regardless of email existence'
        })

        return {
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link shortly.'
        }
      }

      // Log successful request and reset rate limit on success
      SecurityUtils.logSecurityEvent('password_reset_success', {
        action: 'request_reset',
        email: email.trim()
      })

      // Monitor the event
      securityMonitor.monitorPasswordResetEvent('request', true, {
        email: email.trim()
      })

      // Reset rate limit on successful request
      InputValidator.resetRateLimit(rateLimitKey)

      return {
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link shortly.'
      }

    } catch (error) {
      console.error('Password reset request exception:', error)
      
      SecurityUtils.logSecurityEvent('password_reset_failure', {
        action: 'request_reset',
        email: email.trim(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Network error handling
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        return {
          success: false,
          message: 'Network error. Please check your connection and try again.'
        }
      }

      return {
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
      }
    }
  }

  /**
   * Reset password using a valid reset token
   */
  async resetPassword(newPassword: string): Promise<PasswordResetResult> {
    try {
      // Enhanced password validation
      const validation = SecurityUtils.validatePassword(newPassword)
      if (!validation.isValid) {
        SecurityUtils.logSecurityEvent('password_reset_failure', {
          action: 'reset_password',
          reason: 'Password validation failed',
          score: validation.score
        })
        
        return {
          success: false,
          message: validation.message || 'Password does not meet requirements.'
        }
      }

      // Check for suspicious activity
      if (SecurityUtils.detectSuspiciousActivity(undefined, 'password_reset')) {
        SecurityUtils.logSecurityEvent('suspicious_activity', {
          action: 'password_reset',
          reason: 'Multiple rapid password reset attempts'
        })
        
        return {
          success: false,
          message: 'Suspicious activity detected. Please wait before trying again.'
        }
      }

      // Get current session to check token validity and expiration
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        SecurityUtils.logSecurityEvent('token_expired', {
          action: 'password_reset',
          reason: 'No valid session found'
        })
        
        return {
          success: false,
          message: 'Reset link has expired. Please request a new password reset.'
        }
      }

      // Check if token is expired (Supabase handles this, but we log it)
      const tokenAge = Date.now() - new Date(session.user.created_at || session.created_at).getTime()
      const oneHour = 3600000 // 1 hour in milliseconds
      
      if (tokenAge > oneHour) {
        SecurityUtils.logSecurityEvent('token_expired', {
          action: 'password_reset',
          tokenAge: tokenAge,
          maxAge: oneHour
        })
        
        return {
          success: false,
          message: 'Reset link has expired. Please request a new password reset.'
        }
      }

      // Use Supabase's password update functionality
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('Password reset error:', error)
        
        SecurityUtils.logSecurityEvent('password_reset_failure', {
          action: 'reset_password',
          error: error.message
        })

        // Handle specific error cases
        if (error.message.includes('session')) {
          return {
            success: false,
            message: 'Reset link has expired. Please request a new password reset.'
          }
        }

        if (error.message.includes('password')) {
          return {
            success: false,
            message: 'Password does not meet security requirements.'
          }
        }

        return {
          success: false,
          message: 'Failed to reset password. Please try again.'
        }
      }

      // Invalidate all existing sessions for security
      try {
        await SecurityUtils.invalidateAllSessions()
        SecurityUtils.logSecurityEvent('session_invalidation', {
          action: 'password_reset_success',
          reason: 'Password changed - all sessions invalidated'
        })
      } catch (invalidationError) {
        console.warn('Failed to invalidate sessions:', invalidationError)
        // Continue anyway - password was reset successfully
      }

      // Log successful password reset
      SecurityUtils.logSecurityEvent('password_reset_success', {
        action: 'reset_password',
        sessionInvalidated: true
      })

      // Monitor the event
      securityMonitor.monitorPasswordResetEvent('complete', true, {
        sessionInvalidated: true
      })

      return {
        success: true,
        message: 'Password has been reset successfully. You can now sign in with your new password.'
      }

    } catch (error) {
      console.error('Password reset exception:', error)
      
      SecurityUtils.logSecurityEvent('password_reset_failure', {
        action: 'reset_password',
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
      }
    }
  }

  /**
   * Validate a reset token (check if session is valid for password reset)
   */
  async validateResetToken(): Promise<ResetTokenValidation> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Token validation error:', error)
        SecurityUtils.logSecurityEvent('token_expired', {
          action: 'validate_reset_token',
          error: error.message
        })
        
        return {
          valid: false,
          expired: true,
          message: 'Reset link is invalid or has expired.'
        }
      }

      if (!session) {
        SecurityUtils.logSecurityEvent('token_expired', {
          action: 'validate_reset_token',
          reason: 'No session found'
        })
        
        return {
          valid: false,
          expired: true,
          message: 'Reset link is invalid or has expired. Please request a new password reset.'
        }
      }

      // Enhanced token expiration check
      const tokenTimestamp = new Date(session.user.created_at || session.created_at).getTime()
      const isExpired = InputValidator.isTokenExpired(tokenTimestamp, 3600000) // 1 hour expiration
      
      if (isExpired) {
        SecurityUtils.logSecurityEvent('token_expired', {
          action: 'validate_reset_token',
          tokenAge: Date.now() - tokenTimestamp,
          maxAge: 3600000
        })
        
        return {
          valid: false,
          expired: true,
          message: 'Reset link has expired. Please request a new password reset.'
        }
      }

      // Check if this is a password recovery session
      // Supabase sets the session type for password recovery
      const isRecoverySession = session.user?.aud === 'authenticated' && 
                               session.user?.recovery_sent_at !== undefined

      if (!isRecoverySession) {
        SecurityUtils.logSecurityEvent('unauthorized_access', {
          action: 'validate_reset_token',
          reason: 'Not a recovery session'
        })
        
        return {
          valid: false,
          expired: false,
          message: 'This link is not valid for password reset.'
        }
      }

      // Log successful token validation
      SecurityUtils.logSecurityEvent('password_reset_success', {
        action: 'validate_reset_token',
        userId: session.user.id
      })

      // Monitor the event
      securityMonitor.monitorPasswordResetEvent('validate', true, {
        userId: session.user.id
      })

      return {
        valid: true,
        expired: false,
        message: 'Reset token is valid.'
      }

    } catch (error) {
      console.error('Token validation exception:', error)
      
      SecurityUtils.logSecurityEvent('password_reset_failure', {
        action: 'validate_reset_token',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return {
        valid: false,
        expired: true,
        message: 'Unable to validate reset link. Please try again.'
      }
    }
  }

  /**
   * Clear rate limiting for a specific email (used after successful operations)
   */
  clearRateLimit(email: string): void {
    const rateLimitKey = `password_reset_${email.trim()}`
    InputValidator.resetRateLimit(rateLimitKey)
  }

  /**
   * Get security monitoring data for analysis
   */
  getSecurityMetrics(): {
    criticalEvents: any[]
    rateLimitStatus: Record<string, any>
    suspiciousActivityCount: number
  } {
    try {
      // Get critical security events
      const criticalEvents = JSON.parse(localStorage.getItem('critical_security_events') || '[]')
      
      // Get rate limit status for common keys
      const rateLimitKeys = ['password_reset', 'signin', 'signup']
      const rateLimitStatus: Record<string, any> = {}
      
      rateLimitKeys.forEach(key => {
        const stored = localStorage.getItem(`advanced_rate_limit_${key}`)
        if (stored) {
          rateLimitStatus[key] = JSON.parse(stored)
        }
      })
      
      // Count suspicious activity events
      const suspiciousActivityCount = criticalEvents.filter(
        (event: any) => event.event === 'suspicious_activity'
      ).length
      
      return {
        criticalEvents,
        rateLimitStatus,
        suspiciousActivityCount
      }
    } catch (error) {
      console.error('Failed to get security metrics:', error)
      return {
        criticalEvents: [],
        rateLimitStatus: {},
        suspiciousActivityCount: 0
      }
    }
  }

  /**
   * Security monitoring hook for detecting multiple failed attempts
   */
  monitorFailedAttempts(email: string, action: 'signin' | 'password_reset'): void {
    try {
      const key = `failed_attempts_${action}_${email.trim()}`
      const stored = localStorage.getItem(key)
      const data = stored ? JSON.parse(stored) : { attempts: [], consecutiveFailures: 0 }
      
      const now = Date.now()
      const windowMs = 3600000 // 1 hour window
      
      // Remove old attempts
      data.attempts = data.attempts.filter((timestamp: number) => now - timestamp < windowMs)
      
      // Add current failed attempt
      data.attempts.push(now)
      data.consecutiveFailures = (data.consecutiveFailures || 0) + 1
      
      // Check for multiple failed attempts (security concern)
      if (data.attempts.length >= 5) {
        SecurityUtils.logSecurityEvent('multiple_failed_attempts', {
          action,
          email: email.trim(),
          attemptCount: data.attempts.length,
          consecutiveFailures: data.consecutiveFailures,
          timeWindow: windowMs
        })
      }
      
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to monitor failed attempts:', error)
    }
  }

  /**
   * Reset failed attempts counter (called on successful operations)
   */
  resetFailedAttempts(email: string, action: 'signin' | 'password_reset'): void {
    try {
      const key = `failed_attempts_${action}_${email.trim()}`
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to reset failed attempts:', error)
    }
  }
}

export const passwordResetService = new PasswordResetService()