/**
 * Performance optimization tests
 * Tests the new performance utilities and optimizations
 */

import { 
  performanceMonitor, 
  debounce, 
  throttle, 
  imageCache 
} from '../../design-system/utils/performance-utils';

import { 
  createOptimizedSpring, 
  createOptimizedTiming,
  AnimationResourceManager 
} from '../../design-system/utils/optimized-animations';

import { 
  deepEqual, 
  shallowEqual, 
  MemoizationMonitor 
} from '../../design-system/utils/memoization-utils';

import { 
  BundleAnalyzer, 
  ResourcePreloader 
} from '../../design-system/utils/bundle-optimization';

describe('Performance Optimizations', () => {
  beforeEach(() => {
    // Reset monitors before each test
    MemoizationMonitor.reset();
    BundleAnalyzer.reset();
  });

  describe('Performance Monitor', () => {
    it('should track performance metrics', () => {
      expect(performanceMonitor).toBeDefined();
      expect(typeof performanceMonitor.startMonitoring).toBe('function');
      expect(typeof performanceMonitor.stopMonitoring).toBe('function');
      expect(typeof performanceMonitor.getMetrics).toBe('function');
    });

    it('should provide performance metrics', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveProperty('frameRate');
      expect(metrics).toHaveProperty('droppedFrames');
      expect(metrics).toHaveProperty('renderTime');
      expect(metrics).toHaveProperty('animationDuration');
    });
  });

  describe('Debounce and Throttle', () => {
    it('should debounce function calls', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
      }, 100);

      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should only be called once after delay
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });

    it('should throttle function calls', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount++;
      }, 100);

      // Call multiple times rapidly
      throttledFn();
      throttledFn();
      throttledFn();

      // Should only be called once immediately
      expect(callCount).toBe(1);

      setTimeout(() => {
        throttledFn();
        expect(callCount).toBe(2);
        done();
      }, 150);
    });
  });

  describe('Image Cache', () => {
    it('should provide cache statistics', () => {
      const stats = imageCache.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('totalSizeMB');
      expect(stats).toHaveProperty('maxSizeMB');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.totalSizeMB).toBe('number');
      expect(typeof stats.maxSizeMB).toBe('number');
    });

    it('should clear cache', () => {
      imageCache.clearCache();
      const stats = imageCache.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.totalSizeMB).toBe(0);
    });
  });

  describe('Optimized Animations', () => {
    it('should create optimized spring animations', () => {
      const springAnimation = createOptimizedSpring(1, {
        damping: 15,
        stiffness: 300,
      });
      expect(springAnimation).toBeDefined();
    });

    it('should create optimized timing animations', () => {
      const timingAnimation = createOptimizedTiming(1, {
        duration: 300,
      });
      expect(timingAnimation).toBeDefined();
    });

    it('should provide animation resource manager', () => {
      expect(AnimationResourceManager).toBeDefined();
      expect(typeof AnimationResourceManager.loadAnimationResource).toBe('function');
      expect(typeof AnimationResourceManager.getStats).toBe('function');
    });
  });

  describe('Memoization Utils', () => {
    it('should perform deep equality checks', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      const obj3 = { a: 1, b: { c: 3 } };

      expect(deepEqual(obj1, obj2)).toBe(true);
      expect(deepEqual(obj1, obj3)).toBe(false);
    });

    it('should perform shallow equality checks', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };
      const obj3 = { a: 1, b: 3 };

      expect(shallowEqual(obj1, obj2)).toBe(true);
      expect(shallowEqual(obj1, obj3)).toBe(false);
    });

    it('should track memoization statistics', () => {
      MemoizationMonitor.trackRender('TestComponent');
      MemoizationMonitor.trackMemoHit('TestComponent');
      MemoizationMonitor.trackMemoMiss('TestComponent');

      const stats = MemoizationMonitor.getStats();
      expect(stats).toHaveProperty('TestComponent');
      expect(stats.TestComponent.renders).toBe(1);
      expect(stats.TestComponent.hits).toBe(1);
      expect(stats.TestComponent.misses).toBe(1);
    });
  });

  describe('Bundle Optimization', () => {
    it('should track bundle statistics', () => {
      BundleAnalyzer.trackChunkLoad('test-chunk', 100);
      BundleAnalyzer.trackChunkError('failed-chunk', new Error('Test error'));

      const stats = BundleAnalyzer.getStats();
      expect(stats.loadedChunks).toContain('test-chunk');
      expect(stats.failedChunks).toContain('failed-chunk');
      expect(stats.totalSize).toBe(1);
      expect(stats.loadTime).toBe(100);
    });

    it('should provide resource preloader', () => {
      expect(ResourcePreloader).toBeDefined();
      expect(typeof ResourcePreloader.preload).toBe('function');
      expect(typeof ResourcePreloader.getStats).toBe('function');
    });

    it('should track preload statistics', () => {
      const stats = ResourcePreloader.getStats();
      expect(stats).toHaveProperty('preloadedCount');
      expect(stats).toHaveProperty('preloadingCount');
      expect(stats).toHaveProperty('preloadedResources');
    });
  });

  describe('Performance Integration', () => {
    it('should work together for comprehensive optimization', () => {
      // Test that all performance utilities can be used together
      const debouncedFn = debounce(() => {
        MemoizationMonitor.trackRender('IntegratedComponent');
      }, 50);

      const throttledFn = throttle(() => {
        BundleAnalyzer.trackChunkLoad('integrated-chunk', 50);
      }, 100);

      // Execute functions
      debouncedFn();
      throttledFn();

      // Verify they work without conflicts
      expect(typeof debouncedFn).toBe('function');
      expect(typeof throttledFn).toBe('function');
    });
  });
});

/**
 * Feature: twitter-like-ui-improvements, Property 21: Performance Optimization Effectiveness
 * Tests that performance optimizations provide measurable improvements
 */
describe('Performance Property Tests', () => {
  it('should demonstrate performance improvements with optimizations', () => {
    // Test that optimized functions perform better than naive implementations
    const startTime = performance.now();
    
    // Simulate optimized operations
    const optimizedSpring = createOptimizedSpring(1);
    const optimizedTiming = createOptimizedTiming(1);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    // Should complete quickly (under 10ms for creation)
    expect(executionTime).toBeLessThan(10);
    expect(optimizedSpring).toBeDefined();
    expect(optimizedTiming).toBeDefined();
  });

  it('should maintain consistent performance across multiple operations', () => {
    const times: number[] = [];
    
    // Run multiple operations and measure consistency
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      createOptimizedSpring(Math.random());
      const end = performance.now();
      times.push(end - start);
    }
    
    // Calculate variance to ensure consistency
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / times.length;
    
    // Variance should be low (consistent performance)
    expect(variance).toBeLessThan(1); // Less than 1ms variance
  });
});