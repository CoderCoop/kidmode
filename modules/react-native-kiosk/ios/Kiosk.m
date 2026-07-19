#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// Bridges the Swift `Kiosk` class (an RCTEventEmitter) into the React Native
// module registry. Method signatures must mirror the @objc selectors in
// Kiosk.swift exactly.
@interface RCT_EXTERN_MODULE (Kiosk, RCTEventEmitter)

RCT_EXTERN_METHOD(enterKiosk
                  : (RCTPromiseResolveBlock)resolve
                  rejecter : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(exitKiosk
                  : (RCTPromiseResolveBlock)resolve
                  rejecter : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isKioskActive
                  : (RCTPromiseResolveBlock)resolve
                  rejecter : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCapabilities
                  : (RCTPromiseResolveBlock)resolve
                  rejecter : (RCTPromiseRejectBlock)reject)

@end
