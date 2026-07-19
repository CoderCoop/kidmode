package com.kidmode.kiosk

import android.app.admin.DeviceAdminReceiver

/**
 * Device-admin receiver required to provision the app as Device Owner, which
 * unlocks the strongest lockdown tier (no-confirmation screen pinning +
 * notification suppression via lock-task features).
 *
 * Provision on a factory-reset / no-accounts device with:
 *   adb shell dpm set-device-owner com.kidmode/.kiosk.KioskDeviceAdminReceiver
 *
 * Without this the app still works — it falls back to standard screen pinning.
 */
class KioskDeviceAdminReceiver : DeviceAdminReceiver()
