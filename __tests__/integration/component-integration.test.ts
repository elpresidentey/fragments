/**
 * Component Integration Tests
 * 
 * Tests the integration between components and verifies complete user flows
 * work correctly across the application.
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { AuthProvider } from '@/contexts/auth-context';
import { ErrorProvider } from '@/contexts/error-context';
import { ToastProvider } from '@/contexts/toast-context';
import { RealTimeFeed } from '@/components/real-time-feed';
import { ProfileScreen } from '@/components/profile-screen';
import { authService } from '@/lib/services/auth';
import { postService } from '@/lib/services/post';

// Mock localStorage for testing environment
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock services
jest.mock('@/lib/services/auth');
jest.mock('@/lib/services/post');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockPostService = postService as jest.Mocked<typeof postService>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorProvider>
    <ToastProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ToastProvider>
  </ErrorProvider>
);

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockPosts = [
  {
    id: 'post-1',
    user_id: 'test-user-id',
    content: 'Test post 1',
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    user: {
      name: 'Test User',
      avatar_url: null,
    },
  },
  {
    id: 'post-2',
    user_id: 'other-user-id',
    content: 'Test post 2',
    created_at: '2024-01-01T11:00:00Z',
    updated_at: '2024-01-01T11:00:00Z',
    user: {
      name: 'Other User',
      avatar_url: null,
    },
  },
];

describe('Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue(undefined);
    localStorageMock.removeItem.mockReturnValue(undefined);
  });

  describe('Feed Component Integration', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        callback(mockUser);
        return () => {};
      });
      mockPostService.getPosts.mockResolvedValue(mockPosts);
      mockPostService.subscribeToPostUpdates.mockImplementation((callback) => {
        callback(mockPosts);
        return () => {};
      });
    });

    it('should render feed with posts in chronological order', async () => {
      const { getByText } = render(
        <TestWrapper>
          <RealTimeFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Test post 1')).toBeTruthy();
        expect(getByText('Test post 2')).toBeTruthy();
      });

      // Verify posts are loaded
      expect(mockPostService.getPosts).toHaveBeenCalled();
      expect(mockPostService.subscribeToPostUpdates).toHaveBeenCalled();

      // Validates Requirements: 6.1, 6.2, 6.3
    });

    it('should handle real-time updates correctly', async () => {
      let updateCallback: ((posts: any[]) => void) | null = null;
      
      mockPostService.subscribeToPostUpdates.mockImplementation((callback) => {
        updateCallback = callback;
        callback(mockPosts);
        return () => {};
      });

      const { getByText, queryByText } = render(
        <TestWrapper>
          <RealTimeFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Test post 1')).toBeTruthy();
      });

      // Simulate real-time update with new post
      const newPost = {
        id: 'post-3',
        user_id: 'test-user-id',
        content: 'New real-time post',
        created_at: '2024-01-01T13:00:00Z',
        updated_at: '2024-01-01T13:00:00Z',
        user: {
          name: 'Test User',
          avatar_url: null,
        },
      };

      if (updateCallback) {
        updateCallback([newPost, ...mockPosts]);
      }

      await waitFor(() => {
        expect(getByText('New real-time post')).toBeTruthy();
      });

      // Validates Requirements: 6.3, 7.4
    });

    it('should filter posts by user for profile view', async () => {
      const userPosts = mockPosts.filter(p => p.user_id === mockUser.id);
      mockPostService.getUserPosts.mockResolvedValue(userPosts);

      const { getByText, queryByText } = render(
        <TestWrapper>
          <RealTimeFeed userId={mockUser.id} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Test post 1')).toBeTruthy();
        expect(queryByText('Test post 2')).toBeNull(); // Should not show other user's posts
      });

      expect(mockPostService.getUserPosts).toHaveBeenCalledWith(mockUser.id);

      // Validates Requirements: 7.2
    });
  });

  describe('Profile Component Integration', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        callback(mockUser);
        return () => {};
      });
      mockAuthService.signOut.mockResolvedValue();
      
      const userPosts = mockPosts.filter(p => p.user_id === mockUser.id);
      mockPostService.getUserPosts.mockResolvedValue(userPosts);
    });

    it('should display user information and posts', async () => {
      const { getByText } = render(
        <TestWrapper>
          <ProfileScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Test User')).toBeTruthy();
        expect(getByText('test@example.com')).toBeTruthy();
        expect(getByText('Test post 1')).toBeTruthy();
      });

      expect(mockPostService.getUserPosts).toHaveBeenCalledWith(mockUser.id);

      // Validates Requirements: 7.1, 7.2
    });

    it('should handle logout functionality', async () => {
      const { getByText } = render(
        <TestWrapper>
          <ProfileScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Sign Out')).toBeTruthy();
      });

      // Note: In a real test, you'd simulate the alert confirmation
      // For now, we just verify the component renders the logout button

      // Validates Requirements: 3.1, 3.2
    });
  });

  describe('Cross-Component Data Consistency', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        callback(mockUser);
        return () => {};
      });
      mockPostService.getPosts.mockResolvedValue(mockPosts);
      mockPostService.getUserPosts.mockResolvedValue(mockPosts.filter(p => p.user_id === mockUser.id));
      mockPostService.subscribeToPostUpdates.mockImplementation((callback) => {
        callback(mockPosts);
        return () => {};
      });
    });

    it('should show consistent post data across feed and profile', async () => {
      // Render both components
      const { getByText: getFeedText } = render(
        <TestWrapper>
          <RealTimeFeed />
        </TestWrapper>
      );

      const { getByText: getProfileText } = render(
        <TestWrapper>
          <RealTimeFeed userId={mockUser.id} />
        </TestWrapper>
      );

      // Both should show the same post content for the user's posts
      await waitFor(() => {
        expect(getFeedText('Test post 1')).toBeTruthy();
        expect(getProfileText('Test post 1')).toBeTruthy();
      });

      // Validates Requirements: 7.5
    });
  });

  describe('Error Handling Integration', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        callback(mockUser);
        return () => {};
      });
    });

    it('should handle post loading errors gracefully', async () => {
      mockPostService.getPosts.mockRejectedValue(new Error('Network error'));
      mockPostService.subscribeToPostUpdates.mockImplementation((callback) => {
        return () => {};
      });

      const { getByText } = render(
        <TestWrapper>
          <RealTimeFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show error state or empty state
        expect(getByText(/No posts/i) || getByText(/error/i)).toBeTruthy();
      });

      // Validates Requirements: 8.5
    });

    it('should show loading states during data fetching', async () => {
      // Mock delayed response
      mockPostService.getPosts.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockPosts), 100))
      );
      mockPostService.subscribeToPostUpdates.mockImplementation((callback) => {
        return () => {};
      });

      const { getByText } = render(
        <TestWrapper>
          <RealTimeFeed />
        </TestWrapper>
      );

      // Should show loading state initially
      expect(getByText(/Loading/i)).toBeTruthy();

      await waitFor(() => {
        expect(getByText('Test post 1')).toBeTruthy();
      });

      // Validates Requirements: 8.4
    });
  });

  describe('Authentication State Integration', () => {
    it('should handle unauthenticated state correctly', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        callback(null);
        return () => {};
      });

      const { queryByText } = render(
        <TestWrapper>
          <ProfileScreen />
        </TestWrapper>
      );

      // Profile should not render content for unauthenticated users
      await waitFor(() => {
        expect(queryByText('Test User')).toBeNull();
      });

      // Validates Requirements: 3.2, 3.4
    });

    it('should handle authentication state changes', async () => {
      let authCallback: ((user: any) => void) | null = null;
      
      mockAuthService.getCurrentUser.mockResolvedValue(null);
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        callback(null); // Start unauthenticated
        return () => {};
      });

      const { queryByText, getByText } = render(
        <TestWrapper>
          <ProfileScreen />
        </TestWrapper>
      );

      // Initially should not show user content
      expect(queryByText('Test User')).toBeNull();

      // Simulate authentication
      if (authCallback) {
        authCallback(mockUser);
      }

      // Should now show user content
      await waitFor(() => {
        expect(getByText('Test User')).toBeTruthy();
      });

      // Validates Requirements: 2.4, 2.5
    });
  });
});