/**
 * Performance monitoring utilities for animations and rendering
 * Provides frame rate monitoring, memory tracking, and performance optimization helpers
 */

import React from 'react';
import { InteractionManager, Platform } from 'react-native';

export interface PerformanceMetrics {
  frameRate: number;
  droppedFrames: number;
  memoryUsage?: number;
  renderTime: number;
  animationDuration: number;
}

export interface PerformanceMonitorOptions {
  enableFrameRateMonitoring?: boolean;
  enableMemoryTracking?: boolean;
  sampleInterval?: number;
  maxSamples?: number;
}

class PerformanceMonitor {
  private frameCount = 0;
  private droppedFrames = 0;
  private lastFrameTime = 0;
  private frameRates: number[] = [];
  private isMonitoring = false;
  private monitoringInterval?: ReturnType<typeof setInterval>;
  private options: Required<PerformanceMonitorOptions>;

  constructor(options: PerformanceMonitorOptions = {}) {
    this.options = {
      enableFrameRateMonitoring: true,
      enableMemoryTracking: Platform.OS !== 'web',
      sampleInterval: 1000, // 1 second
      maxSamples: 60, // Keep last 60 samples (1 minute)
      ...options,
    };
  }

  /**
   * Start monitoring performance metrics
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.lastFrameTime = performance.now();

    if (this.options.enableFrameRateMonitoring) {
      this.monitoringInterval = setInterval(() => {
        this.sampleFrameRate();
      }, this.options.sampleInterval);
    }
  }

  /**
   * Stop monitoring performance metrics
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Sample current frame rate
   */
  private sampleFrameRate(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime > 0) {
      const currentFrameRate = 1000 / deltaTime;
      this.frameRates.push(currentFrameRate);
      
      // Keep only the last maxSamples
      if (this.frameRates.length > this.options.maxSamples) {
        this.frameRates.shift();
      }
      
      // Count dropped frames (below 55fps is considered dropped)
      if (currentFrameRate < 55) {
        this.droppedFrames++;
      }
    }
    
    this.frameCount++;
    this.lastFrameTime = currentTime;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const averageFrameRate = this.frameRates.length > 0 
      ? this.frameRates.reduce((sum, rate) => sum + rate, 0) / this.frameRates.length
      : 60;

    return {
      frameRate: Math.round(averageFrameRate),
      droppedFrames: this.droppedFrames,
      memoryUsage: this.getMemoryUsage(),
      renderTime: this.getAverageRenderTime(),
      animationDuration: 0, // Will be set by animation monitoring
    };
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number | undefined {
    if (!this.options.enableMemoryTracking) return undefined;

    // Use performance.memory if available (Chrome/Edge)
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }

    return undefined;
  }

  /**
   * Get average render time from recent samples
   */
  private getAverageRenderTime(): number {
    if (this.frameRates.length === 0) return 0;
    
    // Convert frame rate to render time (ms per frame)
    const renderTimes = this.frameRates.map(rate => 1000 / rate);
    return renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
  }

  /**
   * Check if performance is acceptable (>= 55fps)
   */
  isPerformanceAcceptable(): boolean {
    const metrics = this.getMetrics();
    return metrics.frameRate >= 55;
  }

  /**
   * Get performance grade (A-F based on frame rate)
   */
  getPerformanceGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    const frameRate = this.getMetrics().frameRate;
    
    if (frameRate >= 58) return 'A';
    if (frameRate >= 50) return 'B';
    if (frameRate >= 40) return 'C';
    if (frameRate >= 30) return 'D';
    return 'F';
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for monitoring animation performance
 */
export function useAnimationPerformance() {
  const startMonitoring = () => performanceMonitor.startMonitoring();
  const stopMonitoring = () => performanceMonitor.stopMonitoring();
  const getMetrics = () => performanceMonitor.getMetrics();
  const isAcceptable = () => performanceMonitor.isPerformanceAcceptable();
  const getGrade = () => performanceMonitor.getPerformanceGrade();

  return {
    startMonitoring,
    stopMonitoring,
    getMetrics,
    isAcceptable,
    getGrade,
  };
}

/**
 * Measure animation performance for a specific animation
 */
export async function measureAnimationPerformance<T>(
  animationFn: () => Promise<T>,
  animationName: string = 'animation'
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  const startTime = performance.now();
  
  performanceMonitor.startMonitoring();
  
  try {
    const result = await animationFn();
    const endTime = performance.now();
    
    // Wait for next frame to ensure animation is complete
    await new Promise(resolve => {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(resolve);
      });
    });
    
    const metrics = performanceMonitor.getMetrics();
    metrics.animationDuration = endTime - startTime;
    
    console.log(`Animation "${animationName}" performance:`, {
      duration: `${metrics.animationDuration.toFixed(2)}ms`,
      frameRate: `${metrics.frameRate}fps`,
      grade: performanceMonitor.getPerformanceGrade(),
    });
    
    return { result, metrics };
  } finally {
    performanceMonitor.stopMonitoring();
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  }) as T;
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean = false;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

/**
 * Optimize component re-renders by providing stable references
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const ref = React.useRef<T>(callback);
  
  React.useEffect(() => {
    ref.current = callback;
  }, deps);
  
  return React.useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []) as T;
}

/**
 * Memory-efficient image loading with caching
 */
export interface ImageCacheOptions {
  maxCacheSize?: number; // MB
  maxAge?: number; // milliseconds
  compressionQuality?: number; // 0-1
}

class ImageCache {
  private cache = new Map<string, { data: string; timestamp: number; size: number }>();
  private totalSize = 0;
  private options: Required<ImageCacheOptions>;

  constructor(options: ImageCacheOptions = {}) {
    this.options = {
      maxCacheSize: 50, // 50MB default
      maxAge: 30 * 60 * 1000, // 30 minutes
      compressionQuality: 0.8,
      ...options,
    };
  }

  /**
   * Get cached image or load and cache it
   */
  async getCachedImage(uri: string): Promise<string> {
    const cached = this.cache.get(uri);
    
    if (cached && Date.now() - cached.timestamp < this.options.maxAge) {
      return cached.data;
    }
    
    // Remove expired entry
    if (cached) {
      this.removeFromCache(uri);
    }
    
    // Load and cache new image
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const data = URL.createObjectURL(blob);
      
      const size = blob.size / 1024 / 1024; // MB
      this.addToCache(uri, data, size);
      
      return data;
    } catch (error) {
      console.warn('Failed to cache image:', uri, error);
      return uri; // Fallback to original URI
    }
  }

  /**
   * Add image to cache with size management
   */
  private addToCache(uri: string, data: string, size: number): void {
    // Ensure we don't exceed cache size limit
    while (this.totalSize + size > this.options.maxCacheSize && this.cache.size > 0) {
      this.evictOldest();
    }
    
    this.cache.set(uri, {
      data,
      timestamp: Date.now(),
      size,
    });
    
    this.totalSize += size;
  }

  /**
   * Remove image from cache
   */
  private removeFromCache(uri: string): void {
    const cached = this.cache.get(uri);
    if (cached) {
      this.cache.delete(uri);
      this.totalSize -= cached.size;
      
      // Clean up blob URL
      if (cached.data.startsWith('blob:')) {
        URL.revokeObjectURL(cached.data);
      }
    }
  }

  /**
   * Evict oldest cached image
   */
  private evictOldest(): void {
    let oldestUri = '';
    let oldestTime = Date.now();
    
    for (const [uri, cached] of this.cache.entries()) {
      if (cached.timestamp < oldestTime) {
        oldestTime = cached.timestamp;
        oldestUri = uri;
      }
    }
    
    if (oldestUri) {
      this.removeFromCache(oldestUri);
    }
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    for (const [uri] of this.cache.entries()) {
      this.removeFromCache(uri);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      totalSizeMB: Math.round(this.totalSize * 100) / 100,
      maxSizeMB: this.options.maxCacheSize,
    };
  }
}

// Global image cache instance
export const imageCache = new ImageCache();

/**
 * Performance-optimized image component hook
 */
export function useOptimizedImage(uri: string) {
  const [cachedUri, setCachedUri] = React.useState<string>(uri);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    
    const loadImage = async () => {
      if (!uri) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const cached = await imageCache.getCachedImage(uri);
        if (!cancelled) {
          setCachedUri(cached);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load image'));
          setCachedUri(uri); // Fallback to original
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadImage();
    
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return { cachedUri, loading, error };
}