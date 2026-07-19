# Kid Mode 🍼

A secure, interactive full-screen **sandbox for children ages 0–5**, built with
**React Native + TypeScript**. It locks the device into a single app (Android
screen pinning / iOS Guided Access), hides the OS, and exposes only a resilient,
multi-touch play canvas with pluggable activities. A parent-only gate — four
corner taps followed by a randomized PIN pad — is the sole way out.

> **Status:** complete JS/TS application + hand-written native modules for both
> platforms. Drop the native modules into an app scaffold (see
> [`docs/NATIVE_SETUP.md`](docs/NATIVE_SETUP.md)) and run.

---

## Why it exists

Hand a toddler a phone and within seconds they have dialled a contact, deleted an
app, or bought something. Kid Mode turns the device into a dumb, delightful
light-and-sound toy that a child physically **cannot** escape, while giving the
grown-up a reliable, deliberate way back out.

## The four pillars

| Requirement | Where it lives | How it works |
|---|---|---|
| **Device lockdown (kiosk)** | `src/kiosk/`, `android/**/kiosk`, `ios/**/Kiosk` | Native bridges call Android `startLockTask` (Device Owner → no-confirmation kiosk + notification suppression) and iOS `requestGuidedAccessSession` / Guided Access. JS adds a hardware-Back trap + immersive mode as a second line of defence. |
| **Parental gate exit** | `src/parentalGate/` | Multi-finger long-press *opens* the gate → tap 4 corners clockwise (timed, ordered) → **randomized** PIN pad. Each barrier targets a skill a toddler lacks. |
| **Resilient interactive canvas** | `src/canvas/` | A `Gesture.Manual` touch observer feeds every pointer into a **fixed animated object pool**. Mashing = cheap shared-value writes on the UI thread, never React re-renders or GC churn. |
| **Modular activities** | `src/activities/` | A registry of pluggable, forwardRef modules (`ripples`, `pop`, `sounds`, `comet`, `sparkle`). Add one file + one registry entry — the shell adapts automatically. |

## Architecture at a glance

```
App.tsx
└─ GestureHandlerRootView
   └─ SafeAreaProvider
      └─ KioskProvider ............ enters lockdown on mount, owns lock state
         └─ Sandbox ............... the shell
            ├─ InteractiveCanvas .. multi-touch observer -> activity.spawn()
            │  └─ <Activity/> ..... Ripple | Pop | Soundboard | Comet | Sparkle (animated pool)
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

To run on a device/emulator you first need a native shell for the two source
folders — see [`docs/NATIVE_SETUP.md`](docs/NATIVE_SETUP.md). Then:

```bash
npm run android   # or: npm run ios
```

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
