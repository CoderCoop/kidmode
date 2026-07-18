import React, {useImperativeHandle, useMemo, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  makeMutable,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type {ActivityHandle, ActivityProps} from '../types';
import {playPad, tick} from '../feedback';
import {palette, radii, spacing} from '../../theme/theme';

const COLS = 3;
const ROWS = 3;
const PAD_COUNT = COLS * ROWS;
const COLORS = palette.playful as readonly string[];

function Pad({
  flash,
  color,
}: {
  flash: SharedValue<number>;
  color: string;
}): React.JSX.Element {
  const style = useAnimatedStyle(() => {
    'worklet';
    const f = flash.value;
    return {
      opacity: 0.55 + f * 0.45,
      transform: [{scale: 0.94 + f * 0.06}],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pad, {backgroundColor: color}, style]}
    />
  );
}

/**
 * A high-contrast soundboard. The play canvas maps every touch to a grid pad by
 * coordinate, so the board reacts correctly to erratic multi-touch mashing (no
 * per-pad Pressables to miss fast taps). Each hit flashes the pad, fires a
 * throttled haptic, and calls the pluggable `playPad` sound seam.
 */
export const SoundboardActivity = React.forwardRef<
  ActivityHandle,
  ActivityProps
>(function SoundboardActivity({width, height}, ref) {
  // One flash shared value per pad, created once.
  const flashes = useRef<SharedValue<number>[] | null>(null);
  if (flashes.current === null) {
    flashes.current = Array.from({length: PAD_COUNT}, () => makeMutable(0));
  }
  const pads = flashes.current;
  const lastHaptic = useRef(0);

  const {cellW, cellH} = useMemo(
    () => ({cellW: width / COLS, cellH: height / ROWS}),
    [width, height],
  );

  useImperativeHandle(
    ref,
    () => ({
      spawn: tap => {
        if (cellW <= 0 || cellH <= 0) {
          return;
        }
        const col = Math.min(COLS - 1, Math.max(0, Math.floor(tap.x / cellW)));
        const row = Math.min(ROWS - 1, Math.max(0, Math.floor(tap.y / cellH)));
        const idx = row * COLS + col;
        const flash = pads[idx];
        if (!flash) {
          return;
        }
        flash.value = 1;
        flash.value = withTiming(0, {duration: 320});
        playPad(idx);
        if (tap.t - lastHaptic.current > 60) {
          lastHaptic.current = tap.t;
          tick();
        }
      },
    }),
    [pads, cellW, cellH],
  );

  return (
    <View style={styles.grid} pointerEvents="none">
      {pads.map((flash, i) => (
        <View key={i} style={styles.cell}>
          <Pad flash={flash} color={COLORS[i % COLORS.length] as string} />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / COLS}%`,
    height: `${100 / ROWS}%`,
    padding: spacing.sm,
  },
  pad: {
    flex: 1,
    borderRadius: radii.lg,
  },
});
