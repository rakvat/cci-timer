import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { isDndBypassGranted, openDndBypassSettings } from '../../../modules/dnd-bypass';
import { GONG_SOUND_FILENAME } from '@/constants/audio';

const SESSION_CHANNEL_ID = 'session-timer-events';

let configuring: Promise<void> | undefined;
let permissionRequest: Promise<void> | undefined;
let schedulingNotifications: Promise<void> | undefined;
let scheduledNotificationIds: string[] = [];
let dndBypassPrompt: Promise<void> | undefined;

export function requestSessionNotificationPermissions(): Promise<void> {
  permissionRequest ??= (async () => {
    await ensureConfigured();
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') await Notifications.requestPermissionsAsync();
  })();
  return permissionRequest;
}

export async function hasSessionNotificationPermissions(): Promise<boolean> {
  await requestSessionNotificationPermissions();
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Opens the Do Not Disturb access settings once per app run, if not granted yet.
 * The returned promise resolves once the prompt flow has been initiated
 * (or immediately when no prompt is needed).
 */
export function requestDndBypassAccess(): Promise<void> {
  dndBypassPrompt ??= (async () => {
    if (Platform.OS !== 'android' || isDndBypassGranted()) return;
    if (await hasSessionNotificationPermissions()) openDndBypassSettings();
  })().catch(() => undefined);
  return dndBypassPrompt;
}

/** Resolves once the Do Not Disturb prompt flow has been initiated (once per app run). */
export function dndBypassPromptSettled(): Promise<void> {
  return requestDndBypassAccess();
}

export async function canBypassDoNotDisturb(): Promise<boolean> {
  return Platform.OS === 'android' ? isDndBypassGranted() : true;
}

export function openDoNotDisturbAccessSettings(): void {
  if (Platform.OS === 'android') openDndBypassSettings();
}

export function scheduleSessionNotifications(
  deadline: number,
  warningDeadline?: number,
): Promise<void> {
  const previous = schedulingNotifications;
  const current = (async () => {
    await previous?.catch(() => undefined);
    await cancelScheduled();
    await schedule(deadline, warningDeadline);
  })();
  schedulingNotifications = current;
  void current
    .finally(() => {
      if (schedulingNotifications === current) schedulingNotifications = undefined;
    })
    .catch(() => undefined);
  return current;
}

export async function cancelSessionNotifications(): Promise<void> {
  await schedulingNotifications?.catch(() => undefined);
  await cancelScheduled();
}

async function cancelScheduled(): Promise<void> {
  const ids = scheduledNotificationIds;
  scheduledNotificationIds = [];
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

async function schedule(deadline: number, warningDeadline?: number): Promise<void> {
  await ensureConfigured();
  await permissionRequest;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(SESSION_CHANNEL_ID, {
      name: 'Session timer',
      importance: Notifications.AndroidImportance.HIGH,
      sound: GONG_SOUND_FILENAME,
      enableVibrate: false,
      bypassDnd: isDndBypassGranted(),
    });
  }

  const notifications = [
    { at: warningDeadline, title: 'Warning time', body: 'Your session is nearing its end.' },
    { at: deadline, title: 'Session over', body: 'Your session time is up.' },
  ];

  const ids: string[] = [];
  try {
    for (const { at, title, body } of notifications) {
      if (at === undefined || at <= Date.now()) continue;
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content: { title, body, sound: GONG_SOUND_FILENAME },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(at),
            ...(Platform.OS === 'android' ? { channelId: SESSION_CHANNEL_ID } : {}),
          },
        }),
      );
    }
    scheduledNotificationIds = ids;
  } catch (error) {
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    throw error;
  }
}

function ensureConfigured(): Promise<void> {
  configuring ??= (async () => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  })().catch((error) => {
    configuring = undefined;
    throw error;
  });
  return configuring;
}
