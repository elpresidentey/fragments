import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  FlatList, 
  RefreshControl, 
  StyleSheet, 
  View, 
  ActivityIndicator,
  ListRenderItem 
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { PostCard } from './post-card';
import { FeedStateTransition } from './state-transition';
import { PostsEmptyState } from './empty-state';
import { NetworkErrorState } from './error-state';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Post, EnhancedPost } from '@/types';
import { postService } from '@/lib/services/post';
import { useTheme } from '@/design-system/hooks/use-theme';
import { memoShallow, useStableCallback } from '@/design-system/utils/memoization-utils';
import { debounce, throttle } from '@/design-system/utils/performance-utils';

export interface PostListProps {
  userId?: string; // If provided, shows only posts from this user
  onPostPress?: (post: Post) => void;
}

function PostListComponent({ userId, onPostPress }: PostListProps) {
  const [posts, setPosts] = useState<EnhancedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const offsetRef = useRef(0);
  const POSTS_PER_PAGE = 20;
  
  const { theme } = useTheme()
  const subtleTextColor = useThemeColor({ light: '#666666', dark: '#999999' }, 'text');
  const refreshColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

  // Convert regular Post to EnhancedPost with mock engagement data
  const enhancePost = useStableCallback((post: Post): EnhancedPost => {
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

  // Load initial posts with stable callback
  const loadPosts = useStableCallback(async (reset: boolean = false) => {
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

      if (reset) {
        setPosts(enhancedPosts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...enhancedPosts]);
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

  // Initial load
  useEffect(() => {
    const loadInitialPosts = async () => {
      setLoading(true);
      await loadPosts(true);
      setLoading(false);
    };

    loadInitialPosts();
  }, [loadPosts]);

  // Debounced refresh to prevent excessive API calls
  const debouncedRefresh = useMemo(
    () => debounce(async () => {
      await loadPosts(true);
    }, 300),
    [loadPosts]
  );

  // Pull to refresh with debouncing
  const onRefresh = useStableCallback(async () => {
    setRefreshing(true);
    await debouncedRefresh();
    setRefreshing(false);
  }, [debouncedRefresh]);

  // Throttled load more to prevent rapid fire requests
  const throttledLoadMore = useMemo(
    () => throttle(async () => {
      if (!loadingMore && hasMore && !userId) {
        setLoadingMore(true);
        await loadPosts(false);
        setLoadingMore(false);
      }
    }, 1000),
    [loadingMore, hasMore, userId, loadPosts]
  );

  // Load more posts (infinite scroll) with throttling
  const onEndReached = useStableCallback(async () => {
    throttledLoadMore();
  }, [throttledLoadMore]);

  // Stable post press handler
  const handlePostPress = useStableCallback((post: Post) => {
    onPostPress?.(post);
  }, [onPostPress]);

  // Memoized render functions for better performance
  const renderPost: ListRenderItem<EnhancedPost> = useStableCallback(({ item }) => (
    <PostCard 
      post={item} 
      onPress={() => handlePostPress(item)}
      onLike={() => console.log('Like pressed for post:', item.id)}
      onRetweet={() => console.log('Retweet pressed for post:', item.id)}
      onComment={() => console.log('Comment pressed for post:', item.id)}
      onShare={() => console.log('Share pressed for post:', item.id)}
    />
  ), [handlePostPress]);

  // Memoized key extractor for better FlatList performance
  const keyExtractor = useStableCallback((item: EnhancedPost) => item.id, []);

  // Memoized getItemLayout for better scrolling performance
  const getItemLayout = useStableCallback((data: any, index: number) => ({
    length: 200, // Approximate item height
    offset: 200 * index,
    index,
  }), []);

  // Render loading footer for infinite scroll
  const renderFooter = useStableCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={subtleTextColor} />
        <ThemedText style={[styles.footerText, { color: subtleTextColor }]}>
          Loading more posts...
        </ThemedText>
      </View>
    );
  }, [loadingMore, subtleTextColor]);

  // Render empty state
  const renderEmpty = useStableCallback(() => {
    if (loading) return null;
    
    return (
      <PostsEmptyState 
        onCreatePost={() => {
          // Navigate to create post or trigger create action
          console.log('Navigate to create post');
        }}
      />
    );
  }, [loading]);

  // Render error state
  const renderError = useStableCallback(() => (
    <NetworkErrorState
      onRetry={() => {
        setError(null);
        onRefresh();
      }}
      onGoOffline={() => {
        console.log('Go offline mode');
      }}
    />
  ), [onRefresh]);

  // Memoized refresh control
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={refreshColor}
      colors={[refreshColor]}
    />
  ), [refreshing, onRefresh, refreshColor]);

  return (
    <ThemedView style={styles.container}>
      <FeedStateTransition
        isLoading={loading}
        isEmpty={posts.length === 0 && !error}
        hasError={!!error && posts.length === 0}
        isRefreshing={refreshing}
        onCreatePost={() => console.log('Navigate to create post')}
        onRetry={() => {
          setError(null);
          onRefresh();
        }}
      >
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={keyExtractor}
          refreshControl={refreshControl}
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
          getItemLayout={getItemLayout}
          // Additional performance optimizations
          disableIntervalMomentum={true}
          scrollEventThrottle={16}
        />
      </FeedStateTransition>
    </ThemedView>
  );
}

// Memoize the entire component for better performance
export const PostList = memoShallow(PostListComponent, 'PostList');

const styles = StyleSheet.create({
  container: {
    flex: 1,
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