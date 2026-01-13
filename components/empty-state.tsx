import React from 'react'
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedProps
} from 'react-native-reanimated'
import { ThemedText } from './themed-text'
import { ThemedView } from './themed-view'
import { useTheme } from '@/design-system/hooks/use-theme'

const { width: screenWidth } = Dimensions.get('window')

interface EmptyStateProps {
  variant: 'posts' | 'profile' | 'search' | 'notifications' | 'followers' | 'following' | 'media' | 'likes'
  title?: string
  description?: string
  actionText?: string
  onActionPress?: () => void
  showAnimation?: boolean
  customIcon?: string
  size?: 'small' | 'medium' | 'large'
}

export function EmptyState({
  variant,
  title,
  description,
  actionText,
  onActionPress,
  showAnimation = true,
  customIcon,
  size = 'medium'
}: EmptyStateProps) {
  const { theme } = useTheme()
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  // Animation values for floating effect
  const floatY = useSharedValue(0)

  React.useEffect(() => {
    // Entry animation
    opacity.value = withTiming(1, { duration: 600 })
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 })
    
    // Floating animation for icons
    if (showAnimation) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 2000 }),
          withTiming(5, { duration: 2000 })
        ),
        -1,
        true
      )
    }
  }, [opacity, translateY, floatY, showAnimation])

  const getEmptyStateConfig = () => {
    const configs = {
      posts: {
        icon: '📝',
        title: 'No posts yet',
        description: 'When you share your thoughts, they\'ll appear here.',
        actionText: 'Create your first post',
        color: theme.colors.primary,
      },
      profile: {
        icon: '👤',
        title: 'Complete your profile',
        description: 'Add a bio and profile picture to help others get to know you.',
        actionText: 'Edit profile',
        color: theme.colors.primary,
      },
      search: {
        icon: '🔍',
        title: 'No results found',
        description: 'Try searching for something else or check your spelling.',
        actionText: 'Clear search',
        color: theme.colors.textSecondary,
      },
      notifications: {
        icon: '🔔',
        title: 'No notifications',
        description: 'When someone interacts with your posts, you\'ll see it here.',
        actionText: 'Create a post',
        color: theme.colors.info,
      },
      followers: {
        icon: '👥',
        title: 'No followers yet',
        description: 'Share interesting content to attract followers.',
        actionText: 'Find people to follow',
        color: theme.colors.success,
      },
      following: {
        icon: '➕',
        title: 'Not following anyone',
        description: 'Follow people to see their posts in your feed.',
        actionText: 'Discover people',
        color: theme.colors.primary,
      },
      media: {
        icon: '📷',
        title: 'No photos or videos',
        description: 'Posts with photos and videos will appear here.',
        actionText: 'Share a photo',
        color: theme.colors.warning,
      },
      likes: {
        icon: '❤️',
        title: 'No likes yet',
        description: 'Posts you like will appear here.',
        actionText: 'Explore posts',
        color: theme.colors.error,
      },
    }

    return configs[variant] || configs.posts
  }

  const config = getEmptyStateConfig()
  const finalTitle = title || config.title
  const finalDescription = description || config.description
  const finalActionText = actionText || config.actionText
  const finalIcon = customIcon || config.icon

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 40,
          titleSize: 18,
          descriptionSize: 14,
          spacing: 12,
          padding: 20,
        }
      case 'large':
        return {
          iconSize: 80,
          titleSize: 24,
          descriptionSize: 18,
          spacing: 20,
          padding: 40,
        }
      default: // medium
        return {
          iconSize: 60,
          titleSize: 20,
          descriptionSize: 16,
          spacing: 16,
          padding: 32,
        }
    }
  }

  const sizeStyles = getSizeStyles()

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: scale.value }
    ],
  }))

  const handleActionPress = () => {
    // Button press animation
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    )
    
    onActionPress?.()
  }

  return (
    <ThemedView style={[styles.container, { padding: sizeStyles.padding }]}>
      <Animated.View style={[styles.content, containerAnimatedStyle]}>
        {/* Animated Icon */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <View style={[
            styles.iconBackground, 
            { 
              backgroundColor: `${config.color}15`,
              width: sizeStyles.iconSize + 20,
              height: sizeStyles.iconSize + 20,
              borderRadius: (sizeStyles.iconSize + 20) / 2,
            }
          ]}>
            <ThemedText style={[
              styles.icon, 
              { fontSize: sizeStyles.iconSize }
            ]}>
              {finalIcon}
            </ThemedText>
          </View>
        </Animated.View>

        {/* Title */}
        <ThemedText style={[
          styles.title,
          {
            fontSize: sizeStyles.titleSize,
            color: theme.colors.text,
            marginTop: sizeStyles.spacing,
          }
        ]}>
          {finalTitle}
        </ThemedText>

        {/* Description */}
        <ThemedText style={[
          styles.description,
          {
            fontSize: sizeStyles.descriptionSize,
            color: theme.colors.textSecondary,
            marginTop: sizeStyles.spacing / 2,
          }
        ]}>
          {finalDescription}
        </ThemedText>

        {/* Action Button */}
        {onActionPress && finalActionText && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: config.color,
                marginTop: sizeStyles.spacing * 1.5,
              }
            ]}
            onPress={handleActionPress}
            activeOpacity={0.8}
          >
            <ThemedText style={[
              styles.actionButtonText,
              { fontSize: sizeStyles.descriptionSize }
            ]}>
              {finalActionText}
            </ThemedText>
          </TouchableOpacity>
        )}
      </Animated.View>
    </ThemedView>
  )
}

// Specialized empty state components for common use cases
export function PostsEmptyState({ onCreatePost }: { onCreatePost?: () => void }) {
  return (
    <EmptyState
      variant="posts"
      onActionPress={onCreatePost}
      size="large"
    />
  )
}

export function SearchEmptyState({ 
  query, 
  onClearSearch 
}: { 
  query?: string
  onClearSearch?: () => void 
}) {
  return (
    <EmptyState
      variant="search"
      title={query ? `No results for "${query}"` : 'No results found'}
      description="Try searching for something else or check your spelling."
      actionText="Clear search"
      onActionPress={onClearSearch}
    />
  )
}

export function ProfileEmptyState({ onEditProfile }: { onEditProfile?: () => void }) {
  return (
    <EmptyState
      variant="profile"
      onActionPress={onEditProfile}
    />
  )
}

export function NotificationsEmptyState({ onCreatePost }: { onCreatePost?: () => void }) {
  return (
    <EmptyState
      variant="notifications"
      onActionPress={onCreatePost}
    />
  )
}

export function FollowersEmptyState({ onFindPeople }: { onFindPeople?: () => void }) {
  return (
    <EmptyState
      variant="followers"
      onActionPress={onFindPeople}
    />
  )
}

export function FollowingEmptyState({ onDiscoverPeople }: { onDiscoverPeople?: () => void }) {
  return (
    <EmptyState
      variant="following"
      onActionPress={onDiscoverPeople}
    />
  )
}

export function MediaEmptyState({ onSharePhoto }: { onSharePhoto?: () => void }) {
  return (
    <EmptyState
      variant="media"
      onActionPress={onSharePhoto}
    />
  )
}

export function LikesEmptyState({ onExplorePosts }: { onExplorePosts?: () => void }) {
  return (
    <EmptyState
      variant="likes"
      onActionPress={onExplorePosts}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  content: {
    alignItems: 'center',
    maxWidth: screenWidth * 0.8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  description: {
    textAlign: 'center',
    lineHeight: 1.4,
    opacity: 0.8,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
})