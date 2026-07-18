import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {ACTIVITIES} from '../activities';
import {palette, radii, spacing} from '../theme/theme';

interface Props {
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Compact activity switcher. It lives inside the sandbox (switching activities
 * never leaves the secured surface), so it is safe for a child to tap. Chips are
 * large, high-contrast, and glyph-led for pre-readers.
 */
export function ActivitySwitcher({activeId, onSelect}: Props): React.JSX.Element {
  return (
    <View style={styles.bar} pointerEvents="box-none">
      {ACTIVITIES.map(a => {
        const active = a.id === activeId;
        return (
          <Pressable
            key={a.id}
            onPress={() => onSelect(a.id)}
            accessibilityRole="button"
            accessibilityState={{selected: active}}
            accessibilityLabel={a.title}
            style={[
              styles.chip,
              {borderColor: a.accent},
              active && {backgroundColor: a.accent},
            ]}>
            <Text style={styles.glyph}>{a.glyph}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  chip: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    borderWidth: 2,
    backgroundColor: palette.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {fontSize: 26},
});
