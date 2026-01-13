/**
 * Bundle optimization utilities for lazy loading and code splitting
 * Reduces initial bundle size and improves app startup performance
 */

import React from 'react';
import { Platform } from 'react-native';

export interface LazyComponentOptions {
  fallback?: React.ComponentType;
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
  timeout?: number;
}

export interface BundleStats {
  loadedChunks: string[];
  failedChunks: string[];
  totalSize: number;
  loadTime: number;
}

/**
 * Lazy load a component with error handling and fallback
 */
export function lazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): React.LazyExoticComponent<T> {
  const {
    fallback,
    errorBoundary,
    preload = false,
    timeout = 10000,
  } = options;

  // Create lazy component with timeout
  const LazyComponent = React.lazy(() => {
    const importPromise = importFn();
    
    if (timeout > 0) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Component import timed out after ${timeout}ms`));
        }, timeout);
      });
      
      return Promise.race([importPromise, timeoutPromise]);
    }
    
    return importPromise;
  });

  // Preload if requested
  if (preload) {
    importFn().catch(error => {
      console.warn('Failed to preload component:', error);
    });
  }

  return LazyComponent;
}

/**
 * Lazy load animation resources
 */
export const LazyAnimations = {
  // Complex animations (loaded on demand)
  ComplexAnimations: lazyComponent(
    () => import('../theme/animations').then(module => ({ default: module.animationPresets })),
    { preload: false }
  ),
  
  // Lottie animations (if needed)
  LottieAnimations: lazyComponent(
    () => Promise.resolve({ default: null }), // Lottie not available
    { preload: false }
  ),
};

/**
 * Lazy load UI components that are not immediately needed
 */
export const LazyComponents = {
  // Profile modal (loaded when needed)
  EditProfileModal: lazyComponent(
    () => import('../../components/edit-profile-modal').then(module => ({ default: module.EditProfileModal })),
    { preload: false }
  ),
};

/**
 * Bundle analyzer for monitoring loaded chunks
 */
export class BundleAnalyzer {
  private static loadedChunks = new Set<string>();
  private static failedChunks = new Set<string>();
  private static loadTimes = new Map<string, number>();
  private static startTime = Date.now();

  /**
   * Track successful chunk load
   */
  static trackChunkLoad(chunkName: string, loadTime: number): void {
    this.loadedChunks.add(chunkName);
    this.loadTimes.set(chunkName, loadTime);
    
    console.log(`✅ Chunk loaded: ${chunkName} (${loadTime}ms)`);
  }

  /**
   * Track failed chunk load
   */
  static trackChunkError(chunkName: string, error: Error): void {
    this.failedChunks.add(chunkName);
    
    console.error(`❌ Chunk failed: ${chunkName}`, error);
  }

  /**
   * Get bundle statistics
   */
  static getStats(): BundleStats {
    const totalLoadTime = Array.from(this.loadTimes.values()).reduce((sum, time) => sum + time, 0);
    
    return {
      loadedChunks: Array.from(this.loadedChunks),
      failedChunks: Array.from(this.failedChunks),
      totalSize: this.loadedChunks.size,
      loadTime: totalLoadTime,
    };
  }

  /**
   * Log bundle report
   */
  static logReport(): void {
    const stats = this.getStats();
    const appLoadTime = Date.now() - this.startTime;
    
    console.group('📦 Bundle Performance Report');
    console.log('App Load Time:', `${appLoadTime}ms`);
    console.log('Loaded Chunks:', stats.loadedChunks.length);
    console.log('Failed Chunks:', stats.failedChunks.length);
    console.log('Total Chunk Load Time:', `${stats.loadTime}ms`);
    
    if (stats.failedChunks.length > 0) {
      console.warn('Failed Chunks:', stats.failedChunks);
    }
    
    console.groupEnd();
  }

  /**
   * Reset statistics
   */
  static reset(): void {
    this.loadedChunks.clear();
    this.failedChunks.clear();
    this.loadTimes.clear();
    this.startTime = Date.now();
  }
}

/**
 * Preload critical resources for better perceived performance
 */
export class ResourcePreloader {
  private static preloadedResources = new Set<string>();
  private static preloadPromises = new Map<string, Promise<any>>();

  /**
   * Preload a resource
   */
  static async preload(
    resourceName: string,
    importFn: () => Promise<any>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    if (this.preloadedResources.has(resourceName)) {
      return;
    }

    if (this.preloadPromises.has(resourceName)) {
      return this.preloadPromises.get(resourceName);
    }

    const startTime = Date.now();
    const preloadPromise = importFn()
      .then(result => {
        const loadTime = Date.now() - startTime;
        this.preloadedResources.add(resourceName);
        BundleAnalyzer.trackChunkLoad(resourceName, loadTime);
        return result;
      })
      .catch(error => {
        BundleAnalyzer.trackChunkError(resourceName, error);
        throw error;
      })
      .finally(() => {
        this.preloadPromises.delete(resourceName);
      });

    this.preloadPromises.set(resourceName, preloadPromise);
    
    // Add delay for low priority resources
    if (priority === 'low') {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else if (priority === 'medium') {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return preloadPromise;
  }

  /**
   * Preload critical app resources
   */
  static async preloadCritical(): Promise<void> {
    const criticalResources = [
      {
        name: 'theme-engine',
        importFn: () => import('../theme/theme-engine'),
        priority: 'high' as const,
      },
      {
        name: 'animation-utils',
        importFn: () => import('../utils/optimized-animations'),
        priority: 'high' as const,
      },
      {
        name: 'performance-utils',
        importFn: () => import('../utils/performance-utils'),
        priority: 'medium' as const,
      },
    ];

    await Promise.allSettled(
      criticalResources.map(resource =>
        this.preload(resource.name, resource.importFn, resource.priority)
      )
    );
  }

  /**
   * Preload non-critical resources in the background
   */
  static preloadBackground(): void {
    const backgroundResources = [
      {
        name: 'edit-profile-modal',
        importFn: () => import('../../components/edit-profile-modal'),
      },
    ];

    // Preload after a delay to not interfere with critical path
    setTimeout(() => {
      backgroundResources.forEach(resource => {
        this.preload(resource.name, resource.importFn, 'low').catch(error => {
          console.warn(`Failed to preload ${resource.name}:`, error);
        });
      });
    }, 2000);
  }

  /**
   * Get preload statistics
   */
  static getStats() {
    return {
      preloadedCount: this.preloadedResources.size,
      preloadingCount: this.preloadPromises.size,
      preloadedResources: Array.from(this.preloadedResources),
    };
  }
}

/**
 * Memory-efficient component wrapper that unloads when not visible
 */
export function withMemoryOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: { unloadDelay?: number } = {}
) {
  const { unloadDelay = 30000 } = options; // 30 seconds default

  return React.forwardRef<any, P & { visible?: boolean }>((props, ref) => {
    const { visible = true, ...componentProps } = props;
    const [shouldRender, setShouldRender] = React.useState(visible);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

    React.useEffect(() => {
      if (visible) {
        setShouldRender(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = undefined;
        }
      } else {
        // Delay unloading to prevent flickering
        timeoutRef.current = setTimeout(() => {
          setShouldRender(false);
        }, unloadDelay);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [visible, unloadDelay]);

    if (!shouldRender) {
      return null;
    }

    return React.createElement(Component, { ...(componentProps as P), ref });
  });
}

/**
 * Platform-specific bundle optimization
 */
export const PlatformOptimizations = {
  /**
   * Check if device supports advanced animations
   */
  supportsAdvancedAnimations(): boolean {
    if (Platform.OS === 'web') {
      return true; // Web generally supports advanced animations
    }
    
    if (Platform.OS === 'android') {
      return Platform.Version >= 21; // Android 5.0+
    }
    
    if (Platform.OS === 'ios') {
      return parseInt(Platform.Version, 10) >= 11; // iOS 11+
    }
    
    return false;
  },

  /**
   * Get recommended bundle strategy based on platform
   */
  getBundleStrategy(): 'aggressive' | 'moderate' | 'conservative' {
    if (Platform.OS === 'web') {
      return 'aggressive'; // Web can handle more aggressive splitting
    }
    
    if (Platform.OS === 'android' && Platform.Version < 23) {
      return 'conservative'; // Older Android devices
    }
    
    if (Platform.OS === 'ios' && parseInt(Platform.Version, 10) < 12) {
      return 'conservative'; // Older iOS devices
    }
    
    return 'moderate';
  },

  /**
   * Apply platform-specific optimizations
   */
  applyOptimizations(): void {
    const strategy = this.getBundleStrategy();
    
    switch (strategy) {
      case 'aggressive':
        ResourcePreloader.preloadCritical();
        ResourcePreloader.preloadBackground();
        break;
        
      case 'moderate':
        ResourcePreloader.preloadCritical();
        setTimeout(() => ResourcePreloader.preloadBackground(), 5000);
        break;
        
      case 'conservative':
        // Only preload critical resources
        ResourcePreloader.preloadCritical();
        break;
    }
  },
};

/**
 * Initialize bundle optimizations
 */
export function initializeBundleOptimizations(): void {
  console.log('🚀 Initializing bundle optimizations...');
  
  // Apply platform-specific optimizations
  PlatformOptimizations.applyOptimizations();
  
  // Log bundle report after app loads
  setTimeout(() => {
    BundleAnalyzer.logReport();
  }, 3000);
  
  console.log('✅ Bundle optimizations initialized');
}