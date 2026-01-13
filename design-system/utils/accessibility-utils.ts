/**
 * Accessibility utility functions
 * Provides color contrast validation, focus management, and accessibility helpers
 */

export interface ContrastRatio {
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
  isAccessible: boolean;
}

export interface FocusManagerOptions {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: string;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 guidelines
 */
function getRelativeLuminance(color: string): number {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Apply gamma correction
  const sRGB = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  // Calculate relative luminance
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio and accessibility level
 */
export function getContrastRatio(foreground: string, background: string): ContrastRatio {
  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  const ratio = (lighter + 0.05) / (darker + 0.05);
  
  let level: 'AA' | 'AAA' | 'fail';
  let isAccessible: boolean;
  
  if (ratio >= 7) {
    level = 'AAA';
    isAccessible = true;
  } else if (ratio >= 4.5) {
    level = 'AA';
    isAccessible = true;
  } else {
    level = 'fail';
    isAccessible = false;
  }
  
  return { ratio, level, isAccessible };
}

/**
 * Validate color palette for accessibility compliance
 */
export function validateColorPalette(colors: Record<string, string>): Record<string, ContrastRatio> {
  const results: Record<string, ContrastRatio> = {};
  
  // Common color combinations to check
  const combinations = [
    { name: 'text-on-background', fg: colors.text, bg: colors.background },
    { name: 'text-secondary-on-background', fg: colors.textSecondary, bg: colors.background },
    { name: 'primary-on-background', fg: colors.primary, bg: colors.background },
    { name: 'text-on-surface', fg: colors.text, bg: colors.surface },
    { name: 'error-on-background', fg: colors.error, bg: colors.background },
    { name: 'success-on-background', fg: colors.success, bg: colors.background },
  ];
  
  combinations.forEach(({ name, fg, bg }) => {
    if (fg && bg) {
      results[name] = getContrastRatio(fg, bg);
    }
  });
  
  return results;
}

/**
 * Get accessible color variant if contrast is insufficient
 */
export function getAccessibleColor(
  foreground: string, 
  background: string, 
  targetRatio: number = 4.5
): string {
  const currentRatio = getContrastRatio(foreground, background);
  
  if (currentRatio.ratio >= targetRatio) {
    return foreground;
  }
  
  // Simple approach: darken or lighten the foreground color
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);
  
  // If background is lighter, darken foreground; if darker, lighten foreground
  const shouldDarken = bgLuminance > 0.5;
  
  // For insufficient contrast, make a more dramatic adjustment
  let adjustedColor = foreground;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (getContrastRatio(adjustedColor, background).ratio < targetRatio && attempts < maxAttempts) {
    // Convert hex to RGB
    const hex = adjustedColor.replace('#', '');
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);
    
    // Adjust RGB values
    const adjustment = shouldDarken ? -30 : 30;
    r = Math.max(0, Math.min(255, r + adjustment));
    g = Math.max(0, Math.min(255, g + adjustment));
    b = Math.max(0, Math.min(255, b + adjustment));
    
    // Convert back to hex
    adjustedColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    attempts++;
  }
  
  return adjustedColor;
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusStack: string[] = [];
  private static trapContainer: string | null = null;
  
  static pushFocus(elementId: string) {
    this.focusStack.push(elementId);
  }
  
  static popFocus(): string | undefined {
    return this.focusStack.pop();
  }
  
  static restoreFocus() {
    const lastFocused = this.popFocus();
    if (lastFocused) {
      // In React Native, we would use ref.current?.focus()
      // This is a placeholder for the actual implementation
      console.log(`Restoring focus to: ${lastFocused}`);
    }
  }
  
  static trapFocus(containerId: string) {
    this.trapContainer = containerId;
  }
  
  static releaseFocusTrap() {
    this.trapContainer = null;
  }
  
  static isFocusTrapped(): boolean {
    return this.trapContainer !== null;
  }
}

/**
 * Generate accessibility announcement for content changes
 */
export function generateContentChangeAnnouncement(
  changeType: 'added' | 'removed' | 'updated' | 'loaded',
  itemType: 'post' | 'comment' | 'user' | 'page',
  count?: number
): string {
  const itemName = count && count > 1 ? `${itemType}s` : itemType;
  const countText = count && count > 1 ? `${count} ` : count === 1 ? '' : '';
  
  switch (changeType) {
    case 'added':
      return `${countText}new ${itemName} added`;
    case 'removed':
      return `${countText}${itemName} removed`;
    case 'updated':
      return `${countText}${itemName} updated`;
    case 'loaded':
      return `${countText}${itemName} loaded`;
    default:
      return `${itemName} changed`;
  }
}

/**
 * Create semantic accessibility label for complex UI elements
 */
export function createSemanticLabel(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(', ');
}

/**
 * Format numbers for screen readers
 */
export function formatNumberForScreenReader(num: number): string {
  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    if (remainder === 0) {
      return `${thousands} thousand`;
    } else {
      return `${thousands} thousand ${remainder}`;
    }
  } else {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    if (remainder === 0) {
      return `${millions} million`;
    } else {
      const thousands = Math.floor(remainder / 1000);
      return `${millions} million ${thousands} thousand`;
    }
  }
}