import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { Colors, spacing, typography } from '../design-system';
import { useColorScheme } from '../hooks/use-color-scheme';
import { PasswordStrengthIndicator, CompactPasswordStrengthIndicator } from './password-strength-indicator';
import { usePasswordStrength } from '../hooks/use-password-strength';

export interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showStrengthIndicator?: boolean;
  strengthIndicatorType?: 'full' | 'compact';
  autoHideOnBlur?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  error?: string;
  label?: string;
  style?: any; // Allow any style type for flexibility
}

export interface PasswordVisibilityState {
  isVisible: boolean;
  toggle: () => void;
  hide: () => void;
}

/**
 * Enhanced password input component with visibility toggle
 * Implements accessibility features and auto-hide on blur for security
 */
export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Enter your password',
  showStrengthIndicator = false,
  strengthIndicatorType = 'full',
  autoHideOnBlur = true,
  testID = 'password-input',
  accessibilityLabel = 'Password input field',
  error,
  label,
  style,
  onBlur,
  onFocus,
  ...textInputProps
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Password visibility state management
  const passwordVisibility: PasswordVisibilityState = {
    isVisible,
    toggle: () => {
      const newVisibility = !isVisible;
      setIsVisible(newVisibility);
      
      // Announce state change to screen readers
      AccessibilityInfo.announceForAccessibility(
        newVisibility ? 'Password is now visible' : 'Password is now hidden'
      );
    },
    hide: () => {
      if (isVisible) {
        setIsVisible(false);
        AccessibilityInfo.announceForAccessibility('Password is now hidden');
      }
    }
  };

  // Handle blur event with auto-hide functionality
  const handleBlur = (e: any) => {
    if (autoHideOnBlur) {
      passwordVisibility.hide();
    }
    onBlur?.(e);
  };

  // Handle focus event
  const handleFocus = (e: any) => {
    onFocus?.(e);
  };

  // Get toggle button accessibility label
  const getToggleAccessibilityLabel = () => {
    return isVisible ? 'Hide password' : 'Show password';
  };

  // Get toggle icon name
  const getToggleIconName = () => {
    return isVisible ? 'eye-off-outline' : 'eye-outline';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <ThemedText style={[styles.label, { color: colors.text }]}>
          {label}
        </ThemedText>
      )}
      
      {/* Input Container */}
      <View style={[
        styles.inputContainer,
        {
          borderColor: error ? colors.error : colors.border,
          backgroundColor: error ? `${colors.error}10` : colors.surface,
        },
      ]}>
        <TextInput
          ref={textInputRef}
          style={[
            styles.textInput,
            {
              color: colors.text,
              fontSize: typography.body.fontSize,
            }
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={handleBlur}
          onFocus={handleFocus}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={isVisible ? 'Password is visible' : 'Password is hidden'}
          {...textInputProps}
        />
        
        {/* Visibility Toggle Button */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={passwordVisibility.toggle}
          accessibilityRole="button"
          accessibilityLabel={getToggleAccessibilityLabel()}
          accessibilityHint="Double tap to toggle password visibility"
          testID={`${testID}-toggle`}
        >
          <Ionicons
            name={getToggleIconName()}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      
      {/* Error Message */}
      {error && (
        <ThemedText 
          style={[styles.errorText, { color: colors.error }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          testID={`${testID}-error`}
          nativeID={`${testID}-error-message`}
        >
          {error}
        </ThemedText>
      )}
      
      {/* Password Strength Indicator */}
      {showStrengthIndicator && (
        <>
          {strengthIndicatorType === 'full' ? (
            <PasswordStrengthIndicator
              password={value}
              testID={`${testID}-strength`}
            />
          ) : (
            <CompactPasswordStrengthIndicator
              password={value}
              testID={`${testID}-strength-compact`}
            />
          )}
        </>
      )}
    </View>
  );
}

/**
 * Custom hook for password visibility management
 */
export function usePasswordVisibility(): PasswordVisibilityState {
  const [isVisible, setIsVisible] = useState(false);

  return {
    isVisible,
    toggle: () => {
      const newVisibility = !isVisible;
      setIsVisible(newVisibility);
      
      // Announce state change to screen readers
      AccessibilityInfo.announceForAccessibility(
        newVisibility ? 'Password is now visible' : 'Password is now hidden'
      );
    },
    hide: () => {
      if (isVisible) {
        setIsVisible(false);
        AccessibilityInfo.announceForAccessibility('Password is now hidden');
      }
    }
  };
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    minHeight: 48, // Minimum touch target size for accessibility
  },
  textInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  toggleButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
    minWidth: 32, // Minimum touch target size
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
});