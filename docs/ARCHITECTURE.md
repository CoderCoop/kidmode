# Architecture

Kid Mode is organised around four decoupled subsystems, each in its own folder
under `src/`. They communicate through narrow, typed contracts so any one can be
replaced without touching the others.

```
src/
├─ kiosk/          device lockdown (native bridge + lifecycle)
├─ parentalGate/   the exit gate (two-finger hold + randomized PIN)
├─ canvas/         the resilient multi-touch surface + animated pool
├─ activities/     pluggable play modules + registry
├─ shell/          the app shell that composes everything
├─ theme/          design tokens
└─ utils/          logging
```

## 1. Device lockdown (`src/kiosk`)

The JS layer never talks to the OS directly; it goes through `KioskManager`, a
process-level singleton that:

- delegates OS lockdown to a **native module** (`NativeKiosk`);
- installs a **hardware-Back trap** (`BackHandler`) so the app can't be popped;
- watches **`AppState`** and *reconciles* with native truth if the OS ever
  forces us out (parent leaving Guided Access, lock-task dropping);
- fans a single `active` boolean out to React via a tiny subscribe API.

`NativeKiosk.ts` resolves the real native module and, when it is absent (Jest,
web, un-rebuilt app), returns a **soft module** so the bundle never crashes on
import. `hasNativeKiosk` tells the UI whether lockdown is real or best-effort.

### Native tiers

| Platform | Strongest | Fallback |
|---|---|---|
| Android | Device Owner + `setLockTaskFeatures` (no confirmation, notifications off) | `startLockTask` screen pinning (+ JS Back-trap & immersive) |
| iOS | Autonomous Single App Mode (supervised devices) | user-enabled Guided Access, which the app detects & uses |

The native modules also emit `KidModeKioskChanged` so system-initiated changes
propagate back into JS.

## 2. Parental gate (`src/parentalGate`)

Two barriers, each keyed to a capability a 0–5 child lacks, deliberately kept
quick and forgiving for a distracted adult:

1. **Open** — a **two-finger press-and-hold** (`useGateTrigger`,
   `numberOfPointers`), composed *simultaneously* with the canvas so it never
   steals single-finger play touches. A `holdProgress` shared value drives a
   live "keep holding to exit" indicator (`HoldToExit`) so the parent gets
   immediate feedback that the hidden gesture is working.
2. **PIN** — a **randomized** pad (`shuffledDigits`) reshuffled on open and after
   every failure, defeating positional memory and requiring literacy.

**Recovery** — a "Forgot PIN?" affordance reveals a timed press-and-hold that
exits without the PIN (`recoveryHoldMs`). It stores no second secret, so it can
never be forgotten, yet is far too sustained for a toddler to stumble into. (In
production the device's own screen-pin / Guided-Access exit, gated by the phone
passcode, is the ultimate fallback.)

The gate renders in a top-level `Modal` and auto-dismisses on idle, returning a
child who somehow reaches it back to play.

## 3. Resilient canvas (`src/canvas`)

The performance contract is: **an arbitrary burst of simultaneous taps must never
lag, crash, or re-render the tree.** Two design choices deliver this:

- **Touch observation, not handling.** `InteractiveCanvas` uses a
  `Gesture.Manual` recognizer that *never activates*, so it coexists with every
  other gesture and just reports pointers. All `changedTouches` from one native
  event are marshalled to JS in a **single `runOnJS`** call — not one per finger.
- **A fixed animated object pool** (`useAnimatedPool`). N slots are mounted once;
  each spawn recycles the next slot round-robin and drives its `progress` shared
  value with `withTiming`. The per-frame animation runs on the **UI thread**;
  JS does O(1) shared-value writes per tap and **zero** React renders. Pool
  exhaustion silently recycles the oldest effect, so throughput is bounded.

Activities expose an imperative `ActivityHandle.spawn(tap)` — the canvas is
activity-agnostic.

## 4. Modular activities (`src/activities`)

Every activity is a `forwardRef` component exposing `ActivityHandle` plus an
`ActivityDefinition` (id, title, glyph, accent, component) in `registry.ts`.
The shell reads the registry to build the switcher and mount the active module —
so **adding an activity is one new file and one registry line.**

Shipped modules:

- **Ripples** — expanding high-contrast discs (pure animated pool).
- **Pop** — inflating shapes that burst, with throttled haptics.
- **Soundboard** — a pad grid; taps are mapped by coordinate (robust to mashing),
  flashing a pad and calling the pluggable `SoundEngine` seam (`playPad`).
- **Comets** — glowing heads flung along a seed-derived heading that drift and
  fade; the first module whose motion is entirely worklet-driven from `progress`.
- **Sparkles** — spinning four-point twinkles (two crossed bars) with a light,
  throttled haptic tick.

Audio is intentionally a seam (`setSoundEngine`) so the core stays asset-free;
haptics ship out of the box via the built-in `Vibration` API.

## Data & control flow of a single tap

```
finger down
  → Gesture.Manual.onTouchesDown (UI thread, worklet)
  → runOnJS(dispatch)([{id,x,y}, ...])          // one call per native event
  → activityHandle.spawn({id,x,y,seed,t})       // O(1), allocation-free
  → pool slot shared-values set + withTiming     // animation on UI thread
  → useAnimatedStyle renders frames (UI thread)  // no JS, no React render
```

## Testing

Logic and interaction are covered by Jest (`__tests__/`): the PIN shuffle/compare,
the gate flow (opens straight to the PIN pad, unlocks on the correct PIN, rejects
a wrong one, and the "Forgot PIN?" hold-to-exit fallback fires only after a full
hold), the activity registry, and the kiosk lifecycle against a mocked native
module. UI-thread animation code is intentionally thin and declarative so it
needs no device to reason about.
