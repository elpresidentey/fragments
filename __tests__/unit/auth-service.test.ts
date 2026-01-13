import { authService } from '../../lib/services/auth'
import { supabase } from '../../lib/supabase'

// Mock the supabase module
jest.mock('../../lib/supabase')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

// Setup mock structure for supabase auth
beforeEach(() => {
  mockSupabase.auth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn()
  } as any
})

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock structure for each test
    mockSupabase.auth = {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn()
    } as any
  })

  describe('signUp', () => {
    it('should successfully sign up a user with valid credentials', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }
      
      const mockSession = {
        access_token: 'mock-token',
        user: mockUser
      }

      const mockUserProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'test',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          mockResolvedValue: { error: null }
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null
            })
          })
        })
      } as any)

      const result = await authService.signUp('test@example.com', 'password123')

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result.error).toBeNull()
      expect(result.user).toEqual(mockUserProfile)
    })

    it('should handle sign up errors', async () => {
      const mockError = { message: 'Email already exists' }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const result = await authService.signUp('test@example.com', 'password123')

      expect(result.error).toEqual(mockError)
      expect(result.user).toBeNull()
    })
  })

  describe('signIn', () => {
    it('should successfully sign in a user with valid credentials', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com'
      }
      
      const mockSession = {
        access_token: 'mock-token',
        user: mockUser
      }

      const mockUserProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'test',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null
            })
          })
        })
      } as any)

      const result = await authService.signIn('test@example.com', 'password123')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result.error).toBeNull()
      expect(result.user).toEqual(mockUserProfile)
    })

    it('should handle sign in errors', async () => {
      const mockError = { message: 'Invalid credentials' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const result = await authService.signIn('test@example.com', 'wrongpassword')

      expect(result.error).toEqual(mockError)
      expect(result.user).toBeNull()
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await expect(authService.signOut()).resolves.not.toThrow()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user when session exists', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com'
      }
      
      const mockSession = {
        user: mockUser
      }

      const mockUserProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'test',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null
            })
          })
        })
      } as any)

      const result = await authService.getCurrentUser()

      expect(result).toEqual(mockUserProfile)
    })

    it('should return null when no session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await authService.getCurrentUser()

      expect(result).toBeNull()
    })
  })
})