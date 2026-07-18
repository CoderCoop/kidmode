import {useMemo} from 'react';
import {Gesture} from 'react-native-gesture-handler';
import {runOnJS} from 'react-native-reanimated';

interface Options {
  fingers: number;
  holdMs: number;
  onTrigger: () => void;
}

/**
 * Builds the gesture that *opens* the parental gate: a long-press held with
 * `fingers` pointers for `holdMs` milliseconds.
 *
 * Two design points make this toddler-proof:
 *  - `numberOfPointers(fingers)` — requires exactly that many fingers held; a
 *    small child almost never plants two deliberate fingers and holds them
 *    still, whereas play input is single-finger and jittery.
 *  - The gesture is meant to be composed with `Gesture.Simultaneous` alongside
 *    the play canvas so it observes without stealing single-finger touches.
 *
 * The callback is marshalled back to JS via `runOnJS` because the gesture
 * callbacks execute on the UI thread under Reanimated.
 */
export function useGateTrigger({fingers, holdMs, onTrigger}: Options) {
  return useMemo(
    () =>
      Gesture.LongPress()
        .numberOfPointers(fingers)
        .minDuration(holdMs)
        // Allow the finger(s) to wander a little during the long hold.
        .maxDistance(10_000)
        .shouldCancelWhenOutside(false)
        .onStart(() => {
          runOnJS(onTrigger)();
        }),
    [fingers, holdMs, onTrigger],
  );
}
