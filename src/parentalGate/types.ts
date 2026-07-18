export type Corner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

/** The canonical clockwise-from-top-left order the parent must reproduce. */
export const CORNER_ORDER: readonly Corner[] = [
  'topLeft',
  'topRight',
  'bottomRight',
  'bottomLeft',
];

export interface ParentalGateConfig {
  /**
   * Fingers required for the long-press that *opens* the gate. A single finger
   * (which is all a toddler reliably manages) will never trigger it.
   */
  triggerFingers: number;
  /** How long (ms) the multi-finger press must be held to open the gate. */
  triggerHoldMs: number;
  /** Ms allowed between corner taps before the sequence resets. */
  cornerTimeoutMs: number;
  /** The secret PIN. Kept in memory only; see ParentalGate docs. */
  pin: string;
  /** Auto-dismiss the gate if untouched for this long (ms). */
  idleDismissMs: number;
}

export const DEFAULT_GATE_CONFIG: ParentalGateConfig = {
  triggerFingers: 2,
  triggerHoldMs: 1500,
  cornerTimeoutMs: 4000,
  pin: '2468',
  idleDismissMs: 15000,
};

export type GateStage = 'closed' | 'corners' | 'pin' | 'success';
