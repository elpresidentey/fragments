import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FlatList, 
  RefreshControl, 
  StyleSheet, 
  View, 
  ActivityIndicator,
  ListRenderItem,
  Alert
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { PostCard } from './post-card';
import { EditPostModal } from './edit-post-modal';
import { FeedStateTransition } from './state-transition';
import { PostsEmptyState } from './empty-state';
import { NetworkErrorState } from './error-state';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Post, EnhancedPost } from '@/types';
import { postService } from '@/lib/services/post';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { useTheme } from '@/design-system/hooks/use-theme';
import { createRealtimeManager, debounceRealtimeAction, createRetryManager } from '@/lib/utils/realtime-utils';

export interface RealTimeFeedProps {
  userId?: string; // If provided, shows only posts from this user
  onPostPress?: (post: Post) => void;
}

export function RealTimeFeed({ userId, onPostPress }: RealTimeFeedProps) {
  const [posts, setPosts] = useState<EnhancedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  
  // CRUD state
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const offsetRef = useRef(0);
  const realtimeManagerRef = useRef<ReturnType<typeof createRealtimeManager> | null>(null);
  const retryManagerRef = useRef(createRetryManager(5, 1000));
  const POSTS_PER_PAGE = 20;
  
  const { state: authState } = useAuth();
  const { showSuccess, showError } = useToast();
  const { theme } = useTheme()
  const subtleTextColor = useThemeColor({ light: '#666666', dark: '#999999' }, 'text');
  const refreshColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const errorColor = useThemeColor({ light: '#FF3B30', dark: '#FF453A' }, 'tint');

  // Convert regular Post to EnhancedPost with mock engagement data
  const enhancePost = useCallback((post: Post): EnhancedPost => {
    return {
      ...post,
      engagement: {
        likes: Math.floor(Math.random() * 50), // Mock data for demo
        retweets: Math.floor(Math.random() * 20),
        comments: Math.floor(Math.random() * 15),
        isLiked: Math.random() > 0.7,
        isRetweeted: Math.random() > 0.8,
      },
      user: {
        ...post.user,
        handle: post.user.name.toLowerCase().replace(/\s+/g, ''),
        verified: Math.random() > 0.9, // 10% chance of being verified
      },
    };
  }, []);

  // Load posts with proper sorting (chronological order)
  const loadPosts = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        offsetRef.current = 0;
        setHasMore(true);
        setError(null);
      }

      const newPosts = userId 
        ? await postService.getUserPosts(userId)
        : await postService.getPosts(POSTS_PER_PAGE, offsetRef.current);

      // Enhance posts with engagement data
      const enhancedPosts = newPosts.map(enhancePost);

      // Ensure chronological ordering (most recent first)
      const sortedPosts = enhancedPosts.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      if (reset) {
        setPosts(sortedPosts);
      } else {
        setPosts(prevPosts => {
          const combined = [...prevPosts, ...sortedPosts];
          // Remove duplicates and maintain chronological order
          const unique = combined.filter((post, index, arr) => 
            arr.findIndex(p => p.id === post.id) === index
          );
          return unique.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
      }

      // Check if we have more posts to load
      if (newPosts.length < POSTS_PER_PAGE) {
        setHasMore(false);
      } else {
        offsetRef.current += POSTS_PER_PAGE;
      }

    } catch (err) {
      console.error('Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    }
  }, [userId, enhancePost]);

  // Set up real-time subscription with improved connection management
  const setupRealTimeSubscription = useCallback(() => {
    if (userId) {
      // Don't set up real-time for user-specific feeds
      setConnectionStatus('connected');
      return;
    }

    // Clean up existing manager
    if (realtimeManagerRef.current) {
      realtimeManagerRef.current.unsubscribe();
    }

    // Create new realtime manager
    realtimeManagerRef.current = createRealtimeManager(
      () => {
        return postService.subscribeToPostUpdates((updatedPosts) => {
          console.log('Received real-time update:', updatedPosts.length, 'posts');
          
          // Enhance posts with engagement data
          const enhancedPosts = updatedPosts.map(enhancePost);
          
          // Update posts with proper chronological ordering
          const sortedPosts = enhancedPosts.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          setPosts(sortedPosts);
          retryManagerRef.current.reset(); // Reset retry attempts on successful update
        });
      },
      (status) => {
        // Map realtime manager status to our connection status
        switch (status) {
          case 'connecting':
            setConnectionStatus('reconnecting');
            break;
          case 'connected':
            setConnectionStatus('connected');
            break;
          case 'disconnected':
          case 'error':
            setConnectionStatus('disconnected');
            // Attempt retry with exponential backoff
            if (retryManagerRef.current.getAttempts() < 5) {
              retryManagerRef.current.retry(async () => {
                realtimeManagerRef.current?.subscribe();
              }).catch((error) => {
                console.error('Max retry attempts reached:', error);
                setError('Real-time connection failed. Pull to refresh to retry.');
              });
            }
            break;
        }
      }
    );

    // Start the subscription
    realtimeManagerRef.current.subscribe();
  }, [userId, enhancePost]);

  // Debounced version to prevent rapid reconnections
  const debouncedSetupRealTime = useCallback(
    debounceRealtimeAction(setupRealTimeSubscription, 300),
    [setupRealTimeSubscription]
  );

  // Initial load and subscription setup
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await loadPosts(true);
      setLoading(false);
      
      // Set up real-time subscription after initial load
      debouncedSetupRealTime();
    };

    initialize();

    // Cleanup function
    return () => {
      // Clean up realtime manager
      if (realtimeManagerRef.current) {
        realtimeManagerRef.current.unsubscribe();
        realtimeManagerRef.current = null;
      }
      
      // Reset retry manager
      retryManagerRef.current.reset();
    };
  }, [loadPosts, setupRealTimeSubscription]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    
    // Reload posts
    await loadPosts(true);
    
    // Restart real-time subscription
    if (realtimeManagerRef.current) {
      realtimeManagerRef.current.unsubscribe();
    }
    debouncedSetupRealTime();
    
    setRefreshing(false);
  }, [loadPosts, debouncedSetupRealTime]);

  // Load more posts (infinite scroll)
  const onEndReached = useCallback(async () => {
    if (!loadingMore && hasMore && !userId) { // Infinite scroll only for global feed
      setLoadingMore(true);
      await loadPosts(false);
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, userId, loadPosts]);

  // CRUD Handlers
  const handleEditPost = useCallback((post: EnhancedPost) => {
    setEditingPost(post);
    setShowEditModal(true);
  }, []);

  const handleDeletePost = useCallback((post: EnhancedPost) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await postService.deletePost(post.id);
              
              // Remove post from local state
              setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));
              
              showSuccess('Post deleted successfully');
            } catch (error) {
              console.error('Error deleting post:', error);
              showError(error instanceof Error ? error.message : 'Failed to delete post');
            }
          },
        },
      ]
    );
  }, [showSuccess, showError]);

  const handleSaveEditedPost = useCallback(async (content: string, imageUri?: string) => {
    if (!editingPost) return;

    try {
      const updatedPost = await postService.updatePost(editingPost.id, content, imageUri);
      
      // Update post in local state
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === editingPost.id 
            ? { ...p, ...updatedPost, engagement: p.engagement, user: { ...p.user, ...updatedPost.user } }
            : p
        )
      );
      
      showSuccess('Post updated successfully');
    } catch (error) {
      console.error('Error updating post:', error);
      throw error; // Re-throw to let modal handle it
    }
  }, [editingPost, showSuccess]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingPost(null);
  }, []);

  // Render individual post item
  const renderPost: ListRenderItem<EnhancedPost> = useCallback(({ item }) => (
    <PostCard 
      post={item} 
      onPress={() => onPostPress?.(item)}
      onLike={() => console.log('Like pressed for post:', item.id)}
      onRetweet={() => console.log('Retweet pressed for post:', item.id)}
      onComment={() => console.log('Comment pressed for post:', item.id)}
      onShare={() => console.log('Share pressed for post:', item.id)}
      onEdit={() => handleEditPost(item)}
      onDelete={() => handleDeletePost(item)}
      currentUserId={authState.user?.id}
      showOwnerActions={true}
    />
  ), [onPostPress, handleEditPost, handleDeletePost, authState.user?.id]);

  // Render connection status indicator
  const renderConnectionStatus = () => {
    if (userId || connectionStatus === 'connected') return null;
    
    const statusColor = connectionStatus === 'disconnected' ? errorColor : refreshColor;
    const statusText = connectionStatus === 'disconnected' ? 'Offline' : 'Connecting...';
    
    return (
      <View style={[styles.connectionStatus, { backgroundColor: statusColor }]}>
        <ThemedText style={styles.connectionStatusText}>
          {statusText}
        </ThemedText>
      </View>
    );
  };

  // Render loading footer for infinite scroll
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={subtleTextColor} />
        <ThemedText style={[styles.footerText, { color: subtleTextColor }]}>
          Loading more posts...
        </ThemedText>
      </View>
    );
  };

  // Render empty state
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <PostsEmptyState 
        onCreatePost={() => {
          // Navigate to create post or trigger create action
          console.log('Navigate to create post');
        }}
      />
    );
  };

  // Render error state
  const renderError = () => (
    <NetworkErrorState
      onRetry={() => {
        setError(null);
        retryManagerRef.current.reset();
        onRefresh();
      }}
      onGoOffline={() => {
        console.log('Go offline mode');
      }}
    />
  );

  return (
    <ThemedView style={styles.container}>
      {renderConnectionStatus()}
      <FeedStateTransition
        isLoading={loading}
        isEmpty={posts.length === 0 && !error}
        hasError={!!error && posts.length === 0}
        isRefreshing={refreshing}
        onCreatePost={() => console.log('Navigate to create post')}
        onRetry={() => {
          setError(null);
          retryManagerRef.current.reset();
          onRefresh();
        }}
      >
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={refreshColor}
              colors={[refreshColor]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      </FeedStateTransition>

      {/* Edit Post Modal */}
      <EditPostModal
        visible={showEditModal}
        post={editingPost}
        onClose={handleCloseEditModal}
        onSave={handleSaveEditedPost}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  connectionStatus: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  connectionStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
  },
});