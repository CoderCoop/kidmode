import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {CORNER_ORDER, type Corner} from './types';
import {useCornerSequence} from './useCornerSequence';
import {palette, radii, spacing} from '../theme/theme';

interface Props {
  timeoutMs: number;
  onComplete: () => void;
  onCancel: () => void;
}

const CORNER_STYLE: Record<Corner, object> = {
  topLeft: {top: spacing.xl, left: spacing.xl},
  topRight: {top: spacing.xl, right: spacing.xl},
  bottomRight: {bottom: spacing.xl, right: spacing.xl},
  bottomLeft: {bottom: spacing.xl, left: spacing.xl},
};

/**
 * Stage 1 of the parental gate. Four corner targets must be tapped clockwise
 * from the top-left. A live dot counter shows adults their progress; the timeout
 * and ordering requirements make accidental completion by a toddler effectively
 * impossible.
 */
export function CornersChallenge({
  timeoutMs,
  onComplete,
  onCancel,
}: Props): React.JSX.Element {
  const {progress, press} = useCornerSequence({timeoutMs, onComplete});

  return (
    <View style={styles.fill} accessibilityLabel="Parental gate: tap corners">
      <View style={styles.header} pointerEvents="none">
        <Text style={styles.title}>Grown-ups only</Text>
        <Text style={styles.subtitle}>
          Tap the four corners, clockwise from the top-left.
        </Text>
        <View style={styles.dots}>
          {CORNER_ORDER.map((corner, i) => (
            <View
              key={corner}
              style={[styles.dot, i < progress && styles.dotOn]}
            />
          ))}
        </View>
      </View>

      {CORNER_ORDER.map((corner, i) => (
        <Pressable
          key={corner}
          onPress={() => press(corner)}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel={`Corner ${i + 1}`}
          style={[styles.corner, CORNER_STYLE[corner]]}>
          <View
            style={[styles.cornerInner, i < progress && styles.cornerInnerOn]}
          />
        </Pressable>
      ))}

      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        style={styles.cancel}>
        <Text style={styles.cancelText}>Back to play</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {...StyleSheet.absoluteFillObject},
  header: {
    position: 'absolute',
    top: '38%',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
  },
  title: {
    color: palette.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  dots: {flexDirection: 'row', gap: spacing.sm},
  dot: {
    width: 14,
    height: 14,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: palette.textMuted,
  },
  dotOn: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  corner: {
    position: 'absolute',
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerInner: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    borderWidth: 3,
    borderColor: palette.surfaceRaised,
    borderStyle: 'dashed',
  },
  cornerInnerOn: {
    backgroundColor: palette.success,
    borderColor: palette.success,
    borderStyle: 'solid',
  },
  cancel: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cancelText: {color: palette.textMuted, fontSize: 14},
});
