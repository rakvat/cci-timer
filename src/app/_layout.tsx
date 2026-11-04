import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { prepareSessions } from '@/lib/session';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    prepareSessions();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
