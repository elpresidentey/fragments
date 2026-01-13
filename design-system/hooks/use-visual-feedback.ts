/**
 * Visual feedback hooks for immediate user interaction responses
 * Ensures all interactions provide feedback within 100ms as per requirements
 */

import { useSharedValue, withTiming, withSpring, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { useCallback, useRef } from 'react';
import { Haptics } from 'expo-haptics';
import { animationTiming } from '../theme/animations';
import { useTheme } from './use-theme';

export interface UseVisualFeedbackOptions {
  feedbackType?: 'press' | 'success' | 'error' | 'warning' | 'info';
  hapticFeedback?: boolean;
  duration?: number;
  onPress?: () => void;
  disabled?: boolean;
}

/**
 * Hook for immediate visual feedback on user interactions
 * Provides feedback within 100ms as required by specifications
 */
export function useVisualFeedback(options: UseVisualFeedbackOptions = {}) {
  const { 
    feedbackType = 'press',
    hapticFeedback = true,
    duration = 150,
    onPress,
    disabled = false
  } = options;
  
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const backgroundColor = useSharedValue(0);
  const borderWidth = useSharedValue(0);
  
  const feedbackTimeoutRef = useRef<NodeJS.Timeout>();

  const animatedStyle = useAnimatedStyle(() => {
    const getBackgroundColor = () => {
      switch (feedbackType) {
        case 'success':
          return `rgba(23, 191, 99, ${backgroundColor.value * 0.1})`;
        case 'error':
          return `rgba(224, 36, 94, ${backgroundColor.value * 0.1})`;
        case 'warning':
          return `rgba(255, 173, 31, ${backgroundColor.value * 0.1})`;
        case 'info':
          return `rgba(29, 161, 242, ${backgroundColor.value * 0.1})`;
        case 'press':
        default:
          return `rgba(29, 161, 242, ${backgroundColor.value * 0.05})`;
      }
    };

    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      backgroundColor: getBackgroundColor(),
      borderWidth: borderWidth.value,
      borderColor: theme.colors.primary,
    };
  });

  const provideFeedback = useCallback((type: 'press' | 'success' | 'error' | 'warning' | 'info' = feedbackType) => {
    if (disabled) return;

    // Clear any existing timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Immediate visual feedback (within 100ms requirement)
    scale.value = withSpring(0.95, {
      damping: 20,
      stiffness: 400,
    });
    
    opacity.value = withTiming(0.8, { duration: 80 });
    backgroundColor.value = withTiming(1, { duration: 80 });
    
    if (type !== 'press') {
      borderWidth.value = withTiming(2, { duration: 80 });
    }

    // Haptic feedback for enhanced user experience
    if (hapticFeedback && process.env.EXPO_OS === 'ios') {
      const hapticType = type === 'success' ? Haptics.ImpactFeedbackStyle.Light :
                        type === 'error' ? Haptics.ImpactFeedbackStyle.Medium :
                        Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(hapticType);
    }

    // Return to normal state
    feedbackTimeoutRef.current = setTimeout(() => {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
      opacity.value = withTiming(1, { duration: duration });
      backgroundColor.value = withTiming(0, { duration: duration });
      borderWidth.value = withTiming(0, { duration: duration });
    }, 100);

    // Execute callback after feedback
    if (onPress) {
      setTimeout(() => {
        runOnJS(onPress)();
      }, 50);
    }
  }, [scale, opacity, backgroundColor, borderWidth, feedbackType, hapticFeedback, duration, onPress, disabled, theme.colors.primary]);

  const handlePressIn = useCallback(() => {
    provideFeedback('press');
  }, [provideFeedback]);

  const showSuccess = useCallback(() => {
    provideFeedback('success');
  }, [provideFeedback]);

  const showError = useCallback(() => {
    provideFeedback('error');
  }, [provideFeedback]);

  const showWarning = useCallback(() => {
    provideFeedback('warning');
  }, [provideFeedback]);

  const showInfo = useCallback(() => {
    provideFeedback('info');
  }, [provideFeedback]);

  return {
    animatedStyle,
    handlePressIn,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    provideFeedback,
  };
}

export interface UseHoverEffectOptions {
  hoverScale?: number;
  hoverOpacity?: number;
  duration?: number;
  disabled?: boolean;
}

/**
 * Hook for subtle hover effects on interactive elements
 * Provides consistent hover behavior across the app
 */
export function useHoverEffect(options: UseHoverEffectOptions = {}) {
  const {
    hoverScale = 1.02,
    hoverOpacity = 0.9,
    duration = animationTiming.quick,
    disabled = false
  } = options;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const elevation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    elevation: elevation.value,
    shadowOpacity: elevation.value * 0.1,
    shadowRadius: elevation.value * 2,
    shadowOffset: {
      width: 0,
      height: elevation.value,
    },
  }));

  const handleHoverIn = useCallback(() => {
    if (disabled) return;
    
    scale.value = withSpring(hoverScale, {
      damping: 15,
      stiffness: 300,
    });
    opacity.value = withTiming(hoverOpacity, { duration });
    elevation.value = withTiming(2, { duration });
  }, [scale, opacity, elevation, hoverScale, hoverOpacity, duration, disabled]);

  const handleHoverOut = useCallback(() => {
    if (disabled) return;
    
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
    opacity.value = withTiming(1, { duration });
    elevation.value = withTiming(0, { duration });
  }, [scale, opacity, elevation, duration, disabled]);

  return {
    animatedStyle,
    handleHoverIn,
    handleHoverOut,
  };
}

export interface UseStateTransitionOptions {
  duration?: number;
  staggerDelay?: number;
}

/**
 * Hook for smooth state transitions between UI states
 * Ensures consistent transition timing across all UI elements
 */
export function useStateTransition(options: UseStateTransitionOptions = {}) {
  const {
    duration = animationTiming.medium,
    staggerDelay = 50
  } = options;

  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  const transitionTo = useCallback((state: 'visible' | 'hidden' | 'loading', delay = 0) => {
    const animationDelay = delay * staggerDelay;

    switch (state) {
      case 'visible':
        opacity.value = withTiming(1, { duration }, () => {
          // Animation complete
        });
        translateY.value = withSpring(0, {
          damping: 15,
          stiffness: 300,
        });
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 300,
        });
        break;
      
      case 'hidden':
        opacity.value = withTiming(0, { duration });
        translateY.value = withTiming(-10, { duration });
        scale.value = withTiming(0.95, { duration });
        break;
      
      case 'loading':
        opacity.value = withTiming(0.6, { duration });
        scale.value = withSpring(0.98, {
          damping: 15,
          stiffness: 300,
        });
        break;
    }
  }, [opacity, translateY, scale, duration, staggerDelay]);

  return {
    animatedStyle,
    transitionTo,
  };
}