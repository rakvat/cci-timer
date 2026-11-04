import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { endSession } from '@/lib/session';
import { getRemainingSeconds, getSessionTimerConfig } from '@/lib/session-timer';
import { playTimerSound } from '@/lib/timer-sound';

export function useSessionTimer(deadlineParam?: string, warningDeadlineParam?: string) {
  const { deadline, hasValidDeadline, hasWarningTime, warningDeadline } = getSessionTimerConfig(
    deadlineParam,
    warningDeadlineParam,
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
        playTimerSound();
      }

      const seconds = getRemainingSeconds(deadline);
      setRemainingSeconds(seconds);
      if (seconds === 0) {
        if (!hasPlayedEndSound.current) {
          hasPlayedEndSound.current = true;
          playTimerSound();
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
      endSession();
    };
  }, [deadline, hasValidDeadline, hasWarningTime, warningDeadline]);

  return { hasValidDeadline, remainingSeconds };
}
