/**
 * Integration tests for design system core functionality
 */

import { themeEngine, Colors, typography, spacing, animationTiming } from '../../design-system';

describe('Design System Integration', () => {
  it('should provide consistent theme values', () => {
    const theme = themeEngine.getTheme();
    
    expect(theme.colors).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.spacing).toBeDefined();
    expect(theme.animations).toBeDefined();
  });

  it('should switch between light and dark modes', () => {
    themeEngine.setMode('light');
    const lightTheme = themeEngine.getTheme();
    
    themeEngine.setMode('dark');
    const darkTheme = themeEngine.getTheme();
    
    expect(lightTheme.colors.background).toBe('#FFFFFF');
    expect(darkTheme.colors.background).toBe('#15202B');
    expect(lightTheme.colors.primary).toBe(darkTheme.colors.primary); // Primary should be same
  });

  it('should maintain consistent typography across modes', () => {
    themeEngine.setMode('light');
    const lightTypography = themeEngine.getTypography();
    
    themeEngine.setMode('dark');
    const darkTypography = themeEngine.getTypography();
    
    expect(lightTypography.h1.fontSize).toBe(darkTypography.h1.fontSize);
    expect(lightTypography.body.fontWeight).toBe(darkTypography.body.fontWeight);
  });

  it('should provide correct spacing values', () => {
    const spacingSystem = themeEngine.getSpacing();
    
    expect(spacingSystem.xs).toBe(4);
    expect(spacingSystem.sm).toBe(8);
    expect(spacingSystem.md).toBe(16);
    expect(spacingSystem.lg).toBe(24);
  });

  it('should provide correct animation timing', () => {
    const timing = themeEngine.getAnimationTiming();
    
    expect(timing.quick).toBe(200);
    expect(timing.medium).toBe(300);
    expect(timing.slow).toBe(500);
  });

  it('should integrate with legacy theme constants', () => {
    // Test that design system colors are accessible
    const designSystemColors = themeEngine.getColors();
    
    expect(designSystemColors.primary).toBe('#1DA1F2'); // Twitter blue
    expect(designSystemColors.background).toBeDefined();
    expect(designSystemColors.text).toBeDefined();
  });
});