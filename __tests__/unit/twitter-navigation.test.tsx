import React from 'react';
import { render } from '@testing-library/react-native';
import { TwitterIcon } from '@/components/twitter-icon';
import { TwitterHeader } from '@/components/twitter-header';

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('@/design-system', () => ({
  Colors: {
    light: {
      primary: '#1DA1F2',
      background: '#FFFFFF',
      surface: '#F7F9FA',
      text: '#14171A',
      textSecondary: '#657786',
      border: '#E1E8ED',
      error: '#E0245E',
    },
    dark: {
      primary: '#1DA1F2',
      background: '#15202B',
      surface: '#192734',
      text: '#FFFFFF',
      textSecondary: '#8B98A5',
      border: '#38444D',
      error: '#F91880',
    },
  },
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

describe('Twitter Navigation Components', () => {
  describe('TwitterIcon', () => {
    it('should render home icon correctly', () => {
      const { getByTestId } = render(
        <TwitterIcon name="home" size={24} color="#1DA1F2" testID="home-icon" />
      );
      
      expect(getByTestId('home-icon')).toBeTruthy();
    });

    it('should render search icon correctly', () => {
      const { getByTestId } = render(
        <TwitterIcon name="search" size={24} color="#1DA1F2" testID="search-icon" />
      );
      
      expect(getByTestId('search-icon')).toBeTruthy();
    });

    it('should render compose icon correctly', () => {
      const { getByTestId } = render(
        <TwitterIcon name="compose" size={24} color="#FFFFFF" testID="compose-icon" />
      );
      
      expect(getByTestId('compose-icon')).toBeTruthy();
    });

    it('should handle filled state correctly', () => {
      const { getByTestId } = render(
        <TwitterIcon name="home" size={24} color="#1DA1F2" filled={true} testID="filled-icon" />
      );
      
      expect(getByTestId('filled-icon')).toBeTruthy();
    });
  });

  describe('TwitterHeader', () => {
    it('should render header with title', () => {
      const { getByText } = render(
        <TwitterHeader title="Home" />
      );
      
      expect(getByText('Home')).toBeTruthy();
    });

    it('should render header with back button when showBackButton is true', () => {
      const { getByTestId } = render(
        <TwitterHeader title="Profile" showBackButton testID="header-with-back" />
      );
      
      expect(getByTestId('header-with-back')).toBeTruthy();
    });

    it('should render header with right component', () => {
      const rightComponent = <TwitterIcon name="profile" size={20} color="#1DA1F2" testID="right-icon" />;
      
      const { getByTestId } = render(
        <TwitterHeader title="Settings" rightComponent={rightComponent} />
      );
      
      expect(getByTestId('right-icon')).toBeTruthy();
    });

    it('should display badge when provided', () => {
      const { getByText } = render(
        <TwitterHeader title="Notifications" badge={5} />
      );
      
      expect(getByText('5')).toBeTruthy();
    });

    it('should display 99+ for badges over 99', () => {
      const { getByText } = render(
        <TwitterHeader title="Notifications" badge={150} />
      );
      
      expect(getByText('99+')).toBeTruthy();
    });
  });
});