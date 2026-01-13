import { commentService } from '@/lib/services/comment';
import { Comment } from '@/types';

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'comment-1',
              post_id: 'post-1',
              user_id: 'user-1',
              content: 'Test comment',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              user: {
                name: 'Test User',
                avatar_url: null,
              },
            },
            error: null,
          })),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [],
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: null,
                error: null,
              })),
            })),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            error: null,
          })),
        })),
      })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => Promise.resolve()),
      })),
    })),
    removeChannel: jest.fn(),
  },
}));

// Mock the security utils
jest.mock('@/lib/security/security-utils', () => ({
  SecurityUtils: {
    secureOperation: jest.fn((fn) => fn()),
    validatePostData: jest.fn(() => ({
      isValid: true,
      sanitizedContent: 'Test comment',
    })),
    canPerformAction: jest.fn(() => Promise.resolve({ allowed: true })),
    logSecurityEvent: jest.fn(),
  },
  AuthGuard: {
    getCurrentUserId: jest.fn(() => Promise.resolve('user-1')),
    requireResourceOwnership: jest.fn(() => Promise.resolve()),
  },
}));

describe('CommentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      const result = await commentService.createComment('post-1', 'Test comment');

      expect(result).toEqual({
        id: 'comment-1',
        post_id: 'post-1',
        user_id: 'user-1',
        content: 'Test comment',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: {
          name: 'Test User',
          avatar_url: null,
        },
      });
    });

    it('should throw error for empty content', async () => {
      await expect(commentService.createComment('post-1', '')).rejects.toThrow(
        'Post ID and content are required'
      );
    });

    it('should throw error for missing post ID', async () => {
      await expect(commentService.createComment('', 'Test comment')).rejects.toThrow(
        'Post ID and content are required'
      );
    });
  });

  describe('getComments', () => {
    it('should get comments for a post', async () => {
      const result = await commentService.getComments('post-1');

      expect(result).toEqual([]);
    });

    it('should throw error for missing post ID', async () => {
      await expect(commentService.getComments('')).rejects.toThrow(
        'Post ID is required'
      );
    });
  });

  describe('subscribeToCommentUpdates', () => {
    it('should set up real-time subscription', () => {
      const callback = jest.fn();
      const unsubscribe = commentService.subscribeToCommentUpdates('post-1', callback);

      expect(typeof unsubscribe).toBe('function');
    });
  });
});