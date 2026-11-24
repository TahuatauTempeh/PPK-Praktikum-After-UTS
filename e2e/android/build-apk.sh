#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

source e2e/android/env.sh
export E2E_ANDROID=1

created_placeholder=0

cleanup() {
  rm -rf android
  if [[ "$created_placeholder" == "1" ]]; then
    rm -f google-services.json
  fi
}
trap cleanup EXIT

if [[ ! -f google-services.json ]]; then
  cp e2e/android/fixtures/gs-placeholder.json google-services.json
  created_placeholder=1
fi

rm -f e2e/android/artifacts/app-release.apk

npx expo prebuild --platform android --clean --no-install

grep -q 'android:usesCleartextTraffic="true"' android/app/src/main/AndroidManifest.xml

(cd android && ./gradlew assembleRelease)

mkdir -p e2e/android/artifacts
cp android/app/build/outputs/apk/release/app-release.apk e2e/android/artifacts/app-release.apk
test -s e2e/android/artifacts/app-release.apk

AAPT2="${ANDROID_HOME:-$HOME/Android/Sdk}/build-tools/37.0.0/aapt2"
"$AAPT2" dump permissions e2e/android/artifacts/app-release.apk \
  | grep 'ACCESS_FINE_LOCATION' >/dev/null
