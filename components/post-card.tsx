import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { themeEngine } from '@/design-system/theme/theme-engine';
import { useButtonPressAnimation, useLikeAnimation } from '@/design-system/hooks/use-animation';
import { useVisualFeedback, useHoverEffect } from '@/design-system/hooks/use-visual-feedback';
import { useAccessibility } from '@/design-system/hooks/use-accessibility';
import { createSemanticLabel, formatNumberForScreenReader } from '@/design-system/utils/accessibility-utils';
import { memoCustom, useStableCallback, useMemoizedStyles } from '@/design-system/utils/memoization-utils';
import { useOptimizedImage } from '@/design-system/utils/performance-utils';
import { EnhancedPost } from '@/types';

export interface PostCardProps {
  post: EnhancedPost;
  onPress?: () => void;
  onLike?: () => void;
  onRetweet?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showEngagementActions?: boolean;
  showOwnerActions?: boolean;
  compact?: boolean;
  currentUserId?: string;
}

function PostCardComponent({ 
  post, 
  onPress, 
  onLike, 
  onRetweet, 
  onComment, 
  onShare,
  onEdit,
  onDelete,
  showEngagementActions = true,
  showOwnerActions = true,
  compact = false,
  currentUserId
}: PostCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const theme = themeEngine.getTheme();
  const cardBackgroundColor = useThemeColor({ light: theme.colors.background, dark: theme.colors.background }, 'background');
  const dividerColor = useThemeColor({ light: theme.colors.border, dark: theme.colors.border }, 'icon');

  // Optimized image loading with caching
  const { cachedUri, loading: imageOptimizedLoading, error: imageOptimizedError } = useOptimizedImage(post.image_url || '');

  // Memoized styles to prevent recreation
  const memoizedStyles = useMemoizedStyles(() => ({
    container: [styles.container, { backgroundColor: cardBackgroundColor }],
    avatar: [styles.avatar, styles.avatarPlaceholder],
    verifiedBadge: styles.verifiedBadge,
    divider: [styles.divider, { backgroundColor: dividerColor }],
  }), [cardBackgroundColor, dividerColor]);

  // Accessibility hook
  const { getAccessibilityProps, announceForAccessibility } = useAccessibility();

  // Animation hooks with enhanced visual feedback
  const { animatedStyle: cardAnimatedStyle, handlePressIn, handlePressOut } = useButtonPressAnimation({
    scale: 0.98,
    onPress,
  });

  const { animatedStyle: cardHoverStyle, handleHoverIn: handleCardHoverIn, handleHoverOut: handleCardHoverOut } = useHoverEffect({
    hoverScale: 1.01,
    disabled: !onPress,
  });

  const { animatedStyle: likeAnimatedStyle, handleLike } = useLikeAnimation({
    onLike,
    isLiked: post.engagement?.isLiked,
  });

  const { animatedStyle: commentFeedbackStyle, handlePressIn: handleCommentPress } = useVisualFeedback({
    feedbackType: 'info',
    onPress: onComment,
  });

  const { animatedStyle: retweetFeedbackStyle, handlePressIn: handleRetweetPress } = useVisualFeedback({
    feedbackType: post.engagement?.isRetweeted ? 'success' : 'press',
    onPress: onRetweet,
  });

  const { animatedStyle: shareFeedbackStyle, handlePressIn: handleSharePress } = useVisualFeedback({
    feedbackType: 'info',
    onPress: onShare,
  });

  // Memoized timestamp formatting
  const formattedTimestamp = useMemo(() => {
    const date = new Date(post.created_at);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }, [post.created_at]);

  // Stable callbacks to prevent unnecessary re-renders
  const handleImageLoad = useStableCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useStableCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const formatEngagementCount = useStableCallback((count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  }, []);

  // Enhanced accessibility handlers with stable callbacks
  const handleLikeWithAnnouncement = useStableCallback(() => {
    const wasLiked = post.engagement?.isLiked;
    handleLike();
    
    // Announce the action to screen readers
    const action = wasLiked ? 'unliked' : 'liked';
    const newCount = (post.engagement?.likes || 0) + (wasLiked ? -1 : 1);
    announceForAccessibility(`Post ${action}. ${formatNumberForScreenReader(newCount)} likes`);
  }, [post.engagement?.isLiked, post.engagement?.likes, handleLike, announceForAccessibility]);

  const handleRetweetWithAnnouncement = useStableCallback(() => {
    const wasRetweeted = post.engagement?.isRetweeted;
    handleRetweetPress();
    
    const action = wasRetweeted ? 'unretweeted' : 'retweeted';
    const newCount = (post.engagement?.retweets || 0) + (wasRetweeted ? -1 : 1);
    announceForAccessibility(`Post ${action}. ${formatNumberForScreenReader(newCount)} retweets`);
  }, [post.engagement?.isRetweeted, post.engagement?.retweets, handleRetweetPress, announceForAccessibility]);

  const handleCommentWithAnnouncement = useStableCallback(() => {
    handleCommentPress();
    announceForAccessibility('Opening comments');
  }, [handleCommentPress, announceForAccessibility]);

  const handleShareWithAnnouncement = useStableCallback(() => {
    handleSharePress();
    announceForAccessibility('Opening share options');
  }, [handleSharePress, announceForAccessibility]);

  // Memoized accessibility labels
  const accessibilityLabels = useMemo(() => {
    const postAccessibilityLabel = createSemanticLabel([
      `Post by ${post.user.name}`,
      post.user.verified ? 'verified user' : undefined,
      post.user.handle ? `@${post.user.handle}` : undefined,
      `posted ${formattedTimestamp}`,
      post.content ? `Content: ${post.content}` : undefined,
      post.image_url ? 'includes image' : undefined,
    ]);

    const likeAccessibilityLabel = createSemanticLabel([
      post.engagement?.isLiked ? 'Unlike post' : 'Like post',
      post.engagement?.likes ? `${formatNumberForScreenReader(post.engagement.likes)} likes` : 'No likes',
    ]);

    const retweetAccessibilityLabel = createSemanticLabel([
      post.engagement?.isRetweeted ? 'Unretweet post' : 'Retweet post',
      post.engagement?.retweets ? `${formatNumberForScreenReader(post.engagement.retweets)} retweets` : 'No retweets',
    ]);

    const commentAccessibilityLabel = createSemanticLabel([
      'Comment on post',
      post.engagement?.comments ? `${formatNumberForScreenReader(post.engagement.comments)} comments` : 'No comments',
    ]);

    return {
      post: postAccessibilityLabel,
      like: likeAccessibilityLabel,
      retweet: retweetAccessibilityLabel,
      comment: commentAccessibilityLabel,
    };
  }, [post, formattedTimestamp]);

  return (
    <Animated.View style={[cardAnimatedStyle, cardHoverStyle]}>
      <TouchableOpacity 
        style={memoizedStyles.container}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleCardHoverIn}
        onHoverOut={handleCardHoverOut}
        activeOpacity={1}
        {...getAccessibilityProps({
          label: accessibilityLabels.post,
          hint: onPress ? 'Double tap to view post details' : undefined,
          role: 'button',
        })}
      >
        {/* Header with author info and timestamp */}
        <View style={styles.header}>
          <View style={styles.authorInfo}>
            {post.user.avatar_url ? (
              <Image
                source={{ uri: cachedUri || post.user.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
                {...getAccessibilityProps({
                  label: `${post.user.name}'s profile picture`,
                  role: 'image',
                })}
              />
            ) : (
              <View 
                style={memoizedStyles.avatar}
                {...getAccessibilityProps({
                  label: `${post.user.name}'s profile picture placeholder`,
                  role: 'image',
                })}
              >
                <ThemedText style={styles.avatarText}>
                  {post.user.name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
            <View style={styles.authorDetails}>
              <View style={styles.nameRow}>
                <ThemedText 
                  style={[styles.authorName, theme.typography.bodyMedium]}
                  accessibilityRole="text"
                  accessibilityLabel={`Author: ${post.user.name}`}
                >
                  {post.user.name}
                </ThemedText>
                {post.user.verified && (
                  <View 
                    style={memoizedStyles.verifiedBadge}
                    {...getAccessibilityProps({
                      label: 'Verified user',
                      role: 'image',
                    })}
                  >
                    <ThemedText style={styles.verifiedIcon}>✓</ThemedText>
                  </View>
                )}
                {post.user.handle && (
                  <ThemedText 
                    style={[styles.handle, { color: theme.colors.textSecondary }]}
                    accessibilityLabel={`Username: @${post.user.handle}`}
                  >
                    @{post.user.handle}
                  </ThemedText>
                )}
                <ThemedText 
                  style={[styles.separator, { color: theme.colors.textSecondary }]}
                  accessibilityElementsHidden={true}
                >
                  •
                </ThemedText>
                <ThemedText 
                  style={[styles.timestamp, { color: theme.colors.textSecondary }]}
                  accessibilityLabel={`Posted ${formattedTimestamp}`}
                >
                  {formattedTimestamp}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Post content */}
        {post.content && (
          <ThemedText 
            style={[styles.content, theme.typography.body]}
            accessibilityRole="text"
            accessibilityLabel={`Post content: ${post.content}`}
          >
            {post.content}
          </ThemedText>
        )}

        {/* Post image with optimized loading */}
        {post.image_url && (
          <View style={styles.imageContainer}>
            {(imageLoading || imageOptimizedLoading) && (
              <View 
                style={styles.imageLoadingContainer}
                {...getAccessibilityProps({
                  label: 'Image loading',
                  role: 'none',
                })}
              >
                <ActivityIndicator size="large" color={theme.colors.textSecondary} />
              </View>
            )}
            {!imageError && !imageOptimizedError ? (
              <Image
                source={{ uri: cachedUri || post.image_url }}
                style={[styles.postImage, (imageLoading || imageOptimizedLoading) && styles.hiddenImage]}
                contentFit="cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
                {...getAccessibilityProps({
                  label: 'Post image',
                  hint: 'Image attached to this post',
                  role: 'image',
                })}
              />
            ) : (
              <View 
                style={styles.imageErrorContainer}
                {...getAccessibilityProps({
                  label: 'Image failed to load',
                  role: 'text',
                })}
              >
                <ThemedText style={[styles.imageErrorText, { color: theme.colors.textSecondary }]}>
                  Failed to load image
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Twitter-style engagement buttons with enhanced feedback */}
        {showEngagementActions && (
          <View 
            style={styles.engagementActions}
            {...getAccessibilityProps({
              label: 'Post engagement actions',
              role: 'none',
            })}
          >
            <Animated.View style={commentFeedbackStyle}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPressIn={handleCommentWithAnnouncement}
                activeOpacity={0.7}
                {...getAccessibilityProps({
                  label: accessibilityLabels.comment,
                  hint: 'Double tap to comment on this post',
                  role: 'button',
                })}
              >
                <ThemedText style={[styles.actionIcon, { color: theme.colors.textSecondary }]}>
                  💬
                </ThemedText>
                {post.engagement?.comments && post.engagement.comments > 0 && (
                  <ThemedText 
                    style={[styles.actionCount, { color: theme.colors.textSecondary }]}
                    accessibilityElementsHidden={true}
                  >
                    {formatEngagementCount(post.engagement.comments)}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={retweetFeedbackStyle}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPressIn={handleRetweetWithAnnouncement}
                activeOpacity={0.7}
                {...getAccessibilityProps({
                  label: accessibilityLabels.retweet,
                  hint: 'Double tap to retweet this post',
                  role: 'button',
                  state: { selected: post.engagement?.isRetweeted },
                })}
              >
                <ThemedText style={[
                  styles.actionIcon, 
                  { color: post.engagement?.isRetweeted ? theme.colors.success : theme.colors.textSecondary }
                ]}>
                  🔄
                </ThemedText>
                {post.engagement?.retweets && post.engagement.retweets > 0 && (
                  <ThemedText 
                    style={[
                      styles.actionCount, 
                      { color: post.engagement?.isRetweeted ? theme.colors.success : theme.colors.textSecondary }
                    ]}
                    accessibilityElementsHidden={true}
                  >
                    {formatEngagementCount(post.engagement.retweets)}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={likeAnimatedStyle}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleLikeWithAnnouncement}
                activeOpacity={0.7}
                {...getAccessibilityProps({
                  label: accessibilityLabels.like,
                  hint: 'Double tap to like this post',
                  role: 'button',
                  state: { selected: post.engagement?.isLiked },
                })}
              >
                <ThemedText style={[
                  styles.actionIcon, 
                  { color: post.engagement?.isLiked ? theme.colors.error : theme.colors.textSecondary }
                ]}>
                  {post.engagement?.isLiked ? '❤️' : '🤍'}
                </ThemedText>
                {post.engagement?.likes && post.engagement.likes > 0 && (
                  <ThemedText 
                    style={[
                      styles.actionCount, 
                      { color: post.engagement?.isLiked ? theme.colors.error : theme.colors.textSecondary }
                    ]}
                    accessibilityElementsHidden={true}
                  >
                    {formatEngagementCount(post.engagement.likes)}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={shareFeedbackStyle}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPressIn={handleShareWithAnnouncement}
                activeOpacity={0.7}
                {...getAccessibilityProps({
                  label: 'Share post',
                  hint: 'Double tap to share this post',
                  role: 'button',
                })}
              >
                <ThemedText style={[styles.actionIcon, { color: theme.colors.textSecondary }]}>
                  📤
                </ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Owner Actions (Edit/Delete) */}
        {showOwnerActions && currentUserId === post.user_id && (
          <View 
            style={styles.ownerActions}
            {...getAccessibilityProps({
              label: 'Post owner actions',
              role: 'none',
            })}
          >
            {onEdit && (
              <TouchableOpacity 
                style={styles.ownerActionButton}
                onPress={onEdit}
                activeOpacity={0.7}
                {...getAccessibilityProps({
                  label: 'Edit post',
                  hint: 'Double tap to edit this post',
                  role: 'button',
                })}
              >
                <ThemedText style={[styles.ownerActionIcon, { color: theme.colors.primary }]}>
                  ✏️
                </ThemedText>
                <ThemedText style={[styles.ownerActionText, { color: theme.colors.primary }]}>
                  Edit
                </ThemedText>
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity 
                style={styles.ownerActionButton}
                onPress={onDelete}
                activeOpacity={0.7}
                {...getAccessibilityProps({
                  label: 'Delete post',
                  hint: 'Double tap to delete this post',
                  role: 'button',
                })}
              >
                <ThemedText style={[styles.ownerActionIcon, { color: theme.colors.error }]}>
                  🗑️
                </ThemedText>
                <ThemedText style={[styles.ownerActionText, { color: theme.colors.error }]}>
                  Delete
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Subtle divider */}
        <View 
          style={memoizedStyles.divider} 
          accessibilityElementsHidden={true}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Memoize the component with custom comparison for optimal performance
export const PostCard = memoCustom(
  PostCardComponent,
  (prevProps, nextProps) => {
    // Fast path: if post ID is different, definitely re-render
    if (prevProps.post.id !== nextProps.post.id) return false;
    
    // Compare engagement data (most likely to change)
    const prevEngagement = prevProps.post.engagement;
    const nextEngagement = nextProps.post.engagement;
    
    if (prevEngagement?.isLiked !== nextEngagement?.isLiked) return false;
    if (prevEngagement?.isRetweeted !== nextEngagement?.isRetweeted) return false;
    if (prevEngagement?.likes !== nextEngagement?.likes) return false;
    if (prevEngagement?.retweets !== nextEngagement?.retweets) return false;
    if (prevEngagement?.comments !== nextEngagement?.comments) return false;
    
    // Compare callback functions (should be stable)
    if (prevProps.onPress !== nextProps.onPress) return false;
    if (prevProps.onLike !== nextProps.onLike) return false;
    if (prevProps.onRetweet !== nextProps.onRetweet) return false;
    if (prevProps.onComment !== nextProps.onComment) return false;
    if (prevProps.onShare !== nextProps.onShare) return false;
    if (prevProps.onEdit !== nextProps.onEdit) return false;
    if (prevProps.onDelete !== nextProps.onDelete) return false;
    
    // Compare other props
    if (prevProps.showEngagementActions !== nextProps.showEngagementActions) return false;
    if (prevProps.showOwnerActions !== nextProps.showOwnerActions) return false;
    if (prevProps.compact !== nextProps.compact) return false;
    if (prevProps.currentUserId !== nextProps.currentUserId) return false;
    
    // If we get here, props are effectively the same
    return true;
  },
  'PostCard'
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  avatar: {
    width: 48, // Larger avatar as per Twitter design
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#1DA1F2', // Twitter blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authorDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  authorName: {
    marginRight: 4,
  },
  verifiedBadge: {
    backgroundColor: '#1DA1F2',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  verifiedIcon: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  handle: {
    fontSize: 14,
    marginRight: 4,
  },
  separator: {
    fontSize: 14,
    marginRight: 4,
  },
  timestamp: {
    fontSize: 14,
  },
  content: {
    marginLeft: 60, // Align with text after avatar
    marginBottom: 12,
  },
  imageContainer: {
    marginLeft: 60, // Align with content
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 200,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  hiddenImage: {
    opacity: 0,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
  },
  imageErrorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
  },
  imageErrorText: {
    fontSize: 14,
  },
  engagementActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 60, // Align with content
    marginRight: 40,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 32,
    minHeight: 32,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '400',
  },
  ownerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginLeft: 60,
    marginRight: 16,
    marginBottom: 8,
    gap: 12,
  },
  ownerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  ownerActionIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  ownerActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginTop: 8,
    opacity: 0.3,
  },
});