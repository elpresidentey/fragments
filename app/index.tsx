import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/contexts/auth-context'
import { ThemedText } from '@/components/themed-text'

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

  // Show branded loading screen while determining auth state
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <ThemedText style={styles.logoText}>F</ThemedText>
        </View>
        <ThemedText style={styles.brandText}>FRAGMENTS</ThemedText>
      </View>
      <ActivityIndicator size="large" color="#1DA1F2" style={styles.loader} />
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  brandText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1DA1F2',
    letterSpacing: 2,
  },
  loader: {
    marginTop: 20,
  },
})