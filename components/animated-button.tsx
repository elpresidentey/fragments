/**
 * Animated Button Component
 * Provides consistent button animations with enhanced press feedback
 * Updated to use new visual feedback system for immediate response
 */

import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useButtonPressAnimation } from '../design-system/hooks/use-animation';
import { useVisualFeedback, useHoverEffect } from '../design-system/hooks/use-visual-feedback';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AnimatedButtonProps extends Omit<PressableProps, 'onPress'> {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: boolean;
  showHoverEffect?: boolean;
}

export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  hapticFeedback = true,
  showHoverEffect = true,
  style,
  ...props
}: AnimatedButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Enhanced visual feedback with immediate response (within 100ms)
  const { animatedStyle: feedbackStyle, handlePressIn } = useVisualFeedback({
    feedbackType: 'press',
    hapticFeedback,
    onPress: disabled || loading ? undefined : onPress,
    disabled: disabled || loading,
  });

  // Subtle hover effects for interactive elements
  const { animatedStyle: hoverStyle, handleHoverIn, handleHoverOut } = useHoverEffect({
    disabled: disabled || loading || !showHoverEffect,
  });

  // Legacy animation for compatibility
  const { animatedStyle: legacyStyle, handlePressIn: legacyPressIn, handlePressOut: legacyPressOut } = useButtonPressAnimation({
    scale: 0.95,
    onPress: disabled || loading ? undefined : onPress,
  });

  const buttonStyles = [
    styles.button,
    styles[size],
    styles[variant],
    {
      backgroundColor: variant === 'primary' ? colors.tint : 
                      variant === 'secondary' ? colors.background : 
                      'transparent',
      borderColor: variant === 'ghost' ? colors.border : 'transparent',
      opacity: disabled ? 0.5 : 1,
    },
    style,
  ];

  const textColor = variant === 'primary' ? '#FFFFFF' : colors.text;

  return (
    <AnimatedPressable
      style={[buttonStyles, feedbackStyle, hoverStyle]}
      onPressIn={handlePressIn}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      disabled={disabled || loading}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <Animated.View style={styles.iconLeft}>
          {icon}
        </Animated.View>
      )}
      
      <ThemedText style={[styles.text, { color: textColor }]}>
        {loading ? 'Loading...' : title}
      </ThemedText>
      
      {icon && iconPosition === 'right' && (
        <Animated.View style={styles.iconRight}>
          {icon}
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 48,
  },
  primary: {
    // Styles handled dynamically
  },
  secondary: {
    borderWidth: 1,
  },
  ghost: {
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});