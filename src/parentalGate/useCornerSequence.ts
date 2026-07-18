import {useCallback, useEffect, useRef, useState} from 'react';
import {CORNER_ORDER, type Corner} from './types';

interface Options {
  /** Ms allowed between taps before progress resets to zero. */
  timeoutMs: number;
  /** Called once the full clockwise sequence is completed in order. */
  onComplete: () => void;
}

interface CornerSequence {
  /** How many corners have been correctly tapped so far (0..4). */
  progress: number;
  /** Register a corner tap. Out-of-order taps reset progress. */
  press: (corner: Corner) => void;
  /** Force progress back to zero (e.g. when the gate reopens). */
  reset: () => void;
}

/**
 * Tracks progress through the clockwise four-corner unlock sequence.
 *
 * Correctness rules that matter for a *child-proofing* gate:
 *  - Taps must be in the exact canonical order; any wrong corner resets.
 *  - Taps must be reasonably prompt; dawdling past `timeoutMs` resets. This
 *    defeats random mashing, which statistically cannot hit 4 specific corners
 *    in order inside a short window.
 *  - Re-tapping the corner you just tapped is ignored (not a reset) so an
 *    accidental adult double-tap is forgiving.
 */
export function useCornerSequence({
  timeoutMs,
  onComplete,
}: Options): CornerSequence {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const set = useCallback((n: number) => {
    progressRef.current = n;
    setProgress(n);
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    set(0);
  }, [clearTimer, set]);

  const press = useCallback(
    (corner: Corner) => {
      const current = progressRef.current;
      const expected = CORNER_ORDER[current];
      const justTapped = current > 0 ? CORNER_ORDER[current - 1] : null;

      if (corner === expected) {
        clearTimer();
        const next = current + 1;
        set(next);
        if (next >= CORNER_ORDER.length) {
          onCompleteRef.current();
          return;
        }
        timer.current = setTimeout(() => set(0), timeoutMs);
        return;
      }

      // Forgive an immediate repeat of the last correct corner.
      if (corner === justTapped) {
        return;
      }

      // Any other corner is a mistake -> reset.
      reset();
    },
    [clearTimer, reset, set, timeoutMs],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return {progress, press, reset};
}
