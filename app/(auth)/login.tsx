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
import { ForgotPasswordModal } from '../../components/forgot-password-modal'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  
  const { signIn, state, requestPasswordReset } = useAuth()

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

  // Handle form submission
  const handleSignIn = async () => {
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)

    if (!isEmailValid || !isPasswordValid) {
      return
    }

    try {
      console.log('Attempting sign in for:', email)
      const result = await signIn(email, password)
      console.log('Sign in result:', result)
      
      if (result.error) {
        console.error('Sign in error:', result.error)
        Alert.alert('Sign In Failed', result.error.message || 'Invalid credentials')
      } else if (result.user) {
        console.log('Sign in successful, navigating to tabs')
        // Navigation will be handled by the auth state change
        router.replace('/(tabs)')
      } else {
        console.log('Sign in completed but no user returned')
        Alert.alert('Sign In Issue', 'Please try again or contact support.')
      }
    } catch (error) {
      console.error('Sign in exception:', error)
      Alert.alert('Error', 'An unexpected error occurred')
    }
  }

  // Navigate to register screen
  const handleGoToRegister = () => {
    router.push('/(auth)/register')
  }

  // Handle forgot password
  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true)
  }

  // Handle password reset request
  const handlePasswordResetRequest = async (resetEmail: string) => {
    return await requestPasswordReset(resetEmail)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

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
              testID="login-email-input"
              accessibilityLabel="Email input field"
              accessibilityHint="Enter your email address to sign in"
            />
            {emailError ? (
              <Text 
                style={styles.errorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                nativeID="login-email-error"
                testID="login-email-error"
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
              }}
              placeholder="Enter your password"
              label="Password"
              error={passwordError}
              autoHideOnBlur={true}
              testID="login-password-input"
              accessibilityLabel="Password input field"
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
                testID="login-global-error"
              >
                {state.error}
              </Text>
            </View>
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.button, state.isLoading ? styles.buttonDisabled : null]}
            onPress={handleSignIn}
            disabled={state.isLoading}
            accessibilityLabel="Sign in to your account"
            accessibilityHint={state.isLoading ? "Signing in, please wait" : "Double tap to sign in with your email and password"}
            accessibilityState={{ disabled: state.isLoading }}
            testID="login-submit-button"
          >
            <Text style={styles.buttonText}>
              {state.isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity 
              onPress={handleForgotPassword} 
              disabled={state.isLoading}
              accessibilityLabel="Forgot password"
              accessibilityHint="Double tap to reset your password via email"
              accessibilityRole="button"
              testID="forgot-password-link"
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don&apos;t have an account? </Text>
            <TouchableOpacity 
              onPress={handleGoToRegister} 
              disabled={state.isLoading}
              accessibilityLabel="Sign up for a new account"
              accessibilityHint="Double tap to create a new account"
              accessibilityRole="button"
              testID="register-link"
            >
              <Text style={styles.linkButton}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          visible={showForgotPasswordModal}
          onClose={() => setShowForgotPasswordModal(false)}
          onResetRequest={handlePasswordResetRequest}
        />
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
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
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