import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { ForgotPasswordModal } from '../../components/forgot-password-modal'
import { ToastProvider } from '../../contexts/toast-context'

// Mock the toast context
const mockShowSuccess = jest.fn()
const mockShowError = jest.fn()

jest.mock('../../contexts/toast-context', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
)

describe('ForgotPasswordModal', () => {
  const mockOnClose = jest.fn()
  const mockOnResetRequest = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly when visible', () => {
    const { getByText, getByTestId } = render(
      <TestWrapper>
        <ForgotPasswordModal
          visible={true}
          onClose={mockOnClose}
          onResetRequest={mockOnResetRequest}
        />
      </TestWrapper>
    )

    expect(getByText('Reset Password')).toBeTruthy()
    expect(getByText('Enter your email address and we\'ll send you a link to reset your password.')).toBeTruthy()
    expect(getByTestId('forgot-password-email-input')).toBeTruthy()
    expect(getByTestId('send-reset-email-button')).toBeTruthy()
  })

  it('validates email format', async () => {
    const { getByTestId, getByText } = render(
      <TestWrapper>
        <ForgotPasswordModal
          visible={true}
          onClose={mockOnClose}
          onResetRequest={mockOnResetRequest}
        />
      </TestWrapper>
    )

    const emailInput = getByTestId('forgot-password-email-input')
    const submitButton = getByTestId('send-reset-email-button')

    // Test empty email
    fireEvent.press(submitButton)
    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy()
    })

    // Test invalid email format
    fireEvent.changeText(emailInput, 'invalid-email')
    fireEvent.press(submitButton)
    await waitFor(() => {
      expect(getByText('Please enter a valid email address')).toBeTruthy()
    })
  })

  it('calls onResetRequest with valid email', async () => {
    mockOnResetRequest.mockResolvedValue({ success: true, message: 'Reset email sent' })

    const { getByTestId } = render(
      <TestWrapper>
        <ForgotPasswordModal
          visible={true}
          onClose={mockOnClose}
          onResetRequest={mockOnResetRequest}
        />
      </TestWrapper>
    )

    const emailInput = getByTestId('forgot-password-email-input')
    const submitButton = getByTestId('send-reset-email-button')

    fireEvent.changeText(emailInput, 'test@example.com')
    fireEvent.press(submitButton)

    await waitFor(() => {
      expect(mockOnResetRequest).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('shows success state after successful reset request', async () => {
    mockOnResetRequest.mockResolvedValue({ success: true, message: 'Reset email sent' })

    const { getByTestId, getByText } = render(
      <TestWrapper>
        <ForgotPasswordModal
          visible={true}
          onClose={mockOnClose}
          onResetRequest={mockOnResetRequest}
        />
      </TestWrapper>
    )

    const emailInput = getByTestId('forgot-password-email-input')
    const submitButton = getByTestId('send-reset-email-button')

    fireEvent.changeText(emailInput, 'test@example.com')
    fireEvent.press(submitButton)

    await waitFor(() => {
      expect(getByText('Email Sent!')).toBeTruthy()
      expect(getByText('We\'ve sent a password reset link to test@example.com. Please check your email and follow the instructions to reset your password.')).toBeTruthy()
    })
  })

  it('handles reset request errors', async () => {
    mockOnResetRequest.mockResolvedValue({ success: false, message: 'Email not found' })

    const { getByTestId } = render(
      <TestWrapper>
        <ForgotPasswordModal
          visible={true}
          onClose={mockOnClose}
          onResetRequest={mockOnResetRequest}
        />
      </TestWrapper>
    )

    const emailInput = getByTestId('forgot-password-email-input')
    const submitButton = getByTestId('send-reset-email-button')

    fireEvent.changeText(emailInput, 'test@example.com')
    fireEvent.press(submitButton)

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Email not found')
    })
  })

  it('calls onClose when close button is pressed', () => {
    const { getByText } = render(
      <TestWrapper>
        <ForgotPasswordModal
          visible={true}
          onClose={mockOnClose}
          onResetRequest={mockOnResetRequest}
        />
      </TestWrapper>
    )

    const closeButton = getByText('✕')
    fireEvent.press(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })
})