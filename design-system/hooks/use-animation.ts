/**
 * Animation hooks for consistent micro-interactions
 * Provides reusable animation patterns for common UI interactions
 * Updated with performance optimizations and native driver support
 */

import { useSharedValue, withSpring, withTiming, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { useCallback } from 'react';
import { animationTiming } from '../theme/animations';
import { 
  createOptimizedSpring, 
  createOptimizedTiming, 
  useAdaptiveAnimation 
} from '../utils/optimized-animations';
import { performanceMonitor } from '../utils/performance-utils';

export interface UseButtonPressAnimationOptions {
  scale?: number;
  duration?: number;
  onPress?: () => void;
}

/**
 * Hook for button press animations with scale and opacity changes
 * Now uses optimized animations for better performance
 */
export function useButtonPressAnimation(options: UseButtonPressAnimationOptions = {}) {
  const { scale = 0.95, duration = animationTiming.quick, onPress } = options;
  
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);

  // Use adaptive animation for better performance on low-end devices
  const { optimizedConfig, createSpring, createTiming } = useAdaptiveAnimation('spring', {
    enablePerformanceMonitoring: true,
    useNativeDriver: true,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }), []);

  const handlePressIn = useCallback(() => {
    scaleValue.value = createSpring(scale, {
      damping: 15,
      stiffness: 300,
    });
    opacityValue.value = createTiming(0.8, { duration: 100 });
  }, [scale, scaleValue, opacityValue, createSpring, createTiming]);

  const handlePressOut = useCallback(() => {
    scaleValue.value = createSpring(1, {
      damping: 15,
      stiffness: 300,
    });
    opacityValue.value = createTiming(1, { duration: 150 });
    
    if (onPress) {
      runOnJS(onPress)();
    }
  }, [scaleValue, opacityValue, onPress, createSpring, createTiming]);

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
  };
}

export interface UseLikeAnimationOptions {
  onLike?: () => void;
  isLiked?: boolean;
}

/**
 * Hook for like button animation with heart scaling effect
 * Now uses optimized animations with performance monitoring
 */
export function useLikeAnimation(options: UseLikeAnimationOptions = {}) {
  const { onLike, isLiked = false } = options;
  
  const scaleValue = useSharedValue(1);
  const rotationValue = useSharedValue(0);

  // Use adaptive animation for better performance
  const { createSpring, createTiming } = useAdaptiveAnimation('spring', {
    enablePerformanceMonitoring: true,
    useNativeDriver: true,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleValue.value },
      { rotate: `${rotationValue.value}deg` }
    ],
  }), []);

  const handleLike = useCallback(() => {
    // Start performance monitoring for this animation
    performanceMonitor.startMonitoring();

    // Heart pop animation with optimized springs
    scaleValue.value = createSpring(1.3, {
      damping: 10,
      stiffness: 300,
    });
    
    // Return to normal size
    setTimeout(() => {
      scaleValue.value = createSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }, 150);

    // Slight rotation for extra flair
    rotationValue.value = createTiming(isLiked ? 0 : 15, { duration: 200 });
    setTimeout(() => {
      rotationValue.value = createTiming(0, { duration: 200 });
    }, 200);

    if (onLike) {
      runOnJS(onLike)();
    }

    // Stop monitoring after animation completes
    setTimeout(() => {
      performanceMonitor.stopMonitoring();
    }, 600);
  }, [scaleValue, rotationValue, isLiked, onLike, createSpring, createTiming]);

  return {
    animatedStyle,
    handleLike,
  };
}

export interface UseSlideInAnimationOptions {
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  duration?: number;
  delay?: number;
}

/**
 * Hook for slide-in animations for screen transitions
 */
export function useSlideInAnimation(options: UseSlideInAnimationOptions = {}) {
  const { 
    direction = 'right', 
    distance = 100, 
    duration = animationTiming.medium,
    delay = 0 
  } = options;
  
  const translateX = useSharedValue(direction === 'left' ? -distance : direction === 'right' ? distance : 0);
  const translateY = useSharedValue(direction === 'up' ? -distance : direction === 'down' ? distance : 0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  const slideIn = useCallback(() => {
    translateX.value = withTiming(0, { duration }, () => {
      // Animation complete
    });
    translateY.value = withTiming(0, { duration });
    opacity.value = withTiming(1, { duration });
  }, [translateX, translateY, opacity, duration]);

  const slideOut = useCallback(() => {
    const targetX = direction === 'left' ? -distance : direction === 'right' ? distance : 0;
    const targetY = direction === 'up' ? -distance : direction === 'down' ? distance : 0;
    
    translateX.value = withTiming(targetX, { duration });
    translateY.value = withTiming(targetY, { duration });
    opacity.value = withTiming(0, { duration });
  }, [translateX, translateY, opacity, direction, distance, duration]);

  return {
    animatedStyle,
    slideIn,
    slideOut,
  };
}

export interface UseFadeAnimationOptions {
  duration?: number;
  delay?: number;
}

/**
 * Hook for fade animations
 */
export function useFadeAnimation(options: UseFadeAnimationOptions = {}) {
  const { duration = animationTiming.quick, delay = 0 } = options;
  
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const fadeIn = useCallback(() => {
    opacity.value = withTiming(1, { duration });
  }, [opacity, duration]);

  const fadeOut = useCallback(() => {
    opacity.value = withTiming(0, { duration });
  }, [opacity, duration]);

  return {
    animatedStyle,
    fadeIn,
    fadeOut,
  };
}

export interface UsePullToRefreshAnimationOptions {
  onRefresh?: () => void;
  threshold?: number;
}

/**
 * Hook for pull-to-refresh animation with spring physics
 */
export function usePullToRefreshAnimation(options: UsePullToRefreshAnimationOptions = {}) {
  const { onRefresh, threshold = 80 } = options;
  
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
  }));

  const handlePull = useCallback((distance: number) => {
    const progress = Math.min(distance / threshold, 1);
    translateY.value = distance;
    rotation.value = progress * 180;
    scale.value = 1 + (progress * 0.2);
  }, [translateY, rotation, scale, threshold]);

  const handleRelease = useCallback((distance: number) => {
    if (distance >= threshold && onRefresh) {
      // Trigger refresh
      runOnJS(onRefresh)();
      
      // Spring back animation
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 300,
      });
      rotation.value = withSpring(360, {
        damping: 15,
        stiffness: 300,
      });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    } else {
      // Spring back to original position
      translateY.value = withSpring(0);
      rotation.value = withSpring(0);
      scale.value = withSpring(1);
    }
  }, [translateY, rotation, scale, threshold, onRefresh]);

  return {
    animatedStyle,
    handlePull,
    handleRelease,
  };
}