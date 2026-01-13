/**
 * Design System Foundation
 * Centralized exports for theme engine, colors, typography, spacing, animations, and accessibility
 * Updated with performance optimizations and lazy loading
 */

// Theme Engine
export { ThemeEngine, themeEngine } from './theme/theme-engine';
export type { Theme, ColorScheme, ColorPalette, TypographySystem, SpacingSystem, AnimationTiming, AnimationPresets } from './theme/theme-engine';

// Individual Systems
export { Colors, lightColors, darkColors } from './theme/colors';
export { typography, scalableTypography } from './theme/typography';
export type { TypographyStyle, TypographyVariant, ScalableTypographySystem } from './theme/typography';
export { spacing } from './theme/spacing';
export type { SpacingKey } from './theme/spacing';
export { animationTiming, animationPresets } from './theme/animations';
export type { EasingType, AnimationPreset, AnimationPresetKey } from './theme/animations';

// Animation Hooks and Utilities
export { 
  useButtonPressAnimation,
  useLikeAnimation,
  useSlideInAnimation,
  useFadeAnimation,
  usePullToRefreshAnimation
} from './hooks/use-animation';

// Visual Feedback Hooks
export { 
  useVisualFeedback, 
  useHoverEffect, 
  useStateTransition 
} from './hooks/use-visual-feedback';
export type { 
  UseVisualFeedbackOptions, 
  UseHoverEffectOptions, 
  UseStateTransitionOptions 
} from './hooks/use-visual-feedback';

// Accessibility Hooks and Utilities
export { useAccessibility } from './hooks/use-accessibility';
export type { 
  UseAccessibilityReturn, 
  AccessibilitySettings, 
  AccessibilityPropsOptions, 
  AccessibilityProps 
} from './hooks/use-accessibility';

export {
  animationPresets as animationUtils,
  timingFunctions,
  easingFunctions,
  defaultSpringConfig,
  bouncySpringConfig,
  gentleSpringConfig
} from './utils/animation-utils';

// Accessibility Utilities
export {
  getContrastRatio,
  validateColorPalette,
  getAccessibleColor,
  FocusManager,
  generateContentChangeAnnouncement,
  createSemanticLabel,
  formatNumberForScreenReader
} from './utils/accessibility-utils';
export type { ContrastRatio, FocusManagerOptions } from './utils/accessibility-utils';

// Hooks
export { useTheme } from './hooks/use-theme';
export type { UseThemeReturn } from './hooks/use-theme';

// Performance utilities (new)
export {
  performanceMonitor,
  useAnimationPerformance,
  measureAnimationPerformance,
  debounce,
  throttle,
  useStableCallback,
  imageCache,
  useOptimizedImage
} from './utils/performance-utils';
export type { PerformanceMetrics, PerformanceMonitorOptions, ImageCacheOptions } from './utils/performance-utils';

export {
  createOptimizedSpring,
  createOptimizedTiming,
  useOptimizedButtonPress,
  useOptimizedLikeAnimation,
  useOptimizedSlideTransition,
  useOptimizedShimmer,
  useOptimizedPullToRefresh,
  AnimationResourceManager,
  useAdaptiveAnimation
} from './utils/optimized-animations';
export type { OptimizedAnimationConfig, SpringConfig, TimingConfig } from './utils/optimized-animations';

export {
  deepEqual,
  shallowEqual,
  memoShallow,
  memoDeep,
  memoCustom,
  useMemoizedStyles,
  createMemoizedStyleSheet,
  useStableCallback as useStableCallbackMemo,
  useMemoizedValue,
  MemoizedComponentFactory,
  MemoizationMonitor,
  useMemoizationMonitor,
  withMemoizationMonitoring
} from './utils/memoization-utils';

export {
  lazyComponent,
  LazyAnimations,
  LazyComponents,
  BundleAnalyzer,
  ResourcePreloader,
  withMemoryOptimization,
  PlatformOptimizations,
  initializeBundleOptimizations
} from './utils/bundle-optimization';
export type { LazyComponentOptions, BundleStats } from './utils/bundle-optimization';

// Initialize performance optimizations
import { initializeBundleOptimizations } from './utils/bundle-optimization';

// Auto-initialize optimizations when design system is imported
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  // Delay initialization to not block app startup
  setTimeout(() => {
    initializeBundleOptimizations();
  }, 100);
}