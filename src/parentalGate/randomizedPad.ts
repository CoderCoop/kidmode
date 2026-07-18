/**
 * Builds a randomized digit layout for the PIN pad.
 *
 * Randomizing the key positions on every gate open defeats "positional memory":
 * a child (or an adult peeking) cannot learn the PIN as a fixed spatial gesture,
 * because 2-4-6-8 lands somewhere different each time. It also means the parent
 * must actually *read* the digits — a literacy gate the 0-5 cohort has not
 * crossed.
 */
export function shuffledDigits(
  rng: () => number = Math.random,
): readonly number[] {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  // Fisher-Yates.
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = digits[i] as number;
    const b = digits[j] as number;
    digits[i] = b;
    digits[j] = a;
  }
  return digits;
}

/**
 * Constant-time-ish PIN comparison. PINs here are short and low-stakes (they
 * gate a *toddler*, not a bank), but we still avoid early-exit string compare so
 * behaviour does not subtly depend on how many leading digits matched.
 */
export function pinMatches(entered: string, expected: string): boolean {
  if (entered.length !== expected.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    // eslint-disable-next-line no-bitwise -- constant-time accumulate, by design
    diff |= entered.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
