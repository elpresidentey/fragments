import React, { useEffect, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSequence,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown
} from 'react-native-reanimated'
import { FeedSkeleton, PostSkeleton, ProfileSkeleton, CreatePostSkeleton } from './skeleton-loader'
import { EmptyState } from './empty-state'
import { ErrorState } from './error-state'
import { LoadingIndicator } from './loading-indicator'
import { useTheme } from '@/design-system/hooks/use-theme'
import { useStateTransition } from '@/design-system/hooks/use-visual-feedback'
import { animationTiming } from '@/design-system/theme/animations'

export type StateType = 'loading' | 'content' | 'empty' | 'error' | 'refreshing'

interface StateTransitionProps {
  state: StateType
  children?: React.ReactNode
  
  // Loading state props
  loadingVariant?: 'skeleton' | 'spinner' | 'dots'
  skeletonType?: 'feed' | 'post' | 'profile' | 'create'
  loadingText?: string
  
  // Empty state props
  emptyVariant?: 'posts' | 'profile' | 'search' | 'notifications' | 'followers' | 'following' | 'media' | 'likes'
  emptyTitle?: string
  emptyDescription?: string
  emptyActionText?: string
  onEmptyAction?: () => void
  
  // Error state props
  errorVariant?: 'network' | 'server' | 'auth' | 'validation' | 'storage' | 'generic'
  errorTitle?: string
  errorDescription?: string
  errorCode?: string
  onRetry?: () => void
  onSecondaryAction?: () => void
  
  // Animation props
  animationDuration?: number
  staggerDelay?: number
  
  // Layout props
  minHeight?: number
  showTransitions?: boolean
}

export function StateTransition({
  state,
  children,
  loadingVariant = 'skeleton',
  skeletonType = 'feed',
  loadingText,
  emptyVariant = 'posts',
  emptyTitle,
  emptyDescription,
  emptyActionText,
  onEmptyAction,
  errorVariant = 'generic',
  errorTitle,
  errorDescription,
  errorCode,
  onRetry,
  onSecondaryAction,
  animationDuration = animationTiming.medium,
  staggerDelay = 100,
  minHeight = 200,
  showTransitions = true
}: StateTransitionProps) {
  const { theme } = useTheme()
  
  // Enhanced state transitions with consistent timing
  const { animatedStyle: transitionStyle, transitionTo } = useStateTransition({
    duration: animationDuration,
    staggerDelay,
  });

  // Legacy animation values for compatibility
  const opacity = useSharedValue(1)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)
  const previousState = useRef<StateType>(state)

  useEffect(() => {
    if (previousState.current !== state && showTransitions) {
      // Use enhanced state transition system
      transitionTo('hidden', 0);
      
      setTimeout(() => {
        previousState.current = state;
        
        // Determine target state based on current state
        const targetState = state === 'loading' ? 'loading' : 'visible';
        transitionTo(targetState, 0);
      }, animationDuration / 2);
    } else {
      previousState.current = state
      transitionTo('visible', 0);
    }
  }, [state, animationDuration, showTransitions, transitionTo])

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }))

  const renderLoadingState = () => {
    if (loadingVariant === 'skeleton') {
      switch (skeletonType) {
        case 'post':
          return <PostSkeleton />
        case 'profile':
          return <ProfileSkeleton />
        case 'create':
          return <CreatePostSkeleton />
        case 'feed':
        default:
          return <FeedSkeleton count={3} />
      }
    }

    return (
      <LoadingIndicator
        variant={loadingVariant === 'spinner' ? 'spinner' : 'dots'}
        text={loadingText}
        size="large"
      />
    )
  }

  const renderEmptyState = () => {
    return (
      <EmptyState
        variant={emptyVariant}
        title={emptyTitle}
        description={emptyDescription}
        actionText={emptyActionText}
        onActionPress={onEmptyAction}
        size="large"
      />
    )
  }

  const renderErrorState = () => {
    return (
      <ErrorState
        variant={errorVariant}
        title={errorTitle}
        description={errorDescription}
        errorCode={errorCode}
        onPrimaryAction={onRetry}
        onSecondaryAction={onSecondaryAction}
        size="large"
        retryable={!!onRetry}
      />
    )
  }

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return renderLoadingState()
      case 'empty':
        return renderEmptyState()
      case 'error':
        return renderErrorState()
      case 'refreshing':
        return (
          <View style={styles.refreshingContainer}>
            <View style={styles.refreshingIndicator}>
              <LoadingIndicator
                variant="spinner"
                size="small"
                text="Refreshing..."
              />
            </View>
            {children}
          </View>
        )
      case 'content':
      default:
        return children
    }
  }

  if (!showTransitions) {
    return (
      <View style={[styles.container, { minHeight }]}>
        {renderContent()}
      </View>
    )
  }

  return (
    <View style={[styles.container, { minHeight }]}>
      <Animated.View 
        style={[styles.animatedContainer, transitionStyle]}
        entering={FadeIn.duration(animationDuration)}
        exiting={FadeOut.duration(animationDuration)}
      >
        {renderContent()}
      </Animated.View>
    </View>
  )
}

// Specialized state transition components for common use cases
export function FeedStateTransition({
  isLoading,
  isEmpty,
  hasError,
  isRefreshing,
  children,
  onCreatePost,
  onRetry
}: {
  isLoading: boolean
  isEmpty: boolean
  hasError: boolean
  isRefreshing?: boolean
  children: React.ReactNode
  onCreatePost?: () => void
  onRetry?: () => void
}) {
  const getState = (): StateType => {
    if (isLoading) return 'loading'
    if (hasError) return 'error'
    if (isEmpty) return 'empty'
    if (isRefreshing) return 'refreshing'
    return 'content'
  }

  return (
    <StateTransition
      state={getState()}
      loadingVariant="skeleton"
      skeletonType="feed"
      emptyVariant="posts"
      onEmptyAction={onCreatePost}
      errorVariant="network"
      onRetry={onRetry}
    >
      {children}
    </StateTransition>
  )
}

export function ProfileStateTransition({
  isLoading,
  isEmpty,
  hasError,
  children,
  onEditProfile,
  onRetry
}: {
  isLoading: boolean
  isEmpty: boolean
  hasError: boolean
  children: React.ReactNode
  onEditProfile?: () => void
  onRetry?: () => void
}) {
  const getState = (): StateType => {
    if (isLoading) return 'loading'
    if (hasError) return 'error'
    if (isEmpty) return 'empty'
    return 'content'
  }

  return (
    <StateTransition
      state={getState()}
      loadingVariant="skeleton"
      skeletonType="profile"
      emptyVariant="profile"
      onEmptyAction={onEditProfile}
      errorVariant="network"
      onRetry={onRetry}
    >
      {children}
    </StateTransition>
  )
}

export function SearchStateTransition({
  isLoading,
  isEmpty,
  hasError,
  query,
  children,
  onClearSearch,
  onRetry
}: {
  isLoading: boolean
  isEmpty: boolean
  hasError: boolean
  query?: string
  children: React.ReactNode
  onClearSearch?: () => void
  onRetry?: () => void
}) {
  const getState = (): StateType => {
    if (isLoading) return 'loading'
    if (hasError) return 'error'
    if (isEmpty) return 'empty'
    return 'content'
  }

  return (
    <StateTransition
      state={getState()}
      loadingVariant="spinner"
      loadingText="Searching..."
      emptyVariant="search"
      emptyTitle={query ? `No results for "${query}"` : 'No results found'}
      onEmptyAction={onClearSearch}
      errorVariant="network"
      onRetry={onRetry}
    >
      {children}
    </StateTransition>
  )
}

export function CreatePostStateTransition({
  isLoading,
  hasError,
  children,
  onRetry
}: {
  isLoading: boolean
  hasError: boolean
  children: React.ReactNode
  onRetry?: () => void
}) {
  const getState = (): StateType => {
    if (isLoading) return 'loading'
    if (hasError) return 'error'
    return 'content'
  }

  return (
    <StateTransition
      state={getState()}
      loadingVariant="skeleton"
      skeletonType="create"
      errorVariant="storage"
      onRetry={onRetry}
      minHeight={300}
    >
      {children}
    </StateTransition>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  animatedContainer: {
    flex: 1,
  },
  refreshingContainer: {
    flex: 1,
    position: 'relative',
  },
  refreshingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
  },
})