import { Platform } from 'react-native';
import type { DateTriggerInput } from 'expo-notifications';

const SESSION_CHANNEL_ID = 'session-timer-events';
let notificationHandlerConfigured = false;
let scheduledNotificationIds: string[] = [];
let schedulingNotifications: Promise<void> | undefined;

export function scheduleSessionNotifications(
  deadline: number,
  warningDeadline?: number,
): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();

  schedulingNotifications = schedule(deadline, warningDeadline).finally(() => {
    schedulingNotifications = undefined;
  });
  return schedulingNotifications;
}

export async function cancelSessionNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  await schedulingNotifications;
  const Notifications = await import('expo-notifications');
  const ids = scheduledNotificationIds;
  scheduledNotificationIds = [];
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

async function schedule(deadline: number, warningDeadline?: number): Promise<void> {
  const Notifications = await import('expo-notifications');

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(SESSION_CHANNEL_ID, {
      name: 'Session timer',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'gong.wav',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return;

  const trigger = (timestamp: number): DateTriggerInput => ({
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(timestamp),
    ...(Platform.OS === 'android' ? { channelId: SESSION_CHANNEL_ID } : {}),
  });

  const ids: string[] = [];
  try {
    if (warningDeadline !== undefined && warningDeadline > Date.now()) {
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Warning time',
            body: 'Your session is nearing its end.',
            sound: 'gong.wav',
          },
          trigger: trigger(warningDeadline),
        }),
      );
    }
    if (deadline > Date.now()) {
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Session over',
            body: 'Your session time is up.',
            sound: 'gong.wav',
          },
          trigger: trigger(deadline),
        }),
      );
    }
    scheduledNotificationIds = ids;
  } catch (error) {
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    throw error;
  }
}
