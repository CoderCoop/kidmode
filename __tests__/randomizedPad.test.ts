import {pinMatches, shuffledDigits} from '../src/parentalGate/randomizedPad';

describe('shuffledDigits', () => {
  it('returns a permutation of 0-9 with no repeats or omissions', () => {
    const digits = shuffledDigits();
    expect(digits).toHaveLength(10);
    expect([...digits].sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('is deterministic given a fixed rng', () => {
    const seq = [0.1, 0.9, 0.4, 0.7, 0.2, 0.5, 0.33, 0.66, 0.15, 0.85];
    let i = 0;
    const rng = () => seq[i++ % seq.length]!;
    let j = 0;
    const rng2 = () => seq[j++ % seq.length]!;
    expect(shuffledDigits(rng)).toEqual(shuffledDigits(rng2));
  });

  it('actually reorders (not the identity) for a typical rng', () => {
    // With a shuffle that always picks index 0, order changes meaningfully.
    const digits = shuffledDigits(() => 0);
    expect(digits).not.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe('pinMatches', () => {
  it('accepts the exact PIN', () => {
    expect(pinMatches('2468', '2468')).toBe(true);
  });

  it('rejects wrong PINs of equal length', () => {
    expect(pinMatches('2469', '2468')).toBe(false);
    expect(pinMatches('0000', '2468')).toBe(false);
  });

  it('rejects length mismatches', () => {
    expect(pinMatches('246', '2468')).toBe(false);
    expect(pinMatches('24680', '2468')).toBe(false);
    expect(pinMatches('', '2468')).toBe(false);
  });
});
