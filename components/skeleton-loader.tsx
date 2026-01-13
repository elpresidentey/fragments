import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { useTheme } from '@/design-system/hooks/use-theme'

interface SkeletonLoaderProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: any
  shimmer?: boolean
  variant?: 'default' | 'text' | 'circular' | 'rectangular'
}

export function SkeletonLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style,
  shimmer = true,
  variant = 'default'
}: SkeletonLoaderProps) {
  const { theme } = useTheme()
  const animatedValue = useRef(new Animated.Value(0)).current
  const shimmerValue = useRef(new Animated.Value(0)).current

  // Set default dimensions based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return {
          width: height,
          height: height,
          borderRadius: height / 2,
        }
      case 'text':
        return {
          width,
          height: 16,
          borderRadius: 4,
        }
      case 'rectangular':
        return {
          width,
          height,
          borderRadius: 8,
        }
      default:
        return {
          width,
          height,
          borderRadius,
        }
    }
  }

  useEffect(() => {
    // Base pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    )

    // Shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: false,
      })
    )

    pulseAnimation.start()
    if (shimmer) {
      shimmerAnimation.start()
    }

    return () => {
      pulseAnimation.stop()
      shimmerAnimation.stop()
    }
  }, [animatedValue, shimmerValue, shimmer])

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      theme.mode === 'dark' ? '#2A2A2A' : '#E1E9EE',
      theme.mode === 'dark' ? '#3A3A3A' : '#F2F8FC'
    ],
  })

  const shimmerTranslateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  })

  const shimmerOpacity = shimmerValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 0],
  })

  const variantStyles = getVariantStyles()

  return (
    <View
      style={[
        styles.skeletonContainer,
        variantStyles,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.skeleton,
          {
            width: '100%',
            height: '100%',
            borderRadius: variantStyles.borderRadius,
            backgroundColor,
          },
        ]}
      />
      {shimmer && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslateX }],
              opacity: shimmerOpacity,
              backgroundColor: theme.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 255, 255, 0.6)',
            },
          ]}
        />
      )}
    </View>
  )
}

// Pre-built skeleton components for common use cases
export function PostSkeleton() {
  const { theme } = useTheme()
  
  return (
    <View style={[styles.postSkeleton, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.postHeader}>
        <SkeletonLoader variant="circular" height={48} />
        <View style={styles.postHeaderText}>
          <SkeletonLoader width="60%" height={16} />
          <SkeletonLoader width="40%" height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.postContent}>
        <SkeletonLoader width="100%" height={16} />
        <SkeletonLoader width="80%" height={16} style={{ marginTop: 4 }} />
        <SkeletonLoader width="90%" height={16} style={{ marginTop: 4 }} />
      </View>
      {/* Engagement actions skeleton */}
      <View style={styles.engagementSkeleton}>
        <SkeletonLoader width={40} height={16} />
        <SkeletonLoader width={40} height={16} />
        <SkeletonLoader width={40} height={16} />
        <SkeletonLoader width={40} height={16} />
      </View>
    </View>
  )
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.feedSkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton key={index} />
      ))}
    </View>
  )
}

export function ProfileSkeleton() {
  const { theme } = useTheme()
  
  return (
    <View style={[styles.profileSkeleton, { backgroundColor: theme.colors.background }]}>
      {/* Cover photo area */}
      <SkeletonLoader width="100%" height={120} borderRadius={0} />
      
      {/* Profile info */}
      <View style={styles.profileInfo}>
        <SkeletonLoader variant="circular" height={80} style={{ marginTop: -40 }} />
        <View style={styles.profileDetails}>
          <SkeletonLoader width="40%" height={20} style={{ marginTop: 8 }} />
          <SkeletonLoader width="30%" height={16} style={{ marginTop: 4 }} />
          <SkeletonLoader width="80%" height={16} style={{ marginTop: 8 }} />
          <SkeletonLoader width="60%" height={16} style={{ marginTop: 4 }} />
        </View>
        
        {/* Stats skeleton */}
        <View style={styles.statsSkeleton}>
          <SkeletonLoader width={60} height={16} />
          <SkeletonLoader width={60} height={16} />
          <SkeletonLoader width={60} height={16} />
        </View>
      </View>
    </View>
  )
}

export function CreatePostSkeleton() {
  const { theme } = useTheme()
  
  return (
    <View style={[styles.createPostSkeleton, { backgroundColor: theme.colors.background }]}>
      <View style={styles.createHeader}>
        <SkeletonLoader variant="circular" height={48} />
        <View style={styles.createContent}>
          <SkeletonLoader width="100%" height={20} />
          <SkeletonLoader width="80%" height={20} style={{ marginTop: 8 }} />
          <SkeletonLoader width="60%" height={20} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View style={styles.createActions}>
        <SkeletonLoader width={30} height={30} borderRadius={15} />
        <SkeletonLoader width={80} height={32} borderRadius={16} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  skeletonContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 50,
  },
  postSkeleton: {
    padding: 16,
    borderBottomWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  postContent: {
    marginLeft: 60, // Align with content after avatar
    marginBottom: 12,
  },
  engagementSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 60,
    marginRight: 40,
  },
  feedSkeleton: {
    flex: 1,
  },
  profileSkeleton: {
    flex: 1,
  },
  profileInfo: {
    padding: 16,
  },
  profileDetails: {
    marginTop: 8,
  },
  statsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  createPostSkeleton: {
    padding: 16,
  },
  createHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  createContent: {
    flex: 1,
    marginLeft: 12,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 60,
  },
})