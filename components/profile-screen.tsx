import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { Post, EnhancedPost, User } from '@/types';
import { postService } from '@/lib/services/post';
import { PostCard } from './post-card';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { TwitterHeader } from './twitter-header';
import { EditProfileModal } from './edit-profile-modal';
import { Colors, typography as Typography, spacing as Spacing } from '@/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ProfileScreen() {
  const { state: authState, signOut, updateProfile } = useAuth();
  const { user } = authState;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [userPosts, setUserPosts] = useState<EnhancedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userStats, setUserStats] = useState({
    posts: 0,
    following: Math.floor(Math.random() * 500) + 50, // Mock data
    followers: Math.floor(Math.random() * 1000) + 100, // Mock data
  });

  // Convert regular Post to EnhancedPost with mock engagement data
  const enhancePost = (post: Post): EnhancedPost => {
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
  };

  // Load user posts
  const loadUserPosts = async () => {
    if (!user) return;

    try {
      setError(null);
      const posts = await postService.getUserPosts(user.id);
      const enhancedPosts = posts.map(enhancePost);
      setUserPosts(enhancedPosts);
      setUserStats(prev => ({ ...prev, posts: posts.length }));
    } catch (err) {
      console.error('Error loading user posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation guard - redirect if not authenticated
  useEffect(() => {
    if (!authState.isAuthenticated && !authState.isLoading) {
      router.replace('/(auth)/login');
    }
  }, [authState.isAuthenticated, authState.isLoading]);

  // Load posts on component mount
  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user]);

  // Don't render content if not authenticated
  if (!authState.isAuthenticated || !user) {
    return null;
  }

  // Refresh posts
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUserPosts();
    setIsRefreshing(false);
  };

  // Handle logout
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Use browser's native confirm dialog on web
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        signOut();
      }
    } else {
      // Use React Native Alert on mobile
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: signOut,
          },
        ]
      );
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updatedUser: Partial<User>) => {
    const result = await updateProfile(updatedUser)
    if (!result.success) {
      // Error is already shown by the auth context
      console.error('Profile update failed:', result.error)
    }
    // Success message is already shown by the auth context
  };

  // Format creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  // Generate user handle
  const getUserHandle = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '');
  };

  return (
    <ThemedView style={styles.container}>
      <TwitterHeader 
        showLogo={true}
        rightComponent={
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.primary }]}
            onPress={handleLogout}
          >
            <ThemedText style={styles.logoutButtonText} numberOfLines={1}>
              Sign Out
            </ThemedText>
          </TouchableOpacity>
        }
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.background }]}>
          {/* Cover Photo Area */}
          <View style={[styles.coverPhoto, { backgroundColor: colors.primary }]}>
            <View style={styles.coverPhotoGradient} />
          </View>
          
          {/* Profile Info Container */}
          <View style={[styles.profileInfoContainer, { backgroundColor: colors.background }]}>
            {/* Avatar and Edit Button Row */}
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                {user.avatar_url ? (
                  <Image
                    source={{ uri: user.avatar_url }}
                    style={[styles.avatar, { borderColor: colors.background }]}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[
                    styles.avatar, 
                    styles.avatarPlaceholder,
                    { 
                      backgroundColor: colors.border,
                      borderColor: colors.background 
                    }
                  ]}>
                    <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                      {user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Edit Profile Button */}
              <TouchableOpacity
                style={[styles.editButton, { borderColor: colors.border }]}
                onPress={() => setShowEditModal(true)}
              >
                <Feather name="edit-3" size={16} color={colors.text} />
                <ThemedText style={styles.editButtonText}>Edit profile</ThemedText>
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <ThemedText style={[styles.userName, { fontSize: Typography.h2.fontSize }]}>
                {user.name}
              </ThemedText>
              <ThemedText style={[styles.userHandle, { color: colors.textSecondary }]}>
                @{getUserHandle(user.name)}
              </ThemedText>
              
              {/* Bio placeholder */}
              <ThemedText style={[styles.userBio, { color: colors.text }]}>
                Welcome to my profile! 🚀
              </ThemedText>
              
              {/* Location and Join Date */}
              <View style={styles.metaInfo}>
                <View style={styles.metaItem}>
                  <Feather name="map-pin" size={14} color={colors.textSecondary} />
                  <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
                    Earth
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="calendar" size={14} color={colors.textSecondary} />
                  <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
                    Joined {formatDate(user.created_at)}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { fontSize: Typography.bodyMedium.fontSize }]}>
                  {userStats.following}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Following
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { fontSize: Typography.bodyMedium.fontSize }]}>
                  {userStats.followers}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Followers
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Posts Tab Header */}
        <View style={[styles.tabHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.tabContainer}>
            <View style={[styles.activeTab, { borderBottomColor: colors.primary }]}>
              <ThemedText style={[styles.tabText, { color: colors.text }]}>
                Posts
              </ThemedText>
              <ThemedText style={[styles.tabCount, { color: colors.textSecondary }]}>
                {userStats.posts}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={{ color: colors.textSecondary }}>Loading posts...</ThemedText>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={loadUserPosts}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : userPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                You haven't created any posts yet.
              </ThemedText>
              <TouchableOpacity
                style={[styles.createFirstPostButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/create')}
              >
                <ThemedText style={styles.createFirstPostText}>Create your first post</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.postsContainer}>
              {userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPress={() => {
                    router.push(`/post/${post.id}`);
                  }}
                  onLike={() => console.log('Like pressed for post:', post.id)}
                  onRetweet={() => console.log('Retweet pressed for post:', post.id)}
                  onComment={() => console.log('Comment pressed for post:', post.id)}
                  onShare={() => console.log('Share pressed for post:', post.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={user}
        onSave={handleProfileUpdate}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    position: 'relative',
  },
  coverPhoto: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  coverPhotoGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  profileInfoContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -40,
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    marginBottom: Spacing.md,
  },
  userName: {
    fontWeight: Typography.h2.fontWeight as any,
    marginBottom: 2,
  },
  userHandle: {
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.sm,
  },
  userBio: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    marginBottom: Spacing.sm,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.caption.fontSize,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statNumber: {
    fontWeight: Typography.bodyMedium.fontWeight as any,
  },
  statLabel: {
    fontSize: Typography.caption.fontSize,
  },
  tabHeader: {
    borderBottomWidth: 1,
  },
  tabContainer: {
    flexDirection: 'row',
  },
  activeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    gap: Spacing.xs,
  },
  tabText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: Typography.bodyMedium.fontWeight as any,
  },
  tabCount: {
    fontSize: Typography.caption.fontSize,
  },
  postsSection: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  createFirstPostButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createFirstPostText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  postsContainer: {
    paddingTop: 8,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80, // Ensure enough width for "Sign Out" text
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});