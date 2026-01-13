import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';

interface FragmentsLogoProps {
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showText?: boolean;
}

/**
 * Fragments app logo component
 */
export function FragmentsLogo({ 
  size = 'medium', 
  onPress,
  showText = true 
}: FragmentsLogoProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default behavior: navigate to home
      router.push('/(tabs)/');
    }
  };

  const sizeStyles = {
    small: {
      fontSize: 16,
      fontWeight: '700' as const,
    },
    medium: {
      fontSize: 20,
      fontWeight: '800' as const,
    },
    large: {
      fontSize: 24,
      fontWeight: '900' as const,
    },
  };

  const logoStyle = sizeStyles[size];

  const LogoContent = () => (
    <View style={styles.logoContainer}>
      {/* Geometric logo symbol */}
      <View style={[styles.logoSymbol, { borderColor: colors.primary }]}>
        <View style={[styles.fragment1, { backgroundColor: colors.primary }]} />
        <View style={[styles.fragment2, { backgroundColor: colors.primary }]} />
        <View style={[styles.fragment3, { backgroundColor: colors.primary }]} />
      </View>
      
      {/* Logo text */}
      {showText && (
        <ThemedText 
          style={[
            styles.logoText,
            {
              fontSize: logoStyle.fontSize,
              fontWeight: logoStyle.fontWeight,
              color: colors.text,
            }
          ]}
        >
          FRAGMENTS
        </ThemedText>
      )}
    </View>
  );

  if (onPress || true) { // Always make it touchable for navigation
    return (
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <LogoContent />
      </TouchableOpacity>
    );
  }

  return <LogoContent />;
}

const styles = StyleSheet.create({
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoSymbol: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fragment1: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 1,
    top: 2,
    left: 2,
  },
  fragment2: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 1,
    top: 2,
    right: 2,
  },
  fragment3: {
    position: 'absolute',
    width: 8,
    height: 4,
    borderRadius: 1,
    bottom: 2,
    left: 2,
  },
  logoText: {
    letterSpacing: 0.5,
  },
});