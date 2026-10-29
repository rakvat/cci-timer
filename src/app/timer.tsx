import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useState } from 'react';
import { Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSessionTimer } from '@/hooks/use-session-timer';
import { useTheme } from '@/hooks/use-theme';

function KeepAwakeWhileActive() {
  useKeepAwake();
  return null;
}

export default function TimerScreen() {
  const theme = useTheme();
  const { deadline: deadlineParam, warningTime: warningTimeParam } =
    useLocalSearchParams<{ deadline?: string; warningTime?: string }>();
  const { hasValidDeadline, remainingSeconds } = useSessionTimer(deadlineParam, warningTimeParam);
  const [remainingLabelWidth, setRemainingLabelWidth] = useState<number>();

  function measureRemainingLabel(event: LayoutChangeEvent) {
    setRemainingLabelWidth(event.nativeEvent.layout.width);
  }

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
