import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabeledNumberInput } from '@/components/labeled-number-input';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { startSession } from '@/lib/session';
import {
  applyDurationText,
  applyWarningText,
  canStartSession,
  EMPTY_SESSION_INPUT,
  getMaxWarningMinutes,
  MAX_MINUTES,
  withSuggestedWarning,
} from '@/lib/session-timer';

const MINUTES_MAX_LENGTH = String(MAX_MINUTES).length;

export default function HomeScreen() {
  const [input, setInput] = useState(EMPTY_SESSION_INPUT);
  const { durationMinutes, warningMinutes } = input;
  const canStart = canStartSession(input);
  const maxWarningMinutes = getMaxWarningMinutes(durationMinutes);
  const theme = useTheme();

  function handleStart() {
    if (!canStart) return;

    const { deadline, warningDeadline } = startSession(durationMinutes, warningMinutes);
    router.push({
      pathname: '/timer',
      params: { deadline: String(deadline), warningDeadline },
    });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText style={styles.title} type="subtitle">
          CCI Session-Timer
        </ThemedText>
        <ThemedView style={styles.mainSection}>
          <ThemedText style={styles.timeHint} type="small">
            All times in minutes
          </ThemedText>
          <LabeledNumberInput
            label="Session duration"
            maxLength={MINUTES_MAX_LENGTH}
            onChangeText={(text) => setInput((current) => applyDurationText(current, text))}
            onSubmitEditing={handleStart}
            placeholder={`1–${MAX_MINUTES}`}
            value={durationMinutes}
          />
          <LabeledNumberInput
            label="Warning time before end"
            maxLength={MINUTES_MAX_LENGTH}
            disabled={!canStart}
            onChangeText={(text) => setInput((current) => applyWarningText(current, text))}
            onFocus={() => setInput(withSuggestedWarning)}
            onSubmitEditing={handleStart}
            placeholder={maxWarningMinutes >= 1 ? `1–${maxWarningMinutes}` : '—'}
            value={warningMinutes}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!canStart}
            onPress={handleStart}
            style={({ pressed }) => [
              styles.startButton,
              { backgroundColor: theme.backgroundElement },
              !canStart && styles.disabledButton,
              pressed && canStart && styles.pressedButton,
            ]}>
            <ThemedText type="default">Start</ThemedText>
          </Pressable>
        </ThemedView>
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
  mainSection: {
    flex: 1,
    width: '100%',
    maxWidth: 345,
    alignSelf: 'center',
    gap: Spacing.two,
    paddingTop: '25%',
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
