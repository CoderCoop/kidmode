# Native setup & builds

The repository is **build-ready**: it contains the full native app projects
(`android/`, `ios/`) plus the Kiosk native code packaged as a local, autolinked
React Native module under `modules/react-native-kiosk/`. You do **not** need to
edit `MainApplication`, the `Podfile`, or the Xcode `project.pbxproj` — React
Native autolinking wires the module into both platforms automatically:

- **Android** — autolinking generates `PackageList` with `new KioskPackage()`.
  Verified via `npx react-native config` → `packageInstance: "new KioskPackage()"`.
- **iOS** — `use_native_modules!` in the `Podfile` discovers
  `react-native-kiosk.podspec` and compiles `Kiosk.swift` + `Kiosk.m` into a pod.

The device-admin receiver and its `device_admin.xml` live in the module's own
`AndroidManifest.xml` / `res`, so they merge into the app manifest during the
build. No app-level manifest edits are required.

## CI builds (recommended) — `.github/workflows/build.yml`

Every push/PR runs three jobs:

1. **checks** — `typecheck` + `lint` + unit tests (fast gate).
2. **android** — installs the pinned NDK/CMake, runs `./gradlew assembleRelease`,
   and uploads **`babymode-android-apk`** (a debug-signed release APK you can
   `adb install`).
3. **ios** — `pod install` then an unsigned **iphonesimulator** build, uploading
   **`babymode-ios-simulator-app`** (a `.app` you can drag onto a running
   Simulator). A signed device `.ipa` requires Apple signing secrets, which this
   public workflow intentionally does not carry — add a signed
   `-exportArchive` step with your certs to produce one.

Download the artifacts from the run's summary page.

## Building locally

Prereqs: Node ≥18, JDK 17, Android SDK (+NDK 26.1.10909125, CMake 3.22.1) for
Android; macOS + Xcode 15 + CocoaPods for iOS.

```bash
npm install

# Android → app/build/outputs/apk/release/app-release.apk
(cd android && ./gradlew assembleRelease)

# iOS (simulator)
(cd ios && bundle install && bundle exec pod install)
npm run ios
```

## The Kiosk module

```
modules/react-native-kiosk/
├── package.json                     # name: react-native-kiosk (file: dep of the app)
├── react-native-kiosk.podspec       # iOS autolink entry
├── src/index.js                     # empty JS surface (native registers as "Kiosk")
├── android/
│   ├── build.gradle                 # com.android.library, inherits root versions
│   └── src/main/
│       ├── AndroidManifest.xml       # DeviceAdminReceiver (merged into app)
│       ├── java/com/babymode/kiosk/  # KioskModule / KioskPackage / KioskDeviceAdminReceiver
│       └── res/{xml,values}/         # device_admin.xml + strings
└── ios/
    ├── Kiosk.swift                   # RCTEventEmitter implementation
    └── Kiosk.m                       # RCT_EXTERN_MODULE bridge
```

The app consumes it through `src/kiosk/NativeKiosk.ts` via `NativeModules.Kiosk`
(the native module's registered name), with a soft fallback when it is absent.

## Strongest lockdown tiers (optional, deployment-time)

### Android — Device Owner

On a **factory-reset device with no accounts**:

```bash
adb shell dpm set-device-owner com.babymode/com.babymode.kiosk.KioskDeviceAdminReceiver
```

This unlocks no-confirmation screen pinning + notification/global-actions
suppression (`setLockTaskFeatures`). Without it, ordinary screen pinning is used
and the JS Back-trap + immersive re-assert remain the second line of defence.

### iOS — Guided Access / Single App Mode

- **Unmanaged device:** the parent enables Guided Access once
  (Settings ▸ Accessibility ▸ Guided Access) and triple-clicks to start a
  session; the app detects it (`mode: "guided-access"`).
- **Supervised device (MDM/Apple Configurator):** whitelist the bundle id for
  *Autonomous Single App Mode* and `enterKiosk()` locks automatically
  (`mode: "single-app"`).

To also hide the Home indicator and defer edge gestures during play, add these
overrides to the root view controller (see the RN docs for wiring on 0.76):

```swift
override var prefersHomeIndicatorAutoHidden: Bool { true }
override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }
override var prefersStatusBarHidden: Bool { true }
```
