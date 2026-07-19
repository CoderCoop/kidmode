import {ACTIVITIES, getActivity} from '../src/activities/registry';
import {palette} from '../src/theme/theme';

describe('activity registry', () => {
  it('exposes at least the built-in activities', () => {
    expect(ACTIVITIES.length).toBeGreaterThanOrEqual(5);
  });

  it('gives every activity a unique id', () => {
    const ids = ACTIVITIES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('fully populates every activity definition', () => {
    const accents = new Set<string>(palette.playful);
    for (const a of ACTIVITIES) {
      expect(a.id).toMatch(/^[a-z][a-z0-9]*$/);
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.glyph.length).toBeGreaterThan(0);
      expect(accents.has(a.accent)).toBe(true);
      expect(typeof a.Component).toBe('object'); // forwardRef exotic component
    }
  });

  it('resolves known ids and falls back to the first activity', () => {
    const first = ACTIVITIES[0];
    for (const a of ACTIVITIES) {
      expect(getActivity(a.id)).toBe(a);
    }
    expect(getActivity('does-not-exist')).toBe(first);
  });
});
