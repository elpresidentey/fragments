import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { TwitterHeader } from '@/components/twitter-header';
import { RealTimeFeed } from '@/components/real-time-feed';
import { Post } from '@/types';
import { useAuth } from '@/contexts/auth-context';

export default function HomeScreen() {
  const { state } = useAuth();

  // Navigation guard - redirect if not authenticated
  useEffect(() => {
    if (!state.isAuthenticated && !state.isLoading) {
      router.replace('/(auth)/login');
    }
  }, [state.isAuthenticated, state.isLoading]);

  const handlePostPress = (post: Post) => {
    router.push(`/post/${post.id}`);
  };

  // Don't render content if not authenticated
  if (!state.isAuthenticated) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <TwitterHeader 
        showLogo={true}
        badge={0} // TODO: Add notification badge count
      />
      <RealTimeFeed onPostPress={handlePostPress} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
