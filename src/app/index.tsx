import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabeledNumberInput } from '@/components/labeled-number-input';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { scheduleSessionNotifications } from '@/lib/session-notifications';
import { prepareTimerEndSound } from '@/lib/timer-end-sound';
import { getSuggestedWarningTime } from '@/lib/warning-time';

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

    const suggestedTime = getSuggestedWarningTime(duration);
    if (suggestedTime !== '') {
      setWarningTime(suggestedTime);
    }
  }

  async function startSession() {
    if (duration === '' || isStarting) return;

    setIsStarting(true);
    const deadline = Date.now() + Number(duration) * 60_000;
    prepareTimerEndSound();
    router.push({
      pathname: '/timer',
      params: { deadline: String(deadline), warningTime },
    });

    const warningDeadline = warningTime ? deadline - Number(warningTime) * 60_000 : undefined;
    void scheduleSessionNotifications(deadline, warningDeadline).catch((error) => {
      console.warn('Could not schedule the session end notification.', error);
    });
    setIsStarting(false);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText style={styles.title} type="subtitle">
          CCI Session-Timer
        </ThemedText>
        <ThemedText style={styles.timeHint} type="small">
          All times in minutes
        </ThemedText>
        <LabeledNumberInput
          label="Session duration"
          onChangeText={handleDurationChange}
          onSubmitEditing={startSession}
          placeholder="1–99"
          value={duration}
        />
        <LabeledNumberInput
          label="Warning time before end"
          disabled={duration === ''}
          editable={duration !== ''}
          onChangeText={handleWarningTimeChange}
          onFocus={prefillWarningTime}
          onSubmitEditing={startSession}
          placeholder={
            duration === '' ? '1–99' : Number(duration) > 1 ? `1–${Number(duration) - 1}` : '—'
          }
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
        <Link
          href="https://co-counselling.info"
          rel="noopener noreferrer"
          style={[styles.footer, { color: theme.text }]}
          target="_blank">
          More information on CCI (Co-Counselling International) ↗
        </Link>
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
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.two,
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
  footer: {
    marginTop: 'auto',
    paddingBottom: Spacing.two,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  title: {
    marginBottom: Spacing.two,
  },
  timeHint: {
    alignSelf: 'stretch',
    textAlign: 'right',
  },
});
