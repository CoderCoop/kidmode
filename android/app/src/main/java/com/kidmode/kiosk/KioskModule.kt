package com.kidmode.kiosk

import android.app.Activity
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.os.Build
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Native bridge for device lockdown on Android.
 *
 * Two tiers of lockdown, chosen automatically:
 *
 *  1. Device Owner (strongest). If the app has been provisioned as Device Owner
 *     (`adb shell dpm set-device-owner ...`, or via EMM/MDM), we set lock-task
 *     packages and call [Activity.startLockTask]. Screen pinning then engages
 *     with NO user confirmation, Home/Recents/Back/Power are neutralised, and
 *     [DevicePolicyManager.setLockTaskFeatures] lets us suppress notifications,
 *     the status bar, and the global-actions (long-press power) menu.
 *
 *  2. Screen Pinning (portable). Without Device Owner we still call
 *     [Activity.startLockTask], which pins the current task. The OS shows a
 *     one-time confirmation and the user could theoretically long-press
 *     Back+Recents to leave — so the JS layer keeps trapping the Back button and
 *     re-asserting immersive mode as a second line of defence.
 *
 * All window/insets mutations run on the UI thread via [Activity.runOnUiThread].
 */
class KioskModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  private val dpm: DevicePolicyManager?
    get() = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager

  private val adminComponent: ComponentName
    get() = ComponentName(reactContext, KioskDeviceAdminReceiver::class.java)

  private fun isDeviceOwner(): Boolean =
    dpm?.isDeviceOwnerApp(reactContext.packageName) == true

  @ReactMethod
  fun enterKiosk(promise: Promise) {
    val activity: Activity =
      currentActivity ?: run {
        promise.reject("no_activity", "No foreground activity to lock")
        return
      }

    activity.runOnUiThread {
      try {
        val owner = isDeviceOwner()
        val policyManager = dpm
        if (owner && policyManager != null) {
          // Restrict lock-task to *this* app only.
          policyManager.setLockTaskPackages(
            adminComponent,
            arrayOf(reactContext.packageName),
          )
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // Keep the system-info bar for the clock but suppress everything a
            // child could use to escape: home, overview, notifications, and the
            // global-actions (power long-press) dialog.
            policyManager.setLockTaskFeatures(
              adminComponent,
              DevicePolicyManager.LOCK_TASK_FEATURE_SYSTEM_INFO,
            )
          }
        }

        activity.startLockTask()
        keepScreenOn(activity, true)
        applyImmersive(activity)

        val mode = if (owner) "device-owner" else "lock-task"
        promise.resolve(statusMap(active = true, mode = mode))
        emitChange(active = true, reason = "entered")
      } catch (e: Exception) {
        promise.reject("enter_failed", e)
      }
    }
  }

  @ReactMethod
  fun exitKiosk(promise: Promise) {
    val activity: Activity =
      currentActivity ?: run {
        promise.reject("no_activity", "No foreground activity")
        return
      }
    activity.runOnUiThread {
      try {
        activity.stopLockTask()
        keepScreenOn(activity, false)
        val mode = if (isDeviceOwner()) "device-owner" else "lock-task"
        promise.resolve(statusMap(active = false, mode = mode))
        emitChange(active = false, reason = "exited")
      } catch (e: Exception) {
        promise.reject("exit_failed", e)
      }
    }
  }

  @ReactMethod
  fun isKioskActive(promise: Promise) {
    val am =
      reactContext.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
    val active =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        am?.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
      } else {
        @Suppress("DEPRECATION")
        am?.isInLockTaskMode == true
      }
    promise.resolve(active == true)
  }

  @ReactMethod
  fun getCapabilities(promise: Promise) {
    val owner = isDeviceOwner()
    val caps: WritableMap = Arguments.createMap()
    caps.putString("platform", "android")
    caps.putBoolean("canPinScreen", true)
    // OS-level notification suppression needs Device Owner + lock-task features.
    caps.putBoolean("canSuppressNotifications", owner)
    caps.putBoolean("isDeviceOwner", owner)
    promise.resolve(caps)
  }

  // Required so React Native's NativeEventEmitter does not warn.
  @ReactMethod fun addListener(eventName: String) { /* no-op */ }

  @ReactMethod fun removeListeners(count: Int) { /* no-op */ }

  // --- helpers -------------------------------------------------------------

  private fun keepScreenOn(activity: Activity, on: Boolean) {
    if (on) {
      activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    } else {
      activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
  }

  /** Hide the status + navigation bars and make them non-swipe-revealable. */
  private fun applyImmersive(activity: Activity) {
    val window = activity.window
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.setDecorFitsSystemWindows(false)
      window.insetsController?.let { controller ->
        controller.hide(WindowInsets.Type.systemBars())
        controller.systemBarsBehavior =
          WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      }
    } else {
      @Suppress("DEPRECATION")
      window.decorView.systemUiVisibility =
        (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_FULLSCREEN
          or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN)
    }
  }

  private fun statusMap(active: Boolean, mode: String): WritableMap {
    val map: WritableMap = Arguments.createMap()
    map.putBoolean("active", active)
    map.putString("platform", "android")
    map.putString("mode", mode)
    return map
  }

  private fun emitChange(active: Boolean, reason: String) {
    val payload: WritableMap = Arguments.createMap()
    payload.putBoolean("active", active)
    payload.putString("reason", reason)
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(EVENT_NAME, payload)
  }

  companion object {
    const val NAME = "Kiosk"
    const val EVENT_NAME = "KidModeKioskChanged"
  }
}
