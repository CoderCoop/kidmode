import {useMemo, useRef} from 'react';
import {
  Easing,
  makeMutable,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * One recyclable visual slot. All fields are Reanimated shared values so the
 * per-frame animation runs entirely on the UI thread; JS only writes the target
 * values once per spawn.
 */
export interface PoolSlot {
  cx: SharedValue<number>;
  cy: SharedValue<number>;
  /** 0 -> 1 animated life of the effect; drives scale/opacity in the view. */
  progress: SharedValue<number>;
  /** Deterministic seed for colour/shape selection. */
  seed: SharedValue<number>;
  /** Bumped each spawn so views can cheaply detect reuse if needed. */
  generation: SharedValue<number>;
}

export interface AnimatedPool {
  slots: PoolSlot[];
  /** Recycle the next slot at (x, y) and (re)start its life animation. */
  spawn: (x: number, y: number, seed: number) => void;
}

/**
 * A fixed-size pool of self-animating visual slots.
 *
 * This is the heart of the "resilient canvas". Because the slots are mounted
 * exactly once and never grow, a burst of a hundred taps performs a hundred
 * cheap shared-value writes instead of a hundred React mounts + GC cycles.
 * Round-robin recycling means the oldest effect is silently reused when the
 * pool is exhausted, so throughput is bounded and lag-free no matter how hard
 * the screen is mashed.
 *
 * `size` should comfortably exceed the number of effects visible at once
 * (fingers * effect-lifetime / spawn-interval). 24-40 is plenty for a 10-finger
 * device.
 */
export function useAnimatedPool(size: number, durationMs: number): AnimatedPool {
  // makeMutable creates shared values outside of a hook, so we build the pool
  // once in a ref and keep it stable across renders.
  const poolRef = useRef<PoolSlot[] | null>(null);
  if (poolRef.current === null) {
    poolRef.current = Array.from({length: size}, () => ({
      cx: makeMutable(0),
      cy: makeMutable(0),
      progress: makeMutable(1), // start "finished" => invisible
      seed: makeMutable(0),
      generation: makeMutable(0),
    }));
  }
  const slots = poolRef.current;
  const cursor = useRef(0);

  return useMemo<AnimatedPool>(() => {
    const spawn = (x: number, y: number, seed: number) => {
      const i = cursor.current % size;
      cursor.current = (cursor.current + 1) % (size * 1024);
      const slot = slots[i];
      if (!slot) {
        return;
      }
      slot.cx.value = x;
      slot.cy.value = y;
      slot.seed.value = seed;
      slot.generation.value = slot.generation.value + 1;
      // Restart the life animation from 0. Assigning a raw number cancels any
      // in-flight animation, then withTiming drives it to 1 on the UI thread.
      slot.progress.value = 0;
      slot.progress.value = withTiming(1, {
        duration: durationMs,
        easing: Easing.out(Easing.cubic),
      });
    };
    return {slots, spawn};
  }, [slots, size, durationMs]);
}
