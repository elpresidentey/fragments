/**
 * Memoization utilities for preventing unnecessary re-renders
 * Provides React.memo wrappers and optimization helpers
 */

import React from 'react';
import { StyleSheet } from 'react-native';

/**
 * Deep comparison function for props
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

/**
 * Shallow comparison function for props (more performant)
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
}

/**
 * Memoize component with shallow comparison (default)
 */
export function memoShallow<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
): React.MemoExoticComponent<React.ComponentType<P>> {
  const MemoizedComponent = React.memo(Component, shallowEqual);
  
  if (displayName) {
    MemoizedComponent.displayName = `Memo(${displayName})`;
  }
  
  return MemoizedComponent;
}

/**
 * Memoize component with deep comparison (use sparingly)
 */
export function memoDeep<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
): React.MemoExoticComponent<React.ComponentType<P>> {
  const MemoizedComponent = React.memo(Component, deepEqual);
  
  if (displayName) {
    MemoizedComponent.displayName = `MemoDeep(${displayName})`;
  }
  
  return MemoizedComponent;
}

/**
 * Memoize component with custom comparison function
 */
export function memoCustom<P extends object>(
  Component: React.ComponentType<P>,
  areEqual: (prevProps: P, nextProps: P) => boolean,
  displayName?: string
): React.MemoExoticComponent<React.ComponentType<P>> {
  const MemoizedComponent = React.memo(Component, areEqual);
  
  if (displayName) {
    MemoizedComponent.displayName = `MemoCustom(${displayName})`;
  }
  
  return MemoizedComponent;
}

/**
 * Memoize styles to prevent recreation on every render
 */
export function useMemoizedStyles<T>(
  styleFactory: () => T,
  deps: React.DependencyList
): T {
  return React.useMemo(styleFactory, deps);
}

/**
 * Memoize StyleSheet creation
 */
export function createMemoizedStyleSheet<T extends StyleSheet.NamedStyles<T>>(
  styles: T | (() => T)
): T {
  if (typeof styles === 'function') {
    let cachedStyles: T | null = null;
    return new Proxy({} as T, {
      get(target, prop) {
        if (!cachedStyles) {
          cachedStyles = StyleSheet.create(styles());
        }
        return cachedStyles[prop as keyof T];
      }
    });
  }
  
  return StyleSheet.create(styles);
}

/**
 * Stable callback hook that doesn't change reference unless dependencies change
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
 * Memoized value hook with custom equality function
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual: (prev: T, next: T) => boolean = Object.is
): T {
  const ref = React.useRef<{ value: T; deps: React.DependencyList }>();
  
  if (!ref.current || !depsEqual(ref.current.deps, deps)) {
    const newValue = factory();
    
    if (!ref.current || !isEqual(ref.current.value, newValue)) {
      ref.current = { value: newValue, deps: [...deps] };
    }
  }
  
  return ref.current.value;
}

/**
 * Check if dependency arrays are equal
 */
function depsEqual(deps1: React.DependencyList, deps2: React.DependencyList): boolean {
  if (deps1.length !== deps2.length) return false;
  
  for (let i = 0; i < deps1.length; i++) {
    if (!Object.is(deps1[i], deps2[i])) return false;
  }
  
  return true;
}

/**
 * Memoized component factory for common patterns
 */
export class MemoizedComponentFactory {
  /**
   * Create memoized list item component
   */
  static createMemoizedListItem<T>(
    ItemComponent: React.ComponentType<{ item: T; index: number; onPress?: (item: T) => void }>,
    itemKeyExtractor: (item: T) => string = (item: any) => item.id || item.key
  ) {
    return memoCustom(
      ItemComponent,
      (prevProps, nextProps) => {
        // Compare item by key first (most common change)
        const prevKey = itemKeyExtractor(prevProps.item);
        const nextKey = itemKeyExtractor(nextProps.item);
        
        if (prevKey !== nextKey) return false;
        
        // Compare other props
        return (
          prevProps.index === nextProps.index &&
          prevProps.onPress === nextProps.onPress &&
          shallowEqual(prevProps.item, nextProps.item)
        );
      },
      'MemoizedListItem'
    );
  }

  /**
   * Create memoized card component
   */
  static createMemoizedCard<T extends { id: string }>(
    CardComponent: React.ComponentType<{ data: T; onPress?: (data: T) => void }>
  ) {
    return memoCustom(
      CardComponent,
      (prevProps, nextProps) => {
        return (
          prevProps.data.id === nextProps.data.id &&
          prevProps.onPress === nextProps.onPress &&
          shallowEqual(prevProps.data, nextProps.data)
        );
      },
      'MemoizedCard'
    );
  }

  /**
   * Create memoized button component
   */
  static createMemoizedButton(
    ButtonComponent: React.ComponentType<{
      title: string;
      onPress?: () => void;
      disabled?: boolean;
      loading?: boolean;
    }>
  ) {
    return memoShallow(ButtonComponent, 'MemoizedButton');
  }
}

/**
 * Performance monitoring for memoized components
 */
export class MemoizationMonitor {
  private static renderCounts = new Map<string, number>();
  private static memoHits = new Map<string, number>();
  private static memoMisses = new Map<string, number>();

  /**
   * Track component render
   */
  static trackRender(componentName: string): void {
    const current = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, current + 1);
  }

  /**
   * Track memo hit (component didn't re-render)
   */
  static trackMemoHit(componentName: string): void {
    const current = this.memoHits.get(componentName) || 0;
    this.memoHits.set(componentName, current + 1);
  }

  /**
   * Track memo miss (component re-rendered)
   */
  static trackMemoMiss(componentName: string): void {
    const current = this.memoMisses.get(componentName) || 0;
    this.memoMisses.set(componentName, current + 1);
  }

  /**
   * Get memoization statistics
   */
  static getStats() {
    const stats: Record<string, { renders: number; hits: number; misses: number; hitRate: number }> = {};
    
    for (const [component, renders] of this.renderCounts.entries()) {
      const hits = this.memoHits.get(component) || 0;
      const misses = this.memoMisses.get(component) || 0;
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;
      
      stats[component] = {
        renders,
        hits,
        misses,
        hitRate: Math.round(hitRate * 100) / 100,
      };
    }
    
    return stats;
  }

  /**
   * Reset all statistics
   */
  static reset(): void {
    this.renderCounts.clear();
    this.memoHits.clear();
    this.memoMisses.clear();
  }

  /**
   * Log performance report
   */
  static logReport(): void {
    const stats = this.getStats();
    console.group('Memoization Performance Report');
    
    Object.entries(stats).forEach(([component, data]) => {
      console.log(`${component}:`, {
        renders: data.renders,
        hitRate: `${data.hitRate}%`,
        efficiency: data.hitRate > 80 ? '✅ Good' : data.hitRate > 60 ? '⚠️ Fair' : '❌ Poor'
      });
    });
    
    console.groupEnd();
  }
}

/**
 * Hook to monitor component memoization performance
 */
export function useMemoizationMonitor(componentName: string) {
  React.useEffect(() => {
    MemoizationMonitor.trackRender(componentName);
  });

  return {
    trackHit: () => MemoizationMonitor.trackMemoHit(componentName),
    trackMiss: () => MemoizationMonitor.trackMemoMiss(componentName),
  };
}

/**
 * Higher-order component that adds memoization monitoring
 */
export function withMemoizationMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const MonitoredComponent = React.forwardRef<any, P>((props, ref) => {
    useMemoizationMonitor(componentName);
    return React.createElement(Component, { ...props, ref });
  });

  MonitoredComponent.displayName = `Monitored(${componentName})`;
  return MonitoredComponent;
}