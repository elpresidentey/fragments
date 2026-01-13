import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PasswordInput } from './password-input';
import { ThemedText } from './themed-text';
import { Colors, spacing, typography } from '../design-system';
import { useColorScheme } from '../hooks/use-color-scheme';
import { usePasswordValidation } from '../hooks/use-password-strength';

/**
 * Demo component to showcase password strength validation
 * This component demonstrates the real-time password strength feedback
 */
export function PasswordStrengthDemo() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const validation = usePasswordValidation(password, confirmPassword);

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.title, { color: colors.text }]}>
        Password Strength Demo
      </ThemedText>
      
      <PasswordInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        showStrengthIndicator={true}
        strengthIndicatorType="full"
        placeholder="Enter a strong password"
        testID="demo-password"
      />

      <PasswordInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        showStrengthIndicator={false}
        placeholder="Confirm your password"
        error={
          confirmPassword.length > 0 && !validation.confirmation.isValid
            ? validation.confirmation.message
            : undefined
        }
        testID="demo-confirm-password"
      />

      <View style={styles.statusContainer}>
        <ThemedText style={[styles.statusText, { color: colors.text }]}>
          Form Status: {validation.isFormValid ? '✅ Valid' : '❌ Invalid'}
        </ThemedText>
        <ThemedText style={[styles.statusText, { color: colors.text }]}>
          Can Submit: {validation.canSubmit ? '✅ Yes' : '❌ No'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusText: {
    fontSize: typography.body.fontSize,
    marginBottom: spacing.xs,
  },
});