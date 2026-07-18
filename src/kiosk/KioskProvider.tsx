import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {kioskManager} from './KioskManager';
import type {KioskCapabilities, KioskChangeReason} from './types';
import {createLogger} from '../utils/logger';

const log = createLogger('kiosk-provider');

interface KioskContextValue {
  /** True while the device is locked into the sandbox. */
  locked: boolean;
  /** Why the lock state last changed. */
  reason: KioskChangeReason | null;
  /** Coarse feature detection for the current device. */
  capabilities: KioskCapabilities | null;
  /** Enter lockdown (called on mount / when returning to play). */
  lock: () => Promise<void>;
  /** Release lockdown. MUST only be invoked from behind the parental gate. */
  unlock: () => Promise<void>;
}

const KioskContext = createContext<KioskContextValue | null>(null);

interface Props {
  children: React.ReactNode;
  /** Automatically enter lockdown when the provider mounts. Defaults to true. */
  autoLock?: boolean;
}

export function KioskProvider({children, autoLock = true}: Props): React.JSX.Element {
  const [locked, setLocked] = useState(false);
  const [reason, setReason] = useState<KioskChangeReason | null>(null);
  const [capabilities, setCapabilities] = useState<KioskCapabilities | null>(
    null,
  );
  // Guards against state updates after unmount.
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const unsub = kioskManager.subscribe(event => {
      if (!mounted.current) {
        return;
      }
      setLocked(event.active);
      setReason(event.reason);
    });

    kioskManager
      .getCapabilities()
      .then(caps => mounted.current && setCapabilities(caps))
      .catch(err => log.error('capabilities probe failed', err));

    return () => {
      mounted.current = false;
      unsub();
    };
  }, []);

  const lock = useCallback(async () => {
    try {
      await kioskManager.enter();
    } catch (err) {
      log.error('lock failed', err);
    }
  }, []);

  const unlock = useCallback(async () => {
    await kioskManager.exit();
  }, []);

  useEffect(() => {
    if (autoLock) {
      void lock();
    }
  }, [autoLock, lock]);

  const value = useMemo<KioskContextValue>(
    () => ({locked, reason, capabilities, lock, unlock}),
    [locked, reason, capabilities, lock, unlock],
  );

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
}

export function useKiosk(): KioskContextValue {
  const ctx = useContext(KioskContext);
  if (!ctx) {
    throw new Error('useKiosk must be used within a <KioskProvider>');
  }
  return ctx;
}
