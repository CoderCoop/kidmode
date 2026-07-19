import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {palette, radii, spacing} from '../theme/theme';

interface Props {
  onResume: () => void;
}

/**
 * Shown after the parent successfully unlocks. The device lockdown is released,
 * so the grown-up can now leave the app via the normal OS gestures — or tap
 * "Resume play" to re-enter the secured sandbox.
 */
export function ReleasedScreen({onResume}: Props): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>🔓</Text>
      <Text style={styles.title}>Lockdown released</Text>
      <Text style={styles.body}>
        The device is unlocked. You can leave the app, or resume Kid Mode.
      </Text>
      <Pressable
        onPress={onResume}
        accessibilityRole="button"
        style={styles.button}>
        <Text style={styles.buttonText}>Resume play</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.canvasAlt,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emoji: {fontSize: 64, marginBottom: spacing.md},
  title: {
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  body: {
    color: palette.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 340,
  },
  button: {
    backgroundColor: palette.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
  },
  buttonText: {color: '#04201C', fontSize: 18, fontWeight: '800'},
});
