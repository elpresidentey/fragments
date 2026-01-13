/**
 * Typography system with consistent font hierarchy
 * Based on design specifications for Twitter-like interface
 * Supports dynamic font scaling for accessibility
 */

import { TextStyle } from 'react-native';

export interface TypographyStyle extends TextStyle {
  fontSize: number;
  fontWeight: TextStyle['fontWeight'];
  lineHeight: number;
}

export interface TypographySystem {
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  body: TypographyStyle;
  bodyMedium: TypographyStyle;
  caption: TypographyStyle;
  small: TypographyStyle;
}

export interface ScalableTypographySystem {
  getScaledTypography: (fontScale: number) => TypographySystem;
  getScaledStyle: (style: keyof TypographySystem, fontScale: number) => TypographyStyle;
}

// Base typography system (scale factor 1.0)
export const typography: TypographySystem = {
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28.8, // 1.2x
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24, // 1.2x
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 21.6, // 1.2x
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4, // 1.4x
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4, // 1.4x
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19.6, // 1.4x
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16.8, // 1.4x
  },
};

/**
 * Create scalable typography system
 */
export const createScalableTypography = (): ScalableTypographySystem => {
  const getScaledFontSize = (baseFontSize: number, fontScale: number): number => {
    // Apply system font scale with reasonable limits
    const scaledSize = baseFontSize * fontScale;
    
    // Ensure minimum readability and maximum usability
    const minSize = baseFontSize < 16 ? 12 : 14;
    const maxSize = baseFontSize * 2.5; // Allow up to 2.5x scaling
    
    return Math.max(minSize, Math.min(maxSize, scaledSize));
  };

  const getScaledStyle = (style: keyof TypographySystem, fontScale: number): TypographyStyle => {
    const baseStyle = typography[style];
    const scaledFontSize = getScaledFontSize(baseStyle.fontSize, fontScale);
    
    return {
      ...baseStyle,
      fontSize: scaledFontSize,
      lineHeight: scaledFontSize * (baseStyle.lineHeight / baseStyle.fontSize),
    };
  };

  const getScaledTypography = (fontScale: number): TypographySystem => {
    return {
      h1: getScaledStyle('h1', fontScale),
      h2: getScaledStyle('h2', fontScale),
      h3: getScaledStyle('h3', fontScale),
      body: getScaledStyle('body', fontScale),
      bodyMedium: getScaledStyle('bodyMedium', fontScale),
      caption: getScaledStyle('caption', fontScale),
      small: getScaledStyle('small', fontScale),
    };
  };

  return {
    getScaledTypography,
    getScaledStyle,
  };
};

// Export singleton instance
export const scalableTypography = createScalableTypography();

export type TypographyVariant = keyof TypographySystem;