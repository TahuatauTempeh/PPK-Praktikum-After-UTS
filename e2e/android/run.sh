#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

APK="e2e/android/artifacts/app-release.apk"
ARTIFACTS="e2e/android/artifacts"
FLOWS="e2e/android/flows"
PASSWORD="e2e-password"
TIER="${TIER:-critical}"
MANIFEST="${MANIFEST:-e2e/android/manifest.tsv}"
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
"${ADB[@]}" get-state >/dev/null 2>&1 || fail "Tidak ada emulator atau perangkat yang terhubung."

IS_EMULATOR="$("${ADB[@]}" shell getprop ro.kernel.qemu 2>/dev/null | tr -d '\r')"
if [[ "$IS_EMULATOR" != "1" && "${ALLOW_REAL_DEVICE:-0}" != "1" ]]; then
  fail "Device bukan emulator. Set ALLOW_REAL_DEVICE=1 untuk perangkat fisik."
fi

REVERSE_PORTS=()
add_reverse() {
  local port="$1"
  "${ADB[@]}" reverse "tcp:$port" "tcp:$port" >/dev/null
  REVERSE_PORTS+=("$port")
}

if [[ "$IS_EMULATOR" != "1" && "${E2E_DEVICE_BACKEND:-emulator}" == "emulator" ]]; then
  add_reverse 8080
  add_reverse 9099
fi

ORIG_WINDOW_ANIMATION_SCALE="$("${ADB[@]}" shell settings get global window_animation_scale 2>/dev/null | tr -d '\r')"
ORIG_TRANSITION_ANIMATION_SCALE="$("${ADB[@]}" shell settings get global transition_animation_scale 2>/dev/null | tr -d '\r')"
ORIG_ANIMATOR_DURATION_SCALE="$("${ADB[@]}" shell settings get global animator_duration_scale 2>/dev/null | tr -d '\r')"
ORIG_HIDE_ERROR_DIALOGS="$("${ADB[@]}" shell settings get global hide_error_dialogs 2>/dev/null | tr -d '\r')"
ORIG_AUTOFILL_SERVICE="$("${ADB[@]}" shell settings get secure autofill_service 2>/dev/null | tr -d '\r')"
ORIG_STAY_ON="$("${ADB[@]}" shell settings get global stay_on_while_plugged_in 2>/dev/null | tr -d '\r')"

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
PROVIDER_NAME="gps"
PROVIDER_ADDED=0

stop_geo() {
  if [[ -n "$GEO_PID" ]]; then
    kill "$GEO_PID" 2>/dev/null || true
    wait "$GEO_PID" 2>/dev/null || true
    GEO_PID=""
  fi
  if [[ "$PROVIDER_ADDED" == "1" ]]; then
    "${ADB[@]}" shell cmd location providers remove-test-provider "$PROVIDER_NAME" >/dev/null 2>&1 || true
    PROVIDER_ADDED=0
  fi
}

restore_device() {
  if [[ "$IS_EMULATOR" == "1" ]]; then
    "${ADB[@]}" shell settings put secure location_mode 3 >/dev/null 2>&1 || true
  else
    "${ADB[@]}" shell cmd location set-location-enabled true >/dev/null 2>&1 || true
  fi
  "${ADB[@]}" shell pm grant com.ppk.presensipraktikum android.permission.ACCESS_FINE_LOCATION >/dev/null 2>&1 || true
  "${ADB[@]}" shell pm grant com.ppk.presensipraktikum android.permission.ACCESS_COARSE_LOCATION >/dev/null 2>&1 || true
  [[ -n "$ORIG_WINDOW_ANIMATION_SCALE" ]] && \
    "${ADB[@]}" shell settings put global window_animation_scale "$ORIG_WINDOW_ANIMATION_SCALE" >/dev/null 2>&1 || true
  [[ -n "$ORIG_TRANSITION_ANIMATION_SCALE" ]] && \
    "${ADB[@]}" shell settings put global transition_animation_scale "$ORIG_TRANSITION_ANIMATION_SCALE" >/dev/null 2>&1 || true
  [[ -n "$ORIG_ANIMATOR_DURATION_SCALE" ]] && \
    "${ADB[@]}" shell settings put global animator_duration_scale "$ORIG_ANIMATOR_DURATION_SCALE" >/dev/null 2>&1 || true
  [[ -n "$ORIG_HIDE_ERROR_DIALOGS" ]] && \
    "${ADB[@]}" shell settings put global hide_error_dialogs "$ORIG_HIDE_ERROR_DIALOGS" >/dev/null 2>&1 || true
  if [[ -z "$ORIG_AUTOFILL_SERVICE" || "$ORIG_AUTOFILL_SERVICE" == "null" ]]; then
    "${ADB[@]}" shell settings delete secure autofill_service >/dev/null 2>&1 || true
  else
    "${ADB[@]}" shell settings put secure autofill_service "$ORIG_AUTOFILL_SERVICE" >/dev/null 2>&1 || true
  fi
  if [[ -n "$ORIG_STAY_ON" ]]; then
    "${ADB[@]}" shell settings put global stay_on_while_plugged_in "$ORIG_STAY_ON" >/dev/null 2>&1 || true
  else
    "${ADB[@]}" shell svc power stayon false >/dev/null 2>&1 || true
  fi
  if [[ "$IS_EMULATOR" != "1" ]]; then
    "${ADB[@]}" shell appops set 2000 android:mock_location default >/dev/null 2>&1 || true
  fi
}

cleanup_reverse() {
  for port in "${REVERSE_PORTS[@]:-}"; do
    [[ -n "$port" ]] && "${ADB[@]}" reverse --remove "tcp:$port" >/dev/null 2>&1 || true
  done
}

prepare_flow() {
  local name="$1"
  case "$name" in
    izin-lokasi-dicabut)
      "${ADB[@]}" shell pm revoke com.ppk.presensipraktikum android.permission.ACCESS_FINE_LOCATION >/dev/null 2>&1 || true
      "${ADB[@]}" shell pm revoke com.ppk.presensipraktikum android.permission.ACCESS_COARSE_LOCATION >/dev/null 2>&1 || true
      ;;
    layanan-lokasi-mati)
      if [[ "$IS_EMULATOR" == "1" ]]; then
        "${ADB[@]}" shell settings put secure location_mode 0
      else
        "${ADB[@]}" shell cmd location set-location-enabled false
      fi
      ;;
  esac
}

trap 'stop_geo; restore_device; cleanup_reverse' EXIT

start_geo() {
  local lon="$1"
  local lat="$2"
  if [[ "$IS_EMULATOR" == "1" ]]; then
    (
      while true; do
        "${ADB[@]}" emu geo fix "$lon" "$lat" >/dev/null 2>&1 || exit 1
        sleep 1
      done
    ) &
    GEO_PID=$!
    return
  fi

  "${ADB[@]}" shell appops set 2000 android:mock_location allow >/dev/null 2>&1 || true
  if ! "${ADB[@]}" shell cmd location providers add-test-provider "$PROVIDER_NAME" \
      --requiresSatellite >/dev/null 2>&1; then
    # Provider bisa sudah ada dari run sebelumnya; coba lanjutkan.
    :
  fi
  PROVIDER_ADDED=1
  "${ADB[@]}" shell cmd location providers set-test-provider-enabled "$PROVIDER_NAME" true >/dev/null
  "${ADB[@]}" shell cmd location providers set-test-provider-location "$PROVIDER_NAME" \
    --location "$lat,$lon" --accuracy 5 >/dev/null
}

run_flow() {
  local name="$1"
  local tier="$2"
  local lon="$3"
  local lat="$4"
  local email="$5"
  local geo="${6:-fix}"

  [[ "$TIER" == "full" || "$tier" == "$TIER" ]] || return 0

  local session_id
  session_id="$(node -e "const j=require('./$RUN_JSON');const f=j.flows['$name']??{};process.stdout.write(f.sessionId??'')")"
  [[ -n "$session_id" ]] || fail "Session ID untuk flow $name tidak ada di run.json."

  printf '\n== %s ==\n' "$name"
  prepare_flow "$name"
  if [[ "$geo" == "fix" ]]; then
    start_geo "$lon" "$lat"
  fi

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

while IFS=$'\t' read -r -u 3 name tier lon lat email geo; do
  [[ -z "$name" || "$name" == \#* ]] && continue
  run_flow "$name" "$tier" "$lon" "$lat" "$email" "${geo:-fix}"
done 3< "$MANIFEST"

TIER="$TIER" MANIFEST="$MANIFEST" node e2e/android/verify.js
