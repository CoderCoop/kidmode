# Native setup

This repository contains the complete JS/TS application and the hand-written
native modules, but not a full generated `android/`+`ios/` app shell (those are
large, machine-generated, and best created locally so tool versions match). This
guide wires the modules into a fresh scaffold.

## 0. Scaffold once

```bash
# From a temp dir, generate a shell with the SAME name ("kidmode")
npx @react-native-community/cli@latest init kidmode --version 0.76.5
```

Copy the generated `android/` and `ios/` folders into this repo (they are
git-ignored where appropriate), then re-run `npm install` here so the JS deps in
`package.json` win. Install the native pods:

```bash
cd ios && pod install && cd ..
```

The three gesture/animation libs need their standard one-time wiring:

- **react-native-reanimated** — already added as the last Babel plugin in
  `babel.config.js`.
- **react-native-gesture-handler** — already imported first in `index.js`; `App`
  is wrapped in `GestureHandlerRootView`.
- **react-native-safe-area-context** — auto-linked.

---

## Android

### 1. Add the Kiosk module to the build

The Kotlin sources live at
`android/app/src/main/java/com/kidmode/kiosk/`. They use package
`com.kidmode`, matching an app scaffolded with that id. If your applicationId
differs, move the files and update the `package` line accordingly.

### 2. Register the package

In `MainApplication.kt`, add the package to `getPackages()`:

```kotlin
import com.kidmode.kiosk.KioskPackage

override fun getPackages(): List<ReactPackage> =
  PackageList(this).packages.apply {
    add(KioskPackage())
  }
```

### 3. Manifest

In `android/app/src/main/AndroidManifest.xml`, declare the device-admin receiver
(needed only for the strongest Device-Owner tier) inside `<application>`:

```xml
<receiver
    android:name="com.kidmode.kiosk.KioskDeviceAdminReceiver"
    android:permission="android.permission.BIND_DEVICE_ADMIN"
    android:exported="true">
  <meta-data
      android:name="android.app.device_admin"
      android:resource="@xml/device_admin" />
  <intent-filter>
    <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
  </intent-filter>
</receiver>
```

`res/xml/device_admin.xml` is already included in this repo.

### 4. (Optional) provision Device Owner for true kiosk mode

On a **factory-reset device with no accounts**:

```bash
adb shell dpm set-device-owner com.kidmode/.kiosk.KioskDeviceAdminReceiver
```

Without this, the app uses ordinary screen pinning (a one-time confirmation, and
the user can leave with a Back+Overview long-press — which is why the JS Back
trap and immersive re-assert stay active).

### 5. Keep the activity single-task

In the manifest's main `<activity>`, ensure:

```xml
android:launchMode="singleTask"
```

so relaunches return to the pinned task instead of stacking.

---

## iOS

### 1. Add the module to the target

Add `ios/KidMode/Kiosk/Kiosk.swift` and `Kiosk.m` to the app target in Xcode
(or they compile automatically if placed inside the target's source group). When
Xcode offers to create a **bridging header**, accept — `Kiosk.m` needs to see the
React headers, and the Swift class is exported via `RCT_EXTERN_MODULE`.

### 2. Home indicator & edge gestures

To hide the Home indicator and defer edge swipes while playing, override these in
the root view controller (e.g. subclass or extend the VC created in
`AppDelegate`):

```swift
override var prefersHomeIndicatorAutoHidden: Bool { true }
override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }
override var prefersStatusBarHidden: Bool { true }
```

`preferredScreenEdgesDeferringSystemGestures` makes the OS require a second swipe
to act on edge gestures — a meaningful speed bump for small hands. True
suppression still comes from Guided Access / Single App Mode.

### 3. Guided Access / Single App Mode

- **Unmanaged devices:** the parent turns on Guided Access once
  (Settings ▸ Accessibility ▸ Guided Access), then triple-clicks the side button
  to start a session. The app detects this via
  `UIAccessibility.isGuidedAccessEnabled` and reports `mode: "guided-access"`.
- **Supervised devices (MDM/Apple Configurator):** whitelist this bundle id for
  *Autonomous Single App Mode*. Then `enterKiosk()` locks the device to the app
  automatically with no user interaction (`mode: "single-app"`).

If neither is available, `enterKiosk()` resolves `active:false, mode:"soft"` and
the UI shows a `soft-lock` hint; the JS immersive guards remain in effect.

---

## Verifying the wiring

After building to a device:

```ts
import {kioskManager} from './src/kiosk';
kioskManager.getCapabilities().then(console.log);
// Android device owner -> { canPinScreen:true, isDeviceOwner:true, ... }
// plain Android          -> { canPinScreen:true, isDeviceOwner:false, ... }
// iOS                    -> { canPinScreen:true, canSuppressNotifications:true, ... }
```

If you see the soft-fallback warning in Metro, the native module is not linked —
recheck the package registration (Android) or target membership (iOS).
