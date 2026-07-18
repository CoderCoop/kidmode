# Baby Mode 🍼

A secure, interactive full-screen **sandbox for children ages 0–5**, built with
**React Native + TypeScript**. It locks the device into a single app (Android
screen pinning / iOS Guided Access), hides the OS, and exposes only a resilient,
multi-touch play canvas with pluggable activities. A parent-only gate — four
corner taps followed by a randomized PIN pad — is the sole way out.

> **Status:** build-ready. Complete JS/TS app + full native projects
> (`android/`, `ios/`) with the Kiosk native code packaged as a local,
> autolinked module (`modules/react-native-kiosk/`). CI produces installable
> app packages on every push — see [Builds](#builds).

---

## Why it exists

Hand a toddler a phone and within seconds they have dialled a contact, deleted an
app, or bought something. Baby Mode turns the device into a dumb, delightful
light-and-sound toy that a child physically **cannot** escape, while giving the
grown-up a reliable, deliberate way back out.

## The four pillars

| Requirement | Where it lives | How it works |
|---|---|---|
| **Device lockdown (kiosk)** | `src/kiosk/`, `android/**/kiosk`, `ios/**/Kiosk` | Native bridges call Android `startLockTask` (Device Owner → no-confirmation kiosk + notification suppression) and iOS `requestGuidedAccessSession` / Guided Access. JS adds a hardware-Back trap + immersive mode as a second line of defence. |
| **Parental gate exit** | `src/parentalGate/` | Multi-finger long-press *opens* the gate → tap 4 corners clockwise (timed, ordered) → **randomized** PIN pad. Each barrier targets a skill a toddler lacks. |
| **Resilient interactive canvas** | `src/canvas/` | A `Gesture.Manual` touch observer feeds every pointer into a **fixed animated object pool**. Mashing = cheap shared-value writes on the UI thread, never React re-renders or GC churn. |
| **Modular activities** | `src/activities/` | A registry of pluggable, forwardRef modules (`ripples`, `pop`, `sounds`). Add one file + one registry entry — the shell adapts automatically. |

## Architecture at a glance

```
App.tsx
└─ GestureHandlerRootView
   └─ SafeAreaProvider
      └─ KioskProvider ............ enters lockdown on mount, owns lock state
         └─ Sandbox ............... the shell
            ├─ InteractiveCanvas .. multi-touch observer -> activity.spawn()
            │  └─ <Activity/> ..... Ripple | Pop | Soundboard (animated pool)
            ├─ ActivitySwitcher ... in-sandbox module picker
            └─ ParentalGate ....... corners -> randomized PIN -> unlock()
```

Full write-up: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Getting started

```bash
npm install

# Type-check, lint, and run the unit tests (no device needed)
npm run typecheck
npm run lint
npm test
```

To run on a device/emulator (native projects are already in the repo):

```bash
npm run android   # or: npm run ios  (macOS: bundle exec pod install first)
```

## Builds

CI (`.github/workflows/build.yml`) type-checks, lints, and tests, then builds
**packaged apps** as downloadable artifacts on every push/PR:

| Artifact | Job | What it is |
|---|---|---|
| `babymode-android-apk` | ubuntu | debug-signed **release APK** (`adb install`) |
| `babymode-ios-simulator-app` | macOS | unsigned **Simulator `.app`** (a signed `.ipa` needs Apple certs) |

Build locally: `cd android && ./gradlew assembleRelease`. See
[`docs/NATIVE_SETUP.md`](docs/NATIVE_SETUP.md) for tooling, the module layout,
and the strongest-lockdown provisioning steps (Android Device Owner / iOS
supervised Single App Mode).

## Key source files

- `src/kiosk/KioskManager.ts` — lockdown lifecycle + Back-button trap + AppState reconciliation.
- `src/kiosk/NativeKiosk.ts` — native module resolver with a safe soft fallback.
- `src/parentalGate/useCornerSequence.ts` — ordered/timed corner-tap logic.
- `src/parentalGate/randomizedPad.ts` — per-open PIN shuffle.
- `src/canvas/useAnimatedPool.ts` — the allocation-free effect pool.
- `src/canvas/InteractiveCanvas.tsx` — the multi-touch surface.
- `src/activities/registry.ts` — the single extension point for new modules.

## Security & safety notes

- **Android:** provisioning the app as **Device Owner** yields true kiosk mode
  (no escape confirmation, notifications suppressed). Without it, standard screen
  pinning is used and the JS guards do the rest.
- **iOS:** apps *cannot* silently force Guided Access. Autonomous Single App Mode
  works on **supervised** devices; otherwise the parent enables Guided Access
  once and the app detects/uses it. The module reports its real capability via
  `getCapabilities()` and the UI shows a `soft-lock` hint when lockdown is
  best-effort.
- The PIN lives in memory/config only. For production, source it from secure
  storage (Keychain / Keystore) — see `ParentalGateConfig`.

## License

MIT
