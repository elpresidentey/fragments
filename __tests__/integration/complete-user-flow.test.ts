/**
 * Complete User Flow Integration Tests
 * 
 * Tests the complete user journey from registration to posting and viewing content.
 * Validates all requirements integration as specified in task 10.1.
 */

import { authService } from '@/lib/services/auth';
import { postService } from '@/lib/services/post';
import { User, Post } from '@/types';

// Mock localStorage for testing environment
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Test utilities
const generateTestEmail = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
const generateTestPassword = () => 'TestPassword123!';
const generateTestContent = () => `Test post content ${Date.now()}`;

// Cleanup utilities
const testUsers: User[] = [];
const testPosts: Post[] = [];

afterAll(async () => {
  // Cleanup test data
  console.log('Cleaning up test data...');
  
  // Note: In a real app, you'd want proper cleanup mechanisms
  // For now, we'll just log the cleanup intent
  console.log(`Would clean up ${testUsers.length} test users and ${testPosts.length} test posts`);
});

describe('Complete User Flow Integration Tests', () => {
  describe('User Registration to First Post Flow', () => {
    let testUser: User;
    let testEmail: string;
    let testPassword: string;

    beforeAll(() => {
      testEmail = generateTestEmail();
      testPassword = generateTestPassword();
    });

    it('should complete the full registration flow', async () => {
      // Step 1: Register new user
      const signUpResult = await authService.signUp(testEmail, testPassword);
      
      expect(signUpResult.error).toBeNull();
      expect(signUpResult.user).toBeTruthy();
      expect(signUpResult.user?.email).toBe(testEmail);
      
      if (signUpResult.user) {
        testUser = signUpResult.user;
        testUsers.push(testUser);
      }

      // Validates Requirements: 1.1, 1.4
    }, 30000);

    it('should authenticate the registered user', async () => {
      // Step 2: Sign in with registered credentials
      const signInResult = await authService.signIn(testEmail, testPassword);
      
      expect(signInResult.error).toBeNull();
      expect(signInResult.user).toBeTruthy();
      expect(signInResult.user?.id).toBe(testUser.id);
      expect(signInResult.session).toBeTruthy();

      // Validates Requirements: 2.1, 2.3, 2.4
    }, 15000);

    it('should maintain session persistence', async () => {
      // Step 3: Verify session persistence
      const currentUser = await authService.getCurrentUser();
      
      expect(currentUser).toBeTruthy();
      expect(currentUser?.id).toBe(testUser.id);
      expect(currentUser?.email).toBe(testEmail);

      // Validates Requirements: 2.5
    }, 10000);

    it('should create a text-only post', async () => {
      // Step 4: Create first post (text only)
      const postContent = generateTestContent();
      const newPost = await postService.createPost(postContent);
      
      expect(newPost).toBeTruthy();
      expect(newPost.content).toBe(postContent);
      expect(newPost.user_id).toBe(testUser.id);
      expect(newPost.image_url).toBeUndefined();
      expect(newPost.created_at).toBeTruthy();
      
      testPosts.push(newPost);

      // Validates Requirements: 4.1, 4.3, 4.4, 4.5
    }, 15000);

    it('should retrieve posts in chronological order', async () => {
      // Step 5: Verify post appears in feed with correct ordering
      const posts = await postService.getPosts(10, 0);
      
      expect(posts.length).toBeGreaterThan(0);
      
      // Find our test post
      const ourPost = posts.find(p => p.user_id === testUser.id);
      expect(ourPost).toBeTruthy();
      expect(ourPost?.content).toBe(testPosts[0].content);
      
      // Verify chronological ordering (most recent first)
      for (let i = 0; i < posts.length - 1; i++) {
        const currentPostTime = new Date(posts[i].created_at).getTime();
        const nextPostTime = new Date(posts[i + 1].created_at).getTime();
        expect(currentPostTime).toBeGreaterThanOrEqual(nextPostTime);
      }

      // Validates Requirements: 6.1, 6.2, 7.3
    }, 15000);

    it('should show user posts in profile', async () => {
      // Step 6: Verify post appears in user profile
      const userPosts = await postService.getUserPosts(testUser.id);
      
      expect(userPosts.length).toBeGreaterThan(0);
      
      const ourPost = userPosts.find(p => p.id === testPosts[0].id);
      expect(ourPost).toBeTruthy();
      expect(ourPost?.content).toBe(testPosts[0].content);
      expect(ourPost?.user_id).toBe(testUser.id);

      // Validates Requirements: 7.1, 7.2, 7.5
    }, 15000);
  });

  describe('Multi-User Real-Time Flow', () => {
    let user1: User, user2: User;
    let user1Email: string, user2Email: string;
    let user1Password: string, user2Password: string;

    beforeAll(async () => {
      // Create two test users for real-time testing
      user1Email = generateTestEmail();
      user1Password = generateTestPassword();
      user2Email = generateTestEmail();
      user2Password = generateTestPassword();

      // Register both users
      const user1Result = await authService.signUp(user1Email, user1Password);
      const user2Result = await authService.signUp(user2Email, user2Password);

      expect(user1Result.user).toBeTruthy();
      expect(user2Result.user).toBeTruthy();

      user1 = user1Result.user!;
      user2 = user2Result.user!;
      
      testUsers.push(user1, user2);
    }, 60000);

    it('should handle posts from multiple users', async () => {
      // Sign in as user1 and create a post
      await authService.signIn(user1Email, user1Password);
      const user1PostContent = `User1 post: ${generateTestContent()}`;
      const user1Post = await postService.createPost(user1PostContent);
      testPosts.push(user1Post);

      // Sign in as user2 and create a post
      await authService.signIn(user2Email, user2Password);
      const user2PostContent = `User2 post: ${generateTestContent()}`;
      const user2Post = await postService.createPost(user2PostContent);
      testPosts.push(user2Post);

      // Verify both posts appear in global feed
      const allPosts = await postService.getPosts(20, 0);
      
      const user1PostInFeed = allPosts.find(p => p.id === user1Post.id);
      const user2PostInFeed = allPosts.find(p => p.id === user2Post.id);
      
      expect(user1PostInFeed).toBeTruthy();
      expect(user2PostInFeed).toBeTruthy();
      expect(user1PostInFeed?.content).toBe(user1PostContent);
      expect(user2PostInFeed?.content).toBe(user2PostContent);

      // Validates Requirements: 6.1, 6.4, 7.4
    }, 30000);

    it('should isolate user data correctly', async () => {
      // Verify user1 only sees their own posts in profile
      const user1Posts = await postService.getUserPosts(user1.id);
      const user1PostIds = user1Posts.map(p => p.user_id);
      
      // All posts should belong to user1
      expect(user1PostIds.every(id => id === user1.id)).toBe(true);
      
      // Verify user2 only sees their own posts in profile
      const user2Posts = await postService.getUserPosts(user2.id);
      const user2PostIds = user2Posts.map(p => p.user_id);
      
      // All posts should belong to user2
      expect(user2PostIds.every(id => id === user2.id)).toBe(true);

      // Validates Requirements: 7.2
    }, 15000);
  });

  describe('Content Type Flexibility Flow', () => {
    let testUser: User;
    let testEmail: string;
    let testPassword: string;

    beforeAll(async () => {
      testEmail = generateTestEmail();
      testPassword = generateTestPassword();

      const signUpResult = await authService.signUp(testEmail, testPassword);
      expect(signUpResult.user).toBeTruthy();
      testUser = signUpResult.user!;
      testUsers.push(testUser);

      await authService.signIn(testEmail, testPassword);
    }, 30000);

    it('should handle text-only posts', async () => {
      const textContent = generateTestContent();
      const post = await postService.createPost(textContent);
      
      expect(post.content).toBe(textContent);
      expect(post.image_url).toBeUndefined();
      expect(post.user_id).toBe(testUser.id);
      
      testPosts.push(post);

      // Validates Requirements: 4.1, 4.2
    }, 15000);

    it('should handle image-only posts', async () => {
      // Create a post with only an image (empty text)
      const mockImageUrl = 'https://example.com/test-image.jpg';
      const post = await postService.createPost('', mockImageUrl);
      
      expect(post.content).toBe('');
      expect(post.image_url).toBe(mockImageUrl);
      expect(post.user_id).toBe(testUser.id);
      
      testPosts.push(post);

      // Validates Requirements: 5.4
    }, 15000);

    it('should handle text and image posts', async () => {
      const textContent = generateTestContent();
      const mockImageUrl = 'https://example.com/test-image-2.jpg';
      const post = await postService.createPost(textContent, mockImageUrl);
      
      expect(post.content).toBe(textContent);
      expect(post.image_url).toBe(mockImageUrl);
      expect(post.user_id).toBe(testUser.id);
      
      testPosts.push(post);

      // Validates Requirements: 5.1, 5.3, 5.5
    }, 15000);
  });

  describe('Authentication State Management Flow', () => {
    let testUser: User;
    let testEmail: string;
    let testPassword: string;

    beforeAll(async () => {
      testEmail = generateTestEmail();
      testPassword = generateTestPassword();

      const signUpResult = await authService.signUp(testEmail, testPassword);
      expect(signUpResult.user).toBeTruthy();
      testUser = signUpResult.user!;
      testUsers.push(testUser);
    }, 30000);

    it('should handle complete authentication lifecycle', async () => {
      // Step 1: Sign in
      const signInResult = await authService.signIn(testEmail, testPassword);
      expect(signInResult.user).toBeTruthy();
      expect(signInResult.session).toBeTruthy();

      // Step 2: Verify authenticated state
      const currentUser = await authService.getCurrentUser();
      expect(currentUser?.id).toBe(testUser.id);

      // Step 3: Sign out
      await authService.signOut();

      // Step 4: Verify signed out state
      const userAfterSignOut = await authService.getCurrentUser();
      expect(userAfterSignOut).toBeNull();

      // Validates Requirements: 2.1, 2.3, 3.1, 3.2, 3.3, 3.4
    }, 30000);

    it('should reject invalid credentials', async () => {
      const invalidResult = await authService.signIn(testEmail, 'wrongpassword');
      
      expect(invalidResult.error).toBeTruthy();
      expect(invalidResult.user).toBeNull();
      expect(invalidResult.session).toBeNull();

      // Validates Requirements: 2.2
    }, 15000);
  });

  describe('Error Handling and Validation Flow', () => {
    it('should reject empty post content when no image provided', async () => {
      // This should fail since we have neither text nor image
      await expect(postService.createPost('')).rejects.toThrow();

      // Validates Requirements: 4.2
    }, 10000);

    it('should reject invalid email formats during registration', async () => {
      const invalidEmails = [
        'invalid-email',
        'missing@domain',
        '@missing-local.com',
        'spaces in@email.com'
      ];

      for (const email of invalidEmails) {
        const result = await authService.signUp(email, generateTestPassword());
        expect(result.error).toBeTruthy();
        expect(result.user).toBeNull();
      }

      // Validates Requirements: 1.2
    }, 30000);

    it('should reject weak passwords during registration', async () => {
      const weakPasswords = [
        '123',      // too short
        'weak',     // too short
        '12345',    // too short
      ];

      for (const password of weakPasswords) {
        const result = await authService.signUp(generateTestEmail(), password);
        expect(result.error).toBeTruthy();
        expect(result.user).toBeNull();
      }

      // Validates Requirements: 1.3
    }, 30000);
  });

  describe('Cross-View Consistency Flow', () => {
    let testUser: User;
    let testPost: Post;

    beforeAll(async () => {
      const testEmail = generateTestEmail();
      const testPassword = generateTestPassword();

      const signUpResult = await authService.signUp(testEmail, testPassword);
      expect(signUpResult.user).toBeTruthy();
      testUser = signUpResult.user!;
      testUsers.push(testUser);

      await authService.signIn(testEmail, testPassword);

      // Create a test post
      const postContent = generateTestContent();
      testPost = await postService.createPost(postContent);
      testPosts.push(testPost);
    }, 45000);

    it('should show consistent post data across global feed and user profile', async () => {
      // Get post from global feed
      const globalPosts = await postService.getPosts(50, 0);
      const postInGlobalFeed = globalPosts.find(p => p.id === testPost.id);
      
      // Get post from user profile
      const userPosts = await postService.getUserPosts(testUser.id);
      const postInProfile = userPosts.find(p => p.id === testPost.id);
      
      // Both should exist and be identical
      expect(postInGlobalFeed).toBeTruthy();
      expect(postInProfile).toBeTruthy();
      
      // Verify all key fields match
      expect(postInGlobalFeed?.id).toBe(postInProfile?.id);
      expect(postInGlobalFeed?.content).toBe(postInProfile?.content);
      expect(postInGlobalFeed?.user_id).toBe(postInProfile?.user_id);
      expect(postInGlobalFeed?.created_at).toBe(postInProfile?.created_at);
      expect(postInGlobalFeed?.image_url).toBe(postInProfile?.image_url);

      // Validates Requirements: 7.5
    }, 15000);
  });
});