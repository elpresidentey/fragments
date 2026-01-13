/**
 * Spacing system for consistent layout and padding
 * Based on 8px base unit for Twitter-like interface
 */

export interface SpacingSystem {
  xs: number;   // 4px - Tight spacing
  sm: number;   // 8px - Small spacing
  md: number;   // 16px - Medium spacing (base unit)
  lg: number;   // 24px - Large spacing
  xl: number;   // 32px - Extra large spacing
  xxl: number;  // 48px - Extra extra large spacing
}

export const spacing: SpacingSystem = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export type SpacingKey = keyof SpacingSystem;