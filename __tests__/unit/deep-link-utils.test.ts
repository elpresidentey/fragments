/**
 * Deep Link Utils Tests
 * Tests for password reset deep link parsing and validation
 */

import {
  parsePasswordResetDeepLink,
  validatePasswordResetParams,
  getErrorMessage,
  isTokenExpired,
  formatTimeRemaining,
  generateResetPasswordParams
} from '../../lib/utils/deep-link-utils'

describe('Deep Link Utils', () => {
  describe('parsePasswordResetDeepLink', () => {
    it('should parse valid password reset deep link with tokens', () => {
      const url = 'fragments://reset-password#access_token=abc123&refresh_token=def456&type=recovery'
      const result = parsePasswordResetDeepLink(url)
      
      expect(result.isPasswordReset).toBe(true)
      expect(result.isValid).toBe(true)
      expect(result.params.accessToken).toBe('abc123')
      expect(result.params.refreshToken).toBe('def456')
      expect(result.params.type).toBe('recovery')
    })

    it('should parse deep link with error parameters', () => {
      const url = 'fragments://reset-password#error=expired&error_description=Token%20has%20expired'
      const result = parsePasswordResetDeepLink(url)
      
      expect(result.isPasswordReset).toBe(true)
      expect(result.isValid).toBe(false)
      expect(result.params.error).toBe('expired')
      expect(result.params.errorDescription).toBe('Token has expired')
    })

    it('should handle non-password-reset URLs', () => {
      const url = 'fragments://profile'
      const result = parsePasswordResetDeepLink(url)
      
      expect(result.isPasswordReset).toBe(false)
      expect(result.isValid).toBe(false)
    })

    it('should handle malformed URLs gracefully', () => {
      const url = 'not-a-valid-url'
      const result = parsePasswordResetDeepLink(url)
      
      expect(result.isPasswordReset).toBe(false)
      expect(result.isValid).toBe(false)
    })

    it('should parse URLs with search parameters', () => {
      const url = 'fragments://reset-password?access_token=abc123&refresh_token=def456&type=recovery'
      const result = parsePasswordResetDeepLink(url)
      
      expect(result.isPasswordReset).toBe(true)
      expect(result.isValid).toBe(true)
      expect(result.params.accessToken).toBe('abc123')
      expect(result.params.refreshToken).toBe('def456')
      expect(result.params.type).toBe('recovery')
    })
  })

  describe('validatePasswordResetParams', () => {
    it('should validate valid parameters', () => {
      const params = {
        accessToken: 'abc123',
        refreshToken: 'def456',
        type: 'recovery'
      }
      
      const result = validatePasswordResetParams(params)
      expect(result.isValid).toBe(true)
    })

    it('should reject parameters with errors', () => {
      const params = {
        error: 'expired',
        errorDescription: 'Token has expired'
      }
      
      const result = validatePasswordResetParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toContain('expired')
    })

    it('should reject parameters missing tokens', () => {
      const params = {
        type: 'recovery'
      }
      
      const result = validatePasswordResetParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toContain('Missing required authentication tokens')
    })

    it('should reject parameters with wrong type', () => {
      const params = {
        accessToken: 'abc123',
        refreshToken: 'def456',
        type: 'signup'
      }
      
      const result = validatePasswordResetParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toContain('Invalid link type')
    })
  })

  describe('getErrorMessage', () => {
    it('should return specific message for known errors', () => {
      expect(getErrorMessage('expired')).toContain('expired')
      expect(getErrorMessage('invalid_token')).toContain('authentication information')
      expect(getErrorMessage('access_denied')).toContain('Access denied')
    })

    it('should return description for unknown errors', () => {
      const description = 'Custom error message'
      expect(getErrorMessage('unknown_error', description)).toBe(description)
    })

    it('should return default message for unknown errors without description', () => {
      const result = getErrorMessage('unknown_error')
      expect(result).toContain('invalid or has expired')
    })
  })

  describe('isTokenExpired', () => {
    it('should detect expired tokens', () => {
      const oldTimestamp = Date.now() - 7200000 // 2 hours ago
      expect(isTokenExpired(oldTimestamp, 3600000)).toBe(true) // 1 hour max age
    })

    it('should detect valid tokens', () => {
      const recentTimestamp = Date.now() - 1800000 // 30 minutes ago
      expect(isTokenExpired(recentTimestamp, 3600000)).toBe(false) // 1 hour max age
    })

    it('should use default max age', () => {
      const oldTimestamp = Date.now() - 7200000 // 2 hours ago
      expect(isTokenExpired(oldTimestamp)).toBe(true) // Default 1 hour max age
    })
  })

  describe('formatTimeRemaining', () => {
    it('should format minutes correctly', () => {
      const expiresAt = Date.now() + 1800000 // 30 minutes from now
      const result = formatTimeRemaining(expiresAt)
      expect(result).toBe('30 minutes')
    })

    it('should format single minute correctly', () => {
      const expiresAt = Date.now() + 60000 // 1 minute from now
      const result = formatTimeRemaining(expiresAt)
      expect(result).toBe('1 minute')
    })

    it('should format hours correctly', () => {
      const expiresAt = Date.now() + 7200000 // 2 hours from now
      const result = formatTimeRemaining(expiresAt)
      expect(result).toBe('2 hours')
    })

    it('should handle expired tokens', () => {
      const expiresAt = Date.now() - 1000 // 1 second ago
      const result = formatTimeRemaining(expiresAt)
      expect(result).toBe('expired')
    })
  })

  describe('generateResetPasswordParams', () => {
    it('should generate navigation parameters from parsed link', () => {
      const parsedLink = {
        isPasswordReset: true,
        isValid: true,
        params: {
          accessToken: 'abc123',
          refreshToken: 'def456',
          type: 'recovery'
        }
      }
      
      const result = generateResetPasswordParams(parsedLink)
      
      expect(result.accessToken).toBe('abc123')
      expect(result.refreshToken).toBe('def456')
      expect(result.type).toBe('recovery')
    })

    it('should generate error parameters from parsed link', () => {
      const parsedLink = {
        isPasswordReset: true,
        isValid: false,
        params: {
          error: 'expired',
          errorDescription: 'Token has expired'
        }
      }
      
      const result = generateResetPasswordParams(parsedLink)
      
      expect(result.error).toBe('expired')
      expect(result.errorDescription).toBe('Token has expired')
    })

    it('should handle empty parameters', () => {
      const parsedLink = {
        isPasswordReset: true,
        isValid: false,
        params: {}
      }
      
      const result = generateResetPasswordParams(parsedLink)
      
      expect(Object.keys(result)).toHaveLength(0)
    })
  })
})