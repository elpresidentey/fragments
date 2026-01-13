import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// Error types
export interface AppError {
  id: string
  message: string
  type: 'network' | 'validation' | 'auth' | 'storage' | 'unknown'
  timestamp: Date
  retryable: boolean
  details?: any
}

// Error state interface
interface ErrorState {
  errors: AppError[]
  isRetrying: boolean
}

// Error actions
type ErrorAction =
  | { type: 'ADD_ERROR'; payload: Omit<AppError, 'id' | 'timestamp'> }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_RETRYING'; payload: boolean }

// Initial state
const initialState: ErrorState = {
  errors: [],
  isRetrying: false,
}

// Error reducer
function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
  switch (action.type) {
    case 'ADD_ERROR':
      const newError: AppError = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      }
      return {
        ...state,
        errors: [...state.errors, newError],
      }
    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload),
      }
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      }
    case 'SET_RETRYING':
      return {
        ...state,
        isRetrying: action.payload,
      }
    default:
      return state
  }
}

// Error context interface
interface ErrorContextType {
  state: ErrorState
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void
  removeError: (id: string) => void
  clearErrors: () => void
  retryOperation: (operation: () => Promise<void>) => Promise<void>
}

// Create context
const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

// Error provider props
interface ErrorProviderProps {
  children: ReactNode
}

// Error provider component
export function ErrorProvider({ children }: ErrorProviderProps) {
  const [state, dispatch] = useReducer(errorReducer, initialState)

  // Add error function
  const addError = (error: Omit<AppError, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_ERROR', payload: error })
  }

  // Remove error function
  const removeError = (id: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: id })
  }

  // Clear all errors function
  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' })
  }

  // Retry operation with exponential backoff
  const retryOperation = async (operation: () => Promise<void>): Promise<void> => {
    const maxRetries = 3
    const baseDelay = 1000 // 1 second

    dispatch({ type: 'SET_RETRYING', payload: true })

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await operation()
        dispatch({ type: 'SET_RETRYING', payload: false })
        return
      } catch (error) {
        if (attempt === maxRetries - 1) {
          // Last attempt failed
          dispatch({ type: 'SET_RETRYING', payload: false })
          
          // Determine error type
          let errorType: AppError['type'] = 'unknown'
          if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
              errorType = 'network'
            } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
              errorType = 'auth'
            }
          }

          addError({
            message: error instanceof Error ? error.message : 'Operation failed after retries',
            type: errorType,
            retryable: true,
            details: { attempts: maxRetries, lastError: error }
          })
          throw error
        }

        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  const contextValue: ErrorContextType = {
    state,
    addError,
    removeError,
    clearErrors,
    retryOperation,
  }

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  )
}

// Custom hook to use error context
export function useError(): ErrorContextType {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

// Utility functions for common error scenarios
export const createNetworkError = (message: string, details?: any): Omit<AppError, 'id' | 'timestamp'> => ({
  message,
  type: 'network',
  retryable: true,
  details,
})

export const createValidationError = (message: string, details?: any): Omit<AppError, 'id' | 'timestamp'> => ({
  message,
  type: 'validation',
  retryable: false,
  details,
})

export const createAuthError = (message: string, details?: any): Omit<AppError, 'id' | 'timestamp'> => ({
  message,
  type: 'auth',
  retryable: false,
  details,
})

export const createStorageError = (message: string, details?: any): Omit<AppError, 'id' | 'timestamp'> => ({
  message,
  type: 'storage',
  retryable: true,
  details,
})