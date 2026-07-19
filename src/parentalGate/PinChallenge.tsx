import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {pinMatches, shuffledDigits} from './randomizedPad';
import {palette, radii, spacing} from '../theme/theme';

interface Props {
  pin: string;
  /** How long the "Forgot PIN?" press-and-hold must be held to exit. */
  recoveryHoldMs: number;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * The unlock screen: a randomized PIN pad, plus a "Forgot PIN?" fallback.
 *
 * The digit layout reshuffles on mount and after every wrong attempt, so the
 * PIN can never be entered as a memorised spatial gesture. The fallback is a
 * press-and-hold that exits without the PIN after `recoveryHoldMs` — a recovery
 * that needs no second secret, so it can never be forgotten, yet is far too
 * sustained for a toddler to stumble into.
 */
export function PinChallenge({
  pin,
  recoveryHoldMs,
  onSuccess,
  onCancel,
}: Props): React.JSX.Element {
  const [mode, setMode] = useState<'pin' | 'recovery'>('pin');
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);
  // Bump this to force a fresh shuffle after a wrong PIN.
  const [shuffleKey, setShuffleKey] = useState(0);

  const digits = useMemo(
    () => shuffledDigits(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shuffleKey],
  );

  const handleDigit = useCallback(
    (digit: number) => {
      setError(false);
      const next = entry + String(digit);
      if (next.length < pin.length) {
        setEntry(next);
        return;
      }
      if (pinMatches(next, pin)) {
        setEntry('');
        onSuccess();
      } else {
        setEntry('');
        setError(true);
        setShuffleKey(k => k + 1); // reshuffle on failure
      }
    },
    [entry, pin, onSuccess],
  );

  const handleClear = useCallback(() => {
    setEntry('');
    setError(false);
  }, []);

  // ---- "Forgot PIN?" press-and-hold recovery ----
  const holdProgress = useSharedValue(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHold = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    cancelAnimation(holdProgress);
    holdProgress.value = withTiming(0, {duration: 180});
  }, [holdProgress]);

  const startHold = useCallback(() => {
    holdProgress.value = 0;
    holdProgress.value = withTiming(1, {
      duration: recoveryHoldMs,
      easing: Easing.linear,
    });
    holdTimer.current = setTimeout(() => {
      holdProgress.value = 0;
      onSuccess();
    }, recoveryHoldMs);
  }, [holdProgress, recoveryHoldMs, onSuccess]);

  useEffect(() => cancelHold, [cancelHold]);

  const holdFillStyle = useAnimatedStyle(() => {
    'worklet';
    return {width: `${Math.min(1, holdProgress.value) * 100}%`};
  });

  if (mode === 'recovery') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Forgot your PIN?</Text>
        <Text style={styles.recoveryBody}>
          No problem. Press and hold the button below until it fills, and Kid
          Mode will exit.
        </Text>
        <Pressable
          onPressIn={startHold}
          onPressOut={cancelHold}
          accessibilityRole="button"
          accessibilityLabel="Hold to exit"
          style={({pressed}) => [styles.holdBtn, pressed && styles.holdBtnDown]}>
          <Animated.View style={[styles.holdFill, holdFillStyle]} />
          <Text style={styles.holdText}>Hold to exit</Text>
        </Pressable>
        <Pressable onPress={() => setMode('pin')} style={styles.action}>
          <Text style={styles.actionText}>Back to PIN</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Enter your PIN to unlock</Text>

      <View style={styles.pips}>
        {Array.from({length: pin.length}).map((_, i) => (
          <View
            key={i}
            style={[
              styles.pip,
              i < entry.length && styles.pipFilled,
              error && styles.pipError,
            ]}
          />
        ))}
      </View>
      <Text style={[styles.hint, error && styles.hintError]}>
        {error ? "That's not it — the keys reshuffled, try again" : ' '}
      </Text>

      <View style={styles.pad}>
        {digits.map(digit => (
          <Pressable
            key={digit}
            onPress={() => handleDigit(digit)}
            accessibilityRole="button"
            accessibilityLabel={`Digit ${digit}`}
            style={({pressed}) => [styles.key, pressed && styles.keyPressed]}>
            <Text style={styles.keyText}>{digit}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={handleClear} style={styles.action}>
          <Text style={styles.actionText}>Clear</Text>
        </Pressable>
        <Pressable onPress={onCancel} style={styles.action}>
          <Text style={styles.actionText}>Back to play</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => setMode('recovery')}
        accessibilityRole="button"
        style={styles.forgot}>
        <Text style={styles.forgotText}>Forgot PIN?</Text>
      </Pressable>
    </View>
  );
}

const KEY_SIZE = 76;

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', paddingHorizontal: spacing.lg},
  title: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  pips: {flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs},
  pip: {
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: palette.textMuted,
  },
  pipFilled: {backgroundColor: palette.textPrimary},
  pipError: {borderColor: palette.danger},
  hint: {color: palette.textMuted, height: 20, marginBottom: spacing.md},
  hintError: {color: palette.danger},
  pad: {
    width: KEY_SIZE * 3 + spacing.md * 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {backgroundColor: palette.success},
  keyText: {color: palette.textPrimary, fontSize: 30, fontWeight: '700'},
  actions: {flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg},
  action: {paddingVertical: spacing.sm, paddingHorizontal: spacing.md},
  actionText: {color: palette.textMuted, fontSize: 16},
  forgot: {marginTop: spacing.sm, padding: spacing.sm},
  forgotText: {
    color: palette.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  // recovery
  recoveryBody: {
    color: palette.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: spacing.xl,
  },
  holdBtn: {
    width: 240,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: palette.surfaceRaised,
    borderWidth: 1,
    borderColor: palette.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  holdBtnDown: {borderColor: palette.success},
  holdFill: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
    backgroundColor: palette.success,
  },
  holdText: {color: palette.textPrimary, fontSize: 18, fontWeight: '700'},
});
