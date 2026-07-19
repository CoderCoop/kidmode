import Foundation
import UIKit
import React // RCTEventEmitter / sendEvent live in the React umbrella module

/**
 * Native bridge for device lockdown on iOS.
 *
 * iOS is deliberately stricter than Android: a normal app cannot force the user
 * into Guided Access. There are two realistic mechanisms, and this module drives
 * both:
 *
 *  1. Autonomous Single App Mode (ASAM). If the device is *supervised* (via
 *     Apple Configurator / MDM) and this app's bundle id is whitelisted for
 *     autonomous single app mode, `UIAccessibility.requestGuidedAccessSession`
 *     locks the device to this app with no user interaction. This is the true
 *     kiosk path for managed / institutional deployments.
 *
 *  2. Guided Access (user-initiated). On an unmanaged device the parent enables
 *     Guided Access once (Settings ▸ Accessibility ▸ Guided Access, then
 *     triple-click). While it is active iOS suppresses notifications, the Home
 *     indicator gesture, and hardware-button app-switching for us. This module
 *     detects that state and reports it so the JS layer knows the lockdown is
 *     genuinely in force.
 *
 * Either way we emit `KidModeKioskChanged` when the OS toggles Guided Access,
 * so JS stays in sync if the parent leaves via triple-click.
 */
@objc(Kiosk)
class Kiosk: RCTEventEmitter {

  private var hasListeners = false

  override init() {
    super.init()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(guidedAccessChanged),
      name: UIAccessibility.guidedAccessStatusDidChangeNotification,
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  override static func requiresMainQueueSetup() -> Bool { false }

  override func supportedEvents() -> [String]! { ["KidModeKioskChanged"] }

  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  @objc private func guidedAccessChanged() {
    guard hasListeners else { return }
    let active = UIAccessibility.isGuidedAccessEnabled
    sendEvent(
      withName: "KidModeKioskChanged",
      body: ["active": active, "reason": "system"]
    )
  }

  @objc(enterKiosk:rejecter:)
  func enterKiosk(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      if UIAccessibility.isGuidedAccessEnabled {
        resolve(self.status(active: true, mode: "guided-access"))
        return
      }
      // Attempt Autonomous Single App Mode. Succeeds only on a supervised,
      // whitelisted device; otherwise `success` is false and we degrade to a
      // soft lock (JS-side immersive guards remain in effect).
      UIAccessibility.requestGuidedAccessSession(enabled: true) { success in
        if success {
          resolve(self.status(active: true, mode: "single-app"))
          if self.hasListeners {
            self.sendEvent(
              withName: "KidModeKioskChanged",
              body: ["active": true, "reason": "entered"]
            )
          }
        } else {
          // Not managed: cannot force lockdown. Report soft so JS can prompt the
          // parent to enable Guided Access manually.
          resolve(self.status(active: false, mode: "soft"))
        }
      }
    }
  }

  @objc(exitKiosk:rejecter:)
  func exitKiosk(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      UIAccessibility.requestGuidedAccessSession(enabled: false) { _ in
        resolve(self.status(active: false, mode: "single-app"))
        if self.hasListeners {
          self.sendEvent(
            withName: "KidModeKioskChanged",
            body: ["active": false, "reason": "exited"]
          )
        }
      }
    }
  }

  @objc(isKioskActive:rejecter:)
  func isKioskActive(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(UIAccessibility.isGuidedAccessEnabled)
  }

  @objc(getCapabilities:rejecter:)
  func getCapabilities(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve([
      "platform": "ios",
      // Requestable only when supervised; JS treats this as best-effort.
      "canPinScreen": true,
      // Guided Access / Single App Mode suppresses notifications at the OS level.
      "canSuppressNotifications": true,
      "isDeviceOwner": false,
    ])
  }

  private func status(active: Bool, mode: String) -> [String: Any] {
    ["active": active, "platform": "ios", "mode": mode]
  }
}
