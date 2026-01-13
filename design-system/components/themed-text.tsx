/**
 * Enhanced themed text component with accessibility support
 * Automatically applies theme colors, typography, and accessibility features
 */

import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../hooks/use-theme';
import { useAccessibility } from '../hooks/use-accessibility';
import { TypographyVariant } from '../theme/typography';

interface ThemedTextProps extends Omit<TextProps, 'style'> {
  variant?: TypographyVariant;
  color?: 'text' | 'textSecondary' | 'primary' | 'error' | 'success';
  style?: TextProps['style'];
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'text' | 'header' | 'link' | 'button';
  semanticLevel?: 1 | 2 | 3 | 4 | 5 | 6; // For headers
}

export function ThemedText({ 
  variant = 'body', 
  color = 'text', 
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'text',
  semanticLevel,
  children,
  ...props 
}: ThemedTextProps) {
  const { theme } = useTheme();
  const { getAccessibilityProps } = useAccessibility();
  
  // Get typography style for the variant
  const typographyStyle = theme.typography[variant];
  
  // Get color from theme
  const textColor = theme.colors[color];

  // Create accessibility props
  const accessibilityProps = getAccessibilityProps({
    label: accessibilityLabel,
    hint: accessibilityHint,
    role: accessibilityRole,
  });

  // Add semantic header properties for screen readers
  const headerProps = semanticLevel ? {
    accessibilityRole: 'header' as const,
    accessibilityLevel: semanticLevel,
  } : {};
  
  const textStyle = [
    typographyStyle,
    { color: textColor },
    style,
  ];

  return (
    <Text 
      style={textStyle} 
      {...accessibilityProps}
      {...headerProps}
      {...props}
    >
      {children}
    </Text>
  );
}