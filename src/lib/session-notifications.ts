import { Platform } from 'react-native';

const SESSION_CHANNEL_ID = 'session-timer-gong';
let notificationHandlerConfigured = false;

export async function scheduleSessionEndNotification(deadline: number): Promise<void> {
  if (Platform.OS === 'web') return;

  const Notifications = await import('expo-notifications');

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
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

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Session complete',
      body: 'Your session time is up.',
      sound: 'gong.wav',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(deadline),
      ...(Platform.OS === 'android' ? { channelId: SESSION_CHANNEL_ID } : {}),
    },
  });
}
