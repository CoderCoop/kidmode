import {Platform, Vibration} from 'react-native';

/**
 * Lightweight, dependency-free tactile feedback.
 *
 * Real audio playback in React Native needs a native module (e.g.
 * react-native-sound); to keep this sandbox self-contained and asset-free we
 * ship haptics out of the box and expose a `SoundEngine` seam (see
 * `soundboard/SoundboardActivity`) where a project can drop in real audio.
 *
 * Haptics are deliberately short so rapid mashing does not turn into one long
 * buzz; Android honours the exact millisecond duration, iOS approximates.
 */
export function tick(durationMs = 12): void {
  // A very short pulse. iOS ignores the duration arg but still gives a light tap.
  Vibration.vibrate(Platform.OS === 'android' ? durationMs : 1);
}

/** A slightly longer, more satisfying "pop" for shape-popping. */
export function pop(): void {
  Vibration.vibrate(Platform.OS === 'android' ? 25 : 1);
}

/** Pluggable audio seam. The default is a no-op; wire a real engine at startup. */
export interface SoundEngine {
  /** Play the tone/sample associated with a soundboard pad index. */
  play(padIndex: number): void;
}

let engine: SoundEngine | null = null;

export function setSoundEngine(next: SoundEngine | null): void {
  engine = next;
}

export function playPad(padIndex: number): void {
  engine?.play(padIndex);
}
