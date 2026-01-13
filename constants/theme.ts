/**
 * Legacy theme constants - now integrated with the new design system
 * Maintained for backward compatibility while transitioning to Twitter-like UI
 */

import { Platform } from 'react-native';
import { Colors as DesignSystemColors } from '../design-system';

// Legacy colors for backward compatibility
const tintColorLight = '#1DA1F2'; // Updated to Twitter blue
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: DesignSystemColors.light.text,
    background: DesignSystemColors.light.background,
    tint: DesignSystemColors.light.primary,
    icon: DesignSystemColors.light.textSecondary,
    tabIconDefault: DesignSystemColors.light.textSecondary,
    tabIconSelected: DesignSystemColors.light.primary,
  },
  dark: {
    text: DesignSystemColors.dark.text,
    background: DesignSystemColors.dark.background,
    tint: DesignSystemColors.dark.primary,
    icon: DesignSystemColors.dark.textSecondary,
    tabIconDefault: DesignSystemColors.dark.textSecondary,
    tabIconSelected: DesignSystemColors.dark.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
