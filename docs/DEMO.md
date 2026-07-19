# Demo & walkthrough

Two ways to see Baby Mode in action:

- **Interactive browser demo** — [`demo/index.html`](../demo/index.html). A
  faithful, self-contained HTML re-creation of the app (no build step): open the
  file in any browser, or serve the folder and visit it. It simulates the locked
  play canvas, all three activities, and the full parental-gate exit flow. On a
  touchscreen you can mash with multiple fingers at once; the soundboard plays
  real tones via Web Audio.
- **The real app** — build and run on a device/emulator per
  [`NATIVE_SETUP.md`](NATIVE_SETUP.md), or grab a CI-built package (see the
  README's *Builds* section).

## Step-by-step

1. **Tap and mash the screen.** Every touch blooms a high-contrast ripple.
   Hammer it — the fixed animation pool keeps up without dropping frames.
2. **Switch activities** with the chips at the top:
   - 💧 **Ripples** — expanding, fading discs.
   - 🎈 **Pop** — chunky shapes that inflate and burst (with haptics on-device).
   - 🎹 **Sounds** — a 3×3 pad; taps anywhere map to a pad, flash it, and play a
     note.
3. **Try to leave.** There is no back or home affordance — on a real device the
   OS is pinned away entirely (Android screen pinning / iOS Guided Access).
4. **Open the grown-up gate.** Press and **hold “◉ hold to exit”** for ~1.5s (in
   the browser this stands in for the real two-finger long-press). Small children
   don't hold a deliberate press.
5. **Tap the four corners** clockwise from the top-left. Wrong order — or
   dawdling past the timeout — resets the sequence.
6. **Enter the PIN `2 4 6 8`.** The keypad reshuffles on every open and after any
   mistake, so the code can't be memorised as a finger-path.
7. **You're out.** The lock badge flips to 🔓 Unlocked. Tap **Resume play** to
   re-lock.

## How the demo maps to the code

| In the demo | In the app |
|---|---|
| Ripple/Pop animation pool | `src/canvas/useAnimatedPool.ts` |
| Tap surface → `spawn()` | `src/canvas/InteractiveCanvas.tsx` |
| Activity chips / registry | `src/activities/registry.ts` |
| Hold-to-exit trigger | `src/parentalGate/useGateTrigger.ts` |
| Corners sequence | `src/parentalGate/useCornerSequence.ts` |
| Randomized PIN | `src/parentalGate/randomizedPad.ts` |
| Lock badge / released screen | `src/kiosk/*`, `src/shell/*` |

> The browser demo can't reproduce OS-level lockdown (that's inherently native)
> or true multi-touch haptics; everything else mirrors the shipping behaviour.
