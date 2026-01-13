import 'react-native-url-polyfill/auto';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/auth-context';
import { ErrorProvider } from '@/contexts/error-context';
import { ToastProvider } from '@/contexts/toast-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { ToastContainer } from '@/components/toast-container';
import { parsePasswordResetDeepLink, generateResetPasswordParams, logDeepLinkEvent } from '@/lib/utils/deep-link-utils';
import { setupFontLoadingPrevention } from '@/lib/utils/font-utils';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Setup font loading prevention to avoid timeout errors
  useEffect(() => {
    setupFontLoadingPrevention();
  }, []);

  // Enhanced deep link handling for password reset
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      logDeepLinkEvent('received', { url });
      
      try {
        // Parse the deep link using our utility
        const parsedLink = parsePasswordResetDeepLink(url);
        
        if (!parsedLink.isPasswordReset) {
          logDeepLinkEvent('ignored', { url, reason: 'Not a password reset link' });
          return;
        }
        
        logDeepLinkEvent('parsed', {
          url,
          isValid: parsedLink.isValid,
          hasTokens: !!(parsedLink.params.accessToken && parsedLink.params.refreshToken),
          hasError: !!parsedLink.params.error
        });
        
        // Generate navigation parameters
        const navParams = generateResetPasswordParams(parsedLink);
        
        // Navigate to reset password screen with parsed parameters
        router.push({
          pathname: '/(auth)/reset-password',
          params: navParams
        });
        
        logDeepLinkEvent('navigated', { params: navParams });
        
      } catch (error) {
        console.error('Error handling deep link:', error);
        logDeepLinkEvent('error', { url, error: error instanceof Error ? error.message : 'Unknown error' });
        
        // Fallback: if URL parsing fails but it looks like a reset link, navigate anyway
        if (url.includes('reset-password') || url.includes('type=recovery')) {
          router.push({
            pathname: '/(auth)/reset-password',
            params: { 
              error: 'parse_error',
              errorDescription: 'Unable to parse the reset link properly'
            }
          });
        }
      }
    };

    // Handle initial URL when app is opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        logDeepLinkEvent('initial_url', { url });
        handleDeepLink(url);
      }
    });

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      logDeepLinkEvent('url_event', { url: event.url });
      handleDeepLink(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ErrorProvider>
        <ToastProvider>
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style="auto" />
              <ToastContainer />
            </ThemeProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}
