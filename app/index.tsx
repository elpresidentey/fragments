import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/contexts/auth-context'

export default function IndexScreen() {
  const { state } = useAuth()

  useEffect(() => {
    if (!state.isLoading) {
      if (state.isAuthenticated) {
        router.replace('/(tabs)')
      } else {
        router.replace('/(auth)/login')
      }
    }
  }, [state.isLoading, state.isAuthenticated])

  // Show loading screen while determining auth state
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})