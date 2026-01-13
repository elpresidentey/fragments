/**
 * Enhanced form validation hook with accessibility support
 * Provides real-time validation, error handling, and screen reader announcements
 */

import { useState, useCallback, useRef } from 'react';
import { AuthErrorHandler, AuthError } from '../lib/security/error-handler';

export interface ValidationRule<T = any> {
  validator: (value: T, formData?: Record<string, any>) => AuthError | null;
  dependencies?: string[];
}

export interface FormField {
  value: any;
  error: AuthError | null;
  touched: boolean;
  validating: boolean;
}

export interface UseFormValidationOptions {
  announceErrors?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export interface UseFormValidationReturn<T extends Record<string, any>> {
  fields: Record<keyof T, FormField>;
  errors: Record<keyof T, AuthError | null>;
  isValid: boolean;
  isValidating: boolean;
  hasErrors: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: AuthError | null) => void;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  markFieldTouched: (field: keyof T) => void;
  resetForm: () => void;
  getFieldProps: (field: keyof T) => {
    value: any;
    error: string | undefined;
    onChangeText: (value: any) => void;
    onBlur: () => void;
    testID: string;
  };
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule>>,
  options: UseFormValidationOptions = {}
): UseFormValidationReturn<T> {
  const {
    announceErrors = true,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
  } = options;

  // Initialize form state
  const [fields, setFields] = useState<Record<keyof T, FormField>>(() => {
    const initialFields: Record<keyof T, FormField> = {} as any;
    Object.keys(initialValues).forEach((key) => {
      initialFields[key as keyof T] = {
        value: initialValues[key as keyof T],
        error: null,
        touched: false,
        validating: false,
      };
    });
    return initialFields;
  });

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Derived state
  const errors = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].error;
    return acc;
  }, {} as Record<keyof T, AuthError | null>);

  const isValid = Object.values(fields).every((field) => field.error === null);
  const isValidating = Object.values(fields).some((field) => field.validating);
  const hasErrors = Object.values(fields).some((field) => field.error !== null);

  // Set field value
  const setValue = useCallback((field: keyof T, value: any) => {
    setFields((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
      },
    }));

    // Validate on change if enabled
    if (validateOnChange && validationRules[field]) {
      // Clear existing debounce timer
      if (debounceTimers.current[field as string]) {
        clearTimeout(debounceTimers.current[field as string]);
      }

      // Set new debounce timer
      debounceTimers.current[field as string] = setTimeout(() => {
        validateField(field);
      }, debounceMs);
    }
  }, [validateOnChange, debounceMs]);

  // Set field error
  const setError = useCallback((field: keyof T, error: AuthError | null) => {
    setFields((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
      },
    }));

    // Announce error to screen readers
    if (error && announceErrors) {
      AuthErrorHandler.handleError(error, { announceToScreenReader: true });
    }
  }, [announceErrors]);

  // Clear field error
  const clearError = useCallback((field: keyof T) => {
    setError(field, null);
  }, [setError]);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setFields((prev) => {
      const newFields = { ...prev };
      Object.keys(newFields).forEach((key) => {
        newFields[key as keyof T] = {
          ...newFields[key as keyof T],
          error: null,
        };
      });
      return newFields;
    });
  }, []);

  // Validate single field
  const validateField = useCallback(async (field: keyof T): Promise<boolean> => {
    const rule = validationRules[field];
    if (!rule) return true;

    // Set validating state
    setFields((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        validating: true,
      },
    }));

    try {
      // Get current form data for cross-field validation
      const formData = Object.keys(fields).reduce((acc, key) => {
        acc[key] = fields[key as keyof T].value;
        return acc;
      }, {} as Record<string, any>);

      // Run validation
      const error = rule.validator(fields[field].value, formData);
      
      // Update field state
      setFields((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          error,
          validating: false,
        },
      }));

      // Announce error if present
      if (error && announceErrors) {
        AuthErrorHandler.handleError(error, { announceToScreenReader: true });
      }

      return error === null;
    } catch (validationError) {
      console.error('Validation error:', validationError);
      const error = AuthErrorHandler.createError('validation_error');
      
      setFields((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          error,
          validating: false,
        },
      }));

      return false;
    }
  }, [fields, validationRules, announceErrors]);

  // Validate entire form
  const validateForm = useCallback(async (): Promise<boolean> => {
    const validationPromises = Object.keys(validationRules).map((field) =>
      validateField(field as keyof T)
    );

    const results = await Promise.all(validationPromises);
    return results.every((result) => result);
  }, [validationRules, validateField]);

  // Mark field as touched
  const markFieldTouched = useCallback((field: keyof T) => {
    setFields((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        touched: true,
      },
    }));

    // Validate on blur if enabled
    if (validateOnBlur && validationRules[field]) {
      validateField(field);
    }
  }, [validateOnBlur, validationRules, validateField]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFields(() => {
      const resetFields: Record<keyof T, FormField> = {} as any;
      Object.keys(initialValues).forEach((key) => {
        resetFields[key as keyof T] = {
          value: initialValues[key as keyof T],
          error: null,
          touched: false,
          validating: false,
        };
      });
      return resetFields;
    });

    // Clear all debounce timers
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};
  }, [initialValues]);

  // Get field props for easy integration with form components
  const getFieldProps = useCallback((field: keyof T) => {
    const fieldState = fields[field];
    return {
      value: fieldState.value,
      error: fieldState.error?.userMessage,
      onChangeText: (value: any) => setValue(field, value),
      onBlur: () => markFieldTouched(field),
      testID: `form-field-${String(field)}`,
    };
  }, [fields, setValue, markFieldTouched]);

  return {
    fields,
    errors,
    isValid,
    isValidating,
    hasErrors,
    setValue,
    setError,
    clearError,
    clearAllErrors,
    validateField,
    validateForm,
    markFieldTouched,
    resetForm,
    getFieldProps,
  };
}

/**
 * Common validation rules for authentication forms
 */
export const authValidationRules = {
  email: {
    validator: (value: string) => AuthErrorHandler.validateEmail(value),
  },
  password: {
    validator: (value: string) => {
      const errors = AuthErrorHandler.validatePassword(value);
      return errors.length > 0 ? errors[0] : null;
    },
  },
  confirmPassword: {
    validator: (value: string, formData?: Record<string, any>) => {
      if (!formData?.password) return null;
      return AuthErrorHandler.validatePasswordConfirmation(formData.password, value);
    },
    dependencies: ['password'],
  },
} as const;