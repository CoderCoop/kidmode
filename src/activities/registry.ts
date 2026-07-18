import type {ActivityDefinition} from './types';
import {RippleActivity} from './ripples/RippleActivity';
import {PopActivity} from './popping/PopActivity';
import {SoundboardActivity} from './soundboard/SoundboardActivity';
import {palette} from '../theme/theme';

/**
 * The activity registry. This is the single extension point for the modular
 * architecture: to add a new play module, author a forwardRef component that
 * exposes an `ActivityHandle` and append its definition here. The shell renders
 * the switcher and canvas straight from this list — nothing else changes.
 */
export const ACTIVITIES: readonly ActivityDefinition[] = [
  {
    id: 'ripples',
    title: 'Ripples',
    glyph: '💧',
    accent: palette.playful[4],
    Component: RippleActivity,
  },
  {
    id: 'pop',
    title: 'Pop',
    glyph: '🎈',
    accent: palette.playful[0],
    Component: PopActivity,
  },
  {
    id: 'sounds',
    title: 'Sounds',
    glyph: '🎹',
    accent: palette.playful[6],
    Component: SoundboardActivity,
  },
];

export function getActivity(id: string): ActivityDefinition {
  const found = ACTIVITIES.find(a => a.id === id);
  return found ?? (ACTIVITIES[0] as ActivityDefinition);
}
