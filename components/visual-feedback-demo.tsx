/**
 * Visual Feedback Demo Component
 * Demonstrates all visual feedback and interaction enhancements
 * Used for testing and showcasing the implementation
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { EnhancedInteractiveButton } from './enhanced-interactive-button';
import { VisualFeedbackIndicator } from './visual-feedback-indicator';
import { useTheme } from '../design-system/hooks/use-theme';
import { useToast } from '../contexts/toast-context';

export function VisualFeedbackDemo() {
  const { theme } = useTheme();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  const [showIndicator, setShowIndicator] = useState(false);
  const [indicatorType, setIndicatorType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const handleButtonPress = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    // Show toast notification
    switch (type) {
      case 'success':
        showSuccess(message);
        break;
      case 'error':
        showError(message);
        break;
      case 'warning':
        showWarning(message);
        break;
      case 'info':
        showInfo(message);
        break;
    }

    // Show visual indicator
    setIndicatorType(type);
    setShowIndicator(true);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, theme.typography.h2]}>
          Visual Feedback Demo
        </ThemedText>
        <ThemedText style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
          Test immediate visual feedback, success/error states, hover effects, and consistent animations
        </ThemedText>
      </View>

      {/* Button Press Feedback */}
      <View style={styles.section}>
        <ThemedText style={[styles.subsectionTitle, theme.typography.h3]}>
          Button Press Feedback
        </ThemedText>
        <View style={styles.buttonRow}>
          <EnhancedInteractiveButton
            title="Primary"
            variant="primary"
            onPress={() => handleButtonPress('info', 'Primary button pressed!')}
            hapticFeedback={true}
            showHoverEffect={true}
          />
          <EnhancedInteractiveButton
            title="Secondary"
            variant="secondary"
            onPress={() => handleButtonPress('info', 'Secondary button pressed!')}
            hapticFeedback={true}
            showHoverEffect={true}
          />
        </View>
      </View>

      {/* Success/Error State Colors */}
      <View style={styles.section}>
        <ThemedText style={[styles.subsectionTitle, theme.typography.h3]}>
          Success/Error State Colors
        </ThemedText>
        <View style={styles.buttonRow}>
          <EnhancedInteractiveButton
            title="Success"
            variant="success"
            onPress={() => handleButtonPress('success', 'Operation completed successfully!')}
            feedbackType="success"
          />
          <EnhancedInteractiveButton
            title="Error"
            variant="error"
            onPress={() => handleButtonPress('error', 'An error occurred!')}
            feedbackType="error"
          />
        </View>
        <View style={styles.buttonRow}>
          <EnhancedInteractiveButton
            title="Warning"
            variant="warning"
            onPress={() => handleButtonPress('warning', 'Warning: Please check your input!')}
            feedbackType="warning"
          />
          <EnhancedInteractiveButton
            title="Info"
            variant="primary"
            onPress={() => handleButtonPress('info', 'Information: Process started!')}
            feedbackType="info"
          />
        </View>
      </View>

      {/* Hover Effects */}
      <View style={styles.section}>
        <ThemedText style={[styles.subsectionTitle, theme.typography.h3]}>
          Hover Effects
        </ThemedText>
        <View style={styles.buttonRow}>
          <EnhancedInteractiveButton
            title="Hover Enabled"
            variant="ghost"
            onPress={() => handleButtonPress('info', 'Hover effect enabled!')}
            showHoverEffect={true}
          />
          <EnhancedInteractiveButton
            title="Hover Disabled"
            variant="ghost"
            onPress={() => handleButtonPress('info', 'Hover effect disabled!')}
            showHoverEffect={false}
          />
        </View>
      </View>

      {/* Animation Timing */}
      <View style={styles.section}>
        <ThemedText style={[styles.subsectionTitle, theme.typography.h3]}>
          Consistent Animation Timing
        </ThemedText>
        <ThemedText style={[styles.description, { color: theme.colors.textSecondary }]}>
          All interactions provide feedback within 100ms as required
        </ThemedText>
        <View style={styles.buttonColumn}>
          <EnhancedInteractiveButton
            title="Quick Response (100ms)"
            variant="primary"
            onPress={() => handleButtonPress('success', 'Quick response demonstrated!')}
          />
          <EnhancedInteractiveButton
            title="With Haptic Feedback"
            variant="secondary"
            onPress={() => handleButtonPress('info', 'Haptic feedback enabled!')}
            hapticFeedback={true}
          />
          <EnhancedInteractiveButton
            title="Without Haptic Feedback"
            variant="ghost"
            onPress={() => handleButtonPress('info', 'Haptic feedback disabled!')}
            hapticFeedback={false}
          />
        </View>
      </View>

      {/* State Transitions */}
      <View style={styles.section}>
        <ThemedText style={[styles.subsectionTitle, theme.typography.h3]}>
          Smooth State Transitions
        </ThemedText>
        <View style={styles.buttonRow}>
          <EnhancedInteractiveButton
            title="Show Success"
            variant="success"
            onPress={() => {
              setIndicatorType('success');
              setShowIndicator(true);
            }}
          />
          <EnhancedInteractiveButton
            title="Show Error"
            variant="error"
            onPress={() => {
              setIndicatorType('error');
              setShowIndicator(true);
            }}
          />
        </View>
      </View>

      {/* Visual Feedback Indicator */}
      <VisualFeedbackIndicator
        type={indicatorType}
        message={`${indicatorType.charAt(0).toUpperCase() + indicatorType.slice(1)} state demonstrated!`}
        visible={showIndicator}
        duration={2000}
        onHide={() => setShowIndicator(false)}
        position="center"
        size="medium"
      />

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  subsectionTitle: {
    marginBottom: 12,
  },
  description: {
    marginBottom: 16,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  buttonColumn: {
    gap: 12,
  },
  spacer: {
    height: 100,
  },
});