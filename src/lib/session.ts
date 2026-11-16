import {
  canBypassDoNotDisturb,
  cancelSessionNotifications,
  dndBypassPromptSettled as dndPromptSettled,
  getSessionNotificationPermissions,
  openDoNotDisturbAccessSettings,
  requestDndBypassAccess,
  requestSessionNotificationPermissions,
  scheduleSessionNotifications,
} from '@/services/notifications/session-notifications';
import { getDeadline, getWarningDeadline } from '@/lib/session-timer';
import { prepareTimerSound } from '@/services/audio/timer-sound';

export type Session = {
  deadline: number;
  warningDeadline?: number;
};

let notificationPermissions: Promise<boolean> | undefined;

function checkNotificationPermissions(): Promise<boolean> {
  notificationPermissions ??= getSessionNotificationPermissions().catch((error) => {
    console.warn('Could not check notification permissions.', error);
    return true;
  });
  return notificationPermissions;
}

/** Call once at app start to warm the notification status check. */
export function prepareSessions(): void {
  void checkNotificationPermissions();
}

export function areSessionNotificationsPermitted(): Promise<boolean> {
  return checkNotificationPermissions();
}

/** Whether notification or Do Not Disturb access still needs to be granted (Android). */
export function needsSessionOnboarding(): Promise<boolean> {
  return Promise.all([checkNotificationPermissions(), canBypassDoNotDisturb()]).then(
    ([notifications, dnd]) => !notifications || !dnd,
  );
}

/** Triggers the system permission prompts; call from a user gesture. */
export async function completeSessionOnboarding(): Promise<void> {
  await requestSessionNotificationPermissions();
  notificationPermissions = undefined;
  await requestDndBypassAccess();
}

export function dndBypassPromptSettled(): Promise<void> {
  return dndPromptSettled();
}

export function canSessionNotificationsBypassDnd(): Promise<boolean> {
  return canBypassDoNotDisturb();
}

export function openSessionDndBypassSettings(): void {
  openDoNotDisturbAccessSettings();
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
