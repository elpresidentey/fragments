import React, { useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  withDelay
} from 'react-native-reanimated'
import { ThemedText } from './themed-text'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  variant?: 'spinner' | 'dots' | 'pulse'
  color?: string
  overlay?: boolean
}

export function LoadingIndicator({ 
  size = 'medium', 
  text,
  variant = 'spinner',
  color,
  overlay = false
}: LoadingIndicatorProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const indicatorColor = color || colors.tint

  const rotation = useSharedValue(0)
  const scale = useSharedValue(1)
  const opacity1 = useSharedValue(0.3)
  const opacity2 = useSharedValue(0.3)
  const opacity3 = useSharedValue(0.3)

  useEffect(() => {
    if (variant === 'spinner') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      )
    } else if (variant === 'pulse') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      )
    } else if (variant === 'dots') {
      // Staggered dot animation
      opacity1.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
      opacity2.value = withDelay(200, withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      ))
      opacity3.value = withDelay(400, withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      ))
    }
  }, [variant, rotation, scale, opacity1, opacity2, opacity3])

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const dot1Style = useAnimatedStyle(() => ({
    opacity: opacity1.value,
  }))

  const dot2Style = useAnimatedStyle(() => ({
    opacity: opacity2.value,
  }))

  const dot3Style = useAnimatedStyle(() => ({
    opacity: opacity3.value,
  }))

  const sizeStyles = {
    small: { width: 20, height: 20 },
    medium: { width: 32, height: 32 },
    large: { width: 48, height: 48 },
  }

  const dotSize = {
    small: 4,
    medium: 6,
    large: 8,
  }

  const containerStyle = overlay ? [styles.container, styles.overlay] : styles.container

  if (variant === 'spinner') {
    return (
      <View style={containerStyle}>
        <Animated.View style={[spinnerStyle, sizeStyles[size]]}>
          <ActivityIndicator size={size === 'medium' ? 'large' : size} color={indicatorColor} />
        </Animated.View>
        {text && (
          <ThemedText style={[styles.text, { color: colors.text }]}>
            {text}
          </ThemedText>
        )}
      </View>
    )
  }

  if (variant === 'pulse') {
    return (
      <View style={containerStyle}>
        <Animated.View style={[pulseStyle, styles.pulseIndicator, sizeStyles[size], { backgroundColor: indicatorColor }]} />
        {text && (
          <ThemedText style={[styles.text, { color: colors.text }]}>
            {text}
          </ThemedText>
        )}
      </View>
    )
  }

  if (variant === 'dots') {
    return (
      <View style={containerStyle}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dot1Style, { backgroundColor: indicatorColor, width: dotSize[size], height: dotSize[size] }]} />
          <Animated.View style={[styles.dot, dot2Style, { backgroundColor: indicatorColor, width: dotSize[size], height: dotSize[size] }]} />
          <Animated.View style={[styles.dot, dot3Style, { backgroundColor: indicatorColor, width: dotSize[size], height: dotSize[size] }]} />
        </View>
        {text && (
          <ThemedText style={[styles.text, { color: colors.text }]}>
            {text}
          </ThemedText>
        )}
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  pulseIndicator: {
    borderRadius: 50,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 50,
    marginHorizontal: 3,
  },
})