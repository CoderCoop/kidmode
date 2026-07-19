/**
 * Shared kiosk types used by both the JS bridge and the React layer.
 */

export type KioskPlatform = 'android' | 'ios' | 'test';

/**
 * Why the lockdown state changed. `system` means the OS toggled it out from
 * under us (e.g. the parent triple-clicked to leave Guided Access, or Android
 * dropped lock-task because the app is not device owner). We surface this so the
 * UI can react instead of assuming the app is always the source of truth.
 */
export type KioskChangeReason =
  | 'entered'
  | 'exited'
  | 'system'
  | 'denied'
  | 'unavailable';

export interface KioskStatus {
  active: boolean;
  platform: KioskPlatform;
  /**
   * A coarse descriptor of how strong the lockdown actually is on this device:
   *  - 'device-owner'  : Android, provisioned as device owner -> true kiosk.
   *  - 'lock-task'     : Android screen pinning w/ user confirmation.
   *  - 'single-app'    : iOS supervised Single App Mode (autonomous).
   *  - 'guided-access' : iOS Guided Access is active (user enabled it).
   *  - 'soft'          : No native lockdown available; JS-only guards only.
   *  - 'mock'          : Test environment.
   */
  mode:
    | 'device-owner'
    | 'lock-task'
    | 'single-app'
    | 'guided-access'
    | 'soft'
    | 'mock';
}

export interface KioskCapabilities {
  platform: KioskPlatform;
  /** Native screen pinning / lock-task / single-app mode is available. */
  canPinScreen: boolean;
  /** OS-level notification suppression is available (needs device owner on Android). */
  canSuppressNotifications: boolean;
  /** Android only: app is provisioned as Device Owner (strongest lockdown). */
  isDeviceOwner: boolean;
}

export interface KioskChangeEvent {
  active: boolean;
  reason: KioskChangeReason;
}

/** The surface the native module must implement. */
export interface KioskNativeModule {
  enterKiosk(): Promise<KioskStatus>;
  exitKiosk(): Promise<KioskStatus>;
  isKioskActive(): Promise<boolean>;
  getCapabilities(): Promise<KioskCapabilities>;
  // NativeEventEmitter bookkeeping (required so RN does not warn).
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export const KIOSK_EVENT = 'KidModeKioskChanged';
