import {kioskManager} from '../src/kiosk/KioskManager';

describe('KioskManager', () => {
  afterEach(async () => {
    // Ensure a clean state between tests.
    if (kioskManager.isActive()) {
      await kioskManager.exit();
    }
  });

  it('enters lockdown and notifies subscribers', async () => {
    const events: boolean[] = [];
    const unsub = kioskManager.subscribe(e => events.push(e.active));

    await kioskManager.enter();
    expect(kioskManager.isActive()).toBe(true);
    expect(events).toContain(true);

    unsub();
  });

  it('exits lockdown and notifies subscribers', async () => {
    await kioskManager.enter();
    const events: boolean[] = [];
    const unsub = kioskManager.subscribe(e => events.push(e.active));

    await kioskManager.exit();
    expect(kioskManager.isActive()).toBe(false);
    expect(events).toContain(false);

    unsub();
  });

  it('is idempotent when entering twice', async () => {
    await kioskManager.enter();
    await kioskManager.enter();
    expect(kioskManager.isActive()).toBe(true);
  });

  it('reports capabilities from the native module', async () => {
    const caps = await kioskManager.getCapabilities();
    expect(caps).toHaveProperty('canPinScreen');
    expect(caps).toHaveProperty('platform');
  });
});
