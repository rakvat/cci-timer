import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LabeledNumberInput } from '@/components/labeled-number-input';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionInput } from '@/hooks/use-session-input';
import { areSessionNotificationsPermitted, startSession } from '@/lib/session';
import { MAX_MINUTES } from '@/lib/session-timer';

const MINUTES_MAX_LENGTH = String(MAX_MINUTES).length;

export default function HomeScreen() {
  const theme = useTheme();
  const {
    input,
    canStart,
    maxWarningMinutes,
    handleDurationChange,
    handleWarningChange,
    fillSuggestedWarning,
  } = useSessionInput();
  const { durationMinutes, warningMinutes } = input;
  const [notificationsPermitted, setNotificationsPermitted] = useState<boolean>();

  useEffect(() => {
    let active = true;
    areSessionNotificationsPermitted()
      .then((permitted) => {
        if (active) setNotificationsPermitted(permitted);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

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
        <ThemedView style={styles.topSpacer} />
        <ThemedView style={styles.mainSection}>
          <ThemedText style={styles.timeHint} type="small">
            All times in minutes
          </ThemedText>
          <LabeledNumberInput
            label="Session duration"
            maxLength={MINUTES_MAX_LENGTH}
            onChangeText={handleDurationChange}
            onSubmitEditing={handleStart}
            placeholder={`1–${MAX_MINUTES}`}
            value={durationMinutes}
          />
          <LabeledNumberInput
            label="Warning time before end"
            maxLength={MINUTES_MAX_LENGTH}
            disabled={!canStart}
            onChangeText={handleWarningChange}
            onFocus={fillSuggestedWarning}
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
        <ThemedView style={styles.footer}>
          {notificationsPermitted === false && (
            <ThemedText type="small" themeColor="warning" style={styles.warningText}>
              You won&apos;t get any notifications for the warning time or when the session
              ends, because notification permissions were denied.
            </ThemedText>
          )}
          <Link
            href="https://co-counselling.info"
            rel="noopener noreferrer"
            style={[styles.footerLink, { color: theme.text }]}
            target="_blank">
            More information on CCI (Co-Counselling International) ↗
          </Link>
        </ThemedView>
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
  topSpacer: {
    flex: 1,
  },
  mainSection: {
    flex: 4,
    width: '100%',
    maxWidth: 345,
    alignSelf: 'center',
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
    alignItems: 'center',
    gap: Spacing.two,
  },
  footerLink: {
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  warningText: {
    textAlign: 'center',
  },
  title: {
    marginBottom: Spacing.two,
  },
  timeHint: {
    alignSelf: 'stretch',
    textAlign: 'right',
  },
});
