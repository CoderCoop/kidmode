# Release signing

The CI pipeline (`ci/build.yml` → move to `.github/workflows/build.yml` to
activate) builds **unsigned/debug-signed** packages out of the box. Add the
repository secrets below (Settings ▸ Secrets and variables ▸ Actions) to have it
emit **properly signed** builds instead. Each platform's signing is independent;
configure one, both, or neither.

## Android — a release-signed APK

Generate an upload keystore once:

```bash
keytool -genkeypair -v -keystore babymode-upload.jks \
  -alias babymode -keyalg RSA -keysize 2048 -validity 10000
```

Then set these secrets:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 babymode-upload.jks` (the keystore, base64-encoded) |
| `ANDROID_KEYSTORE_PASSWORD` | the store password you chose |
| `ANDROID_KEY_ALIAS` | `babymode` (the alias above) |
| `ANDROID_KEY_PASSWORD` | the key password you chose |

When `ANDROID_KEYSTORE_BASE64` is present, CI decodes the keystore, appends the
`BABYMODE_UPLOAD_*` Gradle properties, and `assembleRelease` signs with it (see
the `signingConfigs.release` block in `android/app/build.gradle`). When absent,
the release APK falls back to debug signing so the build never breaks.

> macOS/Linux `base64 -w0`; on macOS use `base64 -i babymode-upload.jks`.

## iOS — a signed device `.ipa`

Requires an Apple Developer account, a signing certificate (`.p12`), and a
matching provisioning profile (`.mobileprovision`) for the app id `com.babymode`.

| Secret | Value |
|---|---|
| `IOS_CERTIFICATE_BASE64` | base64 of your `.p12` signing certificate |
| `IOS_CERTIFICATE_PASSWORD` | the `.p12` export password |
| `IOS_PROVISION_PROFILE_BASE64` | base64 of your `.mobileprovision` |
| `IOS_PROVISION_PROFILE_NAME` | the profile's **name** (not filename), e.g. `BabyMode Ad Hoc` |
| `IOS_TEAM_ID` | your 10-char Apple Team ID |
| `IOS_CODE_SIGN_IDENTITY` | *(optional)* e.g. `Apple Distribution` (default) or `Apple Development` |
| `IOS_EXPORT_METHOD` | *(optional)* `development` (default), `ad-hoc`, `app-store`, or `enterprise` |

Encode files with `base64 -i cert.p12 | pbcopy`.

When `IOS_CERTIFICATE_BASE64` is present, CI imports the cert into a temporary
keychain, installs the profile, archives with manual signing, and runs
`-exportArchive` to produce `babymode-ios-ipa`. When absent, it builds the
unsigned Simulator `.app` (`babymode-ios-simulator-app`) instead.

### Notes

- The export **method** must match the profile type: an `app-store` profile
  can't export `ad-hoc`, etc.
- For App Store / TestFlight distribution you'll typically use
  `IOS_EXPORT_METHOD=app-store` with an *Apple Distribution* certificate and a
  distribution provisioning profile.
- The bundle identifier is `com.babymode` (see `ios/BabyMode.xcodeproj`). Your
  certificate/profile must be issued for it (or change the id to one you own).
