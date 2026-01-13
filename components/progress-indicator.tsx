import React, { useEffect } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated'
import { ThemedText } from './themed-text'
import { useTheme } from '@/design-system/hooks/use-theme'

const { width: screenWidth } = Dimensions.get('window')

interface ProgressIndicatorProps {
  progress: number // 0-100
  variant?: 'linear' | 'circular' | 'dots' | 'upload'
  size?: 'small' | 'medium' | 'large'
  color?: string
  backgroundColor?: string
  showPercentage?: boolean
  showLabel?: boolean
  label?: string
  animated?: boolean
  thickness?: number
  onComplete?: () => void
}

export function ProgressIndicator({
  progress,
  variant = 'linear',
  size = 'medium',
  color,
  backgroundColor,
  showPercentage = true,
  showLabel = false,
  label,
  animated = true,
  thickness,
  onComplete
}: ProgressIndicatorProps) {
  const { theme } = useTheme()
  const animatedProgress = useSharedValue(0)
  const scale = useSharedValue(1)
  
  const progressColor = color || theme.colors.primary
  const trackColor = backgroundColor || (theme.mode === 'dark' ? '#333333' : '#E5E5E5')

  useEffect(() => {
    const targetProgress = Math.max(0, Math.min(100, progress))
    
    if (animated) {
      animatedProgress.value = withTiming(targetProgress, {
        duration: 300,
      }, (finished) => {
        if (finished && targetProgress >= 100 && onComplete) {
          runOnJS(onComplete)()
        }
      })
    } else {
      animatedProgress.value = targetProgress
      if (targetProgress >= 100 && onComplete) {
        onComplete()
      }
    }

    // Pulse animation when complete
    if (progress >= 100) {
      scale.value = withSpring(1.05, { damping: 10 }, () => {
        scale.value = withSpring(1, { damping: 10 })
      })
    }
  }, [progress, animated, animatedProgress, scale, onComplete])

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 4,
          borderRadius: 2,
          fontSize: 12,
          circularSize: 40,
          circularStroke: 3,
        }
      case 'large':
        return {
          height: 12,
          borderRadius: 6,
          fontSize: 18,
          circularSize: 80,
          circularStroke: 6,
        }
      default: // medium
        return {
          height: 8,
          borderRadius: 4,
          fontSize: 14,
          circularSize: 60,
          circularStroke: 4,
        }
    }
  }

  const sizeStyles = getSizeStyles()
  const finalThickness = thickness || sizeStyles.height

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  if (variant === 'linear') {
    const progressAnimatedStyle = useAnimatedStyle(() => ({
      width: `${animatedProgress.value}%`,
    }))

    return (
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        {showLabel && label && (
          <ThemedText style={[
            styles.label,
            { 
              fontSize: sizeStyles.fontSize,
              color: theme.colors.text,
              marginBottom: 8,
            }
          ]}>
            {label}
          </ThemedText>
        )}
        
        <View style={[
          styles.linearTrack,
          {
            height: finalThickness,
            borderRadius: sizeStyles.borderRadius,
            backgroundColor: trackColor,
          }
        ]}>
          <Animated.View style={[
            styles.linearProgress,
            {
              height: finalThickness,
              borderRadius: sizeStyles.borderRadius,
              backgroundColor: progressColor,
            },
            progressAnimatedStyle
          ]} />
        </View>

        {showPercentage && (
          <ThemedText style={[
            styles.percentage,
            { 
              fontSize: sizeStyles.fontSize,
              color: theme.colors.textSecondary,
              marginTop: 4,
            }
          ]}>
            {Math.round(progress)}%
          </ThemedText>
        )}
      </Animated.View>
    )
  }

  if (variant === 'circular') {
    const radius = (sizeStyles.circularSize - sizeStyles.circularStroke) / 2
    const circumference = 2 * Math.PI * radius
    
    const strokeAnimatedStyle = useAnimatedStyle(() => {
      const strokeDashoffset = circumference - (animatedProgress.value / 100) * circumference
      return {
        strokeDashoffset,
      }
    })

    return (
      <Animated.View style={[styles.circularContainer, containerAnimatedStyle]}>
        {showLabel && label && (
          <ThemedText style={[
            styles.label,
            { 
              fontSize: sizeStyles.fontSize,
              color: theme.colors.text,
              marginBottom: 8,
              textAlign: 'center',
            }
          ]}>
            {label}
          </ThemedText>
        )}
        
        <View style={[
          styles.circularProgress,
          {
            width: sizeStyles.circularSize,
            height: sizeStyles.circularSize,
          }
        ]}>
          {/* Background circle */}
          <svg
            width={sizeStyles.circularSize}
            height={sizeStyles.circularSize}
            style={styles.circularSvg}
          >
            <circle
              cx={sizeStyles.circularSize / 2}
              cy={sizeStyles.circularSize / 2}
              r={radius}
              stroke={trackColor}
              strokeWidth={sizeStyles.circularStroke}
              fill="transparent"
            />
            {/* Progress circle */}
            <Animated.View as="circle"
              cx={sizeStyles.circularSize / 2}
              cy={sizeStyles.circularSize / 2}
              r={radius}
              stroke={progressColor}
              strokeWidth={sizeStyles.circularStroke}
              fill="transparent"
              strokeDasharray={circumference}
              strokeLinecap="round"
              transform={`rotate(-90 ${sizeStyles.circularSize / 2} ${sizeStyles.circularSize / 2})`}
              style={strokeAnimatedStyle}
            />
          </svg>
          
          {showPercentage && (
            <View style={styles.circularPercentage}>
              <ThemedText style={[
                styles.circularPercentageText,
                { 
                  fontSize: sizeStyles.fontSize,
                  color: theme.colors.text,
                }
              ]}>
                {Math.round(progress)}%
              </ThemedText>
            </View>
          )}
        </View>
      </Animated.View>
    )
  }

  if (variant === 'dots') {
    const dotCount = 3
    const dots = Array.from({ length: dotCount }, (_, index) => {
      const dotAnimatedStyle = useAnimatedStyle(() => {
        const dotProgress = (animatedProgress.value - (index * 33.33)) / 33.33
        const opacity = interpolate(
          dotProgress,
          [0, 0.5, 1],
          [0.3, 1, 0.3],
          Extrapolate.CLAMP
        )
        const scale = interpolate(
          dotProgress,
          [0, 0.5, 1],
          [0.8, 1.2, 0.8],
          Extrapolate.CLAMP
        )
        
        return {
          opacity,
          transform: [{ scale }],
        }
      })

      return (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              width: sizeStyles.height * 1.5,
              height: sizeStyles.height * 1.5,
              borderRadius: (sizeStyles.height * 1.5) / 2,
              backgroundColor: progressColor,
            },
            dotAnimatedStyle
          ]}
        />
      )
    })

    return (
      <Animated.View style={[styles.dotsContainer, containerAnimatedStyle]}>
        {showLabel && label && (
          <ThemedText style={[
            styles.label,
            { 
              fontSize: sizeStyles.fontSize,
              color: theme.colors.text,
              marginBottom: 8,
              textAlign: 'center',
            }
          ]}>
            {label}
          </ThemedText>
        )}
        
        <View style={styles.dotsRow}>
          {dots}
        </View>

        {showPercentage && (
          <ThemedText style={[
            styles.percentage,
            { 
              fontSize: sizeStyles.fontSize,
              color: theme.colors.textSecondary,
              marginTop: 8,
              textAlign: 'center',
            }
          ]}>
            {Math.round(progress)}%
          </ThemedText>
        )}
      </Animated.View>
    )
  }

  if (variant === 'upload') {
    const progressAnimatedStyle = useAnimatedStyle(() => ({
      width: `${animatedProgress.value}%`,
    }))

    const iconAnimatedStyle = useAnimatedStyle(() => {
      const rotation = interpolate(
        animatedProgress.value,
        [0, 100],
        [0, 360],
        Extrapolate.CLAMP
      )
      
      return {
        transform: [{ rotate: `${rotation}deg` }],
      }
    })

    return (
      <Animated.View style={[styles.uploadContainer, containerAnimatedStyle]}>
        <View style={styles.uploadHeader}>
          <Animated.View style={iconAnimatedStyle}>
            <ThemedText style={[
              styles.uploadIcon,
              { 
                fontSize: sizeStyles.fontSize * 1.5,
                color: progressColor,
              }
            ]}>
              {progress >= 100 ? '✓' : '📤'}
            </ThemedText>
          </Animated.View>
          
          <View style={styles.uploadInfo}>
            <ThemedText style={[
              styles.uploadLabel,
              { 
                fontSize: sizeStyles.fontSize,
                color: theme.colors.text,
              }
            ]}>
              {label || (progress >= 100 ? 'Upload complete' : 'Uploading...')}
            </ThemedText>
            
            {showPercentage && (
              <ThemedText style={[
                styles.uploadPercentage,
                { 
                  fontSize: sizeStyles.fontSize - 2,
                  color: theme.colors.textSecondary,
                }
              ]}>
                {Math.round(progress)}%
              </ThemedText>
            )}
          </View>
        </View>
        
        <View style={[
          styles.uploadTrack,
          {
            height: finalThickness,
            borderRadius: sizeStyles.borderRadius,
            backgroundColor: trackColor,
            marginTop: 8,
          }
        ]}>
          <Animated.View style={[
            styles.uploadProgress,
            {
              height: finalThickness,
              borderRadius: sizeStyles.borderRadius,
              backgroundColor: progressColor,
            },
            progressAnimatedStyle
          ]} />
        </View>
      </Animated.View>
    )
  }

  return null
}

// Specialized progress components for common use cases
export function UploadProgress({ 
  progress, 
  fileName, 
  onComplete 
}: { 
  progress: number
  fileName?: string
  onComplete?: () => void 
}) {
  return (
    <ProgressIndicator
      progress={progress}
      variant="upload"
      label={fileName ? `Uploading ${fileName}` : undefined}
      showPercentage={true}
      onComplete={onComplete}
    />
  )
}

export function LoadingProgress({ 
  progress, 
  label = 'Loading...' 
}: { 
  progress: number
  label?: string 
}) {
  return (
    <ProgressIndicator
      progress={progress}
      variant="linear"
      label={label}
      showPercentage={false}
      size="medium"
    />
  )
}

export function CircularProgress({ 
  progress, 
  size = 'medium' 
}: { 
  progress: number
  size?: 'small' | 'medium' | 'large'
}) {
  return (
    <ProgressIndicator
      progress={progress}
      variant="circular"
      size={size}
      showPercentage={true}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontWeight: '500',
  },
  linearTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  linearProgress: {
    height: '100%',
  },
  percentage: {
    textAlign: 'center',
    fontWeight: '500',
  },
  circularContainer: {
    alignItems: 'center',
  },
  circularProgress: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularSvg: {
    position: 'absolute',
  },
  circularPercentage: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  circularPercentageText: {
    fontWeight: '600',
  },
  dotsContainer: {
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    marginHorizontal: 2,
  },
  uploadContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadIcon: {
    marginRight: 12,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadLabel: {
    fontWeight: '500',
    marginBottom: 2,
  },
  uploadPercentage: {
    fontWeight: '400',
  },
  uploadTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  uploadProgress: {
    height: '100%',
  },
})