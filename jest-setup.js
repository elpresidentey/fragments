import 'react-native-gesture-handler/jestSetup'

// Load environment variables for tests
require('dotenv').config({ path: '.env.local' })

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {}
  
  return Reanimated
})

// Mock localStorage for Node.js test environment
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Create a more complete Supabase mock
const createMockSupabaseResponse = (data = null, error = null) => ({
  data,
  error,
})

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
}

const mockSession = {
  user: mockUser,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
}

// Mock real-time subscription with proper callback simulation
const mockSubscription = {
  subscribe: jest.fn((callback) => {
    // Simulate successful subscription
    if (callback) {
      setTimeout(() => callback('SUBSCRIBED', null), 100)
    }
    return {
      unsubscribe: jest.fn(),
    }
  }),
  on: jest.fn().mockReturnThis(),
  unsubscribe: jest.fn(),
}

// Mock posts data for testing
const mockPosts = [
  {
    id: 'post-1',
    user_id: 'test-user-id',
    content: 'Test post 1',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Test User',
      avatar_url: null,
    },
  },
  {
    id: 'post-2',
    user_id: 'test-user-id',
    content: 'Test post 2',
    image_url: null,
    created_at: new Date(Date.now() - 1000).toISOString(),
    updated_at: new Date(Date.now() - 1000).toISOString(),
    user: {
      name: 'Test User',
      avatar_url: null,
    },
  },
]

// Mock Supabase with proper API structure
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn().mockResolvedValue(createMockSupabaseResponse({
        user: mockUser,
        session: mockSession,
      })),
      signInWithPassword: jest.fn().mockResolvedValue(createMockSupabaseResponse({
        user: mockUser,
        session: mockSession,
      })),
      signOut: jest.fn().mockResolvedValue(createMockSupabaseResponse()),
      getSession: jest.fn().mockResolvedValue(createMockSupabaseResponse({
        session: mockSession,
      })),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(createMockSupabaseResponse({
        id: mockUser.id,
        email: mockUser.email,
        name: 'Test User',
        avatar_url: null,
        created_at: mockUser.created_at,
        updated_at: mockUser.created_at,
      })),
      // Mock posts query to return mock data
      then: jest.fn().mockResolvedValue(createMockSupabaseResponse(mockPosts)),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue(createMockSupabaseResponse({
          path: 'test-path',
        })),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test-image.jpg' },
        }),
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        // Simulate successful subscription
        if (callback) {
          setTimeout(() => callback('SUBSCRIBED', null), 100)
        }
        return mockSubscription
      }),
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(), // Add the missing removeChannel method
  },
}))

// Mock Expo modules
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}))

jest.mock('expo-image', () => ({
  Image: 'Image',
}))

jest.mock('expo-file-system', () => ({
  uploadAsync: jest.fn(),
  downloadAsync: jest.fn(),
}))

// Mock React Native Platform
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
  };
});