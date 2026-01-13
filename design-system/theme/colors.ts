/**
 * Twitter-inspired color palette for light and dark modes
 * Based on design specifications with #1DA1F2 as primary color
 */

export interface ColorPalette {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export const lightColors: ColorPalette = {
  primary: '#1DA1F2',        // Twitter Blue
  background: '#FFFFFF',     // Pure White
  surface: '#F7F9FA',        // Light Gray
  text: '#14171A',           // Near Black
  textSecondary: '#657786',  // Medium Gray
  border: '#E1E8ED',         // Light Border
  error: '#E0245E',          // Red
  success: '#17BF63',        // Green
  warning: '#FFAD1F',        // Orange
  info: '#1DA1F2',           // Same as primary
};

export const darkColors: ColorPalette = {
  primary: '#1DA1F2',        // Twitter Blue
  background: '#15202B',     // Dark Blue
  surface: '#192734',        // Darker Blue
  text: '#FFFFFF',           // Pure White
  textSecondary: '#8B98A5',  // Light Gray
  border: '#38444D',         // Dark Border
  error: '#F91880',          // Bright Red
  success: '#00BA7C',        // Bright Green
  warning: '#FFAD1F',        // Orange
  info: '#1DA1F2',           // Same as primary
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

export type ColorScheme = 'light' | 'dark';