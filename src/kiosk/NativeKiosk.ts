import {NativeModules, Platform} from 'react-native';
import type {KioskNativeModule} from './types';

/**
 * Resolves the native Kiosk module.
 *
 * The module is written by hand (Kotlin on Android, Swift on iOS) and registered
 * under the name `Kiosk`. When it is missing — for example on an unsupported
 * platform, in Storybook, or before the native code has been rebuilt — we fall
 * back to a soft implementation so the JS bundle never crashes on import. The
 * soft module reports `canPinScreen: false`, and the React layer degrades to
 * JS-only guards (immersive UI + back-button trapping).
 */

const LINKING_ERROR =
  "The native 'Kiosk' module is not linked. This is expected in a JS-only " +
  'environment (tests, web) and on platforms without a native build. ' +
  'Rebuild the app (npx react-native run-android / run-ios) to enable true ' +
  'device lockdown.';

function createSoftModule(): KioskNativeModule {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  let active = false;
  return {
    async enterKiosk() {
      active = true;
      return {active: true, platform, mode: 'soft'};
    },
    async exitKiosk() {
      active = false;
      return {active: false, platform, mode: 'soft'};
    },
    async isKioskActive() {
      return active;
    },
    async getCapabilities() {
      return {
        platform,
        canPinScreen: false,
        canSuppressNotifications: false,
        isDeviceOwner: false,
      };
    },
    addListener() {},
    removeListeners() {},
  };
}

const native = (NativeModules as {Kiosk?: KioskNativeModule}).Kiosk;

if (!native && __DEV__) {
  console.warn(LINKING_ERROR);
}

const NativeKiosk: KioskNativeModule = native ?? createSoftModule();

/** True when a real native module is present (vs. the soft fallback). */
export const hasNativeKiosk = Boolean(native);

export default NativeKiosk;
