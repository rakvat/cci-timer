import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { requestSessionNotificationPermissions } from '@/lib/session-notifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void requestSessionNotificationPermissions().catch((error) => {
      console.warn('Could not request notification permissions.', error);
    });
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
