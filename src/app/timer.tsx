import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { GONG_SOUND, playTimerEndSound } from '@/lib/timer-end-sound';

function KeepAwakeWhileActive() {
  useKeepAwake();
  return null;
}

export default function TimerScreen() {
  const theme = useTheme();
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
  const [remainingLabelWidth, setRemainingLabelWidth] = useState<number>();

  function measureRemainingLabel(event: LayoutChangeEvent) {
    setRemainingLabelWidth(event.nativeEvent.layout.width);
  }

  const playNativeTimerEndSound = useCallback(() => {
    void audioPlayer.seekTo(0).then(() => audioPlayer.play());
  }, [audioPlayer]);

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
        playTimerEndSound(playNativeTimerEndSound);
      }

      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) {
        if (!hasPlayedEndSound.current) {
          hasPlayedEndSound.current = true;
          playTimerEndSound(playNativeTimerEndSound);
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
  }, [audioPlayer, deadline, hasValidDeadline, hasWarningTime, playNativeTimerEndSound, warningDeadline]);

  if (!hasValidDeadline) return <Redirect href="/" />;

  return (
    <ThemedView style={styles.container}>
      {remainingSeconds > 0 && <KeepAwakeWhileActive />}
      <SafeAreaView style={styles.content}>
        <ThemedText type="title" style={styles.minutes}>
          {remainingSeconds <= 60 ? remainingSeconds : Math.ceil(remainingSeconds / 60)}
        </ThemedText>
        <ThemedText
          onLayout={measureRemainingLabel}
          type="default"
          themeColor="textSecondary">
          {remainingSeconds <= 60 ? 'seconds remaining' : 'minutes remaining'}
        </ThemedText>
        {remainingSeconds === 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.newSessionButton,
              remainingLabelWidth !== undefined && { width: remainingLabelWidth },
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressedButton,
            ]}>
            <ThemedText type="default">New Session</ThemedText>
          </Pressable>
        )}
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
  newSessionButton: {
    position: 'absolute',
    top: '70%',
    alignSelf: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
  },
  pressedButton: {
    opacity: 0.7,
  },
});
