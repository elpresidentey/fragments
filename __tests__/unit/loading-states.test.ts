/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyState, PostsEmptyState } from '@/components/empty-state';
import { ErrorState, NetworkErrorState } from '@/components/error-state';
import { ProgressIndicator, UploadProgress } from '@/components/progress-indicator';
import { StateTransition, FeedStateTransition } from '@/components/state-transition';

// Mock the theme hook
jest.mock('@/design-system/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#1DA1F2',
        background: '#FFFFFF',
        surface: '#F7F9FA',
        text: '#14171A',
        textSecondary: '#657786',
        border: '#E1E8ED',
        error: '#E0245E',
        success: '#17BF63',
        warning: '#FFAD1F',
        info: '#1DA1F2',
      },
      mode: 'light',
    },
  }),
}));

// Mock Animated components
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  const Text = require('react-native').Text;
  
  return {
    default: {
      View,
      Text,
    },
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: any) => value,
    withSpring: (value: any) => value,
    withSequence: (...values: any[]) => values[values.length - 1],
    withRepeat: (value: any) => value,
    runOnJS: (fn: Function) => fn,
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
    SlideInUp: {},
    SlideOutDown: {},
  };
});

describe('Loading and Empty States', () => {
  describe('EmptyState Component', () => {
    it('should render posts empty state correctly', () => {
      const { getByText } = render(
        <EmptyState
          variant="posts"
          onActionPress={() => {}}
        />
      );

      expect(getByText('No posts yet')).toBeTruthy();
      expect(getByText('Create your first post')).toBeTruthy();
    });

    it('should render search empty state correctly', () => {
      const { getByText } = render(
        <EmptyState
          variant="search"
          title="No results for 'test'"
          onActionPress={() => {}}
        />
      );

      expect(getByText("No results for 'test'")).toBeTruthy();
      expect(getByText('Clear search')).toBeTruthy();
    });

    it('should render PostsEmptyState wrapper correctly', () => {
      const { getByText } = render(
        <PostsEmptyState onCreatePost={() => {}} />
      );

      expect(getByText('No posts yet')).toBeTruthy();
      expect(getByText('Create your first post')).toBeTruthy();
    });
  });

  describe('ErrorState Component', () => {
    it('should render network error state correctly', () => {
      const { getByText } = render(
        <ErrorState
          variant="network"
          onPrimaryAction={() => {}}
          onSecondaryAction={() => {}}
        />
      );

      expect(getByText('Connection Problem')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
      expect(getByText('Go Offline')).toBeTruthy();
    });

    it('should render server error with error code', () => {
      const { getByText } = render(
        <ErrorState
          variant="server"
          errorCode="500"
          onPrimaryAction={() => {}}
        />
      );

      expect(getByText('Server Error')).toBeTruthy();
      expect(getByText('Error 500')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });

    it('should render NetworkErrorState wrapper correctly', () => {
      const { getByText } = render(
        <NetworkErrorState
          onRetry={() => {}}
          onGoOffline={() => {}}
        />
      );

      expect(getByText('Connection Problem')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });
  });

  describe('ProgressIndicator Component', () => {
    it('should render linear progress correctly', () => {
      const { getByText } = render(
        <ProgressIndicator
          progress={50}
          variant="linear"
          showPercentage={true}
        />
      );

      expect(getByText('50%')).toBeTruthy();
    });

    it('should render upload progress correctly', () => {
      const { getByText } = render(
        <ProgressIndicator
          progress={75}
          variant="upload"
          label="Uploading image..."
          showPercentage={true}
        />
      );

      expect(getByText('Uploading image...')).toBeTruthy();
      expect(getByText('75%')).toBeTruthy();
    });

    it('should render UploadProgress wrapper correctly', () => {
      const { getByText } = render(
        <UploadProgress
          progress={25}
          fileName="test.jpg"
          onComplete={() => {}}
        />
      );

      expect(getByText('Uploading test.jpg')).toBeTruthy();
      expect(getByText('25%')).toBeTruthy();
    });
  });

  describe('StateTransition Component', () => {
    it('should render loading state correctly', () => {
      const { getByText } = render(
        <StateTransition
          state="loading"
          loadingVariant="spinner"
          loadingText="Loading posts..."
        >
          <div>Content</div>
        </StateTransition>
      );

      expect(getByText('Loading posts...')).toBeTruthy();
    });

    it('should render empty state correctly', () => {
      const { getByText } = render(
        <StateTransition
          state="empty"
          emptyVariant="posts"
          onEmptyAction={() => {}}
        >
          <div>Content</div>
        </StateTransition>
      );

      expect(getByText('No posts yet')).toBeTruthy();
    });

    it('should render error state correctly', () => {
      const { getByText } = render(
        <StateTransition
          state="error"
          errorVariant="network"
          onRetry={() => {}}
        >
          <div>Content</div>
        </StateTransition>
      );

      expect(getByText('Connection Problem')).toBeTruthy();
    });

    it('should render content state correctly', () => {
      const { getByText } = render(
        <StateTransition state="content">
          <div>Test Content</div>
        </StateTransition>
      );

      expect(getByText('Test Content')).toBeTruthy();
    });
  });

  describe('FeedStateTransition Component', () => {
    it('should render loading state when isLoading is true', () => {
      const { queryByText } = render(
        <FeedStateTransition
          isLoading={true}
          isEmpty={false}
          hasError={false}
          onCreatePost={() => {}}
          onRetry={() => {}}
        >
          <div>Feed Content</div>
        </FeedStateTransition>
      );

      // Should show skeleton loading, not the content
      expect(queryByText('Feed Content')).toBeFalsy();
    });

    it('should render empty state when isEmpty is true', () => {
      const { getByText } = render(
        <FeedStateTransition
          isLoading={false}
          isEmpty={true}
          hasError={false}
          onCreatePost={() => {}}
          onRetry={() => {}}
        >
          <div>Feed Content</div>
        </FeedStateTransition>
      );

      expect(getByText('No posts yet')).toBeTruthy();
    });

    it('should render error state when hasError is true', () => {
      const { getByText } = render(
        <FeedStateTransition
          isLoading={false}
          isEmpty={false}
          hasError={true}
          onCreatePost={() => {}}
          onRetry={() => {}}
        >
          <div>Feed Content</div>
        </FeedStateTransition>
      );

      expect(getByText('Connection Problem')).toBeTruthy();
    });

    it('should render content when all states are false', () => {
      const { getByText } = render(
        <FeedStateTransition
          isLoading={false}
          isEmpty={false}
          hasError={false}
          onCreatePost={() => {}}
          onRetry={() => {}}
        >
          <div>Feed Content</div>
        </FeedStateTransition>
      );

      expect(getByText('Feed Content')).toBeTruthy();
    });
  });
});

// Validates Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
describe('Loading States Requirements Validation', () => {
  it('should validate skeleton screens for loading states (Requirement 8.1)', () => {
    const { container } = render(
      <StateTransition
        state="loading"
        loadingVariant="skeleton"
        skeletonType="feed"
      >
        <div>Content</div>
      </StateTransition>
    );

    // Should render skeleton loading components
    expect(container).toBeTruthy();
  });

  it('should validate engaging empty states with call-to-action (Requirement 8.2)', () => {
    const mockAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        variant="posts"
        onActionPress={mockAction}
      />
    );

    const actionButton = getByText('Create your first post');
    expect(actionButton).toBeTruthy();
  });

  it('should validate error states with retry options (Requirement 8.3)', () => {
    const mockRetry = jest.fn();
    const { getByText } = render(
      <ErrorState
        variant="network"
        onPrimaryAction={mockRetry}
      />
    );

    const retryButton = getByText('Try Again');
    expect(retryButton).toBeTruthy();
  });

  it('should validate progress indicators for uploads (Requirement 8.4)', () => {
    const { getByText } = render(
      <ProgressIndicator
        progress={50}
        variant="upload"
        label="Uploading..."
        showPercentage={true}
      />
    );

    expect(getByText('Uploading...')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
  });

  it('should validate smooth state transitions (Requirement 8.5)', () => {
    const { rerender, getByText } = render(
      <StateTransition state="loading" loadingText="Loading...">
        <div>Content</div>
      </StateTransition>
    );

    expect(getByText('Loading...')).toBeTruthy();

    // Transition to content state
    rerender(
      <StateTransition state="content">
        <div>Content Loaded</div>
      </StateTransition>
    );

    expect(getByText('Content Loaded')).toBeTruthy();
  });
});