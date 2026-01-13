import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useToast } from '../contexts/toast-context'

interface ForgotPasswordModalProps {
  visible: boolean
  onClose: () => void
  onResetRequest: (email: string) => Promise<{ success: boolean; message: string }>
}

export function ForgotPasswordModal({ visible, onClose, onResetRequest }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { showSuccess, showError } = useToast()

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      setEmailError('Email is required')
      return false
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  // Handle password reset request
  const handleResetRequest = async () => {
    if (!validateEmail(email)) {
      return
    }

    setIsLoading(true)
    try {
      const result = await onResetRequest(email.trim())
      
      if (result.success) {
        setIsSuccess(true)
        showSuccess(result.message)
      } else {
        showError(result.message)
        setEmailError(result.message)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email'
      showError(errorMessage)
      setEmailError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    setEmail('')
    setEmailError('')
    setIsLoading(false)
    setIsSuccess(false)
    onClose()
  }

  // Handle email input change
  const handleEmailChange = (text: string) => {
    setEmail(text)
    if (emailError) {
      validateEmail(text)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {!isSuccess ? (
            <>
              <Text style={styles.subtitle}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, emailError ? styles.inputError : null]}
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  testID="forgot-password-email-input"
                  accessibilityLabel="Email input for password reset"
                />
                {emailError ? (
                  <Text 
                    style={styles.errorText}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                    nativeID="forgot-password-email-error"
                    testID="forgot-password-email-error"
                  >
                    {emailError}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading ? styles.buttonDisabled : null]}
                onPress={handleResetRequest}
                disabled={isLoading}
                testID="send-reset-email-button"
                accessibilityLabel="Send password reset email"
                accessibilityHint={isLoading ? "Sending reset email, please wait" : "Double tap to send password reset email"}
                accessibilityState={{ disabled: isLoading }}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.buttonText}>Sending...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Send Reset Email</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>Email Sent!</Text>
              <Text style={styles.successMessage}>
                We&apos;ve sent a password reset link to {email}. Please check your email and follow the instructions to reset your password.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleClose}
                testID="close-success-button"
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
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
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  successIcon: {
    fontSize: 64,
    color: '#4CAF50',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
})