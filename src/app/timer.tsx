import { Redirect, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GONG_SOUND, playTimerEndSound } from '@/lib/timer-end-sound';

export default function TimerScreen() {
  const audioPlayer = useAudioPlayer(Platform.OS === 'web' ? null : GONG_SOUND);
  const hasPlayedWarningSound = useRef(false);
  const hasPlayedEndSound = useRef(false);
  const { deadline: deadlineParam, warningTime: warningTimeParam } =
    useLocalSearchParams<{ deadline?: string; warningTime?: string }>();
  const deadline = Number(deadlineParam);
  const hasValidDeadline = Number.isFinite(deadline) && deadline > 0;
  const warningTime = Number(warningTimeParam);
  const hasWarningTime = Number.isFinite(warningTime) && warningTime > 0;
  const warningDeadline = deadline - warningTime * 60_000;
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    hasValidDeadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!hasValidDeadline) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    const updateRemainingTime = () => {
      if (
        hasWarningTime &&
        Date.now() >= warningDeadline &&
        !hasPlayedWarningSound.current
      ) {
        hasPlayedWarningSound.current = true;
        playTimerEndSound(() => audioPlayer.play());
      }

      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) {
        if (!hasPlayedEndSound.current) {
          hasPlayedEndSound.current = true;
          playTimerEndSound(() => audioPlayer.play());
        }
        if (interval !== undefined) clearInterval(interval);
      }
    };
    interval = setInterval(updateRemainingTime, 1000);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') updateRemainingTime();
    });

    updateRemainingTime();

    return () => {
      if (interval !== undefined) clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [audioPlayer, deadline, hasValidDeadline, hasWarningTime, warningDeadline]);

  if (!hasValidDeadline) return <Redirect href="/" />;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <ThemedText type="title" style={styles.minutes}>
          {remainingSeconds <= 60 ? remainingSeconds : Math.ceil(remainingSeconds / 60)}
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          {remainingSeconds <= 60 ? 'seconds remaining' : 'minutes remaining'}
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minutes: {
    fontSize: 120,
    lineHeight: 132,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
