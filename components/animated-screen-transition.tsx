/**
 * Animated Screen Transition Component
 * Provides smooth screen transitions with slide animations
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { animationTiming } from '../design-system/theme/animations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface AnimatedScreenTransitionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  isVisible?: boolean;
  onTransitionComplete?: () => void;
  style?: any;
}

export function AnimatedScreenTransition({
  children,
  direction = 'right',
  duration = animationTiming.medium,
  isVisible = true,
  onTransitionComplete,
  style,
}: AnimatedScreenTransitionProps) {
  const translateX = useSharedValue(getInitialTranslateX(direction));
  const translateY = useSharedValue(getInitialTranslateY(direction));
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (isVisible) {
      // Slide in animation
      translateX.value = withTiming(0, { duration });
      translateY.value = withTiming(0, { duration });
      opacity.value = withTiming(1, { duration }, () => {
        if (onTransitionComplete) {
          runOnJS(onTransitionComplete)();
        }
      });
    } else {
      // Slide out animation
      translateX.value = withTiming(getExitTranslateX(direction), { duration });
      translateY.value = withTiming(getExitTranslateY(direction), { duration });
      opacity.value = withTiming(0, { duration }, () => {
        if (onTransitionComplete) {
          runOnJS(onTransitionComplete)();
        }
      });
    }
  }, [isVisible, direction, duration, translateX, translateY, opacity, onTransitionComplete]);

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

function getInitialTranslateX(direction: string): number {
  switch (direction) {
    case 'left':
      return -screenWidth;
    case 'right':
      return screenWidth;
    default:
      return 0;
  }
}

function getInitialTranslateY(direction: string): number {
  switch (direction) {
    case 'up':
      return -screenHeight;
    case 'down':
      return screenHeight;
    default:
      return 0;
  }
}

function getExitTranslateX(direction: string): number {
  switch (direction) {
    case 'left':
      return screenWidth;
    case 'right':
      return -screenWidth;
    default:
      return 0;
  }
}

function getExitTranslateY(direction: string): number {
  switch (direction) {
    case 'up':
      return screenHeight;
    case 'down':
      return -screenHeight;
    default:
      return 0;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});