// This native module registers itself under the native name "Kiosk" and is
// consumed by the app through `NativeModules.Kiosk` (see
// `src/kiosk/NativeKiosk.ts` in the app). No JS surface is exported here; this
// entry point exists only so the package resolves cleanly and React Native
// autolinking (Android settings plugin + iOS `use_native_modules!`) discovers
// the native code in ./android and ./ios.
module.exports = {};
