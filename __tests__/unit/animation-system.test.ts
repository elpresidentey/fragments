/**
 * Animation System Tests
 * Tests the animation framework and micro-interactions
 */

import { animationTiming, animationPresets } from '../../design-system/theme/animations';
import { timingFunctions, easingFunctions } from '../../design-system/utils/animation-utils';

describe('Animation System', () => {
  describe('Animation Timing', () => {
    it('should have correct timing values', () => {
      expect(animationTiming.quick).toBe(200);
      expect(animationTiming.medium).toBe(300);
      expect(animationTiming.slow).toBe(500);
    });

    it('should provide timing functions', () => {
      expect(timingFunctions.quick).toBe(200);
      expect(timingFunctions.medium).toBe(300);
      expect(timingFunctions.slow).toBe(500);
      expect(timingFunctions.instant).toBe(0);
    });
  });

  describe('Animation Presets', () => {
    it('should have button press preset', () => {
      expect(animationPresets.buttonPress).toBeDefined();
      expect(animationPresets.buttonPress.scale).toBe(0.95);
      expect(animationPresets.buttonPress.duration).toBe(150);
      expect(animationPresets.buttonPress.easing).toBe('ease-out');
    });

    it('should have like button preset', () => {
      expect(animationPresets.likeButton).toBeDefined();
      expect(animationPresets.likeButton.scale).toEqual([1, 1.2, 1]);
      expect(animationPresets.likeButton.duration).toBe(300);
      expect(animationPresets.likeButton.easing).toBe('spring');
    });

    it('should have slide in preset', () => {
      expect(animationPresets.slideIn).toBeDefined();
      expect(animationPresets.slideIn.translateX).toEqual([100, 0]);
      expect(animationPresets.slideIn.opacity).toEqual([0, 1]);
      expect(animationPresets.slideIn.duration).toBe(300);
      expect(animationPresets.slideIn.easing).toBe('ease-out');
    });

    it('should have fade in preset', () => {
      expect(animationPresets.fadeIn).toBeDefined();
      expect(animationPresets.fadeIn.opacity).toEqual([0, 1]);
      expect(animationPresets.fadeIn.duration).toBe(200);
      expect(animationPresets.fadeIn.easing).toBe('ease-out');
    });
  });

  describe('Easing Functions', () => {
    it('should provide easing functions', () => {
      expect(typeof easingFunctions.easeIn).toBe('function');
      expect(typeof easingFunctions.easeOut).toBe('function');
      expect(typeof easingFunctions.easeInOut).toBe('function');
      expect(typeof easingFunctions.linear).toBe('function');
    });

    it('should calculate easing correctly', () => {
      expect(easingFunctions.linear(0.5)).toBe(0.5);
      expect(easingFunctions.easeIn(0)).toBe(0);
      expect(easingFunctions.easeIn(1)).toBe(1);
      expect(easingFunctions.easeOut(0)).toBe(0);
      expect(easingFunctions.easeOut(1)).toBe(1);
    });
  });
});