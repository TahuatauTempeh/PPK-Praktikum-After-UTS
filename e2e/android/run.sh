#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

APK="e2e/android/artifacts/app-release.apk"
ARTIFACTS="e2e/android/artifacts"
FLOWS="e2e/android/flows"
PASSWORD="e2e-password"
TIER="${TIER:-critical}"
MANIFEST="e2e/android/manifest.tsv"
RUN_JSON="e2e/.run/run.json"

ADB=(adb)
MAESTRO_DEVICE_ARGS=()
if [[ -n "${ANDROID_SERIAL:-}" ]]; then
  ADB=(adb -s "$ANDROID_SERIAL")
  MAESTRO_DEVICE_ARGS=(--udid "$ANDROID_SERIAL")
fi

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[[ -s "$APK" ]] || fail "APK tidak ada. Jalankan npm run android:e2e:build."
[[ -s "$MANIFEST" ]] || fail "Manifest flow tidak ada: $MANIFEST."
[[ -s "$RUN_JSON" ]] || fail "run.json tidak ada. Jalankan lewat npm run test:android."
command -v maestro >/dev/null 2>&1 || fail "Maestro tidak ada di PATH."
"${ADB[@]}" get-state >/dev/null 2>&1 || fail "Tidak ada emulator yang terhubung."
[[ "$("${ADB[@]}" shell getprop ro.kernel.qemu | tr -d '\r')" == "1" ]] \
  || fail "Device bukan emulator Android."

"${ADB[@]}" shell settings put global window_animation_scale 0
"${ADB[@]}" shell settings put global transition_animation_scale 0
"${ADB[@]}" shell settings put global animator_duration_scale 0
# Emulator CI yang lambat memunculkan dialog ANR Pixel Launcher di depan app.
"${ADB[@]}" shell settings put global hide_error_dialogs 1
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

restore_device() {
  "${ADB[@]}" shell settings put secure location_mode 3 >/dev/null 2>&1 || true
  "${ADB[@]}" shell pm grant com.ppk.presensipraktikum android.permission.ACCESS_FINE_LOCATION >/dev/null 2>&1 || true
  "${ADB[@]}" shell pm grant com.ppk.presensipraktikum android.permission.ACCESS_COARSE_LOCATION >/dev/null 2>&1 || true
}

prepare_flow() {
  local name="$1"
  case "$name" in
    izin-lokasi-dicabut)
      "${ADB[@]}" shell pm revoke com.ppk.presensipraktikum android.permission.ACCESS_FINE_LOCATION >/dev/null 2>&1 || true
      "${ADB[@]}" shell pm revoke com.ppk.presensipraktikum android.permission.ACCESS_COARSE_LOCATION >/dev/null 2>&1 || true
      ;;
    layanan-lokasi-mati)
      "${ADB[@]}" shell settings put secure location_mode 0
      ;;
  esac
}

trap 'stop_geo; restore_device' EXIT

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
  local tier="$2"
  local lon="$3"
  local lat="$4"
  local email="$5"

  [[ "$TIER" == "full" || "$tier" == "$TIER" ]] || return 0

  local session_id
  session_id="$(node -e "const j=require('./$RUN_JSON');const f=j.flows['$name']??{};process.stdout.write(f.sessionId??'')")"
  [[ -n "$session_id" ]] || fail "Session ID untuk flow $name tidak ada di run.json."

  printf '\n== %s ==\n' "$name"
  prepare_flow "$name"
  start_geo "$lon" "$lat"

  set +e
  maestro test \
    --format JUNIT \
    --no-ansi \
    --output "$ARTIFACTS/$name.xml" \
    --test-output-dir "$ARTIFACTS/$name" \
    -e RUN_DATE="$(node -e "const j=require('./$RUN_JSON');process.stdout.write(j.runDate)")" \
    -e SESSION_ID="$session_id" \
    -e EMAIL="$email" \
    -e PASSWORD="$PASSWORD" \
    -e REASON="$(node -e "const j=require('./$RUN_JSON');const f=j.flows['$name']??{};process.stdout.write(f.reason??'')")" \
    "${MAESTRO_DEVICE_ARGS[@]}" \
    "$FLOWS/$name.yaml" </dev/null
  local status=$?
  set -e

  stop_geo
  restore_device

  if [[ $status -ne 0 ]]; then
    "${ADB[@]}" logcat -d > "$ARTIFACTS/logcat.txt" 2>/dev/null || true
    "${ADB[@]}" shell dumpsys location > "$ARTIFACTS/dumpsys-location.txt" 2>/dev/null || true
    exit "$status"
  fi
}

while IFS=$'\t' read -r -u 3 name tier lon lat email; do
  [[ -z "$name" || "$name" == \#* ]] && continue
  run_flow "$name" "$tier" "$lon" "$lat" "$email"
done 3< "$MANIFEST"

TIER="$TIER" node e2e/android/verify.js
