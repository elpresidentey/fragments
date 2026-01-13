import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FragmentsLogo } from '@/components/fragments-logo';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

// Mock hooks
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

describe('FragmentsLogo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders logo with text by default', () => {
    const { getByText } = render(<FragmentsLogo />);
    expect(getByText('FRAGMENTS')).toBeTruthy();
  });

  it('renders logo without text when showText is false', () => {
    const { queryByText } = render(<FragmentsLogo showText={false} />);
    expect(queryByText('FRAGMENTS')).toBeNull();
  });

  it('renders different sizes correctly', () => {
    const { rerender, getByText } = render(<FragmentsLogo size="small" />);
    let logoText = getByText('FRAGMENTS');
    expect(logoText.props.style).toMatchObject({
      fontSize: 16,
      fontWeight: '700',
    });

    rerender(<FragmentsLogo size="medium" />);
    logoText = getByText('FRAGMENTS');
    expect(logoText.props.style).toMatchObject({
      fontSize: 20,
      fontWeight: '800',
    });

    rerender(<FragmentsLogo size="large" />);
    logoText = getByText('FRAGMENTS');
    expect(logoText.props.style).toMatchObject({
      fontSize: 24,
      fontWeight: '900',
    });
  });

  it('calls onPress when provided', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<FragmentsLogo onPress={mockOnPress} />);
    
    fireEvent.press(getByText('FRAGMENTS'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('navigates to home by default when pressed', () => {
    const { router } = require('expo-router');
    const { getByText } = render(<FragmentsLogo />);
    
    fireEvent.press(getByText('FRAGMENTS'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/');
  });
});