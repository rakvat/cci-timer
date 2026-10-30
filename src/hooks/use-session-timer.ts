import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { cancelSessionNotifications } from '@/lib/session-notifications';
import { playTimerEndSound } from '@/lib/timer-end-sound';
import { getRemainingSeconds, getSessionTimerConfig } from '@/lib/session-timer';

export function useSessionTimer(deadlineParam?: string, warningTimeParam?: string) {
  const { deadline, hasValidDeadline, hasWarningTime, warningDeadline } = getSessionTimerConfig(
    deadlineParam,
    warningTimeParam,
  );
  const hasPlayedWarningSound = useRef(false);
  const hasPlayedEndSound = useRef(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    hasValidDeadline ? getRemainingSeconds(deadline) : 0,
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
        if (Platform.OS === 'web') playTimerEndSound(() => undefined);
      }

      const seconds = getRemainingSeconds(deadline);
      setRemainingSeconds(seconds);
      if (seconds === 0) {
        if (!hasPlayedEndSound.current) {
          hasPlayedEndSound.current = true;
          if (Platform.OS === 'web') playTimerEndSound(() => undefined);
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
      void cancelSessionNotifications();
    };
  }, [deadline, hasValidDeadline, hasWarningTime, warningDeadline]);

  return { hasValidDeadline, remainingSeconds };
}
