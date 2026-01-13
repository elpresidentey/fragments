import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { ThemedText } from './themed-text';
import { Colors, spacing, typography } from '../design-system';
import { useColorScheme } from '../hooks/use-color-scheme';
import { 
  PasswordValidationService 
} from '../lib/security/password-validation';

export interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  showScore?: boolean;
  testID?: string;
  style?: any;
}

/**
 * Password strength indicator component with visual feedback and accessibility
 * Displays real-time password strength analysis with requirements checklist
 */
export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
  showScore = true,
  testID = 'password-strength-indicator',
  style,
}: PasswordStrengthIndicatorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const validation = PasswordValidationService.validatePassword(password);
  const { strength } = validation;
  
  // Don't show indicator if password is empty
  if (password.length === 0) {
    return null;
  }

  // Get strength color
  const strengthColor = PasswordValidationService.getStrengthColor(strength.score);
  const strengthLabel = PasswordValidationService.getStrengthLabel(strength.score);

  // Calculate progress percentage
  const progressPercentage = (strength.score / 4) * 100;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Strength Bar */}
      <View style={styles.strengthBarContainer}>
        <View style={[styles.strengthBarBackground, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.strengthBarFill,
              {
                backgroundColor: strengthColor,
                width: `${progressPercentage}%`,
              },
            ]}
          />
        </View>
        
        {showScore && (
          <ThemedText
            style={[styles.strengthLabel, { color: strengthColor }]}
            accessibilityRole="text"
            accessibilityLabel={`Password strength: ${strengthLabel}`}
            accessibilityLiveRegion="polite"
            testID={`${testID}-label`}
          >
            {strengthLabel}
          </ThemedText>
        )}
      </View>

      {/* Requirements Checklist */}
      {showRequirements && (
        <View style={styles.requirementsContainer}>
          <RequirementItem
            met={strength.requirements.minLength}
            text="At least 8 characters"
            testID={`${testID}-length`}
          />
          <RequirementItem
            met={strength.requirements.hasUppercase}
            text="Uppercase letter (A-Z)"
            testID={`${testID}-uppercase`}
          />
          <RequirementItem
            met={strength.requirements.hasLowercase}
            text="Lowercase letter (a-z)"
            testID={`${testID}-lowercase`}
          />
          <RequirementItem
            met={strength.requirements.hasNumber}
            text="Number (0-9)"
            testID={`${testID}-number`}
          />
          <RequirementItem
            met={strength.requirements.hasSpecialChar}
            text="Special character (!@#$%^&*)"
            testID={`${testID}-special`}
          />
        </View>
      )}

      {/* Feedback Messages */}
      {strength.feedback.length > 0 && (
        <View style={styles.feedbackContainer}>
          {strength.feedback.map((feedback, index) => (
            <ThemedText
              key={index}
              style={[styles.feedbackText, { color: colors.textSecondary }]}
              accessibilityRole="text"
              testID={`${testID}-feedback-${index}`}
            >
              • {feedback}
            </ThemedText>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Individual requirement item component
 */
interface RequirementItemProps {
  met: boolean;
  text: string;
  testID?: string;
}

function RequirementItem({ met, text, testID }: RequirementItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const checkColor = met ? '#00aa00' : colors.textSecondary;
  const checkIcon = met ? '✓' : '○';

  return (
    <View style={styles.requirementItem} testID={testID}>
      <ThemedText
        style={[styles.requirementIcon, { color: checkColor }]}
        accessibilityRole="text"
        accessibilityLabel={met ? 'Requirement met' : 'Requirement not met'}
      >
        {checkIcon}
      </ThemedText>
      <ThemedText
        style={[
          styles.requirementText,
          {
            color: met ? colors.text : colors.textSecondary,
            textDecorationLine: met ? 'line-through' : 'none',
          },
        ]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

/**
 * Compact password strength indicator for inline use
 */
export function CompactPasswordStrengthIndicator({
  password,
  testID = 'compact-password-strength',
}: {
  password: string;
  testID?: string;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  if (password.length === 0) {
    return null;
  }

  const validation = PasswordValidationService.validatePassword(password);
  const { strength } = validation;
  const strengthColor = PasswordValidationService.getStrengthColor(strength.score);
  const strengthLabel = PasswordValidationService.getStrengthLabel(strength.score);
  const progressPercentage = (strength.score / 4) * 100;

  return (
    <View style={styles.compactContainer} testID={testID}>
      <View style={[styles.compactBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.compactBarFill,
            {
              backgroundColor: strengthColor,
              width: `${progressPercentage}%`,
            },
          ]}
        />
      </View>
      <ThemedText
        style={[styles.compactLabel, { color: strengthColor }]}
        accessibilityLabel={`Password strength: ${strengthLabel}`}
        accessibilityLiveRegion="polite"
      >
        {strengthLabel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  strengthBarBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2, // Ensure some visual feedback even for very weak passwords
  },
  strengthLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  requirementsContainer: {
    marginBottom: spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requirementIcon: {
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
    marginRight: spacing.sm,
    minWidth: 16,
    textAlign: 'center',
  },
  requirementText: {
    fontSize: typography.caption.fontSize,
    flex: 1,
  },
  feedbackContainer: {
    marginTop: spacing.xs,
  },
  feedbackText: {
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.xs,
    lineHeight: typography.caption.lineHeight,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  compactBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  compactBarFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 1,
  },
  compactLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'right',
  },
});