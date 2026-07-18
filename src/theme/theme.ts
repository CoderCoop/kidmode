/**
 * Central design tokens.
 *
 * The palette is deliberately high-contrast and high-saturation: infants and
 * toddlers (0-5) respond most strongly to bold, saturated colour and clear
 * figure/ground separation. Every activity draws from this shared palette so
 * the sandbox reads as one coherent system.
 */

export const palette = {
  // Backdrop is near-black to make saturated marks "pop" (high contrast is
  // developmentally important for the youngest users).
  canvas: '#0B0B10',
  canvasAlt: '#141420',

  // A rotating set of bright, well-separated hues used for ripples/shapes.
  playful: [
    '#FF3B6B', // rose
    '#FF9F1C', // amber
    '#FFD400', // yellow
    '#2EC4B6', // teal
    '#3A86FF', // blue
    '#8338EC', // violet
    '#06D6A0', // green
    '#FF5DA2', // pink
  ] as const,

  // Chrome used only in the (parent-facing) gate + PIN surfaces.
  surface: '#1B1B24',
  surfaceRaised: '#26263340',
  textPrimary: '#FFFFFF',
  textMuted: '#9A9AB0',
  danger: '#FF4D4D',
  success: '#2EC4B6',
  overlayScrim: 'rgba(0,0,0,0.72)',
} as const;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
} as const;

/**
 * Pick a palette colour deterministically from any numeric seed. Deterministic
 * selection (rather than Math.random on the hot path) keeps the touch handler
 * allocation-free and makes rendering reproducible in tests.
 */
export function colorForSeed(seed: number): string {
  const list = palette.playful;
  const idx = Math.abs(Math.trunc(seed)) % list.length;
  return list[idx] as string;
}

export type Palette = typeof palette;
