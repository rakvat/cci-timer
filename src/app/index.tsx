import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const [duration, setDuration] = useState('');
  const theme = useTheme();

  function handleDurationChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    if (digits === '' || Number(digits) >= 1) {
      setDuration(digits);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="default">Session duration (minutes)</ThemedText>
        <TextInput
          accessibilityLabel="Session duration (minutes)"
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={handleDurationChange}
          placeholder="1–99"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="done"
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          value={duration}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
  },
});
