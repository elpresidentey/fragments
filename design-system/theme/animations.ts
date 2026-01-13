/**
 * Animation timing constants and presets
 * Based on design specifications for smooth interactions
 */

export interface AnimationTiming {
  quick: number;    // 200ms - Button presses, hover states
  medium: number;   // 300ms - Screen transitions, modal appearances
  slow: number;     // 500ms - Complex animations, loading states
}

export const animationTiming: AnimationTiming = {
  quick: 200,
  medium: 300,
  slow: 500,
};

export type EasingType = 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';

export interface AnimationPreset {
  duration: number;
  easing: EasingType;
  [key: string]: any;
}

export interface AnimationPresets {
  buttonPress: AnimationPreset;
  likeButton: AnimationPreset;
  slideIn: AnimationPreset;
  fadeIn: AnimationPreset;
}

export const animationPresets: AnimationPresets = {
  buttonPress: {
    scale: 0.95,
    duration: 150,
    easing: 'ease-out',
  },
  likeButton: {
    scale: [1, 1.2, 1],
    duration: 300,
    easing: 'spring',
  },
  slideIn: {
    translateX: [100, 0],
    opacity: [0, 1],
    duration: 300,
    easing: 'ease-out',
  },
  fadeIn: {
    opacity: [0, 1],
    duration: 200,
    easing: 'ease-out',
  },
};

export type AnimationPresetKey = keyof AnimationPresets;