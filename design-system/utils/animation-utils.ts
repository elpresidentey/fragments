/**
 * Animation utility functions and helpers
 * Provides common animation patterns and timing functions
 */

import { withSpring, withTiming, withSequence, withDelay } from 'react-native-reanimated';
import { animationTiming } from '../theme/animations';

export interface SpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
}

export interface TimingConfig {
  duration?: number;
  easing?: any;
}

/**
 * Default spring configuration for smooth animations
 */
export const defaultSpringConfig: SpringConfig = {
  damping: 15,
  stiffness: 300,
  mass: 1,
};

/**
 * Spring configuration for bouncy animations
 */
export const bouncySpringConfig: SpringConfig = {
  damping: 8,
  stiffness: 200,
  mass: 1,
};

/**
 * Spring configuration for gentle animations
 */
export const gentleSpringConfig: SpringConfig = {
  damping: 20,
  stiffness: 150,
  mass: 1,
};

/**
 * Creates a button press animation sequence
 */
export function createButtonPressAnimation(scale: number = 0.95) {
  return withSequence(
    withSpring(scale, defaultSpringConfig),
    withSpring(1, defaultSpringConfig)
  );
}

/**
 * Creates a like button animation with heart effect
 */
export function createLikeAnimation() {
  return withSequence(
    withSpring(1.3, bouncySpringConfig),
    withSpring(1, defaultSpringConfig)
  );
}

/**
 * Creates a slide-in animation from specified direction
 */
export function createSlideInAnimation(
  fromValue: number,
  toValue: number = 0,
  duration: number = animationTiming.medium
) {
  return withTiming(toValue, { duration });
}

/**
 * Creates a fade-in animation
 */
export function createFadeInAnimation(duration: number = animationTiming.quick) {
  return withTiming(1, { duration });
}

/**
 * Creates a fade-out animation
 */
export function createFadeOutAnimation(duration: number = animationTiming.quick) {
  return withTiming(0, { duration });
}

/**
 * Creates a staggered animation for multiple elements
 */
export function createStaggeredAnimation(
  animation: any,
  delay: number = 100,
  index: number = 0
) {
  return withDelay(delay * index, animation);
}

/**
 * Creates a pull-to-refresh spring animation
 */
export function createPullToRefreshAnimation() {
  return withSpring(0, {
    damping: 15,
    stiffness: 300,
    mass: 1,
  });
}

/**
 * Creates a floating action button animation
 */
export function createFloatingButtonAnimation() {
  return withSequence(
    withSpring(0.9, { damping: 15, stiffness: 300 }),
    withSpring(1, { damping: 15, stiffness: 300 })
  );
}

/**
 * Creates a screen transition animation
 */
export function createScreenTransitionAnimation(
  direction: 'left' | 'right' | 'up' | 'down' = 'right',
  distance: number = 100
) {
  const targetValue = direction === 'left' ? -distance : 
                     direction === 'right' ? distance :
                     direction === 'up' ? -distance : distance;
  
  return {
    enter: withTiming(0, { duration: animationTiming.medium }),
    exit: withTiming(targetValue, { duration: animationTiming.medium }),
  };
}

/**
 * Creates a loading spinner animation
 */
export function createSpinnerAnimation() {
  return withTiming(360, { duration: 1000 });
}

/**
 * Creates a shake animation for error states
 */
export function createShakeAnimation() {
  return withSequence(
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );
}

/**
 * Creates a success checkmark animation
 */
export function createSuccessAnimation() {
  return withSequence(
    withSpring(1.2, bouncySpringConfig),
    withSpring(1, defaultSpringConfig)
  );
}

/**
 * Animation presets for common UI patterns
 */
export const animationPresets = {
  buttonPress: () => createButtonPressAnimation(),
  like: () => createLikeAnimation(),
  fadeIn: () => createFadeInAnimation(),
  fadeOut: () => createFadeOutAnimation(),
  slideInLeft: () => createSlideInAnimation(-100),
  slideInRight: () => createSlideInAnimation(100),
  slideInUp: () => createSlideInAnimation(-100),
  slideInDown: () => createSlideInAnimation(100),
  pullToRefresh: () => createPullToRefreshAnimation(),
  floatingButton: () => createFloatingButtonAnimation(),
  spinner: () => createSpinnerAnimation(),
  shake: () => createShakeAnimation(),
  success: () => createSuccessAnimation(),
};

/**
 * Timing functions for different animation types
 */
export const timingFunctions = {
  quick: animationTiming.quick,
  medium: animationTiming.medium,
  slow: animationTiming.slow,
  instant: 0,
};

/**
 * Easing functions (for use with withTiming)
 */
export const easingFunctions = {
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  linear: (t: number) => t,
};