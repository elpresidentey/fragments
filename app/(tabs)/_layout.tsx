import { Tabs } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { HapticTab } from '@/components/haptic-tab';
import { TwitterIcon } from '../../components/twitter-icon';
import { Colors } from '@/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/design-system/hooks/use-accessibility';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { getAccessibilityProps, announceForAccessibility, isReduceMotionEnabled } = useAccessibility();
  
  // Animation values for floating compose button
  const composeScale = useSharedValue(1);
  const composeRotation = useSharedValue(0);

  const handleComposePress = () => {
    // Announce navigation for screen readers
    announceForAccessibility('Opening compose screen');
    
    // Only animate if reduce motion is not enabled
    if (!isReduceMotionEnabled) {
      // Animate button press
      composeScale.value = withSpring(0.9, { duration: 150 }, () => {
        composeScale.value = withSpring(1, { duration: 150 });
      });
      
      // Rotate animation
      composeRotation.value = withTiming(composeRotation.value + 180, { duration: 300 });
    }
    
    // Navigate to create screen
    router.push('/(tabs)/create');
  };

  const composeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: composeScale.value },
        { rotate: `${composeRotation.value}deg` }
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 60,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}>
        
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TwitterIcon 
                name="home" 
                size={24} 
                color={color} 
                filled={focused}
              />
            ),
            tabBarAccessibilityLabel: 'Home tab',
            tabBarButton: (props) => (
              <HapticTab 
                {...props} 
                {...getAccessibilityProps({
                  label: 'Home tab',
                  hint: 'View your home timeline',
                  role: 'button',
                  state: { selected: props.accessibilityState?.selected },
                })}
              />
            ),
          }}
        />
        
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <TwitterIcon 
                name="search" 
                size={24} 
                color={color} 
                filled={focused}
              />
            ),
            tabBarAccessibilityLabel: 'Search tab',
            tabBarButton: (props) => (
              <HapticTab 
                {...props} 
                {...getAccessibilityProps({
                  label: 'Search tab',
                  hint: 'Search for posts and users',
                  role: 'button',
                  state: { selected: props.accessibilityState?.selected },
                })}
              />
            ),
          }}
        />
        
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TwitterIcon 
                name="profile" 
                size={24} 
                color={color} 
                filled={focused}
              />
            ),
            tabBarAccessibilityLabel: 'Profile tab',
            tabBarButton: (props) => (
              <HapticTab 
                {...props} 
                {...getAccessibilityProps({
                  label: 'Profile tab',
                  hint: 'View your profile',
                  role: 'button',
                  state: { selected: props.accessibilityState?.selected },
                })}
              />
            ),
          }}
        />
        
        {/* Hidden create tab - we'll use floating button instead */}
        <Tabs.Screen
          name="create"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>

      {/* Floating Compose Button */}
      <AnimatedTouchableOpacity
        style={[
          styles.floatingButton,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
          composeAnimatedStyle,
        ]}
        onPress={handleComposePress}
        activeOpacity={0.8}
        {...getAccessibilityProps({
          label: 'Compose new post',
          hint: 'Double tap to create a new post',
          role: 'button',
        })}
      >
        <TwitterIcon name="compose" size={24} color="#FFFFFF" />
      </AnimatedTouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
});
