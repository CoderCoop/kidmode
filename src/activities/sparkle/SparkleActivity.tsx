import React, {useImperativeHandle, useRef} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {useAnimatedPool, type PoolSlot} from '../../canvas/useAnimatedPool';
import type {ActivityHandle, ActivityProps} from '../types';
import {tick} from '../feedback';
import {palette} from '../../theme/theme';

const POOL_SIZE = 28;
const DURATION = 650;
const BAR_LEN = 132;
const BAR_THICK = 22;

const COLORS = palette.playful as readonly string[];

/**
 * Shared life curve for a spinning twinkle. `orientation` (0 or 90 degrees)
 * offsets the two crossed bars so together they read as a four-point sparkle.
 * Everything is derived from `progress` inside the worklet, so the whole effect
 * animates on the UI thread with no per-frame JS.
 */
function useSparkleStyle(slot: PoolSlot, orientation: number) {
  return useAnimatedStyle(() => {
    'worklet';
    const p = slot.progress.value;
    const color = COLORS[Math.abs(Math.trunc(slot.seed.value)) % COLORS.length];

    // Pop out with a slight overshoot, then twinkle away.
    const scale = p < 0.4 ? (p / 0.4) * 1.15 : 1.15 - ((p - 0.4) / 0.6) * 1.15;
    const opacity = p >= 1 ? 0 : 1 - p * p;
    const spin = orientation + p * 90; // quarter-turn twinkle

    return {
      opacity,
      backgroundColor: color,
      transform: [
        {translateX: slot.cx.value - BAR_LEN / 2},
        {translateY: slot.cy.value - BAR_THICK / 2},
        {rotate: `${spin}deg`},
        {scale},
      ],
    };
  });
}

/** One four-point sparkle: two crossed, co-rotating bars. */
function SparkleSlotView({slot}: {slot: PoolSlot}): React.JSX.Element {
  const barA = useSparkleStyle(slot, 0);
  const barB = useSparkleStyle(slot, 90);
  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.bar, barA]} />
      <Animated.View pointerEvents="none" style={[styles.bar, barB]} />
    </>
  );
}

/**
 * Sparkles: each touch blooms a spinning four-point twinkle with a light haptic.
 * Haptics are throttled so ten-finger mashing stays a series of soft taps rather
 * than one continuous buzz.
 */
export const SparkleActivity = React.forwardRef<ActivityHandle, ActivityProps>(
  function SparkleActivity(_props, ref) {
    const pool = useAnimatedPool(POOL_SIZE, DURATION);
    const lastHaptic = useRef(0);

    useImperativeHandle(
      ref,
      () => ({
        spawn: tap => {
          pool.spawn(tap.x, tap.y, tap.seed);
          if (tap.t - lastHaptic.current > 60) {
            lastHaptic.current = tap.t;
            tick();
          }
        },
      }),
      [pool],
    );

    return (
      <>
        {pool.slots.map((slot, i) => (
          <SparkleSlotView key={i} slot={slot} />
        ))}
      </>
    );
  },
);

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    width: BAR_LEN,
    height: BAR_THICK,
    borderRadius: BAR_THICK / 2,
  },
});
