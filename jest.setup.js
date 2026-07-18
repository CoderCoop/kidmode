/* eslint-disable no-undef */
// Jest setup: register gesture-handler and stub native modules that are not
// available inside the JS-only test environment.

require('react-native-gesture-handler/jestSetup');

// Reanimated ships a Jest mock that wires up the necessary globals.
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// The Kiosk native module does not exist under Jest, so provide a fake that
// mirrors the TurboModule surface the JS layer consumes.
jest.mock('./src/kiosk/NativeKiosk', () => {
  const listeners = new Set();
  const state = {active: false};
  return {
    __esModule: true,
    default: {
      enterKiosk: jest.fn(async () => {
        state.active = true;
        listeners.forEach(l => l({active: true, reason: 'entered'}));
        return {active: true, platform: 'test', mode: 'mock'};
      }),
      exitKiosk: jest.fn(async () => {
        state.active = false;
        listeners.forEach(l => l({active: false, reason: 'exited'}));
        return {active: false, platform: 'test', mode: 'mock'};
      }),
      isKioskActive: jest.fn(async () => state.active),
      getCapabilities: jest.fn(async () => ({
        canPinScreen: true,
        canSuppressNotifications: true,
        isDeviceOwner: false,
        platform: 'test',
      })),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
    __emit: event => listeners.forEach(l => l(event)),
    __subscribe: fn => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
});

// Silence the native animation warning noise in tests.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
  virtual: true,
});
