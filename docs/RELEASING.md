# Releasing

Kid Mode uses [semantic versioning](https://semver.org): **`MAJOR.MINOR.PATCH`**.

- **MAJOR** — incompatible / behaviour-changing releases.
- **MINOR** — new functionality, backwards compatible.
- **PATCH** — backwards-compatible bug fixes.

A release is cut by pushing a matching **`v`-prefixed git tag**. Everything else
is automated by [`.github/workflows/release.yml`](../.github/workflows/release.yml).

## Cut a release

```bash
# from an up-to-date main
git tag v1.2.3
git push origin v1.2.3
```

That triggers the **Release** workflow, which:

1. **Validates** the tag is semver (`v1.2.3`, or a pre-release like
   `v1.2.3-beta.1`). Non-semver tags fail fast without building.
2. **Builds** the Android APK — the same recipe the CI `android` job in
   [`build.yml`](../.github/workflows/build.yml) uses — with the version
   stamped in:
   - `versionName` = the tag without the `v` (e.g. `1.2.3`);
   - `versionCode` = a derived integer, `MAJOR*1000000 + MINOR*1000 + PATCH`
     (so `v1.2.3` → `1002003`), which increases with every release as the Play
     Store requires.
3. **Publishes** a [GitHub Release](https://github.com/CoderCoop/kidmode/releases)
   named `Kid Mode v1.2.3` with auto-generated notes and `kidmode-v1.2.3.apk`
   attached as a **direct, login-free download**.

Pre-release tags (any `-suffix`, e.g. `v1.3.0-rc.1`) are published as GitHub
**pre-releases**.

## Installing the released APK

Download the `.apk` from the release page and open it on an Android device
(Settings must allow installing from unknown sources), or:

```bash
adb install kidmode-v1.2.3.apk
```

By default the APK is **debug-signed**, which is fine for sideloading. To emit a
**release-signed** APK (required for the Play Store), configure the Android
signing secrets in [RELEASE_SIGNING.md](RELEASE_SIGNING.md); the release build
picks them up automatically.

## Where the version lives

`android/app/build.gradle` reads `KIDMODE_VERSION_NAME` / `KIDMODE_VERSION_CODE`
Gradle properties when present and otherwise falls back to a `0.0.0`
placeholder, so local and untagged CI builds never need a real version while
tagged releases always carry the tag's version.

Two other places declare a version and should be bumped to match the tag when
you cut a release (they are not auto-stamped, since the release workflow builds
only the Android APK):

- `package.json` → `"version"` (must stay valid semver `MAJOR.MINOR.PATCH`).
- iOS `MARKETING_VERSION` in `ios/KidMode.xcodeproj/project.pbxproj` (semver);
  bump `CURRENT_PROJECT_VERSION` (the build number) alongside it.
