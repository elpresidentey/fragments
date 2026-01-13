import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { User, AuthResult } from '../types'
import { authService } from '../lib/services/auth'
import { userService, UserUpdateData } from '../lib/services/user'
import { storage } from '../lib/storage-adapter'
import { useToast } from './toast-context'

// Auth State Interface
interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

// Auth Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SIGN_OUT' }
  | { type: 'RESTORE_SESSION'; payload: User | null }

// Initial State
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
}

// Auth Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
        isLoading: false,
        error: null,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }
    case 'SIGN_OUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
        isLoading: false,
      }
    default:
      return state
  }
}

// Auth Context Interface
interface AuthContextType {
  state: AuthState
  signUp: (email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  clearError: () => void
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>
  resetPassword: (newPassword: string) => Promise<{ success: boolean; message: string }>
  validateResetToken: () => Promise<{ valid: boolean; expired: boolean; message: string }>
  updateProfile: (updates: UserUpdateData) => Promise<{ success: boolean; user?: User; error?: string }>
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode
}

// Auth Provider Component - Internal component that uses toast
function AuthProviderInternal({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const { showSuccess, showError } = useToast()

  // Restore session on app start
  useEffect(() => {
    let isMounted = true

    const restoreSession = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        
        // Try to get current user from Supabase
        const user = await authService.getCurrentUser()
        
        if (isMounted) {
          if (user) {
            // Cache user data
            await storage.setItem('user', JSON.stringify(user))
          }
          dispatch({ type: 'RESTORE_SESSION', payload: user })
        }
      } catch (error) {
        console.error('Session restoration error:', error)
        if (isMounted) {
          dispatch({ type: 'RESTORE_SESSION', payload: null })
        }
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      if (user) {
        // Cache user data
        await storage.setItem('user', JSON.stringify(user))
      } else {
        // Clear cached user data
        await storage.removeItem('user')
      }
      dispatch({ type: 'SET_USER', payload: user })
    })

    return unsubscribe
  }, [])

  // Sign Up Function
  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const result = await authService.signUp(email, password)

      if (result.error) {
        dispatch({ type: 'SET_ERROR', payload: result.error.message || 'Sign up failed' })
        dispatch({ type: 'SET_LOADING', payload: false })
        showError(result.error.message || 'Sign up failed')
      } else if (result.user) {
        // Cache user data
        await storage.setItem('user', JSON.stringify(result.user))
        dispatch({ type: 'SET_USER', payload: result.user })
        showSuccess('Account created successfully!')
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      dispatch({ type: 'SET_LOADING', payload: false })
      showError(errorMessage)
      return {
        user: null,
        session: null,
        error: { message: errorMessage }
      }
    }
  }

  // Sign In Function
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const result = await authService.signIn(email, password)

      if (result.error) {
        dispatch({ type: 'SET_ERROR', payload: result.error.message || 'Sign in failed' })
        dispatch({ type: 'SET_LOADING', payload: false })
        showError(result.error.message || 'Sign in failed')
      } else if (result.user) {
        // Cache user data
        await storage.setItem('user', JSON.stringify(result.user))
        dispatch({ type: 'SET_USER', payload: result.user })
        showSuccess('Welcome back!')
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      dispatch({ type: 'SET_LOADING', payload: false })
      showError(errorMessage)
      return {
        user: null,
        session: null,
        error: { message: errorMessage }
      }
    }
  }

  // Sign Out Function
  const signOut = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      await authService.signOut()
      // Clear cached user data
      await storage.removeItem('user')
      dispatch({ type: 'SIGN_OUT' })
      showSuccess('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Sign out failed' })
      dispatch({ type: 'SET_LOADING', payload: false })
      showError('Sign out failed')
    }
  }

  // Clear Error Function
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  // Password Reset Functions
  const requestPasswordReset = async (email: string) => {
    try {
      const result = await authService.requestPasswordReset(email)
      if (result.success) {
        showSuccess(result.message)
      } else {
        showError(result.message)
      }
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email'
      showError(errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const resetPassword = async (newPassword: string) => {
    try {
      const result = await authService.resetPassword(newPassword)
      if (result.success) {
        showSuccess(result.message)
      } else {
        showError(result.message)
      }
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password'
      showError(errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const validateResetToken = async () => {
    try {
      return await authService.validateResetToken()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate reset token'
      return { valid: false, expired: true, message: errorMessage }
    }
  }

  // Profile Update Function
  const updateProfile = async (updates: UserUpdateData) => {
    try {
      if (!state.user) {
        return { success: false, error: 'User not authenticated' }
      }

      dispatch({ type: 'SET_LOADING', payload: true })
      
      const result = await userService.updateProfile(state.user.id, updates)
      
      if (result.success && result.user) {
        // Update user in context state
        dispatch({ type: 'SET_USER', payload: result.user })
        
        // Update cached user data
        await storage.setItem('user', JSON.stringify(result.user))
        
        showSuccess('Profile updated successfully!')
      } else {
        showError(result.error || 'Failed to update profile')
      }
      
      dispatch({ type: 'SET_LOADING', payload: false })
      return result
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      dispatch({ type: 'SET_LOADING', payload: false })
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const contextValue: AuthContextType = {
    state,
    signUp,
    signIn,
    signOut,
    clearError,
    requestPasswordReset,
    resetPassword,
    validateResetToken,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// External Auth Provider that wraps the internal one
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthProviderInternal>
      {children}
    </AuthProviderInternal>
  )
}

// Custom Hook to use Auth Context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Additional hooks for convenience
export function useUser(): User | null {
  const { state } = useAuth()
  return state.user
}

export function useIsAuthenticated(): boolean {
  const { state } = useAuth()
  return state.isAuthenticated
}

export function useAuthLoading(): boolean {
  const { state } = useAuth()
  return state.isLoading
}

export function useAuthError(): string | null {
  const { state } = useAuth()
  return state.error
}