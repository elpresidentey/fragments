/**
 * Password strength validation utilities
 * Implements comprehensive password strength checking with detailed feedback
 */

export interface PasswordStrength {
  score: number; // 0-4 (0: very weak, 1: weak, 2: fair, 3: good, 4: strong)
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
  isValid: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  strength: PasswordStrength;
  message: string;
}

/**
 * Password validation service with comprehensive strength analysis
 */
export class PasswordValidationService {
  private static readonly MIN_LENGTH = 8;
  private static readonly SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
  private static readonly UPPERCASE = /[A-Z]/;
  private static readonly LOWERCASE = /[a-z]/;
  private static readonly NUMBERS = /[0-9]/;

  /**
   * Validate password and return comprehensive strength analysis
   */
  static validatePassword(password: string): PasswordValidationResult {
    const strength = this.calculatePasswordStrength(password);
    const isValid = strength.score >= 2 && strength.requirements.minLength;
    
    let message = '';
    if (!isValid) {
      if (strength.feedback.length > 0) {
        message = strength.feedback[0];
      } else {
        message = 'Password does not meet minimum requirements';
      }
    } else {
      message = this.getStrengthMessage(strength.score);
    }

    return {
      isValid,
      strength,
      message
    };
  }

  /**
   * Calculate comprehensive password strength
   */
  static calculatePasswordStrength(password: string): PasswordStrength {
    const requirements = {
      minLength: password.length >= this.MIN_LENGTH,
      hasUppercase: this.UPPERCASE.test(password),
      hasLowercase: this.LOWERCASE.test(password),
      hasNumber: this.NUMBERS.test(password),
      hasSpecialChar: this.SPECIAL_CHARS.test(password),
    };

    const feedback: string[] = [];
    let score = 0;

    // Check minimum length
    if (!requirements.minLength) {
      feedback.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    } else {
      score += 1;
    }

    // Check character variety
    if (!requirements.hasUppercase) {
      feedback.push('Add uppercase letters (A-Z)');
    } else {
      score += 0.5;
    }

    if (!requirements.hasLowercase) {
      feedback.push('Add lowercase letters (a-z)');
    } else {
      score += 0.5;
    }

    if (!requirements.hasNumber) {
      feedback.push('Add numbers (0-9)');
    } else {
      score += 0.5;
    }

    if (!requirements.hasSpecialChar) {
      feedback.push('Add special characters (!@#$%^&*)');
    } else {
      score += 0.5;
    }

    // Additional scoring based on length and complexity
    if (password.length >= 12) {
      score += 0.5;
    }

    if (password.length >= 16) {
      score += 0.5;
    }

    // Check for common patterns and reduce score
    if (this.hasCommonPatterns(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Avoid common patterns like "123" or "abc"');
    }

    // Check for repeated characters
    if (this.hasRepeatedCharacters(password)) {
      score = Math.max(0, score - 0.5);
      feedback.push('Avoid repeating characters');
    }

    // Ensure score is within bounds and rounded
    score = Math.min(4, Math.max(0, Math.round(score)));

    // If all requirements are met and no negative feedback, clear feedback
    if (score >= 3 && Object.values(requirements).every(req => req)) {
      feedback.length = 0;
    }

    return {
      score,
      feedback,
      requirements,
      isValid: score >= 2 && requirements.minLength
    };
  }

  /**
   * Check for common password patterns
   */
  private static hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123/,
      /abc/i,
      /qwerty/i,
      /password/i,
      /admin/i,
      /user/i,
      /login/i,
      /(.)\1{2,}/, // Three or more repeated characters
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Check for excessive repeated characters
   */
  private static hasRepeatedCharacters(password: string): boolean {
    // Check for more than 2 consecutive identical characters
    return /(.)\1{2,}/.test(password);
  }

  /**
   * Get human-readable strength message
   */
  private static getStrengthMessage(score: number): string {
    switch (score) {
      case 0:
        return 'Very weak password';
      case 1:
        return 'Weak password';
      case 2:
        return 'Fair password';
      case 3:
        return 'Good password';
      case 4:
        return 'Strong password';
      default:
        return 'Password strength unknown';
    }
  }

  /**
   * Get strength color for UI display
   */
  static getStrengthColor(score: number): string {
    switch (score) {
      case 0:
      case 1:
        return '#ff4444'; // Red
      case 2:
        return '#ffaa00'; // Orange
      case 3:
        return '#00aa00'; // Green
      case 4:
        return '#0066cc'; // Blue
      default:
        return '#666666'; // Gray
    }
  }

  /**
   * Get strength label for accessibility
   */
  static getStrengthLabel(score: number): string {
    switch (score) {
      case 0:
        return 'Very weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return 'Unknown';
    }
  }

  /**
   * Check if passwords match (for confirmation fields)
   */
  static doPasswordsMatch(password: string, confirmation: string): boolean {
    return password === confirmation && password.length > 0;
  }

  /**
   * Validate password confirmation
   */
  static validatePasswordConfirmation(
    password: string, 
    confirmation: string
  ): { isValid: boolean; message: string } {
    if (confirmation.length === 0) {
      return { isValid: false, message: 'Please confirm your password' };
    }

    if (!this.doPasswordsMatch(password, confirmation)) {
      return { isValid: false, message: 'Passwords do not match' };
    }

    return { isValid: true, message: 'Passwords match' };
  }
}

/**
 * Real-time password strength hook for React components
 * @deprecated Use usePasswordStrength from '../hooks/use-password-strength' instead
 */
export function usePasswordStrength(password: string) {
  const validation = PasswordValidationService.validatePassword(password);
  
  return {
    strength: validation.strength,
    isValid: validation.isValid,
    message: validation.message,
    color: PasswordValidationService.getStrengthColor(validation.strength.score),
    label: PasswordValidationService.getStrengthLabel(validation.strength.score),
  };
}