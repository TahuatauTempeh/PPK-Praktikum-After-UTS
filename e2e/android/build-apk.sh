#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

TARGET="${E2E_TARGET:-emulator}"

case "$TARGET" in
  emulator)
    source e2e/android/env.sh
    export E2E_ANDROID=1
    ;;
  device-emulator)
    source e2e/android/env.sh
    export EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1
    export E2E_ANDROID=1
    ;;
  live)
    [[ -f .env ]] || fail "Build live membutuhkan .env dengan konfigurasi Firebase."
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
    unset EXPO_PUBLIC_FIREBASE_EMULATOR_HOST
    [[ -f google-services.json ]] || fail "Build live membutuhkan google-services.json asli."
    ;;
  *)
    fail "E2E_TARGET tidak dikenal: $TARGET (gunakan emulator, device-emulator, atau live)."
    ;;
esac

# Emulator memakai x86_64; perangkat fisik memakai arm64-v8a.
if [[ -n "${E2E_ANDROID_ABI:-}" ]]; then
  ABI="$E2E_ANDROID_ABI"
elif [[ "$TARGET" == "emulator" ]]; then
  ABI="x86_64"
else
  ABI="arm64-v8a"
fi

created_placeholder=0
GS_BACKUP=""

cleanup() {
  rm -rf android
  if [[ "$created_placeholder" == "1" ]]; then
    rm -f google-services.json
  fi
  if [[ -n "$GS_BACKUP" && -f "$GS_BACKUP" ]]; then
    mv "$GS_BACKUP" google-services.json
  fi
}
trap cleanup EXIT

if [[ "$TARGET" != "live" ]]; then
  # Build demo harus memakai project demo, bukan google-services.json produksi
  # yang mungkin ada di checkout lokal.
  if [[ -f google-services.json ]]; then
    GS_BACKUP="google-services.json.e2e-backup"
    mv google-services.json "$GS_BACKUP"
  fi
  cp e2e/android/fixtures/gs-placeholder.json google-services.json
  created_placeholder=1
fi

if [[ "$TARGET" == "live" ]]; then
  GS_PROJECT_ID="$(node -e "process.stdout.write(require('./google-services.json').project_info.project_id)")"
  [[ "$GS_PROJECT_ID" == "${EXPO_PUBLIC_FIREBASE_PROJECT_ID:-}" ]] \
    || fail "google-services.json ($GS_PROJECT_ID) tidak cocok dengan EXPO_PUBLIC_FIREBASE_PROJECT_ID."
  [[ "$GS_PROJECT_ID" != demo-* ]] || fail "Build live tidak boleh memakai project demo-."
fi

rm -f e2e/android/artifacts/app-release.apk

npx expo prebuild --platform android --clean --no-install

if [[ "$TARGET" != "live" ]]; then
  grep -q 'android:usesCleartextTraffic="true"' android/app/src/main/AndroidManifest.xml
fi

(cd android && ./gradlew assembleRelease -PreactNativeArchitectures="$ABI")

mkdir -p e2e/android/artifacts
cp android/app/build/outputs/apk/release/app-release.apk e2e/android/artifacts/app-release.apk
test -s e2e/android/artifacts/app-release.apk

APK_LIBS="$(unzip -l e2e/android/artifacts/app-release.apk)"
grep "lib/$ABI/" <<<"$APK_LIBS" >/dev/null
OTHER_ABI="$(grep -E 'lib/(arm64-v8a|armeabi-v7a|x86|x86_64)/' <<<"$APK_LIBS" | grep -v "lib/$ABI/" || true)"
if [[ -n "$OTHER_ABI" ]]; then
  printf 'APK memuat ABI di luar %s:\n%s\n' "$ABI" "$OTHER_ABI" >&2
  exit 1
fi

AAPT2="${ANDROID_HOME:-$HOME/Android/Sdk}/build-tools/37.0.0/aapt2"
"$AAPT2" dump permissions e2e/android/artifacts/app-release.apk \
  | grep 'ACCESS_FINE_LOCATION' >/dev/null
