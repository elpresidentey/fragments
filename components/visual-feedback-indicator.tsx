/**
 * Visual Feedback Indicator Component
 * Provides consistent success/error state colors and animations throughout the app
 * Implements requirements 9.2, 9.3 for visual feedback state consistency
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { ThemedText } from './themed-text';
import { useTheme } from '../design-system/hooks/use-theme';
import { animationTiming } from '../design-system/theme/animations';

export interface VisualFeedbackIndicatorProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  visible: boolean;
  duration?: number;
  onHide?: () => void;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  position?: 'top' | 'center' | 'bottom';
}

export function VisualFeedbackIndicator({
  type,
  message,
  visible,
  duration = 3000,
  onHide,
  size = 'medium',
  showIcon = true,
  position = 'center'
}: VisualFeedbackIndicatorProps) {
  const { theme } = useTheme();
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(position === 'top' ? -50 : position === 'bottom' ? 50 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (visible) {
      // Show animation with immediate feedback (within 100ms)
      scale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
      opacity.value = withTiming(1, { duration: 100 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 300 });

      // Auto-hide after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          hideIndicator();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideIndicator();
    }
  }, [visible, duration]);

  const hideIndicator = () => {
    scale.value = withTiming(0.8, { duration: animationTiming.quick });
    opacity.value = withTiming(0, { duration: animationTiming.quick }, () => {
      if (onHide) {
        runOnJS(onHide)();
      }
    });
    translateY.value = withTiming(
      position === 'top' ? -30 : position === 'bottom' ? 30 : -10, 
      { duration: animationTiming.quick }
    );
  };

  const getIndicatorColors = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          borderColor: theme.colors.success,
          textColor: '#FFFFFF',
          icon: '✓',
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error,
          borderColor: theme.colors.error,
          textColor: '#FFFFFF',
          icon: '✕',
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning,
          borderColor: theme.colors.warning,
          textColor: '#FFFFFF',
          icon: '⚠',
        };
      case 'info':
        return {
          backgroundColor: theme.colors.info,
          borderColor: theme.colors.info,
          textColor: '#FFFFFF',
          icon: 'ℹ',
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          textColor: '#FFFFFF',
          icon: 'ℹ',
        };
    }
  };

  const colors = getIndicatorColors();

  const containerStyles = [
    styles.container,
    styles[size],
    styles[position],
    {
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
    },
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    {
      color: colors.textColor,
    },
  ];

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[containerStyles, animatedStyle]}>
      {showIcon && (
        <ThemedText style={[styles.icon, { color: colors.textColor }]}>
          {colors.icon}
        </ThemedText>
      )}
      <ThemedText style={textStyles}>
        {message}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  top: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  center: {
    alignSelf: 'center',
  },
  bottom: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
});