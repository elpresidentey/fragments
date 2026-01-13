import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { EnhancedPost, Comment } from '@/types';
import { postService } from '@/lib/services/post';
import { commentService } from '@/lib/services/comment';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TwitterHeader } from '@/components/twitter-header';
import { PostCard } from '@/components/post-card';
import { LoadingIndicator } from '@/components/loading-indicator';
import { Colors, typography as Typography, spacing as Spacing } from '@/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CommentItemProps {
  comment: Comment;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
}

function CommentItem({ comment, onEdit, onDelete }: CommentItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state: authState } = useAuth();
  const isOwner = authState.user?.id === comment.user_id;

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
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
  };

  const handleLongPress = () => {
    if (!isOwner) return;

    Alert.alert(
      'Comment Options',
      'What would you like to do with this comment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Edit',
          onPress: () => onEdit?.(comment),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Comment',
              'Are you sure you want to delete this comment?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => onDelete?.(comment.id),
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.commentItem, { borderBottomColor: colors.border }]}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={isOwner ? 0.7 : 1}
    >
      <View style={styles.commentHeader}>
        {comment.user.avatar_url ? (
          <Image
            source={{ uri: comment.user.avatar_url }}
            style={styles.commentAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder, { backgroundColor: colors.border }]}>
            <ThemedText style={[styles.commentAvatarText, { color: colors.textSecondary }]}>
              {comment.user.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}
        <View style={styles.commentInfo}>
          <View style={styles.commentMeta}>
            <ThemedText style={[styles.commentAuthor, { fontSize: Typography.bodyMedium.fontSize }]}>
              {comment.user.name}
            </ThemedText>
            <ThemedText style={[styles.commentTimestamp, { color: colors.textSecondary }]}>
              • {formatTimestamp(comment.created_at)}
            </ThemedText>
          </View>
          <ThemedText style={[styles.commentContent, { color: colors.text }]}>
            {comment.content}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state: authState } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [post, setPost] = useState<EnhancedPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  // Navigation guard - redirect if not authenticated
  useEffect(() => {
    if (!authState.isAuthenticated && !authState.isLoading) {
      router.replace('/(auth)/login');
    }
  }, [authState.isAuthenticated, authState.isLoading]);

  // Load post and comments
  const loadPostAndComments = useCallback(async () => {
    if (!id || !authState.isAuthenticated) return;

    try {
      setError(null);
      
      // For now, we'll need to get the post from the posts list
      // In a real app, you'd have a getPost(id) method
      const posts = await postService.getPosts(100); // Get more posts to find the one we need
      const foundPost = posts.find(p => p.id === id);
      
      if (!foundPost) {
        throw new Error('Post not found');
      }

      // Convert to EnhancedPost with mock engagement data
      const enhancedPost: EnhancedPost = {
        ...foundPost,
        engagement: {
          likes: Math.floor(Math.random() * 50),
          retweets: Math.floor(Math.random() * 20),
          comments: 0, // Will be updated with actual comment count
          isLiked: Math.random() > 0.7,
          isRetweeted: Math.random() > 0.8,
        },
        user: {
          ...foundPost.user,
          handle: foundPost.user.name.toLowerCase().replace(/\s+/g, ''),
          verified: Math.random() > 0.9,
        },
      };

      setPost(enhancedPost);

      // Load comments
      const postComments = await commentService.getComments(id);
      setComments(postComments);

      // Update engagement count with actual comment count
      setPost(prev => prev ? {
        ...prev,
        engagement: {
          ...prev.engagement!,
          comments: postComments.length,
        }
      } : null);

    } catch (err) {
      console.error('Error loading post and comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setIsLoading(false);
    }
  }, [id, authState.isAuthenticated]);

  // Initial load
  useEffect(() => {
    loadPostAndComments();
  }, [loadPostAndComments]);

  // Subscribe to real-time comment updates
  useEffect(() => {
    if (!id || !authState.isAuthenticated) return;

    const unsubscribe = commentService.subscribeToCommentUpdates(id, (updatedComments) => {
      setComments(updatedComments);
      // Update post engagement count
      setPost(prev => prev ? {
        ...prev,
        engagement: {
          ...prev.engagement!,
          comments: updatedComments.length,
        }
      } : null);
    });

    return unsubscribe;
  }, [id, authState.isAuthenticated]);

  // Don't render content if not authenticated
  if (!authState.isAuthenticated) {
    return null;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPostAndComments();
    setIsRefreshing(false);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !id || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingComment) {
        // Update existing comment
        await commentService.updateComment(editingComment.id, commentText.trim());
        setEditingComment(null);
      } else {
        // Create new comment
        await commentService.createComment(id, commentText.trim());
      }
      
      setCommentText('');
      // Comments will be updated via real-time subscription
    } catch (err) {
      console.error('Error submitting comment:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setCommentText(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setCommentText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      // Comments will be updated via real-time subscription
    } catch (err) {
      console.error('Error deleting comment:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <TwitterHeader 
          title="Post"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <LoadingIndicator />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading post...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !post) {
    return (
      <ThemedView style={styles.container}>
        <TwitterHeader 
          title="Post"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: colors.error }]}>
            {error || 'Post not found'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadPostAndComments}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <TwitterHeader 
        title="Post"
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Post Content */}
          <PostCard
            post={post}
            onPress={() => {}} // Disable press since we're already on detail screen
            onLike={() => console.log('Like pressed')}
            onRetweet={() => console.log('Retweet pressed')}
            onComment={() => {}} // Disable since we're showing comments below
            onShare={() => console.log('Share pressed')}
          />

          {/* Comments Section */}
          <View style={[styles.commentsSection, { borderTopColor: colors.border }]}>
            <ThemedText style={[styles.commentsHeader, { fontSize: Typography.h3.fontSize }]}>
              Comments ({comments.length})
            </ThemedText>

            {comments.length === 0 ? (
              <View style={styles.noCommentsContainer}>
                <ThemedText style={[styles.noCommentsText, { color: colors.textSecondary }]}>
                  No comments yet. Be the first to comment!
                </ThemedText>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={[styles.commentInputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {editingComment && (
            <View style={styles.editingIndicator}>
              <ThemedText style={[styles.editingText, { color: colors.textSecondary }]}>
                Editing comment
              </ThemedText>
              <TouchableOpacity onPress={handleCancelEdit}>
                <ThemedText style={[styles.cancelEditText, { color: colors.primary }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }
              ]}
              placeholder={editingComment ? "Edit your comment..." : "Add a comment..."}
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: commentText.trim() ? colors.primary : colors.border,
                }
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <LoadingIndicator size="small" />
              ) : (
                <Feather 
                  name="send" 
                  size={20} 
                  color={commentText.trim() ? '#FFFFFF' : colors.textSecondary} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  commentsSection: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  commentsHeader: {
    fontWeight: Typography.h3.fontWeight as any,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  noCommentsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  commentsList: {
    paddingBottom: Spacing.lg,
  },
  commentItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  commentAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentInfo: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: Typography.bodyMedium.fontWeight as any,
    marginRight: 8,
  },
  commentTimestamp: {
    fontSize: Typography.caption.fontSize,
  },
  commentContent: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  commentInputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  editingIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  editingText: {
    fontSize: Typography.caption.fontSize,
  },
  cancelEditText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});