/**
 * Enhanced error handling utilities for authentication components
 * Provides consistent error messaging, accessibility support, and user feedback
 */

import { AccessibilityInfo } from 'react-native';

export interface AuthError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning' | 'info';
  recoverable: boolean;
  userMessage: string;
  accessibilityMessage: string;
}

export interface ErrorHandlerOptions {
  announceToScreenReader?: boolean;
  logError?: boolean;
  showToast?: boolean;
}

/**
 * Authentication error codes and their user-friendly messages
 */
export const AUTH_ERROR_CODES = {
  // Password validation errors
  PASSWORD_TOO_SHORT: 'password_too_short',
  PASSWORD_NO_UPPERCASE: 'password_no_uppercase',
  PASSWORD_NO_LOWERCASE: 'password_no_lowercase',
  PASSWORD_NO_NUMBER: 'password_no_number',
  PASSWORD_NO_SPECIAL: 'password_no_special',
  PASSWORD_MISMATCH: 'password_mismatch',
  
  // Email validation errors
  EMAIL_INVALID: 'email_invalid',
  EMAIL_REQUIRED: 'email_required',
  EMAIL_NOT_FOUND: 'email_not_found',
  
  // Network and service errors
  NETWORK_ERROR: 'network_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  RATE_LIMITED: 'rate_limited',
  
  // Authentication errors
  INVALID_CREDENTIALS: 'invalid_credentials',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_INVALID: 'token_invalid',
  SESSION_EXPIRED: 'session_expired',
  
  // Generic errors
  UNKNOWN_ERROR: 'unknown_error',
  VALIDATION_ERROR: 'validation_error',
} as const;

/**
 * Error message mappings with accessibility-friendly versions
 */
const ERROR_MESSAGES: Record<string, Omit<AuthError, 'code'>> = {
  [AUTH_ERROR_CODES.PASSWORD_TOO_SHORT]: {
    message: 'Password must be at least 8 characters long',
    field: 'password',
    severity: 'error',
    recoverable: true,
    userMessage: 'Password must be at least 8 characters long',
    accessibilityMessage: 'Password validation error: Password must be at least 8 characters long',
  },
  [AUTH_ERROR_CODES.PASSWORD_NO_UPPERCASE]: {
    message: 'Password must contain at least one uppercase letter',
    field: 'password',
    severity: 'error',
    recoverable: true,
    userMessage: 'Password must contain at least one uppercase letter (A-Z)',
    accessibilityMessage: 'Password validation error: Password must contain at least one uppercase letter',
  },
  [AUTH_ERROR_CODES.PASSWORD_NO_LOWERCASE]: {
    message: 'Password must contain at least one lowercase letter',
    field: 'password',
    severity: 'error',
    recoverable: true,
    userMessage: 'Password must contain at least one lowercase letter (a-z)',
    accessibilityMessage: 'Password validation error: Password must contain at least one lowercase letter',
  },
  [AUTH_ERROR_CODES.PASSWORD_NO_NUMBER]: {
    message: 'Password must contain at least one number',
    field: 'password',
    severity: 'error',
    recoverable: true,
    userMessage: 'Password must contain at least one number (0-9)',
    accessibilityMessage: 'Password validation error: Password must contain at least one number',
  },
  [AUTH_ERROR_CODES.PASSWORD_NO_SPECIAL]: {
    message: 'Password must contain at least one special character',
    field: 'password',
    severity: 'error',
    recoverable: true,
    userMessage: 'Password must contain at least one special character (!@#$%^&*)',
    accessibilityMessage: 'Password validation error: Password must contain at least one special character',
  },
  [AUTH_ERROR_CODES.PASSWORD_MISMATCH]: {
    message: 'Passwords do not match',
    field: 'confirmPassword',
    severity: 'error',
    recoverable: true,
    userMessage: 'Passwords do not match. Please check both password fields.',
    accessibilityMessage: 'Password confirmation error: The passwords you entered do not match',
  },
  [AUTH_ERROR_CODES.EMAIL_INVALID]: {
    message: 'Please enter a valid email address',
    field: 'email',
    severity: 'error',
    recoverable: true,
    userMessage: 'Please enter a valid email address (example@domain.com)',
    accessibilityMessage: 'Email validation error: Please enter a valid email address',
  },
  [AUTH_ERROR_CODES.EMAIL_REQUIRED]: {
    message: 'Email address is required',
    field: 'email',
    severity: 'error',
    recoverable: true,
    userMessage: 'Email address is required',
    accessibilityMessage: 'Email validation error: Email address is required',
  },
  [AUTH_ERROR_CODES.EMAIL_NOT_FOUND]: {
    message: 'If this email is registered, you will receive a reset link',
    field: 'email',
    severity: 'info',
    recoverable: true,
    userMessage: 'If this email is registered with us, you will receive a password reset link shortly.',
    accessibilityMessage: 'Password reset request processed. If the email is registered, you will receive a reset link.',
  },
  [AUTH_ERROR_CODES.NETWORK_ERROR]: {
    message: 'Network connection error',
    field: undefined,
    severity: 'error',
    recoverable: true,
    userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
    accessibilityMessage: 'Network error: Unable to connect to the server. Please check your internet connection.',
  },
  [AUTH_ERROR_CODES.SERVICE_UNAVAILABLE]: {
    message: 'Service temporarily unavailable',
    field: undefined,
    severity: 'error',
    recoverable: true,
    userMessage: 'The service is temporarily unavailable. Please try again in a few minutes.',
    accessibilityMessage: 'Service error: The service is temporarily unavailable. Please try again later.',
  },
  [AUTH_ERROR_CODES.RATE_LIMITED]: {
    message: 'Too many requests',
    field: undefined,
    severity: 'warning',
    recoverable: true,
    userMessage: 'Too many attempts. Please wait a few minutes before trying again.',
    accessibilityMessage: 'Rate limit error: Too many attempts. Please wait before trying again.',
  },
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: {
    message: 'Invalid email or password',
    field: undefined,
    severity: 'error',
    recoverable: true,
    userMessage: 'Invalid email or password. Please check your credentials and try again.',
    accessibilityMessage: 'Authentication error: Invalid email or password.',
  },
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: {
    message: 'Reset link has expired',
    field: undefined,
    severity: 'error',
    recoverable: true,
    userMessage: 'This password reset link has expired. Please request a new one.',
    accessibilityMessage: 'Token error: The password reset link has expired. Please request a new one.',
  },
  [AUTH_ERROR_CODES.TOKEN_INVALID]: {
    message: 'Invalid reset link',
    field: undefined,
    severity: 'error',
    recoverable: true,
    userMessage: 'This password reset link is invalid. Please request a new one.',
    accessibilityMessage: 'Token error: The password reset link is invalid. Please request a new one.',
  },
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: {
    message: 'Session has expired',
    field: undefined,
    severity: 'warning',
    recoverable: true,
    userMessage: 'Your session has expired. Please sign in again.',
    accessibilityMessage: 'Session error: Your session has expired. Please sign in again.',
  },
  [AUTH_ERROR_CODES.UNKNOWN_ERROR]: {
    message: 'An unexpected error occurred',
    field: undefined,
    severity: 'error',
    recoverable: true,
    userMessage: 'An unexpected error occurred. Please try again.',
    accessibilityMessage: 'Unexpected error occurred. Please try again.',
  },
  [AUTH_ERROR_CODES.VALIDATION_ERROR]: {
    message: 'Please check your input',
    field: undefined,
    severity: 'error',
    recoverable: true,
    userMessage: 'Please check your input and try again.',
    accessibilityMessage: 'Validation error: Please check your input and try again.',
  },
};

/**
 * Enhanced error handler class
 */
export class AuthErrorHandler {
  /**
   * Create an AuthError from an error code
   */
  static createError(code: string, customMessage?: string): AuthError {
    const errorTemplate = ERROR_MESSAGES[code] || ERROR_MESSAGES[AUTH_ERROR_CODES.UNKNOWN_ERROR];
    
    return {
      code,
      message: customMessage || errorTemplate.message,
      field: errorTemplate.field,
      severity: errorTemplate.severity,
      recoverable: errorTemplate.recoverable,
      userMessage: customMessage || errorTemplate.userMessage,
      accessibilityMessage: customMessage || errorTemplate.accessibilityMessage,
    };
  }

  /**
   * Handle an error with optional accessibility announcements
   */
  static handleError(
    error: AuthError | string,
    options: ErrorHandlerOptions = {}
  ): AuthError {
    const {
      announceToScreenReader = true,
      logError = true,
      showToast = false,
    } = options;

    let authError: AuthError;

    if (typeof error === 'string') {
      authError = this.createError(error);
    } else {
      authError = error;
    }

    // Log error for debugging
    if (logError) {
      console.error(`[AuthError] ${authError.code}: ${authError.message}`, {
        field: authError.field,
        severity: authError.severity,
        recoverable: authError.recoverable,
      });
    }

    // Announce to screen readers
    if (announceToScreenReader) {
      AccessibilityInfo.announceForAccessibility(authError.accessibilityMessage);
    }

    return authError;
  }

  /**
   * Validate password and return specific error codes
   */
  static validatePassword(password: string): AuthError[] {
    const errors: AuthError[] = [];

    if (password.length < 8) {
      errors.push(this.createError(AUTH_ERROR_CODES.PASSWORD_TOO_SHORT));
    }

    if (!/[A-Z]/.test(password)) {
      errors.push(this.createError(AUTH_ERROR_CODES.PASSWORD_NO_UPPERCASE));
    }

    if (!/[a-z]/.test(password)) {
      errors.push(this.createError(AUTH_ERROR_CODES.PASSWORD_NO_LOWERCASE));
    }

    if (!/\d/.test(password)) {
      errors.push(this.createError(AUTH_ERROR_CODES.PASSWORD_NO_NUMBER));
    }

    return errors;
  }

  /**
   * Validate email and return error if invalid
   */
  static validateEmail(email: string): AuthError | null {
    if (!email.trim()) {
      return this.createError(AUTH_ERROR_CODES.EMAIL_REQUIRED);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return this.createError(AUTH_ERROR_CODES.EMAIL_INVALID);
    }

    return null;
  }

  /**
   * Validate password confirmation
   */
  static validatePasswordConfirmation(password: string, confirmPassword: string): AuthError | null {
    if (password !== confirmPassword) {
      return this.createError(AUTH_ERROR_CODES.PASSWORD_MISMATCH);
    }

    return null;
  }

  /**
   * Parse Supabase error and convert to AuthError
   */
  static parseSupabaseError(error: any): AuthError {
    if (!error) {
      return this.createError(AUTH_ERROR_CODES.UNKNOWN_ERROR);
    }

    // Handle common Supabase error patterns
    const message = error.message || error.error_description || 'Unknown error';
    
    if (message.includes('Invalid login credentials')) {
      return this.createError(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (message.includes('Token has expired')) {
      return this.createError(AUTH_ERROR_CODES.TOKEN_EXPIRED);
    }

    if (message.includes('Invalid token')) {
      return this.createError(AUTH_ERROR_CODES.TOKEN_INVALID);
    }

    if (message.includes('Too many requests')) {
      return this.createError(AUTH_ERROR_CODES.RATE_LIMITED);
    }

    if (message.includes('Network')) {
      return this.createError(AUTH_ERROR_CODES.NETWORK_ERROR);
    }

    // Default to unknown error with the original message
    return this.createError(AUTH_ERROR_CODES.UNKNOWN_ERROR, message);
  }

  /**
   * Get user-friendly error message for display
   */
  static getUserMessage(error: AuthError): string {
    return error.userMessage;
  }

  /**
   * Get accessibility-friendly error message
   */
  static getAccessibilityMessage(error: AuthError): string {
    return error.accessibilityMessage;
  }

  /**
   * Check if error is recoverable (user can fix it)
   */
  static isRecoverable(error: AuthError): boolean {
    return error.recoverable;
  }

  /**
   * Get error severity level
   */
  static getSeverity(error: AuthError): 'error' | 'warning' | 'info' {
    return error.severity;
  }
}