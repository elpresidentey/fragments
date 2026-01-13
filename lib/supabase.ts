import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import { storage } from './storage-adapter'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use our web-compatible storage adapter
    storage: Platform.OS === 'web' ? {
      getItem: (key: string) => storage.getItem(key),
      setItem: (key: string, value: string) => storage.setItem(key, value),
      removeItem: (key: string) => storage.removeItem(key),
    } : storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  realtime: {
    // Improve WebSocket connection handling
    params: {
      eventsPerSecond: 10,
    },
    // Add connection timeout and retry logic
    timeout: 20000,
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => {
      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, tries), 30000);
      const jitter = Math.random() * 1000;
      return baseDelay + jitter;
    },
  },
})