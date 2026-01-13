/**
 * Centralized theme engine with light/dark mode support
 * Combines colors, typography, spacing, and animations
 */

import { ColorPalette, Colors, ColorScheme } from './colors';
import { TypographySystem, typography, scalableTypography } from './typography';
import { SpacingSystem, spacing } from './spacing';
import { AnimationTiming, animationTiming, AnimationPresets, animationPresets } from './animations';
import { validateColorPalette, ContrastRatio } from '../utils/accessibility-utils';

export interface Theme {
  colors: ColorPalette;
  typography: TypographySystem;
  spacing: SpacingSystem;
  animations: {
    timing: AnimationTiming;
    presets: AnimationPresets;
  };
  mode: ColorScheme;
  accessibility: {
    contrastValidation: Record<string, ContrastRatio>;
    isHighContrast: boolean;
  };
}

export class ThemeEngine {
  private currentMode: ColorScheme = 'light';
  private isHighContrast: boolean = false;
  private fontScale: number = 1;
  
  constructor(initialMode: ColorScheme = 'light') {
    this.currentMode = initialMode;
  }

  /**
   * Get the current theme object
   */
  getTheme(): Theme {
    const colors = Colors[this.currentMode];
    const scaledTypography = scalableTypography.getScaledTypography(this.fontScale);
    
    return {
      colors,
      typography: scaledTypography,
      spacing,
      animations: {
        timing: animationTiming,
        presets: animationPresets,
      },
      mode: this.currentMode,
      accessibility: {
        contrastValidation: validateColorPalette(colors),
        isHighContrast: this.isHighContrast,
      },
    };
  }

  /**
   * Switch between light and dark modes
   */
  setMode(mode: ColorScheme): void {
    this.currentMode = mode;
  }

  /**
   * Get current mode
   */
  getMode(): ColorScheme {
    return this.currentMode;
  }

  /**
   * Toggle between light and dark modes
   */
  toggleMode(): ColorScheme {
    this.currentMode = this.currentMode === 'light' ? 'dark' : 'light';
    return this.currentMode;
  }

  /**
   * Get colors for current mode
   */
  getColors(): ColorPalette {
    return Colors[this.currentMode];
  }

  /**
   * Get typography system
   */
  getTypography(): TypographySystem {
    return typography;
  }

  /**
   * Get spacing system
   */
  getSpacing(): SpacingSystem {
    return spacing;
  }

  /**
   * Get animation timing constants
   */
  getAnimationTiming(): AnimationTiming {
    return animationTiming;
  }

  /**
   * Get animation presets
   */
  getAnimationPresets(): AnimationPresets {
    return animationPresets;
  }

  /**
   * Enable or disable high contrast mode
   */
  setHighContrast(enabled: boolean): void {
    this.isHighContrast = enabled;
  }

  /**
   * Get high contrast mode status
   */
  getHighContrast(): boolean {
    return this.isHighContrast;
  }

  /**
   * Validate current theme accessibility
   */
  validateAccessibility(): Record<string, ContrastRatio> {
    return validateColorPalette(Colors[this.currentMode]);
  }

  /**
   * Set font scale for accessibility
   */
  setFontScale(scale: number): void {
    this.fontScale = Math.max(0.8, Math.min(3.0, scale)); // Limit between 0.8x and 3.0x
  }

  /**
   * Get current font scale
   */
  getFontScale(): number {
    return this.fontScale;
  }

  /**
   * Get scaled typography for current font scale
   */
  getScaledTypography(): TypographySystem {
    return scalableTypography.getScaledTypography(this.fontScale);
  }
}

// Export singleton instance
export const themeEngine = new ThemeEngine();

// Export types
export type { Theme, ColorScheme, ColorPalette, TypographySystem, SpacingSystem, AnimationTiming, AnimationPresets };