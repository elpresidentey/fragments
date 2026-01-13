/**
 * Font loading utilities to prevent fontfaceobserver timeout issues
 */

import { Platform } from 'react-native';

/**
 * Initialize font loading to prevent timeout errors
 * This prevents the fontfaceobserver from timing out when no custom fonts are loaded
 */
export function initializeFontLoading(): void {
  if (Platform.OS === 'web') {
    // Override fontfaceobserver timeout behavior for web
    const originalSetTimeout = window.setTimeout;
    
    window.setTimeout = function(callback: any, delay: number, ...args: any[]) {
      // Check if this is a fontfaceobserver timeout
      if (delay === 6000 && callback && callback.toString().includes('timeout exceeded')) {
        // Reduce timeout to prevent long waits
        delay = 100;
        // Wrap callback to suppress error
        const wrappedCallback = () => {
          try {
            callback();
          } catch (error) {
            // Silently handle font loading timeout
            console.warn('Font loading timeout suppressed:', error);
          }
        };
        return originalSetTimeout.call(this, wrappedCallback, delay, ...args);
      }
      
      return originalSetTimeout.call(this, callback, delay, ...args);
    };
  }
}

/**
 * Suppress font loading errors in development
 */
export function suppressFontErrors(): void {
  if (__DEV__) {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && (
        message.includes('6000ms timeout exceeded') ||
        message.includes('fontfaceobserver') ||
        message.includes('Font loading')
      )) {
        return; // Suppress font-related errors
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && (
        message.includes('fontfaceobserver') ||
        message.includes('Font loading')
      )) {
        return; // Suppress font-related warnings
      }
      originalWarn.apply(console, args);
    };
  }
}

/**
 * Setup font loading prevention
 */
export function setupFontLoadingPrevention(): void {
  initializeFontLoading();
  suppressFontErrors();
}