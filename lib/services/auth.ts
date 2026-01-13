import { supabase } from '../supabase'
import { AuthResult, AuthService, User } from '../../types'
import { storage } from '../storage-adapter'
import { SecurityUtils, InputValidator } from '../security/security-utils'
import { passwordResetService, PasswordResetResult } from './password-reset'
import { securityMonitor } from '../security/security-monitor'

class SupabaseAuthService implements AuthService {
  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('Starting minimal auth signup...')
      
      // Validate input data
      const validation = SecurityUtils.validateRegistrationData(email, password)
      if (!validation.isValid) {
        SecurityUtils.logSecurityEvent('auth_failure', { 
          action: 'signup',
          email: email.trim(),
          reason: validation.message 
        })
        return {
          user: null,
          session: null,
          error: { message: validation.message || 'Invalid registration data' } as any
        }
      }

      // Enhanced rate limiting with exponential backoff
      const rateLimitResult = InputValidator.checkAdvancedRateLimit(`signup_${email.trim()}`, 3, 300000, true) // 3 attempts per 5 minutes with backoff
      
      if (!rateLimitResult.allowed) {
        SecurityUtils.logSecurityEvent('rate_limit_exceeded', { 
          action: 'signup',
          email: email.trim(),
          retryAfter: rateLimitResult.retryAfter
        })
        
        const retryMessage = rateLimitResult.retryAfter 
          ? `Please wait ${Math.ceil(rateLimitResult.retryAfter / 60)} minutes before trying again.`
          : 'Please wait 5 minutes and try again.'
          
        return {
          user: null,
          session: null,
          error: { message: `Too many signup attempts. ${retryMessage}` } as any
        }
      }
      
      // MINIMAL signup - no custom data, no profile creation
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password
      })

      console.log('Auth signup result:', { data, error })

      if (error) {
        console.error('Auth signup error:', error)
        
        SecurityUtils.logSecurityEvent('auth_failure', { 
          action: 'signup',
          email: email.trim(),
          error: error.message 
        })
        
        // Enhanced error handling with specific error types
        let errorMessage = error.message
        if (error.message.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.'
        } else if (error.message.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.'
        } else if (error.message.includes('password')) {
          errorMessage = 'Password must be at least 6 characters long.'
        }
        
        return {
          user: null,
          session: null,
          error: { ...error, message: errorMessage }
        }
      }

      // If user created but no session = email confirmation needed
      if (data.user && !data.session) {
        console.log('Email confirmation required')
        return {
          user: null,
          session: null,
          error: {
            message: 'Please check your email and click the confirmation link to activate your account.',
            status: 'email_confirmation_required'
          } as any
        }
      }

      // If we have both user and session = success
      if (data.user && data.session) {
        console.log('Auth signup successful!')
        
        // Try to create user profile in database
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          name: InputValidator.sanitizeText(data.user.email?.split('@')[0] || 'User'),
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        try {
          // Attempt to create user profile in database
          const { error: profileError } = await supabase
            .from('users')
            .insert(user)
            .select()
            .single()

          if (profileError) {
            console.warn('Profile creation failed (table may not exist):', profileError.message)
            // Continue anyway - auth worked, profile creation is optional
          } else {
            console.log('User profile created successfully')
          }
        } catch (profileErr) {
          console.warn('Profile creation exception:', profileErr)
          // Continue anyway - auth worked
        }

        SecurityUtils.logSecurityEvent('auth_success', { 
          action: 'signup',
          userId: user.id,
          email: user.email 
        })

        // Monitor the event
        securityMonitor.monitorAuthEvent('signup', true, {
          userId: user.id,
          email: user.email
        })

        // Clear rate limit on successful signup
        InputValidator.resetRateLimit(`signup_${email.trim()}`)

        return {
          user: user,
          session: data.session,
          error: null
        }
      }

      // Success but no user data
      return {
        user: null,
        session: data.session,
        error: null
      }

    } catch (error) {
      console.error('Signup exception:', error)
      
      SecurityUtils.logSecurityEvent('auth_failure', { 
        action: 'signup',
        email: email.trim(),
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      
      // Network error handling
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        return {
          user: null,
          session: null,
          error: { message: 'Network error. Please check your connection and try again.' } as any
        }
      }
      
      return {
        user: null,
        session: null,
        error: error as any
      }
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('Starting minimal auth signin...')
      
      // Basic input validation
      if (!InputValidator.isValidEmail(email)) {
        SecurityUtils.logSecurityEvent('auth_failure', { 
          action: 'signin',
          email: email.trim(),
          reason: 'Invalid email format' 
        })
        return {
          user: null,
          session: null,
          error: { message: 'Please enter a valid email address.' } as any
        }
      }

      // Enhanced rate limiting with exponential backoff
      const rateLimitResult = InputValidator.checkAdvancedRateLimit(`signin_${email.trim()}`, 5, 300000, true) // 5 attempts per 5 minutes with backoff
      
      if (!rateLimitResult.allowed) {
        SecurityUtils.logSecurityEvent('rate_limit_exceeded', { 
          action: 'signin',
          email: email.trim(),
          retryAfter: rateLimitResult.retryAfter
        })
        
        const retryMessage = rateLimitResult.retryAfter 
          ? `Please wait ${Math.ceil(rateLimitResult.retryAfter / 60)} minutes before trying again.`
          : 'Please wait 5 minutes and try again.'
          
        return {
          user: null,
          session: null,
          error: { message: `Too many login attempts. ${retryMessage}` } as any
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      console.log('Auth signin result:', { data, error })

      if (error) {
        SecurityUtils.logSecurityEvent('auth_failure', { 
          action: 'signin',
          email: email.trim(),
          error: error.message 
        })
        
        // Monitor failed attempts for security
        passwordResetService.monitorFailedAttempts(email.trim(), 'signin')
        
        // Enhanced error handling with specific error types
        let errorMessage = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link to activate your account.'
        } else if (error.message.includes('too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.'
        }
        
        return {
          user: null,
          session: null,
          error: { ...error, message: errorMessage }
        }
      }

      if (data.user && data.session) {
        // Try to get user profile from database first
        let user: User;
        
        try {
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profileError || !userProfile) {
            console.log('User profile not found, creating from auth data')
            // Create user object from auth data
            user = {
              id: data.user.id,
              email: data.user.email!,
              name: InputValidator.sanitizeText(data.user.email?.split('@')[0] || 'User'),
              avatar_url: null,
              created_at: data.user.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            // Try to create profile in database
            try {
              await supabase.from('users').insert(user)
              console.log('User profile created during sign-in')
            } catch (createErr) {
              console.warn('Could not create user profile:', createErr)
              // Continue anyway
            }
          } else {
            user = userProfile as User
          }
        } catch (dbErr) {
          console.warn('Database error, using auth data:', dbErr)
          // Fallback to auth data if database is not available
          user = {
            id: data.user.id,
            email: data.user.email!,
            name: InputValidator.sanitizeText(data.user.email?.split('@')[0] || 'User'),
            avatar_url: null,
            created_at: data.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }

        SecurityUtils.logSecurityEvent('auth_success', { 
          action: 'signin',
          userId: user.id,
          email: user.email 
        })

        // Monitor the event
        securityMonitor.monitorAuthEvent('signin', true, {
          userId: user.id,
          email: user.email
        })

        // Clear rate limit on successful signin
        InputValidator.resetRateLimit(`signin_${email.trim()}`)
        
        // Reset failed attempts counter
        passwordResetService.resetFailedAttempts(email.trim(), 'signin')

        return {
          user: user,
          session: data.session,
          error: null
        }
      }

      return {
        user: null,
        session: data.session,
        error: null
      }
    } catch (error) {
      console.error('Signin exception:', error)
      
      SecurityUtils.logSecurityEvent('auth_failure', { 
        action: 'signin',
        email: email.trim(),
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      
      // Network error handling
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        return {
          user: null,
          session: null,
          error: { message: 'Network error. Please check your connection and try again.' } as any
        }
      }
      
      return {
        user: null,
        session: null,
        error: error as any
      }
    }
  }

  async signOut(): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser()
      
      await supabase.auth.signOut()
      await storage.removeItem('user')
      
      if (currentUser) {
        SecurityUtils.logSecurityEvent('auth_success', { 
          action: 'signout',
          userId: currentUser.id 
        })

        // Monitor the event
        securityMonitor.monitorAuthEvent('signout', true, {
          userId: currentUser.id
        })
      }
    } catch (error) {
      console.error('Sign out error:', error)
      
      // Even if sign out fails, clear local storage
      try {
        await storage.removeItem('user')
      } catch (storageError) {
        console.error('Failed to clear local storage:', storageError)
      }
      
      throw new Error('Failed to sign out. Please try again.')
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        return null
      }

      // Try to get user profile from database first
      try {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!error && userProfile) {
          return userProfile as User
        }
      } catch (dbErr) {
        console.warn('Database error getting user profile:', dbErr)
      }

      // Fallback to creating user object from auth session
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        name: InputValidator.sanitizeText(session.user.email?.split('@')[0] || 'User'),
        avatar_url: null,
        created_at: session.user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Create user object from session
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            name: InputValidator.sanitizeText(session.user.email?.split('@')[0] || 'User'),
            avatar_url: null,
            created_at: session.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          callback(user)
        } else if (event === 'SIGNED_OUT') {
          callback(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }

  // Password Reset Methods
  async requestPasswordReset(email: string): Promise<PasswordResetResult> {
    return passwordResetService.requestReset(email)
  }

  async resetPassword(newPassword: string): Promise<PasswordResetResult> {
    return passwordResetService.resetPassword(newPassword)
  }

  async validateResetToken() {
    return passwordResetService.validateResetToken()
  }
}

export const authService = new SupabaseAuthService()