import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import {palette, radii, spacing} from '../theme/theme';

interface Props {
  /** 0→1 progress of the two-finger exit hold. */
  progress: SharedValue<number>;
}

/**
 * The "keep holding to exit" affordance. It stays invisible during play and
 * fades in the instant a two-finger hold begins, filling a bar as the hold
 * completes — so a distracted parent gets immediate confirmation the hidden
 * gesture is working, without any always-on chrome a toddler could learn from.
 */
export function HoldToExit({progress}: Props): React.JSX.Element {
  const wrapStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    return {
      opacity: Math.min(1, p * 4),
      transform: [{scale: 0.92 + Math.min(1, p) * 0.08}],
    };
  });

  const fillStyle = useAnimatedStyle(() => {
    'worklet';
    return {width: `${Math.min(1, progress.value) * 100}%`};
  });

  return (
    <View style={styles.center} pointerEvents="none">
      <Animated.View style={[styles.card, wrapStyle]}>
        <Text style={styles.label}>Keep holding to exit…</Text>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(6,6,12,0.82)',
    borderWidth: 1,
    borderColor: palette.surfaceRaised,
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 220,
  },
  label: {color: palette.textPrimary, fontSize: 16, fontWeight: '700'},
  track: {
    width: 180,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceRaised,
    overflow: 'hidden',
  },
  fill: {height: '100%', borderRadius: radii.pill, backgroundColor: palette.success},
});
