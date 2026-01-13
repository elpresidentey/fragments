import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Web-compatible storage adapter
class WebStorage {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  }

  async clear(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  }
}

// Export the appropriate storage based on platform
export const storage = Platform.OS === 'web' ? new WebStorage() : AsyncStorage;