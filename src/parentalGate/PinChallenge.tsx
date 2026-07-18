import React, {useCallback, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {pinMatches, shuffledDigits} from './randomizedPad';
import {palette, radii, spacing} from '../theme/theme';

interface Props {
  pin: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Stage 2 of the parental gate: a randomized PIN pad. The digit layout is
 * reshuffled on mount and after every failed attempt, so the PIN can never be
 * entered as a memorised spatial gesture.
 */
export function PinChallenge({
  pin,
  onSuccess,
  onCancel,
}: Props): React.JSX.Element {
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
      // Reached full length: evaluate.
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

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Enter PIN to exit</Text>

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
        {error ? 'Wrong PIN — keys reshuffled' : ' '}
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
          <Text style={styles.actionText}>Cancel</Text>
        </Pressable>
      </View>
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
});
