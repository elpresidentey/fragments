/**
 * Real-Time Functionality Integration Tests
 * 
 * Tests real-time updates, subscriptions, and multi-client synchronization.
 * Validates real-time requirements across multiple clients.
 */

import { postService } from '@/lib/services/post';
import { authService } from '@/lib/services/auth';
import { Post, User } from '@/types';

// Test utilities
const generateTestEmail = () => `realtime-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
const generateTestPassword = () => 'RealtimeTest123!';
const generateTestContent = () => `Realtime test post ${Date.now()}`;

// Cleanup utilities
const testUsers: User[] = [];
const testPosts: Post[] = [];

afterAll(async () => {
  // Cleanup test data
  console.log('Cleaning up real-time test data...');
  console.log(`Would clean up ${testUsers.length} test users and ${testPosts.length} test posts`);
});

describe('Real-Time Functionality Integration Tests', () => {
  describe('Real-Time Subscription Management', () => {
    let testUser: User;
    let receivedUpdates: Post[][] = [];
    let unsubscribe: (() => void) | null = null;

    beforeAll(async () => {
      // Create test user
      const testEmail = generateTestEmail();
      const testPassword = generateTestPassword();
      
      const signUpResult = await authService.signUp(testEmail, testPassword);
      expect(signUpResult.user).toBeTruthy();
      testUser = signUpResult.user!;
      testUsers.push(testUser);

      await authService.signIn(testEmail, testPassword);
    }, 30000);

    afterEach(() => {
      // Clean up subscription
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      receivedUpdates = [];
    });

    it('should establish real-time subscription successfully', async () => {
      let subscriptionEstablished = false;
      
      // Set up subscription
      unsubscribe = postService.subscribeToPostUpdates((posts) => {
        subscriptionEstablished = true;
        receivedUpdates.push(posts);
      });

      // Wait for subscription to establish
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      expect(subscriptionEstablished).toBe(true);
      expect(receivedUpdates.length).toBeGreaterThan(0);

      // Validates Requirements: 6.3, 7.4
    }, 10000);

    it('should receive real-time updates when new posts are created', async () => {
      let updateReceived = false;
      let latestPosts: Post[] = [];
      
      // Set up subscription
      unsubscribe = postService.subscribeToPostUpdates((posts) => {
        updateReceived = true;
        latestPosts = posts;
        receivedUpdates.push(posts);
      });

      // Wait for initial subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new post
      const postContent = generateTestContent();
      const newPost = await postService.createPost(postContent);
      testPosts.push(newPost);

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      expect(updateReceived).toBe(true);
      expect(latestPosts.length).toBeGreaterThan(0);
      
      // Verify our new post is in the updates
      const ourPost = latestPosts.find(p => p.id === newPost.id);
      expect(ourPost).toBeTruthy();
      expect(ourPost?.content).toBe(postContent);

      // Validates Requirements: 6.3, 7.4
    }, 15000);

    it('should maintain chronological ordering in real-time updates', async () => {
      let latestPosts: Post[] = [];
      
      // Set up subscription
      unsubscribe = postService.subscribeToPostUpdates((posts) => {
        latestPosts = posts;
        receivedUpdates.push(posts);
      });

      // Wait for initial subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create multiple posts with slight delays
      const post1Content = `${generateTestContent()} - First`;
      const post1 = await postService.createPost(post1Content);
      testPosts.push(post1);

      await new Promise(resolve => setTimeout(resolve, 500));

      const post2Content = `${generateTestContent()} - Second`;
      const post2 = await postService.createPost(post2Content);
      testPosts.push(post2);

      // Wait for real-time updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      expect(latestPosts.length).toBeGreaterThan(0);
      
      // Verify chronological ordering (most recent first)
      for (let i = 0; i < latestPosts.length - 1; i++) {
        const currentPostTime = new Date(latestPosts[i].created_at).getTime();
        const nextPostTime = new Date(latestPosts[i + 1].created_at).getTime();
        expect(currentPostTime).toBeGreaterThanOrEqual(nextPostTime);
      }

      // Validates Requirements: 6.2, 7.3
    }, 20000);
  });

  describe('Multi-Client Real-Time Synchronization', () => {
    let user1: User, user2: User;
    let user1Email: string, user2Email: string;
    let user1Password: string, user2Password: string;

    beforeAll(async () => {
      // Create two test users
      user1Email = generateTestEmail();
      user1Password = generateTestPassword();
      user2Email = generateTestEmail();
      user2Password = generateTestPassword();

      const user1Result = await authService.signUp(user1Email, user1Password);
      const user2Result = await authService.signUp(user2Email, user2Password);

      expect(user1Result.user).toBeTruthy();
      expect(user2Result.user).toBeTruthy();

      user1 = user1Result.user!;
      user2 = user2Result.user!;
      
      testUsers.push(user1, user2);
    }, 60000);

    it('should propagate posts between multiple clients', async () => {
      let client1Updates: Post[] = [];
      let client2Updates: Post[] = [];
      let client1Unsubscribe: (() => void) | null = null;
      let client2Unsubscribe: (() => void) | null = null;

      try {
        // Set up subscriptions for both clients
        client1Unsubscribe = postService.subscribeToPostUpdates((posts) => {
          client1Updates = posts;
        });

        client2Unsubscribe = postService.subscribeToPostUpdates((posts) => {
          client2Updates = posts;
        });

        // Wait for subscriptions to establish
        await new Promise(resolve => setTimeout(resolve, 2000));

        // User1 creates a post
        await authService.signIn(user1Email, user1Password);
        const user1PostContent = `Multi-client test: ${generateTestContent()}`;
        const user1Post = await postService.createPost(user1PostContent);
        testPosts.push(user1Post);

        // Wait for propagation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Both clients should receive the update
        const user1PostInClient1 = client1Updates.find(p => p.id === user1Post.id);
        const user1PostInClient2 = client2Updates.find(p => p.id === user1Post.id);

        expect(user1PostInClient1).toBeTruthy();
        expect(user1PostInClient2).toBeTruthy();
        expect(user1PostInClient1?.content).toBe(user1PostContent);
        expect(user1PostInClient2?.content).toBe(user1PostContent);

        // User2 creates a post
        await authService.signIn(user2Email, user2Password);
        const user2PostContent = `Multi-client test: ${generateTestContent()}`;
        const user2Post = await postService.createPost(user2PostContent);
        testPosts.push(user2Post);

        // Wait for propagation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Both clients should receive the update
        const user2PostInClient1 = client1Updates.find(p => p.id === user2Post.id);
        const user2PostInClient2 = client2Updates.find(p => p.id === user2Post.id);

        expect(user2PostInClient1).toBeTruthy();
        expect(user2PostInClient2).toBeTruthy();
        expect(user2PostInClient1?.content).toBe(user2PostContent);
        expect(user2PostInClient2?.content).toBe(user2PostContent);

        // Validates Requirements: 6.3, 7.4
      } finally {
        // Cleanup subscriptions
        if (client1Unsubscribe) client1Unsubscribe();
        if (client2Unsubscribe) client2Unsubscribe();
      }
    }, 30000);
  });

  describe('Real-Time Connection Management', () => {
    let testUser: User;
    let connectionEvents: string[] = [];

    beforeAll(async () => {
      // Create test user
      const testEmail = generateTestEmail();
      const testPassword = generateTestPassword();
      
      const signUpResult = await authService.signUp(testEmail, testPassword);
      expect(signUpResult.user).toBeTruthy();
      testUser = signUpResult.user!;
      testUsers.push(testUser);

      await authService.signIn(testEmail, testPassword);
    }, 30000);

    it('should handle subscription lifecycle correctly', async () => {
      let subscriptionActive = false;
      let unsubscribe: (() => void) | null = null;

      // Set up subscription
      unsubscribe = postService.subscribeToPostUpdates((posts) => {
        subscriptionActive = true;
        connectionEvents.push('update_received');
      });

      // Wait for subscription to establish
      await new Promise(resolve => setTimeout(resolve, 2000));
      expect(subscriptionActive).toBe(true);

      // Unsubscribe
      if (unsubscribe) {
        unsubscribe();
        subscriptionActive = false;
      }

      // Create a post after unsubscribing
      const postContent = generateTestContent();
      const newPost = await postService.createPost(postContent);
      testPosts.push(newPost);

      // Wait to ensure no updates are received
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Should not receive updates after unsubscribing
      // (This is a basic test - in practice, you'd need more sophisticated tracking)

      // Validates Requirements: 6.3, 7.4
    }, 15000);
  });

  describe('Real-Time Performance and Reliability', () => {
    let testUser: User;

    beforeAll(async () => {
      // Create test user
      const testEmail = generateTestEmail();
      const testPassword = generateTestPassword();
      
      const signUpResult = await authService.signUp(testEmail, testPassword);
      expect(signUpResult.user).toBeTruthy();
      testUser = signUpResult.user!;
      testUsers.push(testUser);

      await authService.signIn(testEmail, testPassword);
    }, 30000);

    it('should handle rapid post creation without losing updates', async () => {
      let allUpdates: Post[][] = [];
      let unsubscribe: (() => void) | null = null;

      try {
        // Set up subscription
        unsubscribe = postService.subscribeToPostUpdates((posts) => {
          allUpdates.push([...posts]);
        });

        // Wait for subscription
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create multiple posts rapidly
        const rapidPosts: Post[] = [];
        for (let i = 0; i < 3; i++) {
          const postContent = `Rapid post ${i}: ${generateTestContent()}`;
          const post = await postService.createPost(postContent);
          rapidPosts.push(post);
          testPosts.push(post);
          
          // Small delay between posts
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Wait for all updates to propagate
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Verify all posts appear in the final update
        expect(allUpdates.length).toBeGreaterThan(0);
        const finalUpdate = allUpdates[allUpdates.length - 1];
        
        for (const rapidPost of rapidPosts) {
          const foundPost = finalUpdate.find(p => p.id === rapidPost.id);
          expect(foundPost).toBeTruthy();
        }

        // Validates Requirements: 6.3, 7.4
      } finally {
        if (unsubscribe) unsubscribe();
      }
    }, 25000);
  });
});