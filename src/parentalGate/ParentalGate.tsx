import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import {CornersChallenge} from './CornersChallenge';
import {PinChallenge} from './PinChallenge';
import {DEFAULT_GATE_CONFIG, type GateStage, type ParentalGateConfig} from './types';
import {palette} from '../theme/theme';

interface Props {
  open: boolean;
  config?: Partial<ParentalGateConfig>;
  /** Fired when both stages are cleared — the caller should release lockdown. */
  onUnlock: () => void;
  /** Fired when the gate is dismissed without unlocking. */
  onClose: () => void;
}

/**
 * The two-stage parental gate, rendered in a top-level Modal so it always sits
 * above the play canvas and captures all touches while open.
 *
 * Flow:  corners  ->  randomized PIN  ->  onUnlock
 *
 * The gate auto-dismisses after `idleDismissMs` of inactivity so a child who
 * somehow opens it is returned to play rather than left staring at a PIN pad.
 */
export function ParentalGate({
  open,
  config,
  onUnlock,
  onClose,
}: Props): React.JSX.Element {
  const cfg = {...DEFAULT_GATE_CONFIG, ...config};
  const [stage, setStage] = useState<GateStage>('closed');
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdle = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearIdle();
    setStage('closed');
    onClose();
  }, [clearIdle, onClose]);

  // Arm/refresh the idle auto-dismiss whenever the stage advances.
  const armIdle = useCallback(() => {
    clearIdle();
    idleTimer.current = setTimeout(close, cfg.idleDismissMs);
  }, [clearIdle, close, cfg.idleDismissMs]);

  useEffect(() => {
    if (open) {
      setStage('corners');
      armIdle();
    } else {
      setStage('closed');
      clearIdle();
    }
    return clearIdle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCornersDone = useCallback(() => {
    setStage('pin');
    armIdle();
  }, [armIdle]);

  const handlePinSuccess = useCallback(() => {
    clearIdle();
    setStage('success');
    onUnlock();
  }, [clearIdle, onUnlock]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={close} // Android back inside the modal cancels the gate.
      supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.scrim}>
        {stage === 'corners' && (
          <CornersChallenge
            timeoutMs={cfg.cornerTimeoutMs}
            onComplete={handleCornersDone}
            onCancel={close}
          />
        )}
        {stage === 'pin' && (
          <PinChallenge
            pin={cfg.pin}
            onSuccess={handlePinSuccess}
            onCancel={close}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: palette.overlayScrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
