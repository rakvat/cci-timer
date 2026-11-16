import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

type DndBypassNativeModule = {
  isNotificationPolicyAccessGranted(): boolean;
  openNotificationPolicySettings(): void;
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
