import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { scheduleSessionEndNotification } from '@/lib/session-notifications';
import { prepareTimerEndSound } from '@/lib/timer-end-sound';

export default function HomeScreen() {
  const [duration, setDuration] = useState('');
  const [warningTime, setWarningTime] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const theme = useTheme();

  function handleDurationChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    if (digits === '' || Number(digits) >= 1) {
      setDuration(digits);
      if (digits === '' || (warningTime !== '' && Number(warningTime) >= Number(digits))) {
        setWarningTime('');
      }
    }
  }

  function handleWarningTimeChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    if (digits === '' || (Number(digits) >= 1 && Number(digits) < Number(duration))) {
      setWarningTime(digits);
    }
  }

  function prefillWarningTime() {
    if (warningTime !== '') return;

    const suggestedTime = Math.floor(Number(duration) / 10);
    if (suggestedTime > 0) {
      setWarningTime(String(suggestedTime));
    }
  }

  async function startSession() {
    if (duration === '' || isStarting) return;

    setIsStarting(true);
    const deadline = Date.now() + Number(duration) * 60_000;
    prepareTimerEndSound();
    router.push({ pathname: '/timer', params: { deadline: String(deadline) } });

    try {
      await scheduleSessionEndNotification(deadline);
    } catch (error) {
      console.warn('Could not schedule the session end notification.', error);
    } finally {
      setIsStarting(false);
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
        <ThemedText type="default">Warning time before end (minutes)</ThemedText>
        <TextInput
          accessibilityLabel="Warning time before end (minutes)"
          editable={duration !== ''}
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={handleWarningTimeChange}
          onFocus={prefillWarningTime}
          placeholder={
            duration === '' ? '1–99' : Number(duration) > 1 ? `1–${Number(duration) - 1}` : '—'
          }
          placeholderTextColor={theme.textSecondary}
          returnKeyType="done"
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.backgroundSelected },
            duration === '' && styles.disabledInput,
          ]}
          value={warningTime}
        />
        <Pressable
          accessibilityRole="button"
          disabled={duration === '' || isStarting}
          onPress={startSession}
          style={({ pressed }) => [
            styles.startButton,
            { backgroundColor: theme.backgroundElement },
            (duration === '' || isStarting) && styles.disabledButton,
            pressed && duration !== '' && !isStarting && styles.pressedButton,
          ]}>
          <ThemedText type="default">Start</ThemedText>
        </Pressable>
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
  disabledInput: {
    opacity: 0.5,
  },
  startButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
    marginTop: Spacing.two,
  },
  disabledButton: {
    opacity: 0.45,
  },
  pressedButton: {
    opacity: 0.7,
  },
});
