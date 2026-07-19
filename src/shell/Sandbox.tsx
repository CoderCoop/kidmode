import React, {useCallback, useState} from 'react';
import {StatusBar, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {InteractiveCanvas} from '../canvas';
import {ACTIVITIES, getActivity} from '../activities';
import {
  DEFAULT_GATE_CONFIG,
  HoldToExit,
  ParentalGate,
  useGateTrigger,
} from '../parentalGate';
import {useKiosk} from '../kiosk';
import {ActivitySwitcher} from './ActivitySwitcher';
import {ReleasedScreen} from './ReleasedScreen';
import {palette, spacing} from '../theme/theme';

type Mode = 'play' | 'released';

/**
 * The top-level play shell. It wires together the four pillars:
 *   - lockdown state          (useKiosk)
 *   - the resilient canvas     (InteractiveCanvas + active activity)
 *   - the parental gate + its multi-finger trigger
 *   - the modular activity switcher
 */
export function Sandbox(): React.JSX.Element {
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {locked, unlock, lock, capabilities} = useKiosk();

  const [activeId, setActiveId] = useState<string>(ACTIVITIES[0]!.id);
  const [gateOpen, setGateOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('play');

  const openGate = useCallback(() => setGateOpen(true), []);

  // The two-finger press-and-hold that reveals the gate. Composed simultaneously
  // with the canvas so it never steals single-finger play touches. `holdProgress`
  // drives the "keep holding to exit" indicator so a parent gets live feedback.
  const {gesture: triggerGesture, holdProgress} = useGateTrigger({
    fingers: DEFAULT_GATE_CONFIG.triggerFingers,
    holdMs: DEFAULT_GATE_CONFIG.triggerHoldMs,
    onTrigger: openGate,
  });

  const handleUnlock = useCallback(async () => {
    setGateOpen(false);
    await unlock();
    setMode('released');
  }, [unlock]);

  const handleResume = useCallback(async () => {
    setMode('play');
    await lock();
  }, [lock]);

  const active = getActivity(activeId);
  const ActivityComponent = active.Component;

  if (mode === 'released') {
    return <ReleasedScreen onResume={handleResume} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* key={activeId} remounts on switch, giving each activity a fresh pool. */}
      <InteractiveCanvas
        key={activeId}
        auxGesture={triggerGesture}
        renderActivity={ref => (
          <ActivityComponent ref={ref} width={width} height={height} />
        )}
      />

      {/* Chrome overlay: never blocks the canvas except on its own controls. */}
      <View
        style={[styles.chrome, {paddingTop: insets.top + spacing.xs}]}
        pointerEvents="box-none">
        <ActivitySwitcher activeId={activeId} onSelect={setActiveId} />
      </View>

      <View
        style={[styles.footer, {paddingBottom: insets.bottom + spacing.sm}]}
        pointerEvents="none">
        <View style={[styles.badge, locked ? styles.badgeOn : styles.badgeOff]}>
          <Text style={styles.badgeText}>
            {locked ? '🔒 Locked' : '🔓 Unlocked'}
          </Text>
        </View>
        <Text style={styles.hint}>
          Grown-up? Hold {DEFAULT_GATE_CONFIG.triggerFingers} fingers anywhere to
          exit{capabilities && !capabilities.canPinScreen ? '  •  soft-lock' : ''}
        </Text>
      </View>

      {/* Live "keep holding to exit" feedback for the two-finger gesture. */}
      <HoldToExit progress={holdProgress} />

      <ParentalGate
        open={gateOpen}
        onUnlock={handleUnlock}
        onClose={() => setGateOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: palette.canvas},
  chrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  badgeOn: {backgroundColor: '#123'},
  badgeOff: {backgroundColor: '#411'},
  badgeText: {color: palette.textPrimary, fontSize: 13, fontWeight: '700'},
  hint: {color: palette.textMuted, fontSize: 12},
});
