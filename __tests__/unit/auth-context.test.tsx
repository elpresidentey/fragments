import React from 'react'
import { render, act, waitFor } from '@testing-library/react-native'
import { AuthProvider, useAuth } from '../../contexts/auth-context'
import { authService } from '../../lib/services/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mock the auth service
jest.mock('../../lib/services/auth')

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}))

const mockAuthService = authService as jest.Mocked<typeof authService>
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>

// Test component to access auth context
const TestComponent = () => {
  const { state, signIn, signUp, signOut } = useAuth()
  
  return (
    <>
      {state.isAuthenticated && <div testID="authenticated">Authenticated</div>}
      {state.isLoading && <div testID="loading">Loading</div>}
      {state.error && <div testID="error">{state.error}</div>}
      {state.user && <div testID="user">{state.user.email}</div>}
    </>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAsyncStorage.setItem.mockResolvedValue()
    mockAsyncStorage.getItem.mockResolvedValue(null)
    mockAsyncStorage.removeItem.mockResolvedValue()
  })

  it('should provide initial state', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null)
    mockAuthService.onAuthStateChange.mockReturnValue(() => {})

    const { queryByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially should be loading
    expect(queryByTestId('loading')).toBeTruthy()
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByTestId('loading')).toBeNull()
    }, { timeout: 10000 })

    expect(queryByTestId('authenticated')).toBeNull()
    expect(queryByTestId('user')).toBeNull()
  }, 15000)

  it('should restore user session on mount', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'test',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
    mockAuthService.onAuthStateChange.mockReturnValue(() => {})

    const { getByTestId, queryByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(queryByTestId('loading')).toBeNull()
    }, { timeout: 10000 })

    expect(getByTestId('authenticated')).toBeTruthy()
    expect(getByTestId('user')).toBeTruthy()
  }, 15000)

  it('should handle auth state changes', async () => {
    let authStateCallback: (user: any) => void = () => {}
    
    mockAuthService.getCurrentUser.mockResolvedValue(null)
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return () => {}
    })

    const { getByTestId, queryByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(queryByTestId('loading')).toBeNull()
    }, { timeout: 10000 })

    // Simulate user sign in
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'test',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    await act(async () => {
      authStateCallback(mockUser)
    })

    await waitFor(() => {
      expect(getByTestId('authenticated')).toBeTruthy()
      expect(getByTestId('user')).toBeTruthy()
    })

    // Simulate user sign out
    await act(async () => {
      authStateCallback(null)
    })

    await waitFor(() => {
      expect(queryByTestId('authenticated')).toBeNull()
      expect(queryByTestId('user')).toBeNull()
    })
  }, 15000)
})