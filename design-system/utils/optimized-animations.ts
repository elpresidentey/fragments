/**
 * Optimized animation utilities for 60fps performance
 * Uses native driver when possible and provides performance monitoring
 */

import React from 'react';
import { 
  withSpring, 
  withTiming, 
  withSequence, 
  withDelay,
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  SharedValue,
  Easing,
} from 'react-native-reanimated';
import { Platform } from 'react-native';
import { performanceMonitor, measureAnimationPerformance } from './performance-utils';

export interface OptimizedAnimationConfig {
  useNativeDriver?: boolean;
  enablePerformanceMonitoring?: boolean;
  fallbackOnLowPerformance?: boolean;
  maxDuration?: number;
}

export interface SpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
  overshootClamping?: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
}

export interface TimingConfig {
  duration?: number;
  easing?: any; // Accept any easing function or string
}

const DEFAULT_CONFIG: Required<OptimizedAnimationConfig> = {
  useNativeDriver: true,
  enablePerformanceMonitoring: false,
  fallbackOnLowPerformance: true,
  maxDuration: 1000,
};

/**
 * Convert string easing types to react-native-reanimated easing functions
 */
function getEasingFunction(easing?: any): any {
  if (!easing) return Easing.out(Easing.quad);
  
  // If it's already a function, return as-is
  if (typeof easing === 'function') return easing;
  
  // Convert string easing types to functions
  switch (easing) {
    case 'ease-in':
      return Easing.in(Easing.quad);
    case 'ease-out':
      return Easing.out(Easing.quad);
    case 'ease-in-out':
      return Easing.inOut(Easing.quad);
    case 'spring':
      return Easing.elastic(1);
    case 'linear':
      return Easing.linear;
    default:
      return Easing.out(Easing.quad);
  }
}

/**
 * Optimized spring animation with performance monitoring
 */
export function createOptimizedSpring(
  toValue: number,
  config: SpringConfig & OptimizedAnimationConfig = {}
): any {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Use high-performance spring settings for 60fps
  const springConfig: SpringConfig = {
    damping: 15,
    stiffness: 300,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
    ...config,
  };

  // Adjust settings based on performance if monitoring is enabled
  if (finalConfig.enablePerformanceMonitoring && finalConfig.fallbackOnLowPerformance) {
    const isAcceptable = performanceMonitor.isPerformanceAcceptable();
    if (!isAcceptable) {
      // Reduce animation complexity for better performance
      springConfig.damping = Math.min(springConfig.damping! * 1.5, 25);
      springConfig.stiffness = Math.max(springConfig.stiffness! * 0.7, 200);
    }
  }

  return withSpring(toValue, springConfig);
}

/**
 * Optimized timing animation with performance monitoring
 */
export function createOptimizedTiming(
  toValue: number,
  config: TimingConfig & OptimizedAnimationConfig = {}
): any {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  let duration = config.duration || 300;
  
  // Limit duration to prevent performance issues
  if (duration > finalConfig.maxDuration) {
    duration = finalConfig.maxDuration;
    console.warn(`Animation duration capped at ${finalConfig.maxDuration}ms for performance`);
  }

  // Adjust duration based on performance if monitoring is enabled
  if (finalConfig.enablePerformanceMonitoring && finalConfig.fallbackOnLowPerformance) {
    const isAcceptable = performanceMonitor.isPerformanceAcceptable();
    if (!isAcceptable) {
      // Reduce duration for better performance
      duration = Math.max(duration * 0.7, 150);
    }
  }

  const timingConfig: any = {
    duration,
    easing: getEasingFunction(config.easing),
  };

  return withTiming(toValue, timingConfig);
}

/**
 * Performance-optimized button press animation
 */
export function useOptimizedButtonPress(
  config: OptimizedAnimationConfig & { scale?: number; opacity?: number } = {}
) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const targetScale = config.scale || 0.95;
  const targetOpacity = config.opacity || 0.8;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }), []);

  const pressIn = () => {
    scale.value = createOptimizedSpring(targetScale, {
      damping: 20,
      stiffness: 400,
      ...config,
    });
    opacity.value = createOptimizedTiming(targetOpacity, {
      duration: 100,
      ...config,
    });
  };

  const pressOut = () => {
    scale.value = createOptimizedSpring(1, {
      damping: 20,
      stiffness: 400,
      ...config,
    });
    opacity.value = createOptimizedTiming(1, {
      duration: 150,
      ...config,
    });
  };

  return {
    animatedStyle,
    pressIn,
    pressOut,
  };
}

/**
 * Performance-optimized like animation with heart effect
 */
export function useOptimizedLikeAnimation(
  config: OptimizedAnimationConfig & { onComplete?: () => void } = {}
) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }), []);

  const triggerLike = () => {
    // Heart pop sequence optimized for performance
    scale.value = withSequence(
      createOptimizedSpring(1.3, {
        damping: 10,
        stiffness: 400,
        ...config,
      }),
      createOptimizedSpring(1, {
        damping: 15,
        stiffness: 300,
        ...config,
      })
    );

    // Subtle rotation for extra flair
    rotation.value = withSequence(
      createOptimizedTiming(15, { duration: 200, ...config }),
      createOptimizedTiming(0, { duration: 200, ...config })
    );

    if (config.onComplete) {
      // Use runOnJS for callback
      scale.value = withDelay(400, withTiming(1, { duration: 0 }, () => {
        runOnJS(config.onComplete!)();
      }));
    }
  };

  return {
    animatedStyle,
    triggerLike,
  };
}

/**
 * Performance-optimized slide transition
 */
export function useOptimizedSlideTransition(
  direction: 'left' | 'right' | 'up' | 'down' = 'right',
  distance: number = 100,
  config: OptimizedAnimationConfig = {}
) {
  const translateX = useSharedValue(direction === 'left' ? -distance : direction === 'right' ? distance : 0);
  const translateY = useSharedValue(direction === 'up' ? -distance : direction === 'down' ? distance : 0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }), []);

  const slideIn = () => {
    translateX.value = createOptimizedTiming(0, { duration: 300, ...config });
    translateY.value = createOptimizedTiming(0, { duration: 300, ...config });
    opacity.value = createOptimizedTiming(1, { duration: 300, ...config });
  };

  const slideOut = () => {
    const targetX = direction === 'left' ? -distance : direction === 'right' ? distance : 0;
    const targetY = direction === 'up' ? -distance : direction === 'down' ? distance : 0;
    
    translateX.value = createOptimizedTiming(targetX, { duration: 250, ...config });
    translateY.value = createOptimizedTiming(targetY, { duration: 250, ...config });
    opacity.value = createOptimizedTiming(0, { duration: 250, ...config });
  };

  return {
    animatedStyle,
    slideIn,
    slideOut,
  };
}

/**
 * Performance-optimized shimmer loading animation
 */
export function useOptimizedShimmer(
  config: OptimizedAnimationConfig & { duration?: number } = {}
) {
  const shimmerValue = useSharedValue(0);
  const duration = config.duration || 1500;

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      [-100, 100],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  }, []);

  const startShimmer = () => {
    shimmerValue.value = withSequence(
      withTiming(1, { duration }, () => {
        shimmerValue.value = 0;
      })
    );
  };

  const stopShimmer = () => {
    shimmerValue.value = 0;
  };

  return {
    animatedStyle,
    startShimmer,
    stopShimmer,
  };
}

/**
 * Performance-optimized pull-to-refresh animation
 */
export function useOptimizedPullToRefresh(
  threshold: number = 80,
  config: OptimizedAnimationConfig & { onRefresh?: () => void } = {}
) {
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }), []);

  const handlePull = (distance: number) => {
    const progress = Math.min(distance / threshold, 1);
    
    translateY.value = distance;
    rotation.value = progress * 180;
    scale.value = 1 + (progress * 0.2);
  };

  const handleRelease = (distance: number) => {
    const shouldRefresh = distance >= threshold;
    
    if (shouldRefresh && config.onRefresh) {
      // Trigger refresh with optimized animation
      translateY.value = createOptimizedSpring(0, {
        damping: 15,
        stiffness: 300,
        ...config,
      });
      rotation.value = createOptimizedSpring(360, {
        damping: 15,
        stiffness: 300,
        ...config,
      });
      scale.value = createOptimizedSpring(1, {
        damping: 15,
        stiffness: 300,
        ...config,
      });
      
      runOnJS(config.onRefresh)();
    } else {
      // Spring back to original position
      translateY.value = createOptimizedSpring(0, config);
      rotation.value = createOptimizedSpring(0, config);
      scale.value = createOptimizedSpring(1, config);
    }
  };

  return {
    animatedStyle,
    handlePull,
    handleRelease,
  };
}

/**
 * Lazy-loaded animation resources for bundle optimization
 */
export class AnimationResourceManager {
  private static loadedResources = new Set<string>();
  private static loadingPromises = new Map<string, Promise<any>>();

  /**
   * Lazy load animation resources
   */
  static async loadAnimationResource(resourceName: string): Promise<any> {
    if (this.loadedResources.has(resourceName)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(resourceName)) {
      return this.loadingPromises.get(resourceName);
    }

    const loadPromise = this.loadResource(resourceName);
    this.loadingPromises.set(resourceName, loadPromise);

    try {
      const result = await loadPromise;
      this.loadedResources.add(resourceName);
      this.loadingPromises.delete(resourceName);
      return result;
    } catch (error) {
      this.loadingPromises.delete(resourceName);
      throw error;
    }
  }

  /**
   * Load specific animation resource
   */
  private static async loadResource(resourceName: string): Promise<any> {
    switch (resourceName) {
      case 'lottie':
        // Lottie animations not available
        return Promise.resolve(null);
      
      case 'complex-animations':
        // Lazy load complex animation presets
        return import('../theme/animations').then(module => module.animationPresets);
      
      case 'gesture-animations':
        // Gesture-based animations available through react-native-gesture-handler
        return import('react-native-gesture-handler').catch(() => null);
      
      default:
        return Promise.resolve();
    }
  }

  /**
   * Preload critical animation resources
   */
  static async preloadCriticalResources(): Promise<void> {
    const criticalResources = ['complex-animations'];
    
    await Promise.all(
      criticalResources.map(resource => 
        this.loadAnimationResource(resource).catch(error => 
          console.warn(`Failed to preload ${resource}:`, error)
        )
      )
    );
  }

  /**
   * Get loaded resources stats
   */
  static getStats() {
    return {
      loadedCount: this.loadedResources.size,
      loadingCount: this.loadingPromises.size,
      loadedResources: Array.from(this.loadedResources),
    };
  }
}

/**
 * Performance-aware animation hook that adapts to device capabilities
 */
export function useAdaptiveAnimation(
  animationType: 'spring' | 'timing' | 'complex',
  config: OptimizedAnimationConfig = {}
) {
  const [isLowPerformanceDevice, setIsLowPerformanceDevice] = React.useState(false);

  React.useEffect(() => {
    // Check device performance capabilities
    const checkPerformance = () => {
      const isLowEnd = Platform.OS === 'android' && Platform.constants.Release < 10;
      
      // Safely check for totalMemory (not available on web)
      let hasLowMemory = false;
      if (Platform.constants && typeof Platform.constants.totalMemory === 'number') {
        hasLowMemory = Platform.constants.totalMemory < 2 * 1024 * 1024 * 1024; // < 2GB
      }
      
      setIsLowPerformanceDevice(isLowEnd || hasLowMemory);
    };

    checkPerformance();
  }, []);

  const getOptimizedConfig = React.useCallback(() => {
    if (isLowPerformanceDevice) {
      return {
        ...config,
        useNativeDriver: true,
        fallbackOnLowPerformance: true,
        maxDuration: 500, // Shorter animations on low-end devices
      };
    }

    return {
      ...config,
      useNativeDriver: true,
      enablePerformanceMonitoring: true,
    };
  }, [isLowPerformanceDevice, config]);

  return {
    isLowPerformanceDevice,
    optimizedConfig: getOptimizedConfig(),
    createSpring: (toValue: number, springConfig?: SpringConfig) =>
      createOptimizedSpring(toValue, { ...getOptimizedConfig(), ...springConfig }),
    createTiming: (toValue: number, timingConfig?: TimingConfig) =>
      createOptimizedTiming(toValue, { ...getOptimizedConfig(), ...timingConfig }),
  };
}