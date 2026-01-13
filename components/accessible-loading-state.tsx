/**
 * Accessible loading state component for authentication flows
 * Provides screen reader announcements and proper loading indicators
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, spacing, typography } from '../design-system';
import { useColorScheme } from '../hooks/use-color-scheme';

export interface AccessibleLoadingStateProps {
  isLoading: boolean;
  loadingText?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
  announceToScreenReader?: boolean;
  testID?: string;
  style?: any;
}

/**
 * Loading state component with accessibility features
 */
export function AccessibleLoadingState({
  isLoading,
  loadingText = 'Loading...',
  size = 'medium',
  overlay = false,
  announceToScreenReader = true,
  testID = 'accessible-loading-state',
  style,
}: AccessibleLoadingStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Announce loading state changes to screen readers
  useEffect(() => {
    if (announceToScreenReader) {
      if (isLoading) {
        AccessibilityInfo.announceForAccessibility(`Loading: ${loadingText}`);
      } else {
        AccessibilityInfo.announceForAccessibility('Loading complete');
      }
    }
  }, [isLoading, loadingText, announceToScreenReader]);

  if (!isLoading) {
    return null;
  }

  const containerStyle = [
    styles.container,
    overlay && styles.overlay,
    overlay && { backgroundColor: `${colors.background}CC` },
    style,
  ];

  const indicatorSize = size === 'small' ? 'small' : 'large';

  return (
    <View
      style={containerStyle}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={loadingText}
      accessibilityLiveRegion="polite"
      accessible={true}
    >
      <ThemedView style={styles.content}>
        <ActivityIndicator
          size={indicatorSize}
          color={colors.primary}
          testID={`${testID}-spinner`}
        />
        <ThemedText
          style={[
            styles.loadingText,
            {
              color: colors.text,
              fontSize: size === 'small' ? typography.caption.fontSize : typography.body.fontSize,
              marginTop: size === 'small' ? spacing.xs : spacing.sm,
            },
          ]}
          accessibilityRole="text"
          testID={`${testID}-text`}
        >
          {loadingText}
        </ThemedText>
      </ThemedView>
    </View>
  );
}

/**
 * Specialized loading states for authentication flows
 */
export function AuthLoadingState({
  action,
  ...props
}: Omit<AccessibleLoadingStateProps, 'loadingText'> & {
  action: 'signing-in' | 'signing-up' | 'resetting-password' | 'sending-email' | 'validating';
}) {
  const loadingTexts = {
    'signing-in': 'Signing you in...',
    'signing-up': 'Creating your account...',
    'resetting-password': 'Resetting your password...',
    'sending-email': 'Sending reset email...',
    'validating': 'Validating...',
  };

  return (
    <AccessibleLoadingState
      loadingText={loadingTexts[action]}
      {...props}
    />
  );
}

/**
 * Inline loading indicator for form buttons
 */
export function InlineLoadingIndicator({
  isLoading,
  text,
  loadingText,
  size = 'small',
  testID = 'inline-loading',
}: {
  isLoading: boolean;
  text: string;
  loadingText?: string;
  size?: 'small' | 'medium';
  testID?: string;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (isLoading) {
    return (
      <View
        style={styles.inlineContainer}
        testID={testID}
        accessibilityRole="progressbar"
        accessibilityLabel={loadingText || `${text} in progress`}
        accessible={true}
      >
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'large'}
          color={colors.background}
          style={styles.inlineSpinner}
        />
        <ThemedText
          style={[
            styles.inlineText,
            {
              color: colors.background,
              fontSize: size === 'small' ? typography.caption.fontSize : typography.body.fontSize,
            },
          ]}
        >
          {loadingText || text}
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedText
      style={[
        styles.inlineText,
        {
          color: colors.background,
          fontSize: size === 'small' ? typography.caption.fontSize : typography.body.fontSize,
        },
      ]}
    >
      {text}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineSpinner: {
    marginRight: spacing.sm,
  },
  inlineText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});