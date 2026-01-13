import { EnhancedPost } from '@/types';

describe('Enhanced PostCard Component', () => {
  const mockPost: EnhancedPost = {
    id: 'test-post-1',
    user_id: 'test-user-1',
    content: 'This is a test post with Twitter-like features!',
    image_url: 'https://example.com/test-image.jpg',
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
    user: {
      name: 'Test User',
      handle: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      verified: true,
    },
    engagement: {
      likes: 42,
      retweets: 12,
      comments: 8,
      isLiked: true,
      isRetweeted: false,
    },
  };

  it('should create an enhanced post with all required properties', () => {
    expect(mockPost.id).toBe('test-post-1');
    expect(mockPost.content).toBe('This is a test post with Twitter-like features!');
    expect(mockPost.user.name).toBe('Test User');
    expect(mockPost.user.handle).toBe('testuser');
    expect(mockPost.user.verified).toBe(true);
    expect(mockPost.engagement?.likes).toBe(42);
    expect(mockPost.engagement?.retweets).toBe(12);
    expect(mockPost.engagement?.comments).toBe(8);
    expect(mockPost.engagement?.isLiked).toBe(true);
    expect(mockPost.engagement?.isRetweeted).toBe(false);
  });

  it('should handle posts without engagement data', () => {
    const postWithoutEngagement: EnhancedPost = {
      ...mockPost,
      engagement: undefined,
    };

    expect(postWithoutEngagement.user.name).toBe('Test User');
    expect(postWithoutEngagement.content).toBe('This is a test post with Twitter-like features!');
    expect(postWithoutEngagement.engagement).toBeUndefined();
  });

  it('should handle posts without verified badge', () => {
    const unverifiedPost: EnhancedPost = {
      ...mockPost,
      user: {
        ...mockPost.user,
        verified: false,
      },
    };

    expect(unverifiedPost.user.name).toBe('Test User');
    expect(unverifiedPost.user.verified).toBe(false);
  });

  it('should handle posts without handle', () => {
    const postWithoutHandle: EnhancedPost = {
      ...mockPost,
      user: {
        ...mockPost.user,
        handle: undefined,
      },
    };

    expect(postWithoutHandle.user.name).toBe('Test User');
    expect(postWithoutHandle.user.handle).toBeUndefined();
  });

  it('should maintain all original Post properties', () => {
    expect(mockPost.id).toBeDefined();
    expect(mockPost.user_id).toBeDefined();
    expect(mockPost.content).toBeDefined();
    expect(mockPost.created_at).toBeDefined();
    expect(mockPost.updated_at).toBeDefined();
    expect(mockPost.user).toBeDefined();
  });
});