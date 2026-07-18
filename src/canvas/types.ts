/**
 * A single normalized touch delivered to an activity.
 *
 * `id` is the platform pointer id, stable for the lifetime of one finger's
 * contact, so activities can correlate down/move/up if they wish. `seed` is a
 * monotonically increasing counter used to pick deterministic colours/shapes
 * without touching Math.random on the hot path.
 */
export interface Tap {
  id: number;
  x: number;
  y: number;
  seed: number;
  /** UI-thread timestamp (ms) of the originating native event. */
  t: number;
}

/**
 * The imperative surface every activity exposes to the canvas. The canvas calls
 * `spawn` for each new touch; activities must make it allocation-free and
 * non-blocking (drive Reanimated shared values, never setState per tap).
 */
export interface ActivityHandle {
  spawn(tap: Tap): void;
}
