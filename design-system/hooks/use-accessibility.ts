/**
 * React hook for accessibility features
 * Provides dynamic font scaling, screen reader support, and accessibility utilities
 */

import { useState, useEffect } from 'react';
import { AccessibilityInfo, PixelRatio } from 'react-native';

export interface AccessibilitySettings {
  isScreenReaderEnabled: boolean;
  fontScale: number;
  isReduceMotionEnabled: boolean;
  isHighContrastEnabled: boolean;
}

export interface UseAccessibilityReturn extends AccessibilitySettings {
  announceForAccessibility: (message: string) => void;
  getScaledFontSize: (baseFontSize: number) => number;
  getAccessibilityProps: (options: AccessibilityPropsOptions) => AccessibilityProps;
}

export interface AccessibilityPropsOptions {
  label?: string;
  hint?: string;
  role?: 'button' | 'text' | 'image' | 'header' | 'link' | 'search' | 'none';
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
  };
  actions?: Array<{
    name: string;
    label: string;
  }>;
}

export interface AccessibilityProps {
  accessible: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
  };
  accessibilityActions?: Array<{
    name: string;
    label: string;
  }>;
}

export function useAccessibility(): UseAccessibilityReturn {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    isScreenReaderEnabled: false,
    fontScale: 1,
    isReduceMotionEnabled: false,
    isHighContrastEnabled: false,
  });

  useEffect(() => {
    // Check if screen reader is enabled
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      setSettings(prev => ({ ...prev, isScreenReaderEnabled: enabled }));
    });

    // Get font scale from system settings
    const fontScale = PixelRatio.getFontScale();
    setSettings(prev => ({ ...prev, fontScale }));

    // Check for reduce motion preference (iOS only, fallback for Android)
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      setSettings(prev => ({ ...prev, isReduceMotionEnabled: enabled || false }));
    }).catch(() => {
      // Fallback for Android or older versions
      setSettings(prev => ({ ...prev, isReduceMotionEnabled: false }));
    });

    // Listen for accessibility changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        setSettings(prev => ({ ...prev, isScreenReaderEnabled: enabled }));
      }
    );

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setSettings(prev => ({ ...prev, isReduceMotionEnabled: enabled }));
      }
    );

    return () => {
      screenReaderListener?.remove();
      reduceMotionListener?.remove();
    };
  }, []);

  const announceForAccessibility = (message: string) => {
    if (settings.isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const getScaledFontSize = (baseFontSize: number): number => {
    // Apply system font scale with reasonable limits
    const scaledSize = baseFontSize * settings.fontScale;
    
    // Ensure minimum readability (12px) and maximum usability (32px for body text)
    const minSize = baseFontSize < 16 ? 12 : 14;
    const maxSize = baseFontSize * 2;
    
    return Math.max(minSize, Math.min(maxSize, scaledSize));
  };

  const getAccessibilityProps = (options: AccessibilityPropsOptions): AccessibilityProps => {
    const props: AccessibilityProps = {
      accessible: true,
    };

    if (options.label) {
      props.accessibilityLabel = options.label;
    }

    if (options.hint) {
      props.accessibilityHint = options.hint;
    }

    if (options.role) {
      props.accessibilityRole = options.role;
    }

    if (options.state) {
      props.accessibilityState = options.state;
    }

    if (options.actions) {
      props.accessibilityActions = options.actions;
    }

    return props;
  };

  return {
    ...settings,
    announceForAccessibility,
    getScaledFontSize,
    getAccessibilityProps,
  };
}