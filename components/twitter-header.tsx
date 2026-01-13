import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { TwitterIcon } from '@/components/twitter-icon';
import { FragmentsLogo } from '@/components/fragments-logo';
import { Colors } from '@/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface TwitterHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  backgroundColor?: string;
  titleColor?: string;
  badge?: number;
  testID?: string;
}

/**
 * Twitter-style header component with consistent styling and animations
 */
export function TwitterHeader({
  title,
  showBackButton = false,
  showLogo = true,
  rightComponent,
  onBackPress,
  backgroundColor,
  titleColor,
  badge,
  testID,
}: TwitterHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const backButtonScale = useSharedValue(1);

  const handleBackPress = () => {
    // Animate button press
    backButtonScale.value = withSpring(0.9, { duration: 150 }, () => {
      backButtonScale.value = withSpring(1, { duration: 150 });
    });

    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const backButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: backButtonScale.value }],
    };
  });

  const headerHeight = 56;
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor || colors.background,
          paddingTop: statusBarHeight,
          height: headerHeight + statusBarHeight,
        }
      ]}
      testID={testID}
    >
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBackButton ? (
            <AnimatedTouchableOpacity
              style={[styles.backButton, backButtonAnimatedStyle]}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <TwitterIcon 
                name="home" // Using home as back arrow placeholder
                size={20} 
                color={colors.text} 
              />
            </AnimatedTouchableOpacity>
          ) : showLogo ? (
            <FragmentsLogo size="small" />
          ) : null}
        </View>

        {/* Center Section */}
        <View style={styles.centerSection}>
          {title && (
            <ThemedText 
              style={[
                styles.title,
                { color: titleColor || colors.text }
              ]}
              numberOfLines={1}
            >
              {title}
            </ThemedText>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightComponent}
          {badge && badge > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <ThemedText style={styles.badgeText}>
                {badge > 99 ? '99+' : badge.toString()}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Bottom border */}
      <View style={[styles.border, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftSection: {
    width: 120, // Increased width to accommodate logo
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 60,
    alignItems: 'flex-end',
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  border: {
    height: 1,
    width: '100%',
  },
});