import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

export type TwitterIconName = 
  | 'home' 
  | 'search' 
  | 'compose' 
  | 'profile' 
  | 'like' 
  | 'retweet' 
  | 'comment' 
  | 'share'
  | 'notification';

interface TwitterIconProps {
  name: TwitterIconName;
  size?: number;
  color?: string;
  filled?: boolean;
  testID?: string;
}

/**
 * Twitter-style icon component that provides consistent iconography
 * across the app with proper filled/outlined states
 */
export function TwitterIcon({ 
  name, 
  size = 24, 
  color = '#000', 
  filled = false,
  testID
}: TwitterIconProps) {
  const getIconComponent = () => {
    switch (name) {
      case 'home':
        return (
          <Ionicons 
            name={filled ? 'home' : 'home-outline'} 
            size={size} 
            color={color} 
          />
        );
      
      case 'search':
        return (
          <Ionicons 
            name={filled ? 'search' : 'search-outline'} 
            size={size} 
            color={color} 
          />
        );
      
      case 'compose':
        return (
          <Feather 
            name="edit-3" 
            size={size} 
            color={color} 
          />
        );
      
      case 'profile':
        return (
          <Ionicons 
            name={filled ? 'person' : 'person-outline'} 
            size={size} 
            color={color} 
          />
        );
      
      case 'like':
        return (
          <Ionicons 
            name={filled ? 'heart' : 'heart-outline'} 
            size={size} 
            color={color} 
          />
        );
      
      case 'retweet':
        return (
          <Ionicons 
            name="repeat" 
            size={size} 
            color={color} 
          />
        );
      
      case 'comment':
        return (
          <Ionicons 
            name={filled ? 'chatbubble' : 'chatbubble-outline'} 
            size={size} 
            color={color} 
          />
        );
      
      case 'share':
        return (
          <Ionicons 
            name="share-outline" 
            size={size} 
            color={color} 
          />
        );
      
      case 'notification':
        return (
          <Ionicons 
            name={filled ? 'notifications' : 'notifications-outline'} 
            size={size} 
            color={color} 
          />
        );
      
      default:
        return (
          <MaterialIcons 
            name="help-outline" 
            size={size} 
            color={color} 
          />
        );
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]} testID={testID}>
      {getIconComponent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});