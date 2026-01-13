import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import React from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { useVisualFeedback, useHoverEffect } from '../design-system/hooks/use-visual-feedback';
import { useAccessibility } from '../design-system/hooks/use-accessibility';

const AnimatedPressable = Animated.createAnimatedComponent(PlatformPressable);

export function HapticTab(props: BottomTabBarButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const { isReduceMotionEnabled, announceForAccessibility } = useAccessibility();

  // Enhanced visual feedback for tab interactions
  const { animatedStyle: feedbackStyle, handlePressIn: handleFeedbackPress } = useVisualFeedback({
    feedbackType: 'info',
    hapticFeedback: true,
    duration: isReduceMotionEnabled ? 0 : 200,
    onPress: props.onPress,
  });

  const { animatedStyle: hoverStyle, handleHoverIn, handleHoverOut } = useHoverEffect({
    hoverScale: isReduceMotionEnabled ? 1 : 1.05,
    duration: isReduceMotionEnabled ? 0 : 150,
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = (ev: any) => {
    // Enhanced haptic feedback
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Only animate if reduce motion is not enabled
    if (!isReduceMotionEnabled) {
      // Immediate visual feedback (within 100ms requirement)
      scale.value = withSpring(0.95, { 
        damping: 15,
        stiffness: 300,
      });
      
      opacity.value = withTiming(0.7, { duration: 80 });
    }

    // Use enhanced feedback system
    handleFeedbackPress();

    props.onPressIn?.(ev);
  };

  const handlePressOut = (ev: any) => {
    // Only animate if reduce motion is not enabled
    if (!isReduceMotionEnabled) {
      // Return to normal state with smooth animation
      scale.value = withSpring(1, { 
        damping: 15,
        stiffness: 300,
      });
      
      opacity.value = withTiming(1, { duration: 150 });
    }

    props.onPressOut?.(ev);
  };

  const handlePress = (ev: any) => {
    // Announce tab change for screen readers
    const tabName = props.accessibilityLabel || 'Tab';
    announceForAccessibility(`${tabName} selected`);
    
    props.onPress?.(ev);
  };

  return (
    <AnimatedPressable
      {...props}
      style={[props.style, animatedStyle, feedbackStyle, hoverStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
    />
  );
}
