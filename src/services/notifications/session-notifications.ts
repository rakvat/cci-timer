import { Platform } from 'react-native';
import notifee, {
  AlarmType,
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';
import {
  canScheduleExactAlarms,
  isDndBypassGranted,
  openDndBypassSettings,
} from '../../../modules/dnd-bypass';
import { GONG_SOUND_FILENAME } from '@/constants/audio';

const SESSION_CHANNEL_ID = 'session-timer-events';
const NOTIFICATION_SOUND_RESOURCE = GONG_SOUND_FILENAME.replace(/\.wav$/i, '');

let channelReady: Promise<void> | undefined;
let permissionRequest: Promise<void> | undefined;
let schedulingNotifications: Promise<void> | undefined;
let scheduledNotificationIds: string[] = [];
let dndBypassPrompt: Promise<void> | undefined;

export function requestSessionNotificationPermissions(): Promise<void> {
  permissionRequest ??= (async () => {
    await ensureChannel();
    await notifee.requestPermission();
  })();
  return permissionRequest;
}

/** Returns whether notifications are permitted without triggering the system prompt. */
export async function getSessionNotificationPermissions(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
}

export async function hasSessionNotificationPermissions(): Promise<boolean> {
  await requestSessionNotificationPermissions();
  return getSessionNotificationPermissions();
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

/** Resolves once the Do Not Disturb prompt flow has been initiated, if it was. */
export function dndBypassPromptSettled(): Promise<void> {
  return dndBypassPrompt ?? Promise.resolve();
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
  await Promise.all(ids.map((id) => notifee.cancelTriggerNotification(id)));
}

async function schedule(deadline: number, warningDeadline?: number): Promise<void> {
  await ensureChannel();
  await permissionRequest;

  const settings = await notifee.getNotificationSettings();
  if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) return;

  const notifications = [
    { at: warningDeadline, title: 'Warning time', body: 'Your session is nearing its end.' },
    { at: deadline, title: 'Session over', body: 'Your session time is up.' },
  ];

  const ids: string[] = [];
  try {
    for (const { at, title, body } of notifications) {
      if (at === undefined || at <= Date.now()) continue;
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: at,
        ...(Platform.OS === 'android'
          ? {
              alarmManager: {
                type: canScheduleExactAlarms()
                  ? AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE
                  : AlarmType.SET_AND_ALLOW_WHILE_IDLE,
              },
            }
          : {}),
      };
      ids.push(
        await notifee.createTriggerNotification(
          {
            title,
            body,
            android: {
              channelId: SESSION_CHANNEL_ID,
              smallIcon: 'notification_icon',
              pressAction: { id: 'default' },
            },
            ios: { sound: GONG_SOUND_FILENAME },
          },
          trigger,
        ),
      );
    }
    scheduledNotificationIds = ids;
  } catch (error) {
    await Promise.all(ids.map((id) => notifee.cancelTriggerNotification(id)));
    throw error;
  }
}

function ensureChannel(): Promise<void> {
  channelReady ??= (async () => {
    if (Platform.OS !== 'android') return;
    await notifee.createChannel({
      id: SESSION_CHANNEL_ID,
      name: 'Session timer',
      importance: AndroidImportance.HIGH,
      sound: NOTIFICATION_SOUND_RESOURCE,
      vibration: false,
      bypassDnd: isDndBypassGranted(),
    });
  })().catch((error) => {
    channelReady = undefined;
    throw error;
  });
  return channelReady;
}
