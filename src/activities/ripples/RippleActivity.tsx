import React, {useImperativeHandle} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {useAnimatedPool, type PoolSlot} from '../../canvas/useAnimatedPool';
import type {ActivityHandle, ActivityProps} from '../types';
import {palette} from '../../theme/theme';

const POOL_SIZE = 36;
const DURATION = 900;
const BASE = 120; // base diameter (dp) of a ripple at scale 1

// Captured as a plain array so the worklet below can index it on the UI thread.
const COLORS = palette.playful as readonly string[];

function RippleSlotView({slot}: {slot: PoolSlot}): React.JSX.Element {
  const style = useAnimatedStyle(() => {
    'worklet';
    const p = slot.progress.value;
    const color = COLORS[Math.abs(Math.trunc(slot.seed.value)) % COLORS.length];
    // Grow-and-fade: an expanding high-contrast ring.
    const scale = 0.25 + p * 2.4;
    return {
      opacity: (1 - p) * (p < 1 ? 1 : 0),
      backgroundColor: color,
      transform: [
        {translateX: slot.cx.value - BASE / 2},
        {translateY: slot.cy.value - BASE / 2},
        {scale},
      ],
    };
  });

  return <Animated.View pointerEvents="none" style={[styles.ripple, style]} />;
}

/**
 * High-contrast visual ripples. Every touch emits an expanding, fading disc in
 * a rotating palette colour. Backed by a fixed animated pool, so a burst of taps
 * is a burst of shared-value writes — never React re-renders.
 */
export const RippleActivity = React.forwardRef<ActivityHandle, ActivityProps>(
  function RippleActivity(_props, ref) {
    const pool = useAnimatedPool(POOL_SIZE, DURATION);

    useImperativeHandle(
      ref,
      () => ({
        spawn: tap => pool.spawn(tap.x, tap.y, tap.seed),
      }),
      [pool],
    );

    return (
      <>
        {pool.slots.map((slot, i) => (
          <RippleSlotView key={i} slot={slot} />
        ))}
      </>
    );
  },
);

const styles = StyleSheet.create({
  ripple: {
    position: 'absolute',
    width: BASE,
    height: BASE,
    borderRadius: BASE / 2,
  },
});
