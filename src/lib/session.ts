import {
  cancelSessionNotifications,
  requestSessionNotificationPermissions,
  scheduleSessionNotifications,
} from '@/lib/session-notifications';
import { getDeadline, getWarningDeadline } from '@/lib/session-timer';
import { prepareTimerSound } from '@/lib/timer-sound';

export type Session = {
  deadline: number;
  warningDeadline?: number;
};

/** Call once at app start so permission prompts don't interrupt the first session. */
export function prepareSessions(): void {
  void requestSessionNotificationPermissions().catch((error) => {
    console.warn('Could not request notification permissions.', error);
  });
}

/** Must be called from a user gesture so web audio can be unlocked. */
export function startSession(durationMinutes: string, warningMinutes: string): Session {
  prepareTimerSound();

  const deadline = getDeadline(durationMinutes);
  const warningDeadline = getWarningDeadline(deadline, warningMinutes);

  void scheduleSessionNotifications(deadline, warningDeadline).catch((error) => {
    console.warn('Could not schedule the session notifications.', error);
  });

  return { deadline, warningDeadline };
}

export function endSession(): void {
  void cancelSessionNotifications().catch((error) => {
    console.warn('Could not cancel the session notifications.', error);
  });
}
