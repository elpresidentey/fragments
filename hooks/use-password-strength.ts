import { useMemo } from 'react';
import { 
  PasswordValidationService, 
  PasswordStrength,
  PasswordValidationResult 
} from '../lib/security/password-validation';

/**
 * Hook for real-time password strength validation
 * Provides memoized password strength analysis to prevent unnecessary recalculations
 */
export function usePasswordStrength(password: string) {
  const validation = useMemo(() => {
    return PasswordValidationService.validatePassword(password);
  }, [password]);

  const strengthColor = useMemo(() => {
    return PasswordValidationService.getStrengthColor(validation.strength.score);
  }, [validation.strength.score]);

  const strengthLabel = useMemo(() => {
    return PasswordValidationService.getStrengthLabel(validation.strength.score);
  }, [validation.strength.score]);

  return {
    strength: validation.strength,
    isValid: validation.isValid,
    message: validation.message,
    color: strengthColor,
    label: strengthLabel,
    score: validation.strength.score,
    requirements: validation.strength.requirements,
    feedback: validation.strength.feedback,
  };
}

/**
 * Hook for password confirmation validation
 */
export function usePasswordConfirmation(password: string, confirmation: string) {
  const validation = useMemo(() => {
    return PasswordValidationService.validatePasswordConfirmation(password, confirmation);
  }, [password, confirmation]);

  const doMatch = useMemo(() => {
    return PasswordValidationService.doPasswordsMatch(password, confirmation);
  }, [password, confirmation]);

  return {
    isValid: validation.isValid,
    message: validation.message,
    doMatch,
  };
}

/**
 * Hook for comprehensive password validation (password + confirmation)
 */
export function usePasswordValidation(password: string, confirmation?: string) {
  const passwordStrength = usePasswordStrength(password);
  
  const confirmationValidation = useMemo(() => {
    if (confirmation !== undefined) {
      return PasswordValidationService.validatePasswordConfirmation(password, confirmation);
    }
    return { isValid: true, message: '' };
  }, [password, confirmation]);

  const isFormValid = useMemo(() => {
    const passwordValid = passwordStrength.isValid;
    const confirmationValid = confirmation !== undefined ? confirmationValidation.isValid : true;
    return passwordValid && confirmationValid;
  }, [passwordStrength.isValid, confirmationValidation.isValid, confirmation]);

  return {
    password: passwordStrength,
    confirmation: confirmationValidation,
    isFormValid,
    canSubmit: isFormValid && password.length > 0,
  };
}