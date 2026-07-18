import React, {useCallback, useMemo, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  Gesture,
  GestureDetector,
  type GestureType,
} from 'react-native-gesture-handler';
import {runOnJS} from 'react-native-reanimated';
import type {ActivityHandle} from './types';
import {palette} from '../theme/theme';

interface RawTouch {
  id: number;
  x: number;
  y: number;
}

interface Props {
  /**
   * Renders the active activity, wiring the provided ref to the activity's
   * `ActivityHandle`. A render prop (rather than cloneElement) keeps the ref
   * fully typed and lets the caller pass whatever props the activity needs.
   */
  renderActivity: (ref: React.Ref<ActivityHandle>) => React.ReactElement;
  /**
   * Optional extra gesture (e.g. the parental-gate multi-finger trigger) run
   * simultaneously with the tap capture so it observes without stealing single
   * finger play touches.
   */
  auxGesture?: GestureType;
}

/**
 * Full-screen, multi-touch play surface.
 *
 * Uses a `Gesture.Manual` recognizer purely as a *touch observer*: it never
 * activates, so it coexists with every other gesture and simply reports each
 * new pointer via `onTouchesDown`. All changed touches from a single native
 * event are marshalled to JS in one `runOnJS` call (not one per finger), then
 * fanned out to the activity's allocation-free `spawn`. This keeps the JS
 * thread quiet even under ten-finger mashing.
 */
export function InteractiveCanvas({
  renderActivity,
  auxGesture,
}: Props): React.JSX.Element {
  const activityRef = useRef<ActivityHandle | null>(null);
  // Monotonic seed feeding deterministic colour/shape choices.
  const seed = useRef(0);

  const setActivityRef = useCallback((handle: ActivityHandle | null) => {
    activityRef.current = handle;
  }, []);

  const dispatch = useCallback((touches: RawTouch[]) => {
    const handle = activityRef.current;
    if (!handle) {
      return;
    }
    const now = Date.now();
    for (let i = 0; i < touches.length; i++) {
      const t = touches[i];
      if (!t) {
        continue;
      }
      handle.spawn({id: t.id, x: t.x, y: t.y, seed: seed.current++, t: now});
    }
  }, []);

  const tapObserver = useMemo(
    () =>
      Gesture.Manual().onTouchesDown(event => {
        'worklet';
        const changed = event.changedTouches;
        const out: RawTouch[] = [];
        for (let i = 0; i < changed.length; i++) {
          const c = changed[i];
          if (!c) {
            continue;
          }
          out.push({id: c.id, x: c.x, y: c.y});
        }
        runOnJS(dispatch)(out);
      }),
    [dispatch],
  );

  const gesture = useMemo(
    () =>
      auxGesture ? Gesture.Simultaneous(tapObserver, auxGesture) : tapObserver,
    [tapObserver, auxGesture],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.surface} collapsable={false}>
        {renderActivity(setActivityRef)}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  surface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.canvas,
    overflow: 'hidden',
  },
});
