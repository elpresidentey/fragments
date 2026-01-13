import { passwordResetService } from '../../lib/services/password-reset'
import { supabase } from '../../lib/supabase'
import { SecurityUtils, InputValidator } from '../../lib/security/security-utils'

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      getSession: jest.fn(),
    },
  },
}))

jest.mock('../../lib/security/security-utils', () => ({
  SecurityUtils: {
    validatePassword: jest.fn(),
    logSecurityEvent: jest.fn(),
  },
  InputValidator: {
    isValidEmail: jest.fn(),
    checkRateLimit: jest.fn(),
    clearRateLimit: jest.fn(),
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockSecurityUtils = SecurityUtils as jest.Mocked<typeof SecurityUtils>
const mockInputValidator = InputValidator as jest.Mocked<typeof InputValidator>

describe('PasswordResetService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('requestReset', () => {
    it('validates email format', async () => {
      mockInputValidator.isValidEmail.mockReturnValue(false)

      const result = await passwordResetService.requestReset('invalid-email')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Please enter a valid email address.')
      expect(mockSecurityUtils.logSecurityEvent).toHaveBeenCalledWith('password_reset_failure', {
        action: 'request_reset',
        email: 'invalid-email',
        reason: 'Invalid email format'
      })
    })

    it('checks rate limiting', async () => {
      mockInputValidator.isValidEmail.mockReturnValue(true)
      mockInputValidator.checkRateLimit.mockReturnValue(false)

      const result = await passwordResetService.requestReset('test@example.com')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Too many password reset attempts. Please wait 15 minutes and try again.')
      expect(mockSecurityUtils.logSecurityEvent).toHaveBeenCalledWith('rate_limit_exceeded', {
        action: 'password_reset_request',
        email: 'test@example.com'
      })
    })

    it('successfully sends reset email', async () => {
      mockInputValidator.isValidEmail.mockReturnValue(true)
      mockInputValidator.checkRateLimit.mockReturnValue(true)
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null } as any)

      const result = await passwordResetService.requestReset('test@example.com')

      expect(result.success).toBe(true)
      expect(result.message).toBe('If an account with this email exists, you will receive a password reset link shortly.')
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('/reset-password'),
      })
      expect(mockSecurityUtils.logSecurityEvent).toHaveBeenCalledWith('password_reset_success', {
        action: 'request_reset',
        email: 'test@example.com'
      })
    })

    it('handles Supabase errors gracefully', async () => {
      mockInputValidator.isValidEmail.mockReturnValue(true)
      mockInputValidator.checkRateLimit.mockReturnValue(true)
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ 
        error: { message: 'Some error' } 
      } as any)

      const result = await passwordResetService.requestReset('test@example.com')

      // Should still return success for security (don't reveal if email exists)
      expect(result.success).toBe(true)
      expect(result.message).toBe('If an account with this email exists, you will receive a password reset link shortly.')
    })

    it('handles network errors', async () => {
      mockInputValidator.isValidEmail.mockReturnValue(true)
      mockInputValidator.checkRateLimit.mockReturnValue(true)
      mockSupabase.auth.resetPasswordForEmail.mockRejectedValue(new Error('fetch failed'))

      const result = await passwordResetService.requestReset('test@example.com')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Network error. Please check your connection and try again.')
    })
  })

  describe('resetPassword', () => {
    it('validates password strength', async () => {
      mockSecurityUtils.validatePassword.mockReturnValue({
        isValid: false,
        message: 'Password too weak'
      })

      const result = await passwordResetService.resetPassword('weak')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Password too weak')
    })

    it('successfully resets password', async () => {
      mockSecurityUtils.validatePassword.mockReturnValue({
        isValid: true,
        message: ''
      })
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null } as any)

      const result = await passwordResetService.resetPassword('StrongPassword123!')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Password has been reset successfully. You can now sign in with your new password.')
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'StrongPassword123!'
      })
      expect(mockSecurityUtils.logSecurityEvent).toHaveBeenCalledWith('password_reset_success', {
        action: 'reset_password'
      })
    })

    it('handles expired session', async () => {
      mockSecurityUtils.validatePassword.mockReturnValue({
        isValid: true,
        message: ''
      })
      mockSupabase.auth.updateUser.mockResolvedValue({ 
        error: { message: 'session expired' } 
      } as any)

      const result = await passwordResetService.resetPassword('StrongPassword123!')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Reset link has expired. Please request a new password reset.')
    })
  })

  describe('validateResetToken', () => {
    it('returns invalid for no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      } as any)

      const result = await passwordResetService.validateResetToken()

      expect(result.valid).toBe(false)
      expect(result.expired).toBe(true)
      expect(result.message).toBe('Reset link is invalid or has expired. Please request a new password reset.')
    })

    it('returns valid for recovery session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ 
        data: { 
          session: { 
            user: { 
              aud: 'authenticated', 
              recovery_sent_at: '2023-01-01T00:00:00Z' 
            } 
          } 
        }, 
        error: null 
      } as any)

      const result = await passwordResetService.validateResetToken()

      expect(result.valid).toBe(true)
      expect(result.expired).toBe(false)
      expect(result.message).toBe('Reset token is valid.')
    })

    it('handles session errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ 
        data: { session: null }, 
        error: { message: 'Session error' } 
      } as any)

      const result = await passwordResetService.validateResetToken()

      expect(result.valid).toBe(false)
      expect(result.expired).toBe(true)
      expect(result.message).toBe('Reset link is invalid or has expired.')
    })
  })
})