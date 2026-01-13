/**
 * Deep Link Integration Tests
 * Tests for password reset deep link integration with navigation and authentication
 */

import { parsePasswordResetDeepLink, generateResetPasswordParams } from '../../lib/utils/deep-link-utils'

describe('Deep Link Integration', () => {
  describe('Password Reset Flow', () => {
    it('should handle complete password reset deep link flow', () => {
      // Simulate receiving a password reset deep link
      const resetUrl = 'fragments://reset-password#access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9&refresh_token=refresh123&type=recovery'
      
      // Parse the deep link
      const parsedLink = parsePasswordResetDeepLink(resetUrl)
      
      // Verify parsing was successful
      expect(parsedLink.isPasswordReset).toBe(true)
      expect(parsedLink.isValid).toBe(true)
      expect(parsedLink.params.accessToken).toBeTruthy()
      expect(parsedLink.params.refreshToken).toBeTruthy()
      expect(parsedLink.params.type).toBe('recovery')
      
      // Generate navigation parameters
      const navParams = generateResetPasswordParams(parsedLink)
      
      // Verify navigation parameters are correct
      expect(navParams.accessToken).toBe(parsedLink.params.accessToken)
      expect(navParams.refreshToken).toBe(parsedLink.params.refreshToken)
      expect(navParams.type).toBe('recovery')
      expect(navParams.error).toBeUndefined()
    })

    it('should handle error deep link flow', () => {
      // Simulate receiving an error deep link
      const errorUrl = 'fragments://reset-password#error=expired&error_description=The%20reset%20link%20has%20expired'
      
      // Parse the deep link
      const parsedLink = parsePasswordResetDeepLink(errorUrl)
      
      // Verify parsing detected the error
      expect(parsedLink.isPasswordReset).toBe(true)
      expect(parsedLink.isValid).toBe(false)
      expect(parsedLink.params.error).toBe('expired')
      expect(parsedLink.params.errorDescription).toBe('The reset link has expired')
      
      // Generate navigation parameters
      const navParams = generateResetPasswordParams(parsedLink)
      
      // Verify error parameters are passed through
      expect(navParams.error).toBe('expired')
      expect(navParams.errorDescription).toBe('The reset link has expired')
      expect(navParams.accessToken).toBeUndefined()
      expect(navParams.refreshToken).toBeUndefined()
    })

    it('should handle various URL formats', () => {
      const testUrls = [
        // Hash-based parameters (Supabase default)
        'fragments://reset-password#access_token=abc123&refresh_token=def456&type=recovery',
        // Query-based parameters
        'fragments://reset-password?access_token=abc123&refresh_token=def456&type=recovery',
        // Mixed parameters
        'fragments://reset-password?utm_source=email#access_token=abc123&refresh_token=def456&type=recovery',
        // URL with domain
        'https://fragments.app/reset-password#access_token=abc123&refresh_token=def456&type=recovery'
      ]
      
      testUrls.forEach(url => {
        const parsedLink = parsePasswordResetDeepLink(url)
        
        expect(parsedLink.isPasswordReset).toBe(true)
        expect(parsedLink.isValid).toBe(true)
        expect(parsedLink.params.accessToken).toBe('abc123')
        expect(parsedLink.params.refreshToken).toBe('def456')
        expect(parsedLink.params.type).toBe('recovery')
      })
    })

    it('should handle malformed URLs gracefully', () => {
      const malformedUrls = [
        'fragments://reset-password#malformed',
        'not-a-url',
        'fragments://reset-password#access_token=',
        'fragments://reset-password#type=recovery', // Missing tokens
        ''
      ]
      
      malformedUrls.forEach(url => {
        const parsedLink = parsePasswordResetDeepLink(url)
        
        // Should not crash and should handle gracefully
        expect(typeof parsedLink.isPasswordReset).toBe('boolean')
        expect(typeof parsedLink.isValid).toBe('boolean')
        expect(typeof parsedLink.params).toBe('object')
      })
    })

    it('should preserve URL encoding in parameters', () => {
      const urlWithEncoding = 'fragments://reset-password#error=invalid_request&error_description=The%20request%20is%20missing%20a%20required%20parameter'
      
      const parsedLink = parsePasswordResetDeepLink(urlWithEncoding)
      
      expect(parsedLink.params.error).toBe('invalid_request')
      expect(parsedLink.params.errorDescription).toBe('The request is missing a required parameter')
    })
  })

  describe('Navigation Parameter Generation', () => {
    it('should generate minimal parameters for valid tokens', () => {
      const parsedLink = {
        isPasswordReset: true,
        isValid: true,
        params: {
          accessToken: 'token123',
          refreshToken: 'refresh123',
          type: 'recovery'
        }
      }
      
      const navParams = generateResetPasswordParams(parsedLink)
      
      expect(Object.keys(navParams)).toHaveLength(3)
      expect(navParams.accessToken).toBe('token123')
      expect(navParams.refreshToken).toBe('refresh123')
      expect(navParams.type).toBe('recovery')
    })

    it('should generate error parameters for invalid links', () => {
      const parsedLink = {
        isPasswordReset: true,
        isValid: false,
        params: {
          error: 'access_denied',
          errorDescription: 'The user denied the request'
        }
      }
      
      const navParams = generateResetPasswordParams(parsedLink)
      
      expect(Object.keys(navParams)).toHaveLength(2)
      expect(navParams.error).toBe('access_denied')
      expect(navParams.errorDescription).toBe('The user denied the request')
    })

    it('should filter out undefined parameters', () => {
      const parsedLink = {
        isPasswordReset: true,
        isValid: true,
        params: {
          accessToken: 'token123',
          refreshToken: undefined,
          type: 'recovery',
          error: undefined,
          errorDescription: undefined
        }
      }
      
      const navParams = generateResetPasswordParams(parsedLink)
      
      expect(Object.keys(navParams)).toHaveLength(2)
      expect(navParams.accessToken).toBe('token123')
      expect(navParams.type).toBe('recovery')
      expect(navParams.refreshToken).toBeUndefined()
      expect(navParams.error).toBeUndefined()
      expect(navParams.errorDescription).toBeUndefined()
    })
  })
})