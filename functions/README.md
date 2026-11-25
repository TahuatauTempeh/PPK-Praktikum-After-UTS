# Worker Notifikasi (Heroku)

Folder ini berisi dua jalur notifikasi:

- `src/notifications.ts` — trigger Firestore untuk Cloud Functions (butuh Blaze).
- `src/worker.ts` — worker listener Firestore untuk Heroku (tidak butuh Blaze).

Keduanya memakai handler dan helper yang sama di `src/notification-handlers.ts`
dan `src/notification-helpers.ts`, sehingga perilaku pengiriman tetap konsisten.

## Arsitektur worker

```
Aplikasi Expo
     │ tulis Firestore
     ▼
Firestore  ──onSnapshot (gRPC)──►  Heroku worker (Node 22)
                                    ├─ listener sessions
                                    ├─ listener permissionRequests
                                    ├─ baseline di notificationState/*
                                    ├─ handleSessionUpdated()
                                    ├─ handlePermissionReviewed()
                                    ├─ notificationLogs (Admin SDK)
                                    └─► Expo Push API
```

`onSnapshot` hanya memberi data dokumen terbaru, bukan data sebelum perubahan.
Worker menyimpan baseline dokumen di `notificationState/sessions` dan
`notificationState/permissionRequests`, lalu membandingkannya dengan snapshot
terbaru untuk membentuk event `before`/`after` yang sama seperti trigger Cloud
Functions. Baseline juga membuat worker bisa melanjutkan pemrosesan setelah
restart.

Worker berjalan sebagai **worker dyno**, bukan web dyno. Tidak ada port publik
dan service account tidak diekspos ke aplikasi.

## Kenapa bukan `firebase deploy --only functions`

`onDocumentUpdated` adalah trigger Firestore yang disediakan Cloud Functions/
Eventarc. Heroku tidak menyediakan event source tersebut. Yang bisa dijalankan
di Heroku adalah proses Node yang selalu hidup, dengan `onSnapshot` sebagai
pengganti trigger. Kode `src/notifications.ts` tetap disimpan agar project bisa
kembali ke Cloud Functions saat Blaze tersedia.

## Prasyarat

- Node.js 22.
- Firebase project `praktikum-ppk-3` (atau project UAT lain).
- Service account dengan akses Firestore. Untuk least privilege, gunakan role
  `Cloud Datastore User`; Admin SDK tetap melewati security rules.
- `google-services.json` milik project yang sama sudah dipakai aplikasi.
- Expo project memiliki kredensial FCM V1 untuk Android.

Worker memakai **Expo Push**, bukan FCM langsung. Karena itu worker hanya
membutuhkan akses Firestore dan HTTPS ke `exp.host`; worker tidak membutuhkan
kredensial FCM. Kredensial FCM V1 tetap diperlukan di sisi Expo agar Expo bisa
meneruskan pesan ke Android.

## Menjalankan lokal

```bash
cd functions
npm install
npm run build

# Terminal lain: jalankan Firestore Emulator dari root repo
firebase emulators:start --only firestore --project demo-ppk-notifier

# Jalankan worker tanpa mengirim push sungguhan
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_PROJECT_ID=demo-ppk-notifier \
NOTIFICATION_DRY_RUN=true \
npm run worker
```

Ubah dokumen `sessions` atau `permissionRequests` di emulator. Worker akan
mencetak pesan dry-run dan menulis `notificationLogs` seperti jalur produksi.

Untuk memakai project nyata secara lokal, isi
`FIREBASE_SERVICE_ACCOUNT_JSON` (JSON mentah atau base64) dan hilangkan
`FIRESTORE_EMULATOR_HOST`.

## Deploy ke Heroku

```bash
# Dari root repo
heroku create ppk-notifier --region us
heroku buildpacks:set heroku/nodejs -a ppk-notifier

# Service account: jangan commit file-nya
heroku config:set \
  FIREBASE_SERVICE_ACCOUNT_JSON="$(base64 -w0 /path/to/service-account.json)" \
  -a ppk-notifier

# Deploy folder functions/ sebagai root aplikasi
FIREBASE_SERVICE_ACCOUNT_FILE=/path/to/service-account.json \
HEROKU_APP=ppk-notifier \
./scripts/deploy-notifier.sh
```

Script deploy memakai `git archive`, jadi tidak membutuhkan `git-subtree`.
Script juga menyimpan service account ke config var dan mengatur satu worker
Basic. Jika ingin deploy manual, `git subtree` bisa dipakai bila terpasang:

```bash
git subtree split --prefix functions -b notifier-deploy
git push heroku notifier-deploy:main
heroku ps:scale worker=1 web=0 -a ppk-notifier
heroku ps:type worker=basic -a ppk-notifier
heroku logs --tail -a ppk-notifier
```

Jika remote `heroku` belum ada:

```bash
heroku git:remote -a ppk-notifier
```

`functions/Procfile` sudah berisi:

```
worker: node lib/worker.js
```

Heroku menjalankan `npm run build` lewat `heroku-postbuild` sebelum release.
`lib/` tetap diabaikan Git dan dibuat saat build.

## Environment variables

| Variable | Wajib | Keterangan |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Ya (kecuali emulator) | JSON service account mentah atau base64 |
| `FIREBASE_PROJECT_ID` | Hanya emulator | Project ID saat `FIRESTORE_EMULATOR_HOST` dipakai |
| `FIRESTORE_EMULATOR_HOST` | Tidak | `127.0.0.1:8080` untuk pengujian lokal |
| `NOTIFICATION_DRY_RUN` | Tidak | `true` untuk log pesan tanpa mengirim push |
| `NOTIFICATION_HEARTBEAT_MS` | Tidak | Interval heartbeat; default 60000, `0` mematikan |

Jangan menaruh service account di `.env` yang di-commit, di aplikasi Expo, atau
di kode klien. Service account hanya boleh berada di environment server.

## Verifikasi

1. `heroku ps` menunjukkan worker `up`.
2. Log menampilkan `[notifier] worker aktif`.
3. Ubah status sesi dari `scheduled` menjadi `open` di aplikasi.
4. Log menampilkan pemrosesan; perangkat penerima mendapat push.
5. Periksa `notificationLogs` di Firebase Console: `eventType`, `recipientIds`,
   `status`, `successCount`.
6. Ubah jadwal sesi; pastikan notifikasi `session-schedule-changed` terkirim.
7. Setujui atau tolak izin; pastikan notifikasi hanya ke pemohon.
8. Untuk uji token tidak valid, isi `expoPushToken` dengan token palsu; Expo
   mengembalikan `DeviceNotRegistered` dan worker membersihkan token dari
   `users/{uid}`.

## Batasan

- Tidak ada antrean event durabel seperti Cloud Functions. Jika worker mati saat
  ada perubahan, event bisa terlewat. Baseline persisten menangkap perubahan
  yang masih terlihat saat worker hidup kembali, tetapi transisi sesaat
  (misalnya sesi dibuka lalu ditutup saat worker mati) tidak dapat dipulihkan.
- Listener dapat menggabungkan dua update yang sangat cepat menjadi satu
  snapshot. Untuk UAT, beri jeda antar-update.
- Jalankan satu worker. Jika lebih dari satu, dedupe `notificationLogs` tetap
  melindungi, tetapi tidak ada gunanya menambah beban.
- Heroku me-restart dyno secara berkala. Baseline dan dedupe membuat restart
  tidak mengirim ulang notifikasi yang sudah tercatat.
- `submitAttendance` tidak ikut dipindahkan oleh worker ini. Callable tersebut
  tetap memakai fallback Spark sampai project Blaze atau dibuat endpoint HTTP
  terpisah.
- Firestore `onSnapshot` memakai gRPC. Verifikasi koneksi Heroku sebelum
  mengandalkan worker ini; jika gagal, ganti dengan poller periodik.

## Test

```bash
cd functions
npm test -- --runInBand
npm run build
```

Test mencakup handler, baseline, adapter snapshot, dedupe, dan pemrosesan
perubahan oleh `NotificationNotifier`.
