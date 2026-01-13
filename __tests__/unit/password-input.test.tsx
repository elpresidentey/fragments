import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PasswordInput } from '../../components/password-input';

// Mock AccessibilityInfo
const mockAnnounceForAccessibility = jest.fn();

// Mock only the specific module we need
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  announceForAccessibility: mockAnnounceForAccessibility,
}));

describe('PasswordInput Component', () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnnounceForAccessibility.mockClear();
  });

  it('renders correctly with basic props', () => {
    const { getByTestId, getByPlaceholderText } = render(
      <PasswordInput
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Enter password"
        testID="test-password-input"
      />
    );

    expect(getByTestId('test-password-input')).toBeTruthy();
    expect(getByPlaceholderText('Enter password')).toBeTruthy();
    expect(getByTestId('test-password-input-toggle')).toBeTruthy();
  });

  it('renders with label when provided', () => {
    const { getByText } = render(
      <PasswordInput
        value=""
        onChangeText={mockOnChangeText}
        label="Password"
      />
    );

    expect(getByText('Password')).toBeTruthy();
  });

  it('renders error message when error prop is provided', () => {
    const { getByText, getByTestId } = render(
      <PasswordInput
        value=""
        onChangeText={mockOnChangeText}
        error="Password is required"
        testID="test-password-input"
      />
    );

    expect(getByText('Password is required')).toBeTruthy();
    expect(getByTestId('test-password-input-error')).toBeTruthy();
  });

  it('toggles password visibility when toggle button is pressed', async () => {
    const { getByTestId } = render(
      <PasswordInput
        value="testpassword"
        onChangeText={mockOnChangeText}
        testID="test-password-input"
      />
    );

    const toggleButton = getByTestId('test-password-input-toggle');
    const textInput = getByTestId('test-password-input');

    // Initially password should be hidden (secureTextEntry = true)
    expect(textInput.props.secureTextEntry).toBe(true);

    // Press toggle button to show password
    fireEvent.press(toggleButton);

    await waitFor(() => {
      expect(textInput.props.secureTextEntry).toBe(false);
    });

    // Press toggle button again to hide password
    fireEvent.press(toggleButton);

    await waitFor(() => {
      expect(textInput.props.secureTextEntry).toBe(true);
    });
  });

  it('calls onChangeText when text is entered', () => {
    const { getByTestId } = render(
      <PasswordInput
        value=""
        onChangeText={mockOnChangeText}
        testID="test-password-input"
      />
    );

    const textInput = getByTestId('test-password-input');
    fireEvent.changeText(textInput, 'newpassword');

    expect(mockOnChangeText).toHaveBeenCalledWith('newpassword');
  });

  it('has proper accessibility labels and hints', () => {
    const { getByTestId } = render(
      <PasswordInput
        value=""
        onChangeText={mockOnChangeText}
        testID="test-password-input"
        accessibilityLabel="Custom password input"
      />
    );

    const textInput = getByTestId('test-password-input');
    const toggleButton = getByTestId('test-password-input-toggle');

    expect(textInput.props.accessibilityLabel).toBe('Custom password input');
    expect(textInput.props.accessibilityHint).toBe('Password is hidden');
    expect(toggleButton.props.accessibilityLabel).toBe('Show password');
    expect(toggleButton.props.accessibilityHint).toBe('Double tap to toggle password visibility');
  });

  it('auto-hides password on blur when autoHideOnBlur is true', async () => {
    const { getByTestId } = render(
      <PasswordInput
        value="testpassword"
        onChangeText={mockOnChangeText}
        autoHideOnBlur={true}
        testID="test-password-input"
      />
    );

    const toggleButton = getByTestId('test-password-input-toggle');
    const textInput = getByTestId('test-password-input');

    // Show password first
    fireEvent.press(toggleButton);
    await waitFor(() => {
      expect(textInput.props.secureTextEntry).toBe(false);
    });

    // Blur the input
    fireEvent(textInput, 'blur');

    await waitFor(() => {
      expect(textInput.props.secureTextEntry).toBe(true);
    });
  });

  it('does not auto-hide password on blur when autoHideOnBlur is false', async () => {
    const { getByTestId } = render(
      <PasswordInput
        value="testpassword"
        onChangeText={mockOnChangeText}
        autoHideOnBlur={false}
        testID="test-password-input"
      />
    );

    const toggleButton = getByTestId('test-password-input-toggle');
    const textInput = getByTestId('test-password-input');

    // Show password first
    fireEvent.press(toggleButton);
    await waitFor(() => {
      expect(textInput.props.secureTextEntry).toBe(false);
    });

    // Blur the input
    fireEvent(textInput, 'blur');

    // Password should remain visible
    expect(textInput.props.secureTextEntry).toBe(false);
  });
});