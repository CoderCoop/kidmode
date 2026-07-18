import type React from 'react';
import type {ActivityHandle} from '../canvas/types';

/**
 * Metadata + component for a single pluggable activity. Adding a new activity is
 * a matter of authoring a forwardRef component that exposes an `ActivityHandle`
 * and registering an `ActivityDefinition` — no changes to the canvas or shell.
 */
export interface ActivityDefinition {
  /** Stable unique id (used for selection + persistence). */
  id: string;
  /** Human-facing (parent-facing) title. */
  title: string;
  /** A single emoji/glyph used on the activity switcher. */
  glyph: string;
  /** Accent colour for the switcher chip. */
  accent: string;
  /**
   * The activity component. Must forward a ref exposing `ActivityHandle.spawn`,
   * which the canvas calls for every touch. Implementations must keep `spawn`
   * allocation-free (drive Reanimated shared values, never setState per tap).
   */
  Component: React.ForwardRefExoticComponent<
    ActivityProps & React.RefAttributes<ActivityHandle>
  >;
}

/** Props passed to every activity by the shell. */
export interface ActivityProps {
  /** Logical canvas size in dp, for activities that need bounds. */
  width: number;
  height: number;
}

export type {ActivityHandle};
