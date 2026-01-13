/**
 * Utility functions for managing Supabase Realtime connections
 * Helps prevent WebSocket race conditions and connection issues
 */

export interface RealtimeConnectionManager {
  subscribe: () => void;
  unsubscribe: () => void;
  isConnected: () => boolean;
  getStatus: () => 'connecting' | 'connected' | 'disconnected' | 'error';
}

/**
 * Creates a managed realtime connection that handles race conditions
 */
export function createRealtimeManager(
  subscriptionFactory: () => any,
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void
): RealtimeConnectionManager {
  let subscription: any = null;
  let status: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  let isSubscribing = false;
  let subscriptionTimeout: ReturnType<typeof setTimeout> | null = null;

  const updateStatus = (newStatus: typeof status) => {
    if (status !== newStatus) {
      status = newStatus;
      onStatusChange?.(status);
    }
  };

  const subscribe = () => {
    // Prevent multiple simultaneous subscription attempts
    if (isSubscribing || status === 'connected') {
      return;
    }

    isSubscribing = true;
    updateStatus('connecting');

    // Clear any existing timeout
    if (subscriptionTimeout) {
      clearTimeout(subscriptionTimeout);
    }

    // Add a small delay to prevent race conditions
    subscriptionTimeout = setTimeout(() => {
      try {
        subscription = subscriptionFactory();
        updateStatus('connected');
      } catch (error) {
        console.error('Error creating subscription:', error);
        updateStatus('error');
      } finally {
        isSubscribing = false;
        subscriptionTimeout = null;
      }
    }, 100);
  };

  const unsubscribe = () => {
    isSubscribing = false;

    // Clear any pending subscription timeout
    if (subscriptionTimeout) {
      clearTimeout(subscriptionTimeout);
      subscriptionTimeout = null;
    }

    if (subscription) {
      try {
        // Add a small delay to ensure connection is established before closing
        setTimeout(() => {
          if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
          }
          subscription = null;
          updateStatus('disconnected');
        }, 50);
      } catch (error) {
        console.warn('Error during unsubscribe:', error);
        subscription = null;
        updateStatus('disconnected');
      }
    } else {
      updateStatus('disconnected');
    }
  };

  const isConnected = () => status === 'connected';
  const getStatus = () => status;

  return {
    subscribe,
    unsubscribe,
    isConnected,
    getStatus,
  };
}

/**
 * Debounced function to prevent rapid subscription/unsubscription cycles
 */
export function debounceRealtimeAction<T extends (...args: any[]) => void>(
  func: T,
  delay: number = 200
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  }) as T;
}

/**
 * Retry utility with exponential backoff for realtime connections
 */
export function createRetryManager(
  maxAttempts: number = 5,
  baseDelay: number = 1000
) {
  let attempts = 0;

  const retry = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      const result = await operation();
      attempts = 0; // Reset on success
      return result;
    } catch (error) {
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error(`Operation failed after ${maxAttempts} attempts: ${error}`);
      }

      const delay = baseDelay * Math.pow(2, attempts - 1);
      const jitter = Math.random() * 1000;
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      return retry(operation);
    }
  };

  const reset = () => {
    attempts = 0;
  };

  const getAttempts = () => attempts;

  return { retry, reset, getAttempts };
}