import React from 'react'
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  withRepeat
} from 'react-native-reanimated'
import { ThemedText } from './themed-text'
import { ThemedView } from './themed-view'
import { useTheme } from '@/design-system/hooks/use-theme'

const { width: screenWidth } = Dimensions.get('window')

interface ErrorStateProps {
  variant?: 'network' | 'server' | 'auth' | 'validation' | 'storage' | 'generic'
  title?: string
  description?: string
  primaryActionText?: string
  secondaryActionText?: string
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
  showAnimation?: boolean
  customIcon?: string
  size?: 'small' | 'medium' | 'large'
  retryable?: boolean
  errorCode?: string
}

export function ErrorState({
  variant = 'generic',
  title,
  description,
  primaryActionText,
  secondaryActionText,
  onPrimaryAction,
  onSecondaryAction,
  showAnimation = true,
  customIcon,
  size = 'medium',
  retryable = true,
  errorCode
}: ErrorStateProps) {
  const { theme } = useTheme()
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const shakeX = useSharedValue(0)

  React.useEffect(() => {
    // Entry animation
    opacity.value = withTiming(1, { duration: 600 })
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 })
    
    // Subtle shake animation for error icon
    if (showAnimation) {
      shakeX.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 100 }),
          withTiming(2, { duration: 100 }),
          withTiming(-2, { duration: 100 }),
          withTiming(0, { duration: 100 })
        ),
        -1,
        false
      )
    }
  }, [opacity, translateY, shakeX, showAnimation])

  const getErrorConfig = () => {
    const configs = {
      network: {
        icon: '📡',
        title: 'Connection Problem',
        description: 'Please check your internet connection and try again.',
        primaryAction: 'Try Again',
        secondaryAction: 'Go Offline',
        color: theme.colors.warning,
      },
      server: {
        icon: '🔧',
        title: 'Server Error',
        description: 'Something went wrong on our end. We\'re working to fix it.',
        primaryAction: 'Retry',
        secondaryAction: 'Report Issue',
        color: theme.colors.error,
      },
      auth: {
        icon: '🔐',
        title: 'Authentication Required',
        description: 'Please sign in to continue using the app.',
        primaryAction: 'Sign In',
        secondaryAction: 'Create Account',
        color: theme.colors.primary,
      },
      validation: {
        icon: '⚠️',
        title: 'Invalid Input',
        description: 'Please check your input and try again.',
        primaryAction: 'Fix Input',
        secondaryAction: 'Reset Form',
        color: theme.colors.warning,
      },
      storage: {
        icon: '💾',
        title: 'Storage Error',
        description: 'Unable to save your data. Please try again.',
        primaryAction: 'Retry Save',
        secondaryAction: 'Save Later',
        color: theme.colors.error,
      },
      generic: {
        icon: '❌',
        title: 'Something went wrong',
        description: 'An unexpected error occurred. Please try again.',
        primaryAction: 'Try Again',
        secondaryAction: 'Go Back',
        color: theme.colors.error,
      },
    }

    return configs[variant] || configs.generic
  }

  const config = getErrorConfig()
  const finalTitle = title || config.title
  const finalDescription = description || config.description
  const finalPrimaryAction = primaryActionText || config.primaryAction
  const finalSecondaryAction = secondaryActionText || config.secondaryAction
  const finalIcon = customIcon || config.icon

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 40,
          titleSize: 18,
          descriptionSize: 14,
          spacing: 12,
          padding: 20,
        }
      case 'large':
        return {
          iconSize: 80,
          titleSize: 24,
          descriptionSize: 18,
          spacing: 20,
          padding: 40,
        }
      default: // medium
        return {
          iconSize: 60,
          titleSize: 20,
          descriptionSize: 16,
          spacing: 16,
          padding: 32,
        }
    }
  }

  const sizeStyles = getSizeStyles()

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { scale: scale.value }
    ],
  }))

  const handlePrimaryAction = () => {
    // Button press animation
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    )
    
    onPrimaryAction?.()
  }

  const handleSecondaryAction = () => {
    onSecondaryAction?.()
  }

  return (
    <ThemedView style={[styles.container, { padding: sizeStyles.padding }]}>
      <Animated.View style={[styles.content, containerAnimatedStyle]}>
        {/* Animated Error Icon */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <View style={[
            styles.iconBackground, 
            { 
              backgroundColor: `${config.color}15`,
              borderColor: `${config.color}30`,
              width: sizeStyles.iconSize + 20,
              height: sizeStyles.iconSize + 20,
              borderRadius: (sizeStyles.iconSize + 20) / 2,
            }
          ]}>
            <ThemedText style={[
              styles.icon, 
              { fontSize: sizeStyles.iconSize }
            ]}>
              {finalIcon}
            </ThemedText>
          </View>
        </Animated.View>

        {/* Error Code (if provided) */}
        {errorCode && (
          <View style={[styles.errorCodeContainer, { backgroundColor: `${config.color}10` }]}>
            <ThemedText style={[
              styles.errorCode,
              { 
                color: config.color,
                fontSize: sizeStyles.descriptionSize - 2,
              }
            ]}>
              Error {errorCode}
            </ThemedText>
          </View>
        )}

        {/* Title */}
        <ThemedText style={[
          styles.title,
          {
            fontSize: sizeStyles.titleSize,
            color: theme.colors.text,
            marginTop: errorCode ? sizeStyles.spacing / 2 : sizeStyles.spacing,
          }
        ]}>
          {finalTitle}
        </ThemedText>

        {/* Description */}
        <ThemedText style={[
          styles.description,
          {
            fontSize: sizeStyles.descriptionSize,
            color: theme.colors.textSecondary,
            marginTop: sizeStyles.spacing / 2,
          }
        ]}>
          {finalDescription}
        </ThemedText>

        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { marginTop: sizeStyles.spacing * 1.5 }]}>
          {/* Primary Action Button */}
          {onPrimaryAction && finalPrimaryAction && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: config.color,
                  marginBottom: onSecondaryAction ? sizeStyles.spacing / 2 : 0,
                }
              ]}
              onPress={handlePrimaryAction}
              activeOpacity={0.8}
            >
              <ThemedText style={[
                styles.primaryButtonText,
                { fontSize: sizeStyles.descriptionSize }
              ]}>
                {finalPrimaryAction}
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Secondary Action Button */}
          {onSecondaryAction && finalSecondaryAction && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={handleSecondaryAction}
              activeOpacity={0.7}
            >
              <ThemedText style={[
                styles.secondaryButtonText,
                { 
                  color: theme.colors.textSecondary,
                  fontSize: sizeStyles.descriptionSize,
                }
              ]}>
                {finalSecondaryAction}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Retry indicator */}
        {retryable && (
          <View style={styles.retryIndicator}>
            <ThemedText style={[
              styles.retryText,
              { 
                color: theme.colors.textSecondary,
                fontSize: sizeStyles.descriptionSize - 2,
              }
            ]}>
              Pull down to retry
            </ThemedText>
          </View>
        )}
      </Animated.View>
    </ThemedView>
  )
}

// Specialized error state components for common scenarios
export function NetworkErrorState({ onRetry, onGoOffline }: { 
  onRetry?: () => void
  onGoOffline?: () => void 
}) {
  return (
    <ErrorState
      variant="network"
      onPrimaryAction={onRetry}
      onSecondaryAction={onGoOffline}
      size="large"
    />
  )
}

export function ServerErrorState({ 
  onRetry, 
  onReportIssue,
  errorCode 
}: { 
  onRetry?: () => void
  onReportIssue?: () => void
  errorCode?: string
}) {
  return (
    <ErrorState
      variant="server"
      onPrimaryAction={onRetry}
      onSecondaryAction={onReportIssue}
      errorCode={errorCode}
      size="large"
    />
  )
}

export function AuthErrorState({ onSignIn, onCreateAccount }: { 
  onSignIn?: () => void
  onCreateAccount?: () => void 
}) {
  return (
    <ErrorState
      variant="auth"
      onPrimaryAction={onSignIn}
      onSecondaryAction={onCreateAccount}
    />
  )
}

export function ValidationErrorState({ 
  message,
  onFixInput, 
  onResetForm 
}: { 
  message?: string
  onFixInput?: () => void
  onResetForm?: () => void 
}) {
  return (
    <ErrorState
      variant="validation"
      description={message}
      onPrimaryAction={onFixInput}
      onSecondaryAction={onResetForm}
      retryable={false}
    />
  )
}

export function StorageErrorState({ onRetry, onSaveLater }: { 
  onRetry?: () => void
  onSaveLater?: () => void 
}) {
  return (
    <ErrorState
      variant="storage"
      onPrimaryAction={onRetry}
      onSecondaryAction={onSaveLater}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  content: {
    alignItems: 'center',
    maxWidth: screenWidth * 0.8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  icon: {
    textAlign: 'center',
  },
  errorCodeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  errorCode: {
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  description: {
    textAlign: 'center',
    lineHeight: 1.4,
    opacity: 0.8,
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    minWidth: 140,
  },
  secondaryButtonText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  retryIndicator: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  retryText: {
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.6,
  },
})