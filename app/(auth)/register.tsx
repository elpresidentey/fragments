import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useAuth } from '../../contexts/auth-context'
import { router } from 'expo-router'
import { PasswordInput } from '../../components/password-input'

export default function RegisterScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  
  const { signUp, state } = useAuth()

  // Navigation guard - redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated && !state.isLoading) {
      router.replace('/(tabs)')
    }
  }, [state.isAuthenticated, state.isLoading])

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      setEmailError('Email is required')
      return false
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  // Password validation
  const validatePassword = (password: string): boolean => {
    if (!password.trim()) {
      setPasswordError('Password is required')
      return false
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
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
    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match')
      return false
    }
    setConfirmPasswordError('')
    return true
  }

  // Handle form submission
  const handleSignUp = async () => {
    console.log('Sign up button clicked')
    console.log('Email:', email)
    console.log('Password length:', password.length)
    console.log('Confirm password:', confirmPassword)
    
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword)

    console.log('Validation results:', { isEmailValid, isPasswordValid, isConfirmPasswordValid })

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      console.log('Validation failed, returning early')
      return
    }

    console.log('Starting sign up process...')
    try {
      const result = await signUp(email, password)
      console.log('Sign up result:', result)
      
      if (result.error) {
        console.error('Sign up error:', result.error)
        
        // Check if it's an email confirmation required case
        if (result.error.message?.includes('email confirmation') || result.error.message?.includes('check your email')) {
          Alert.alert(
            'Check Your Email',
            result.error.message,
            [
              {
                text: 'OK',
                onPress: () => router.push('/(auth)/login')
              }
            ]
          )
        } else {
          Alert.alert('Registration Failed', result.error.message || 'Registration failed')
        }
      } else if (result.user) {
        console.log('Sign up successful:', result.user)
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)')
            }
          ]
        )
      } else if (result.session && !result.user) {
        // User was created but profile not ready yet - still success
        console.log('Sign up successful, profile will be created shortly')
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)')
            }
          ]
        )
      } else {
        // Fallback case - something unexpected happened
        console.log('Unexpected sign up result:', result)
        Alert.alert(
          'Registration Status Unknown',
          'Your account may have been created. Please try signing in.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(auth)/login')
            }
          ]
        )
      }
    } catch (error) {
      console.error('Sign up exception:', error)
      Alert.alert('Error', 'An unexpected error occurred')
    }
  }

  // Navigate to login screen
  const handleGoToLogin = () => {
    router.push('/(auth)/login')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                if (emailError) validateEmail(text)
              }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!state.isLoading}
              testID="register-email-input"
              accessibilityLabel="Email input field"
              accessibilityHint="Enter your email address to create an account"
            />
            {emailError ? (
              <Text 
                style={styles.errorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                nativeID="register-email-error"
                testID="register-email-error"
              >
                {emailError}
              </Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <PasswordInput
              value={password}
              onChangeText={(text) => {
                setPassword(text)
                if (passwordError) validatePassword(text)
                // Re-validate confirm password if it's already filled
                if (confirmPassword && confirmPasswordError) {
                  validateConfirmPassword(confirmPassword)
                }
              }}
              placeholder="Enter your password"
              label="Password"
              error={passwordError}
              autoHideOnBlur={true}
              showStrengthIndicator={true}
              strengthIndicatorType="compact"
              testID="register-password-input"
              accessibilityLabel="Password input field"
              accessibilityHint="Enter a password with at least 6 characters"
              editable={!state.isLoading}
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <PasswordInput
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text)
                if (confirmPasswordError) validateConfirmPassword(text)
              }}
              placeholder="Confirm your password"
              label="Confirm Password"
              error={confirmPasswordError}
              autoHideOnBlur={true}
              testID="register-confirm-password-input"
              accessibilityLabel="Confirm password input field"
              accessibilityHint="Re-enter your password to confirm it matches"
              editable={!state.isLoading}
            />
          </View>

          {/* Global Error Display */}
          {state.error ? (
            <View style={styles.globalErrorContainer}>
              <Text 
                style={styles.globalErrorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                testID="register-global-error"
              >
                {state.error}
              </Text>
            </View>
          ) : null}

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.button, state.isLoading ? styles.buttonDisabled : null]}
            onPress={handleSignUp}
            disabled={state.isLoading}
            accessibilityLabel="Create your account"
            accessibilityHint={state.isLoading ? "Creating account, please wait" : "Double tap to create your account"}
            accessibilityState={{ disabled: state.isLoading }}
            testID="register-submit-button"
          >
            <Text style={styles.buttonText}>
              {state.isLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={handleGoToLogin} 
              disabled={state.isLoading}
              accessibilityLabel="Sign in to existing account"
              accessibilityHint="Double tap to sign in with existing account"
              accessibilityRole="button"
              testID="login-link"
            >
              <Text style={styles.linkButton}>Sign In</Text>
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
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  passwordRequirements: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    color: '#666',
  },
  linkButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
})