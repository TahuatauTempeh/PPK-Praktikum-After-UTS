#!/usr/bin/env bash
# Deploy folder functions/ sebagai worker Heroku tanpa membutuhkan git-subtree.
#
# Pemakaian:
#   FIREBASE_SERVICE_ACCOUNT_FILE=/path/service-account.json \
#   HEROKU_APP=ppk-notifier \
#   ./scripts/deploy-notifier.sh
#
# Script ini tidak membuat app Heroku. Buat app dan buildpack lebih dulu:
#   heroku create ppk-notifier --region us
#   heroku buildpacks:set heroku/nodejs -a ppk-notifier

set -euo pipefail

APP="${HEROKU_APP:-ppk-notifier}"
SERVICE_ACCOUNT_FILE="${FIREBASE_SERVICE_ACCOUNT_FILE:-}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

if [[ -z "$SERVICE_ACCOUNT_FILE" ]]; then
  echo "FIREBASE_SERVICE_ACCOUNT_FILE wajib diisi." >&2
  exit 1
fi

if [[ ! -f "$SERVICE_ACCOUNT_FILE" ]]; then
  echo "Service account tidak ditemukan: $SERVICE_ACCOUNT_FILE" >&2
  exit 1
fi

if ! command -v heroku >/dev/null 2>&1; then
  echo "Heroku CLI tidak ditemukan." >&2
  exit 1
fi

if ! heroku auth:whoami >/dev/null 2>&1; then
  echo "Heroku CLI belum login. Jalankan: heroku login" >&2
  exit 1
fi

echo "Menyiapkan paket deploy dari commit $(git -C "$ROOT" rev-parse --short HEAD)..."
git -C "$ROOT" archive HEAD:functions | tar -x -C "$TMP_DIR"

git -C "$TMP_DIR" init -b main >/dev/null
git -C "$TMP_DIR" add -A
git -C "$TMP_DIR" -c user.name='Notifier Deploy' \
  -c user.email='deploy@local' \
  commit -m "deploy: ${APP} worker" >/dev/null
git -C "$TMP_DIR" remote add heroku "https://git.heroku.com/${APP}.git"

echo "Menyimpan service account ke config var Heroku..."
SECRET_B64="$(base64 < "$SERVICE_ACCOUNT_FILE" | tr -d '\n')"
if ! heroku config:set "FIREBASE_SERVICE_ACCOUNT_JSON=${SECRET_B64}" -a "$APP" >/dev/null 2>&1; then
  echo "Gagal menyimpan FIREBASE_SERVICE_ACCOUNT_JSON. Periksa akses app Heroku." >&2
  exit 1
fi
unset SECRET_B64

echo "Push ke Heroku..."
git -C "$TMP_DIR" push heroku main

echo "Mengatur satu worker Basic..."
heroku ps:scale worker=1 web=0 -a "$APP"
heroku ps:type worker=basic -a "$APP"

echo "Selesai. Lihat log dengan: heroku logs --tail -a $APP"
