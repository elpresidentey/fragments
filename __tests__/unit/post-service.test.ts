import { postService } from '../../lib/services/post'
import { supabase } from '../../lib/supabase'

// Mock Supabase
jest.mock('../../lib/supabase')
const mockSupabase = supabase as jest.Mocked<typeof supabase>

beforeEach(() => {
  jest.clearAllMocks()
  
  // Setup default mocks
  mockSupabase.auth = {
    getUser: jest.fn(),
  } as any
  
  mockSupabase.from = jest.fn().mockReturnValue({
    insert: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
    single: jest.fn(),
  })
  
  mockSupabase.channel = jest.fn()
  mockSupabase.removeChannel = jest.fn()
})

describe('PostService', () => {
  describe('Service Initialization', () => {
    it('should be properly instantiated', () => {
      expect(postService).toBeDefined()
      expect(typeof postService.createPost).toBe('function')
      expect(typeof postService.getPosts).toBe('function')
      expect(typeof postService.getUserPosts).toBe('function')
      expect(typeof postService.subscribeToPostUpdates).toBe('function')
    })
  })

  describe('createPost', () => {
    it('should reject empty content', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any)

      await expect(postService.createPost('')).rejects.toThrow('Post must have either text content or an image')
      await expect(postService.createPost('   ')).rejects.toThrow('Post must have either text content or an image')
    })

    it('should require authenticated user', async () => {
      // Mock no user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      await expect(postService.createPost('Test content')).rejects.toThrow('User not authenticated')
    })
  })

  describe('getPosts', () => {
    it('should handle empty results', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
      
      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await postService.getPosts()
      expect(result).toEqual([])
    })
  })

  describe('getUserPosts', () => {
    it('should require userId parameter', async () => {
      await expect(postService.getUserPosts('')).rejects.toThrow('User ID is required')
    })
  })

  describe('subscribeToPostUpdates', () => {
    it('should return unsubscribe function', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      }
      
      mockSupabase.channel.mockReturnValue(mockChannel as any)

      const callback = jest.fn()
      const unsubscribe = postService.subscribeToPostUpdates(callback)
      
      expect(typeof unsubscribe).toBe('function')
      expect(mockSupabase.channel).toHaveBeenCalledWith('posts_changes')
    })
  })
})