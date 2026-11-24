#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

APK="e2e/android/artifacts/app-release.apk"
ARTIFACTS="e2e/android/artifacts"
FLOWS="e2e/android/flows"
PASSWORD="e2e-password"

ADB=(adb)
if [[ -n "${ANDROID_SERIAL:-}" ]]; then
  ADB=(adb -s "$ANDROID_SERIAL")
fi

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[[ -s "$APK" ]] || fail "APK tidak ada. Jalankan npm run android:e2e:build."
command -v maestro >/dev/null 2>&1 || fail "Maestro tidak ada di PATH."
"${ADB[@]}" get-state >/dev/null 2>&1 || fail "Tidak ada emulator yang terhubung."
[[ "$("${ADB[@]}" shell getprop ro.kernel.qemu | tr -d '\r')" == "1" ]] \
  || fail "Device bukan emulator Android."

"${ADB[@]}" shell settings put global window_animation_scale 0
"${ADB[@]}" shell settings put global transition_animation_scale 0
"${ADB[@]}" shell settings put global animator_duration_scale 0
# Google Password Manager menutupi UI setelah login dan membuat flow flaky.
"${ADB[@]}" shell settings put secure autofill_service null
"${ADB[@]}" shell svc power stayon true
"${ADB[@]}" shell input keyevent 82 || true

"${ADB[@]}" install -r "$APK" >/dev/null
mkdir -p "$ARTIFACTS"

GEO_PID=""
stop_geo() {
  if [[ -n "$GEO_PID" ]]; then
    kill "$GEO_PID" 2>/dev/null || true
    wait "$GEO_PID" 2>/dev/null || true
    GEO_PID=""
  fi
}
trap stop_geo EXIT

start_geo() {
  local lon="$1"
  local lat="$2"
  (
    while true; do
      "${ADB[@]}" emu geo fix "$lon" "$lat" >/dev/null 2>&1 || exit 1
      sleep 1
    done
  ) &
  GEO_PID=$!
}

run_flow() {
  local name="$1"
  local lon="$2"
  local lat="$3"
  local email="$4"

  printf '\n== %s ==\n' "$name"
  start_geo "$lon" "$lat"

  set +e
  maestro test \
    --format JUNIT \
    --no-ansi \
    --output "$ARTIFACTS/$name.xml" \
    --test-output-dir "$ARTIFACTS/$name" \
    -e EMAIL="$email" \
    -e PASSWORD="$PASSWORD" \
    "$FLOWS/$name.yaml"
  local status=$?
  set -e

  stop_geo

  if [[ $status -ne 0 ]]; then
    "${ADB[@]}" logcat -d > "$ARTIFACTS/logcat.txt" 2>/dev/null || true
    "${ADB[@]}" shell dumpsys location > "$ARTIFACTS/dumpsys-location.txt" 2>/dev/null || true
    exit "$status"
  fi
}

run_flow presensi-dalam-radius 110.4383 -7.0519 praktikan1@test.local
node e2e/android/verify.js
