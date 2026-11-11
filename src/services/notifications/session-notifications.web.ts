// Scheduled notifications are not supported on web; the timer screen plays the sound instead.

export async function requestSessionNotificationPermissions(): Promise<void> {}

export async function hasSessionNotificationPermissions(): Promise<boolean> {
  return true;
}

export function requestDndBypassAccess(): void {}

export async function canBypassDoNotDisturb(): Promise<boolean> {
  return true;
}

export function openDoNotDisturbAccessSettings(): void {}

export async function scheduleSessionNotifications(
  _deadline: number,
  _warningDeadline?: number,
): Promise<void> {}

export async function cancelSessionNotifications(): Promise<void> {}
