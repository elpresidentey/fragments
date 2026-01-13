import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useAuth } from '../../contexts/auth-context'
import { router, useLocalSearchParams } from 'expo-router'
import { PasswordInput } from '../../components/password-input'
import { PasswordStrengthIndicator } from '../../components/password-strength-indicator'
import { usePasswordStrength } from '../../hooks/use-password-strength'
import { supabase } from '../../lib/supabase'
import { getErrorMessage, isTokenExpired, logDeepLinkEvent } from '../../lib/utils/deep-link-utils'

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { resetPassword, state } = useAuth()
  const params = useLocalSearchParams()
  const passwordStrength = usePasswordStrength(newPassword)

  // Validate reset token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        setIsValidating(true)
        
        logDeepLinkEvent('token_validation_start', { params })
        
        // Check for error parameters from deep link
        const error = params.error as string
        const errorDescription = params.errorDescription as string
        
        if (error) {
          console.error('Deep link error:', error, errorDescription)
          logDeepLinkEvent('token_validation_error', { error, errorDescription })
          
          const errorMessage = getErrorMessage(error, errorDescription)
          
          Alert.alert(
            'Invalid Reset Link',
            errorMessage,
            [
              {
                text: 'Request New Reset',
                onPress: () => router.replace('/(auth)/login')
              }
            ]
          )
          return
        }
        
        // Check for token parameters from deep link
        const accessToken = params.accessToken as string
        const refreshToken = params.refreshToken as string
        const type = params.type as string
        
        if (accessToken && refreshToken && type === 'recovery') {
          console.log('Setting session from deep link tokens')
          logDeepLinkEvent('setting_session', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken, type })
          
          // Set the session using the tokens from the deep link
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (sessionError) {
            console.error('Session error:', sessionError)
            logDeepLinkEvent('session_error', { error: sessionError.message })
            
            Alert.alert(
              'Invalid Reset Link',
              'Unable to authenticate with the provided reset link. The link may be expired or invalid.',
              [
                {
                  text: 'Request New Reset',
                  onPress: () => router.replace('/(auth)/login')
                }
              ]
            )
            return
          }
          
          if (!data.session) {
            logDeepLinkEvent('no_session', { data })
            Alert.alert(
              'Invalid Reset Link',
              'No valid session could be established from the reset link.',
              [
                {
                  text: 'Request New Reset',
                  onPress: () => router.replace('/(auth)/login')
                }
              ]
            )
            return
          }
          
          // Check token expiration
          const tokenTimestamp = new Date(data.session.user.created_at || data.session.created_at).getTime()
          const expired = isTokenExpired(tokenTimestamp, 3600000) // 1 hour
          
          if (expired) {
            logDeepLinkEvent('token_expired', { tokenTimestamp, currentTime: Date.now() })
            Alert.alert(
              'Reset Link Expired',
              'This password reset link has expired. Reset links are valid for 1 hour.',
              [
                {
                  text: 'Request New Reset',
                  onPress: () => router.replace('/(auth)/login')
                }
              ]
            )
            return
          }
          
          console.log('Session established successfully from deep link')
          logDeepLinkEvent('token_validation_success', { userId: data.session.user.id })
          setTokenValid(true)
          return
        }
        
        // Fallback: Check if we have a valid session for password recovery
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          logDeepLinkEvent('fallback_session_error', { error: sessionError.message })
          
          Alert.alert(
            'Invalid Reset Link',
            'This password reset link is invalid or has expired.',
            [
              {
                text: 'Request New Reset',
                onPress: () => router.replace('/(auth)/login')
              }
            ]
          )
          return
        }

        if (!session) {
          logDeepLinkEvent('no_fallback_session', {})
          Alert.alert(
            'Invalid Reset Link',
            'This password reset link is invalid or has expired. Please request a new password reset.',
            [
              {
                text: 'Request New Reset',
                onPress: () => router.replace('/(auth)/login')
              }
            ]
          )
          return
        }

        // Check if this is a recovery session
        const isRecoverySession = session.user?.aud === 'authenticated'
        
        if (!isRecoverySession) {
          logDeepLinkEvent('not_recovery_session', { aud: session.user?.aud })
          Alert.alert(
            'Invalid Reset Link',
            'This link is not valid for password reset.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)/login')
              }
            ]
          )
          return
        }
        
        // Check token expiration
        const tokenTimestamp = new Date(session.user.created_at || session.created_at).getTime()
        const expired = isTokenExpired(tokenTimestamp, 3600000) // 1 hour
        
        if (expired) {
          logDeepLinkEvent('fallback_token_expired', { tokenTimestamp, currentTime: Date.now() })
          Alert.alert(
            'Reset Link Expired',
            'This password reset link has expired. Reset links are valid for 1 hour.',
            [
              {
                text: 'Request New Reset',
                onPress: () => router.replace('/(auth)/login')
              }
            ]
          )
          return
        }
        
        console.log('Token validation successful')
        logDeepLinkEvent('fallback_validation_success', { userId: session.user.id })
        setTokenValid(true)
      } catch (error) {
        console.error('Token validation error:', error)
        logDeepLinkEvent('validation_exception', { error: error instanceof Error ? error.message : 'Unknown error' })
        
        Alert.alert(
          'Error',
          'Unable to validate reset link. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login')
            }
          ]
        )
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [params])

  // Password validation
  const validatePassword = (password: string): boolean => {
    if (!password.trim()) {
      setPasswordError('Password is required')
      return false
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return false
    }
    if (!/(?=.*[a-z])/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter')
      return false
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter')
      return false
    }
    if (!/(?=.*\d)/.test(password)) {
      setPasswordError('Password must contain at least one number')
      return false
    }
    setPasswordError('')
    return true
  }

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword: string): boolean => {
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password')
      return false
    }
    if (confirmPassword !== newPassword) {
      setConfirmPasswordError('Passwords do not match')
      return false
    }
    setConfirmPasswordError('')
    return true
  }

  // Handle password reset submission
  const handleResetPassword = async () => {
    const isPasswordValid = validatePassword(newPassword)
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword)

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return
    }

    try {
      setIsSubmitting(true)
      const result = await resetPassword(newPassword)
      
      if (result.success) {
        Alert.alert(
          'Password Reset Successful',
          result.message,
          [
            {
              text: 'Sign In',
              onPress: () => router.replace('/(auth)/login')
            }
          ]
        )
      } else {
        Alert.alert('Password Reset Failed', result.message)
      }
    } catch (error) {
      console.error('Password reset error:', error)
      Alert.alert('Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Navigate back to login
  const handleBackToLogin = () => {
    router.replace('/(auth)/login')
  }

  // Show loading screen while validating token
  if (isValidating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Validating reset link...</Text>
      </View>
    )
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Invalid Reset Link</Text>
        <Text style={styles.errorMessage}>
          This password reset link is invalid or has expired.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleBackToLogin}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below. Make sure it's strong and secure.
          </Text>

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <PasswordInput
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text)
                if (passwordError) validatePassword(text)
                // Re-validate confirm password if it's already filled
                if (confirmPassword && confirmPasswordError) {
                  validateConfirmPassword(confirmPassword)
                }
              }}
              placeholder="Enter your new password"
              label="New Password"
              error={passwordError}
              autoHideOnBlur={true}
              testID="reset-new-password-input"
              accessibilityLabel="New password input field"
              accessibilityHint="Enter your new password with at least 8 characters"
              editable={!isSubmitting}
            />
          </View>

          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <PasswordStrengthIndicator
                password={newPassword}
                testID="reset-password-strength"
              />
            </View>
          )}

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <PasswordInput
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text)
                if (confirmPasswordError) validateConfirmPassword(text)
              }}
              placeholder="Confirm your new password"
              label="Confirm New Password"
              error={confirmPasswordError}
              autoHideOnBlur={true}
              testID="reset-confirm-password-input"
              accessibilityLabel="Confirm new password input field"
              accessibilityHint="Re-enter your new password to confirm it matches"
              editable={!isSubmitting}
            />
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <Text style={styles.requirementItem}>• At least 8 characters long</Text>
            <Text style={styles.requirementItem}>• Contains uppercase and lowercase letters</Text>
            <Text style={styles.requirementItem}>• Contains at least one number</Text>
          </View>

          {/* Global Error Display */}
          {state.error ? (
            <View style={styles.globalErrorContainer}>
              <Text 
                style={styles.globalErrorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                testID="reset-password-global-error"
              >
                {state.error}
              </Text>
            </View>
          ) : null}

          {/* Reset Password Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (isSubmitting || state.isLoading) ? styles.buttonDisabled : null
            ]}
            onPress={handleResetPassword}
            disabled={isSubmitting || state.isLoading}
            accessibilityLabel="Reset password"
            accessibilityHint={isSubmitting || state.isLoading ? "Resetting password, please wait" : "Double tap to reset your password"}
            accessibilityState={{ disabled: isSubmitting || state.isLoading }}
            testID="reset-password-submit-button"
          >
            <Text style={styles.buttonText}>
              {isSubmitting || state.isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>

          {/* Back to Login Link */}
          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={handleBackToLogin} disabled={isSubmitting}>
              <Text style={styles.linkButton}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  strengthContainer: {
    marginBottom: 20,
  },
  requirementsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  globalErrorContainer: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  globalErrorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    alignItems: 'center',
  },
  linkButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
})