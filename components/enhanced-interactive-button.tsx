/**
 * Enhanced Interactive Button Component
 * Provides immediate visual feedback and consistent interaction patterns
 * Implements requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */

import React from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { ThemedText } from './themed-text';
import { useVisualFeedback, useHoverEffect } from '../design-system/hooks/use-visual-feedback';
import { useTheme } from '../design-system/hooks/use-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface EnhancedInteractiveButtonProps extends Omit<PressableProps, 'onPress'> {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'error' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: boolean;
  showHoverEffect?: boolean;
  feedbackType?: 'press' | 'success' | 'error' | 'warning' | 'info';
}

export function EnhancedInteractiveButton({
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
  feedbackType,
  style,
  ...props
}: EnhancedInteractiveButtonProps) {
  const { theme } = useTheme();
  
  // Determine feedback type based on variant if not explicitly provided
  const effectiveFeedbackType = feedbackType || 
    (variant === 'success' ? 'success' :
     variant === 'error' ? 'error' :
     variant === 'warning' ? 'warning' :
     'press');

  const { animatedStyle: feedbackStyle, handlePressIn } = useVisualFeedback({
    feedbackType: effectiveFeedbackType,
    hapticFeedback,
    onPress: disabled || loading ? undefined : onPress,
    disabled: disabled || loading,
  });

  const { animatedStyle: hoverStyle, handleHoverIn, handleHoverOut } = useHoverEffect({
    disabled: disabled || loading || !showHoverEffect,
  });

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          textColor: '#FFFFFF',
          borderColor: theme.colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.surface,
          textColor: theme.colors.text,
          borderColor: theme.colors.border,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: theme.colors.text,
          borderColor: theme.colors.border,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          textColor: '#FFFFFF',
          borderColor: theme.colors.success,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error,
          textColor: '#FFFFFF',
          borderColor: theme.colors.error,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning,
          textColor: '#FFFFFF',
          borderColor: theme.colors.warning,
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          textColor: '#FFFFFF',
          borderColor: theme.colors.primary,
        };
    }
  };

  const colors = getButtonColors();
  
  const buttonStyles: ViewStyle[] = [
    styles.button,
    styles[size],
    {
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      opacity: disabled ? 0.5 : 1,
    },
    style as ViewStyle,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${size}Text`],
    {
      color: colors.textColor,
    },
  ];

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
      
      <ThemedText style={textStyles}>
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
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});