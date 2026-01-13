import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// Toast types
export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onPress: () => void
  }
}

// Toast state interface
interface ToastState {
  toasts: Toast[]
}

// Toast actions
type ToastAction =
  | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_TOASTS' }

// Initial state
const initialState: ToastState = {
  toasts: [],
}

// Toast reducer
function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      const newToast: Toast = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      }
      return {
        ...state,
        toasts: [...state.toasts, newToast],
      }
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      }
    case 'CLEAR_TOASTS':
      return {
        ...state,
        toasts: [],
      }
    default:
      return state
  }
}

// Toast context interface
interface ToastContextType {
  state: ToastState
  showToast: (toast: Omit<Toast, 'id'>) => void
  hideToast: (id: string) => void
  clearToasts: () => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Toast provider props
interface ToastProviderProps {
  children: ReactNode
}

// Toast provider component
export function ToastProvider({ children }: ToastProviderProps) {
  const [state, dispatch] = useReducer(toastReducer, initialState)

  // Show toast function
  const showToast = (toast: Omit<Toast, 'id'>) => {
    dispatch({ type: 'ADD_TOAST', payload: toast })

    // Auto-remove toast after duration
    const duration = toast.duration || 4000
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: toast.id || '' })
    }, duration)
  }

  // Hide toast function
  const hideToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id })
  }

  // Clear all toasts function
  const clearToasts = () => {
    dispatch({ type: 'CLEAR_TOASTS' })
  }

  // Convenience methods for different toast types
  const showSuccess = (message: string, duration?: number) => {
    showToast({ message, type: 'success', duration })
  }

  const showError = (message: string, duration?: number) => {
    showToast({ message, type: 'error', duration })
  }

  const showWarning = (message: string, duration?: number) => {
    showToast({ message, type: 'warning', duration })
  }

  const showInfo = (message: string, duration?: number) => {
    showToast({ message, type: 'info', duration })
  }

  const contextValue: ToastContextType = {
    state,
    showToast,
    hideToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  )
}

// Custom hook to use toast context
export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}