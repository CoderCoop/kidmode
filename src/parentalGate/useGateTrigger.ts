import {useMemo} from 'react';
import {Gesture, type LongPressGesture} from 'react-native-gesture-handler';
import {
  cancelAnimation,
  makeMutable,
  runOnJS,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

interface Options {
  fingers: number;
  holdMs: number;
  onTrigger: () => void;
}

export interface GateTrigger {
  /** Compose this simultaneously with the play canvas. */
  gesture: LongPressGesture;
  /** 0→1 while the two-finger hold is in progress; drives the "keep holding" UI. */
  holdProgress: SharedValue<number>;
}

/**
 * Builds the gesture that *opens* the parental gate: a press-and-hold with
 * `fingers` pointers for `holdMs` milliseconds.
 *
 * Two design points make this toddler-proof yet distracted-parent friendly:
 *  - `numberOfPointers(fingers)` requires that many fingers held still — play
 *    input is single-finger and jittery, so it never trips the gate.
 *  - `holdProgress` animates from 0→1 the moment the correct number of fingers
 *    land, so a parent gets immediate "yes, keep holding" feedback instead of
 *    guessing whether the hidden gesture is working.
 *
 * Callbacks run on the UI thread; the trigger is marshalled back to JS via
 * `runOnJS`, while the progress value is written directly on the UI thread.
 */
export function useGateTrigger({
  fingers,
  holdMs,
  onTrigger,
}: Options): GateTrigger {
  // A single stable shared value, created once (like the canvas pool).
  const holdProgress = useMemo(() => makeMutable(0), []);

  const gesture = useMemo(
    () =>
      Gesture.LongPress()
        .numberOfPointers(fingers)
        .minDuration(holdMs)
        // Allow the fingers to wander a little during the hold.
        .maxDistance(10_000)
        .shouldCancelWhenOutside(false)
        .onTouchesDown(event => {
          'worklet';
          // Only start filling once enough fingers are actually down, so normal
          // single-finger play never flashes the indicator.
          if (event.numberOfTouches >= fingers) {
            cancelAnimation(holdProgress);
            holdProgress.value = 0;
            holdProgress.value = withTiming(1, {duration: holdMs});
          }
        })
        .onTouchesUp(event => {
          'worklet';
          if (event.numberOfTouches < fingers) {
            cancelAnimation(holdProgress);
            holdProgress.value = withTiming(0, {duration: 180});
          }
        })
        .onStart(() => {
          runOnJS(onTrigger)();
        })
        .onFinalize(() => {
          'worklet';
          cancelAnimation(holdProgress);
          holdProgress.value = withTiming(0, {duration: 180});
        }),
    [fingers, holdMs, onTrigger, holdProgress],
  );

  return {gesture, holdProgress};
}
