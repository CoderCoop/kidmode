import {
  AppState,
  BackHandler,
  NativeEventEmitter,
  Platform,
  type NativeEventSubscription,
} from 'react-native';
import NativeKiosk, {hasNativeKiosk} from './NativeKiosk';
import {
  KIOSK_EVENT,
  type KioskCapabilities,
  type KioskChangeEvent,
  type KioskStatus,
} from './types';
import {createLogger} from '../utils/logger';

const log = createLogger('kiosk');

type Listener = (event: KioskChangeEvent) => void;

/**
 * KioskManager centralises everything about the lockdown lifecycle:
 *
 *  1. Delegates the OS-level lockdown to the native module (screen pinning /
 *     lock-task on Android, Guided Access / Single App Mode on iOS).
 *  2. Adds a JS-side safety net that works even when no native module is
 *     present: it traps the hardware Back button so the toddler can never
 *     background the app, and it watches AppState so we know if the OS ever
 *     forces us out of the lockdown.
 *  3. Fans out a single source-of-truth `active` state to React via a small
 *     subscription API (consumed by useKiosk / KioskProvider).
 *
 * It is a module-level singleton because the hardware Back button and AppState
 * are process-global; having two managers fight over them would be a bug.
 */
class KioskManager {
  private active = false;
  private readonly listeners = new Set<Listener>();
  private emitterSub: {remove: () => void} | null = null;
  private backSub: NativeEventSubscription | null = null;
  private appStateSub: NativeEventSubscription | null = null;
  private capabilities: KioskCapabilities | null = null;

  isActive(): boolean {
    return this.active;
  }

  async getCapabilities(): Promise<KioskCapabilities> {
    if (!this.capabilities) {
      this.capabilities = await NativeKiosk.getCapabilities();
    }
    return this.capabilities;
  }

  /** Subscribe to lockdown changes. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Enter lockdown. Idempotent: calling it while already active is a no-op that
   * still resolves with the current status.
   */
  async enter(): Promise<KioskStatus> {
    this.attachGuards();
    if (this.active) {
      return {
        active: true,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        mode: hasNativeKiosk ? 'lock-task' : 'soft',
      };
    }
    try {
      const status = await NativeKiosk.enterKiosk();
      this.setActive(status.active, 'entered');
      log.info('entered lockdown', status);
      return status;
    } catch (err) {
      log.error('enterKiosk failed', err);
      this.emit({active: this.active, reason: 'denied'});
      throw err;
    }
  }

  /** Release lockdown. Only ever called from behind the parental gate. */
  async exit(): Promise<KioskStatus> {
    try {
      const status = await NativeKiosk.exitKiosk();
      this.setActive(status.active, 'exited');
      log.info('exited lockdown', status);
      return status;
    } catch (err) {
      log.error('exitKiosk failed', err);
      throw err;
    } finally {
      this.detachGuards();
    }
  }

  /** Wire up the process-global guards + native event stream. */
  private attachGuards(): void {
    if (!this.backSub) {
      // Returning true from the handler swallows the Back press so Android can
      // never pop our activity off the stack. This is the JS half of the
      // "disable hardware button routing" requirement; the native half blocks
      // Home/Recents/Power via lock-task features.
      this.backSub = BackHandler.addEventListener('hardwareBackPress', () => {
        log.debug('hardware back trapped');
        return true;
      });
    }

    if (!this.appStateSub) {
      this.appStateSub = AppState.addEventListener('change', next => {
        // If the OS ever backgrounds us while we believe we are locked, the
        // lockdown was breached (or the parent legitimately left). Reconcile.
        if (next !== 'active' && this.active) {
          log.warn(`app moved to "${next}" while locked; reconciling`);
          void this.reconcile();
        }
      });
    }

    if (!this.emitterSub && hasNativeKiosk) {
      const emitter = new NativeEventEmitter(
        NativeKiosk as unknown as ConstructorParameters<
          typeof NativeEventEmitter
        >[0],
      );
      const sub = emitter.addListener(KIOSK_EVENT, (event: KioskChangeEvent) => {
        // The native side is authoritative about system-initiated changes.
        this.setActive(event.active, event.reason);
      });
      this.emitterSub = {remove: () => sub.remove()};
    }
  }

  private detachGuards(): void {
    this.backSub?.remove();
    this.backSub = null;
    this.appStateSub?.remove();
    this.appStateSub = null;
    this.emitterSub?.remove();
    this.emitterSub = null;
  }

  /** Re-query the native truth and align local state. */
  private async reconcile(): Promise<void> {
    try {
      const stillActive = await NativeKiosk.isKioskActive();
      if (stillActive !== this.active) {
        this.setActive(stillActive, 'system');
      }
    } catch (err) {
      log.error('reconcile failed', err);
    }
  }

  private setActive(next: boolean, reason: KioskChangeEvent['reason']): void {
    if (next === this.active && reason !== 'system') {
      return;
    }
    this.active = next;
    this.emit({active: next, reason});
  }

  private emit(event: KioskChangeEvent): void {
    this.listeners.forEach(l => {
      try {
        l(event);
      } catch (err) {
        log.error('listener threw', err);
      }
    });
  }
}

export const kioskManager = new KioskManager();
export type {KioskManager};
