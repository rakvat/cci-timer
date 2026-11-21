import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

type DndBypassNativeModule = {
  isNotificationPolicyAccessGranted(): boolean;
  openNotificationPolicySettings(): void;
  canScheduleExactAlarms(): boolean;
};

const nativeModule =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<DndBypassNativeModule>('DndBypass')
    : null;

/**
 * Whether the app is allowed to bypass Do Not Disturb on its notification
 * channels. Always true on platforms without Do Not Disturb.
 */
export function isDndBypassGranted(): boolean {
  return nativeModule ? nativeModule.isNotificationPolicyAccessGranted() : true;
}

/** Opens the system screen where the user grants Do Not Disturb access. */
export function openDndBypassSettings(): void {
  nativeModule?.openNotificationPolicySettings();
}

/**
 * Whether the app may schedule exact alarms (Android 12+).
 * Always true on platforms without the restriction.
 */
export function canScheduleExactAlarms(): boolean {
  if (Platform.OS !== 'android') return true;
  return nativeModule?.canScheduleExactAlarms() ?? true;
}
