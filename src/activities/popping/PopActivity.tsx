import React, {useImperativeHandle, useRef} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {useAnimatedPool, type PoolSlot} from '../../canvas/useAnimatedPool';
import type {ActivityHandle, ActivityProps} from '../types';
import {pop as popHaptic} from '../feedback';
import {palette} from '../../theme/theme';

const POOL_SIZE = 32;
const DURATION = 700;
const SIZE = 110;

const COLORS = palette.playful as readonly string[];

/**
 * One popping shape. Colour, silhouette (circle / rounded-square / diamond) and
 * motion are all derived from the slot's shared values inside a single worklet,
 * so everything runs on the UI thread with zero per-frame JS.
 */
function PopSlotView({slot}: {slot: PoolSlot}): React.JSX.Element {
  const style = useAnimatedStyle(() => {
    'worklet';
    const p = slot.progress.value;
    const s = Math.abs(Math.trunc(slot.seed.value));
    const color = COLORS[s % COLORS.length];
    const shape = s % 3; // 0 circle, 1 square, 2 diamond

    // Inflate with an overshoot, then burst.
    let scale: number;
    let opacity: number;
    if (p < 0.6) {
      scale = (p / 0.6) * 1.15;
      opacity = 1;
    } else {
      const q = (p - 0.6) / 0.4;
      scale = 1.15 + q * 0.9;
      opacity = 1 - q;
    }
    if (p >= 1) {
      opacity = 0;
    }

    const borderRadius = shape === 0 ? SIZE / 2 : shape === 1 ? 18 : 12;
    const rotate = shape === 2 ? '45deg' : '0deg';

    return {
      opacity,
      backgroundColor: color,
      borderRadius,
      transform: [
        {translateX: slot.cx.value - SIZE / 2},
        {translateY: slot.cy.value - SIZE / 2},
        {scale},
        {rotate},
      ],
    };
  });

  return <Animated.View pointerEvents="none" style={[styles.slot, style]} />;
}

/**
 * Shape popping: each touch inflates a chunky high-contrast shape that bursts
 * with a short haptic. Haptics are throttled so ten-finger mashing does not
 * become one continuous buzz.
 */
export const PopActivity = React.forwardRef<ActivityHandle, ActivityProps>(
  function PopActivity(_props, ref) {
    const pool = useAnimatedPool(POOL_SIZE, DURATION);
    const lastHaptic = useRef(0);

    useImperativeHandle(
      ref,
      () => ({
        spawn: tap => {
          pool.spawn(tap.x, tap.y, tap.seed);
          if (tap.t - lastHaptic.current > 60) {
            lastHaptic.current = tap.t;
            popHaptic();
          }
        },
      }),
      [pool],
    );

    return (
      <>
        {pool.slots.map((slot, i) => (
          <PopSlotView key={i} slot={slot} />
        ))}
      </>
    );
  },
);

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
});
