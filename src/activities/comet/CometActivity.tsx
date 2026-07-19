import React, {useImperativeHandle} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {useAnimatedPool, type PoolSlot} from '../../canvas/useAnimatedPool';
import type {ActivityHandle, ActivityProps} from '../types';
import {palette} from '../../theme/theme';

const POOL_SIZE = 32;
const DURATION = 1000;
const SIZE = 84; // head diameter (dp) at scale 1
const DRIFT = 220; // how far (dp) a comet travels over its life
const TAU = Math.PI * 2;

const COLORS = palette.playful as readonly string[];

/**
 * One drifting comet. Unlike the ripple/pop activities, a comet *moves*: it is
 * flung from the touch point along a deterministic, seed-derived heading and
 * fades as it travels, giving the sense of a shooting star. All motion is
 * computed inside the worklet from `progress`, so it runs on the UI thread with
 * zero per-frame JS.
 */
function CometSlotView({slot}: {slot: PoolSlot}): React.JSX.Element {
  const style = useAnimatedStyle(() => {
    'worklet';
    const p = slot.progress.value;
    const s = Math.abs(Math.trunc(slot.seed.value));
    const color = COLORS[s % COLORS.length];

    // Deterministic heading from the seed (golden-angle spread avoids clumping).
    const angle = (s * 2.399963229728653) % TAU;
    // Ease-out travel: fast launch, gentle glide.
    const dist = (1 - (1 - p) * (1 - p)) * DRIFT;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;

    // Shrink and fade as it flies out.
    const scale = 1 - p * 0.5;
    const opacity = p >= 1 ? 0 : 1 - p;

    return {
      opacity,
      backgroundColor: color,
      transform: [
        {translateX: slot.cx.value + dx - SIZE / 2},
        {translateY: slot.cy.value + dy - SIZE / 2},
        {scale},
      ],
    };
  });

  return <Animated.View pointerEvents="none" style={[styles.head, style]} />;
}

/**
 * Comets: every touch launches a glowing head that streaks away from the finger
 * and fades. Backed by the fixed animated pool, so a flurry of taps is a flurry
 * of cheap shared-value writes — never React re-renders.
 */
export const CometActivity = React.forwardRef<ActivityHandle, ActivityProps>(
  function CometActivity(_props, ref) {
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
          <CometSlotView key={i} slot={slot} />
        ))}
      </>
    );
  },
);

const styles = StyleSheet.create({
  head: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
});
