export interface ParentalGateConfig {
  /**
   * Fingers required for the press-and-hold that *opens* the gate. Two fingers
   * held deliberately still is something a toddler almost never does, while an
   * adult can do it one-handed without looking.
   */
  triggerFingers: number;
  /** How long (ms) the two-finger press must be held to open the gate. */
  triggerHoldMs: number;
  /** The secret PIN. Kept in memory only; see ParentalGate docs. */
  pin: string;
  /**
   * How long (ms) the "Forgot PIN?" press-and-hold must be held to exit without
   * the PIN. Long enough that a toddler never sustains it, short enough that a
   * locked-out parent always has a way out. A recovery that can't be forgotten.
   */
  recoveryHoldMs: number;
  /**
   * Auto-dismiss the gate if untouched for this long (ms). Generous on purpose:
   * a distracted parent pulled away mid-exit returns to the same PIN pad instead
   * of having to start over.
   */
  idleDismissMs: number;
}

export const DEFAULT_GATE_CONFIG: ParentalGateConfig = {
  triggerFingers: 2,
  triggerHoldMs: 1500,
  pin: '2468',
  recoveryHoldMs: 5000,
  idleDismissMs: 30000,
};

export type GateStage = 'closed' | 'pin' | 'success';
