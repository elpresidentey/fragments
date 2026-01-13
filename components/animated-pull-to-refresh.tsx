/**
 * Animated Pull-to-Refresh Component
 * Provides smooth pull-to-refresh animation with spring physics
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView, ScrollViewProps } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS,
  useAnimatedScrollHandler
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export interface AnimatedPullToRefreshProps extends Omit<ScrollViewProps, 'refreshControl'> {
  onRefresh?: () => void;
  refreshing?: boolean;
  threshold?: number;
  children: React.ReactNode;
}

export function AnimatedPullToRefresh({
  onRefresh,
  refreshing = false,
  threshold = 80,
  children,
  ...props
}: AnimatedPullToRefreshProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const refreshIndicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scrollY.value <= 0 && event.translationY > 0) {
        const progress = Math.min(event.translationY / threshold, 1.5);
        
        translateY.value = event.translationY * 0.5;
        rotation.value = progress * 180;
        scale.value = 1 + (progress * 0.3);
        opacity.value = Math.min(progress, 1);
      }
    })
    .onEnd((event) => {
      const shouldRefresh = event.translationY >= threshold && scrollY.value <= 0;
      
      if (shouldRefresh && onRefresh && !refreshing) {
        runOnJS(onRefresh)();
      }
      
      // Spring back animation
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 300,
      });
      rotation.value = withSpring(shouldRefresh ? 360 : 0, {
        damping: 15,
        stiffness: 300,
      });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
      opacity.value = withSpring(0, {
        damping: 15,
        stiffness: 300,
      });
    });

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return (
    <View style={styles.container}>
      {/* Custom refresh indicator */}
      <Animated.View style={[styles.refreshIndicator, refreshIndicatorStyle]}>
        <View style={[styles.refreshIcon, { backgroundColor: colors.tint }]} />
      </Animated.View>
      
      <GestureDetector gesture={panGesture}>
        <AnimatedScrollView
          {...props}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
              progressBackgroundColor={colors.background}
            />
          }
        >
          {children}
        </AnimatedScrollView>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  refreshIndicator: {
    position: 'absolute',
    top: -40,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 30,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});