/**
 * Password strength validation tests
 * Tests the password validation service and strength calculation
 */

import { PasswordValidationService } from '../../lib/security/password-validation';

describe('PasswordValidationService', () => {
  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      const result = PasswordValidationService.validatePassword('StrongPass123!');
      
      expect(result.isValid).toBe(true);
      expect(result.strength.score).toBeGreaterThanOrEqual(3);
      expect(result.strength.requirements.minLength).toBe(true);
      expect(result.strength.requirements.hasUppercase).toBe(true);
      expect(result.strength.requirements.hasLowercase).toBe(true);
      expect(result.strength.requirements.hasNumber).toBe(true);
      expect(result.strength.requirements.hasSpecialChar).toBe(true);
    });

    it('should reject a weak password', () => {
      const result = PasswordValidationService.validatePassword('weak');
      
      expect(result.isValid).toBe(false);
      expect(result.strength.score).toBeLessThan(2);
      expect(result.strength.requirements.minLength).toBe(false);
      expect(result.strength.feedback.length).toBeGreaterThan(0);
    });

    it('should validate password requirements individually', () => {
      const tests = [
        { password: 'short', requirement: 'minLength', expected: false },
        { password: 'longenoughbutnouppercaseornumbers', requirement: 'minLength', expected: true },
        { password: 'HasUppercase123', requirement: 'hasUppercase', expected: true },
        { password: 'nouppercase123', requirement: 'hasUppercase', expected: false },
        { password: 'NOLOWERCASE123', requirement: 'hasLowercase', expected: false },
        { password: 'HasLowercase123', requirement: 'hasLowercase', expected: true },
        { password: 'NoNumbers!', requirement: 'hasNumber', expected: false },
        { password: 'HasNumbers123', requirement: 'hasNumber', expected: true },
        { password: 'NoSpecialChars123', requirement: 'hasSpecialChar', expected: false },
        { password: 'HasSpecial123!', requirement: 'hasSpecialChar', expected: true },
      ];

      tests.forEach(({ password, requirement, expected }) => {
        const result = PasswordValidationService.validatePassword(password);
        expect(result.strength.requirements[requirement as keyof typeof result.strength.requirements])
          .toBe(expected);
      });
    });

    it('should provide helpful feedback for weak passwords', () => {
      const result = PasswordValidationService.validatePassword('weak');
      
      expect(result.strength.feedback).toContain('Password must be at least 8 characters long');
      expect(result.strength.feedback).toContain('Add uppercase letters (A-Z)');
      expect(result.strength.feedback).toContain('Add numbers (0-9)');
      expect(result.strength.feedback).toContain('Add special characters (!@#$%^&*)');
    });

    it('should detect common patterns', () => {
      const commonPasswords = [
        'password123',
        'admin123',
        'qwerty123',
        'abc123456',
        '123456789',
      ];

      commonPasswords.forEach(password => {
        const result = PasswordValidationService.validatePassword(password);
        // Common patterns should reduce the score
        expect(result.strength.score).toBeLessThan(4);
      });
    });

    it('should detect repeated characters', () => {
      const result = PasswordValidationService.validatePassword('Passsssword123!');
      
      expect(result.strength.feedback).toContain('Avoid repeating characters');
      expect(result.strength.score).toBeLessThan(4);
    });
  });

  describe('calculatePasswordStrength', () => {
    it('should calculate strength scores correctly', () => {
      const tests = [
        { password: '', expectedScore: 0 },
        { password: 'weak', expectedScore: 0 },
        { password: 'WeakPass', expectedScore: 1 },
        { password: 'WeakPass1', expectedScore: 2 },
        { password: 'StrongPass1!', expectedScore: 3 },
        { password: 'VeryStrongPassword123!', expectedScore: 4 },
      ];

      tests.forEach(({ password, expectedScore }) => {
        const strength = PasswordValidationService.calculatePasswordStrength(password);
        expect(strength.score).toBe(expectedScore);
      });
    });
  });

  describe('getStrengthColor', () => {
    it('should return appropriate colors for different strength scores', () => {
      expect(PasswordValidationService.getStrengthColor(0)).toBe('#ff4444'); // Red
      expect(PasswordValidationService.getStrengthColor(1)).toBe('#ff4444'); // Red
      expect(PasswordValidationService.getStrengthColor(2)).toBe('#ffaa00'); // Orange
      expect(PasswordValidationService.getStrengthColor(3)).toBe('#00aa00'); // Green
      expect(PasswordValidationService.getStrengthColor(4)).toBe('#0066cc'); // Blue
    });
  });

  describe('getStrengthLabel', () => {
    it('should return appropriate labels for different strength scores', () => {
      expect(PasswordValidationService.getStrengthLabel(0)).toBe('Very weak');
      expect(PasswordValidationService.getStrengthLabel(1)).toBe('Weak');
      expect(PasswordValidationService.getStrengthLabel(2)).toBe('Fair');
      expect(PasswordValidationService.getStrengthLabel(3)).toBe('Good');
      expect(PasswordValidationService.getStrengthLabel(4)).toBe('Strong');
    });
  });

  describe('doPasswordsMatch', () => {
    it('should correctly identify matching passwords', () => {
      expect(PasswordValidationService.doPasswordsMatch('password123', 'password123')).toBe(true);
      expect(PasswordValidationService.doPasswordsMatch('password123', 'different123')).toBe(false);
      expect(PasswordValidationService.doPasswordsMatch('', '')).toBe(false); // Empty passwords don't match
    });
  });

  describe('validatePasswordConfirmation', () => {
    it('should validate password confirmation correctly', () => {
      const matchResult = PasswordValidationService.validatePasswordConfirmation('password123', 'password123');
      expect(matchResult.isValid).toBe(true);
      expect(matchResult.message).toBe('Passwords match');

      const mismatchResult = PasswordValidationService.validatePasswordConfirmation('password123', 'different123');
      expect(mismatchResult.isValid).toBe(false);
      expect(mismatchResult.message).toBe('Passwords do not match');

      const emptyResult = PasswordValidationService.validatePasswordConfirmation('password123', '');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.message).toBe('Please confirm your password');
    });
  });
});