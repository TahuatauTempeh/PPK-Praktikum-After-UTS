# Presensi Praktikum

Aplikasi mobile (dan web) untuk presensi praktikum. Asisten mengelola kelas, peserta, dan sesi, lalu membuka dan menutup sesi. Praktikan mengisi presensi hanya saat sesi dibuka, dan bisa mengajukan izin yang dinilai awal oleh model sentimen lokal sebelum ditinjau asisten.

Dibuat dengan Expo (React Native) + Expo Router, dengan Firebase Authentication dan Cloud Firestore sebagai backend.

## Daftar isi

1. [Teknologi dan dependensi](#1-teknologi-dan-dependensi)
2. [Prasyarat](#2-prasyarat)
3. [Konfigurasi Firebase](#3-konfigurasi-firebase)
4. [Menjalankan aplikasi](#4-menjalankan-aplikasi)
5. [Akun dan peran](#5-akun-dan-peran)
6. [Struktur proyek](#6-struktur-proyek)
7. [Rute aplikasi](#7-rute-aplikasi)
8. [Struktur data Firestore](#8-struktur-data-firestore)
9. [Status pengerjaan](#9-status-pengerjaan)
10. [Perintah yang sering dipakai](#10-perintah-yang-sering-dipakai)
11. [Build dengan EAS](#11-build-dengan-eas)
12. [Pemecahan masalah](#12-pemecahan-masalah)
13. [Dokumen lain](#13-dokumen-lain)

---

## 1. Teknologi dan dependensi

Versi di bawah diambil dari `package.json`. Selalu pasang paket Expo dengan `npx expo install <paket>` agar versinya cocok dengan SDK.

| Bagian | Teknologi |
|---|---|
| Framework | Expo SDK 58, React Native 0.88, React 19.3 |
| Bahasa | TypeScript (strict) |
| Navigasi | Expo Router (rute berbasis berkas di `src/app/`) |
| Backend | Firebase 13 (Authentication + Cloud Firestore) |
| Lokasi & peta | `expo-location`, `react-native-webview` + Leaflet/OpenStreetMap (tanpa API key peta) |
| Animasi | `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler` |
| Tampilan | `expo-blur`, `expo-glass-effect`, `expo-image`, `expo-symbols`, `react-native-svg`, font Inter (`@expo-google-fonts/inter`) |
| Penyimpanan lokal | `@react-native-async-storage/async-storage` (sesi login di perangkat) |
| Web | `react-native-web`, `react-dom` |
| Lint | ESLint 9 + `eslint-config-expo` |

Model AI (sentimen alasan izin) berada di folder `ai/` dan berjalan langsung di perangkat, tanpa internet dan tanpa dependensi tambahan.

## 2. Prasyarat

- **Node.js** 22.13+ atau 24.3+ (lihat `.nvmrc`; CI memakai Node 24) dan **npm**.
- Sebuah **proyek Firebase** (lihat bagian 3).
- Salah satu cara menjalankan:
  - **Browser** (paling mudah): tidak perlu apa-apa lagi.
  - **Emulator/perangkat Android atau iOS**: Android Studio atau Xcode, atau aplikasi [Expo Go](https://expo.dev/go) di ponsel. Karena proyek memakai modul native (`expo-blur`, `expo-glass-effect`, dan lainnya), jika Expo Go menampilkan galat modul native, gunakan *development build* (lihat bagian 4).

## 3. Konfigurasi Firebase

Aplikasi tidak bisa berjalan tanpa konfigurasi ini. Jika variabel `.env` kosong, aplikasi menampilkan layar *"Konfigurasi Firebase belum lengkap"*.

### 3.1 Buat proyek dan aktifkan layanan

Di [Firebase Console](https://console.firebase.google.com/):

1. Buat proyek baru (atau minta akses ke proyek tim `praktikum-ppk-3`).
2. **Authentication → Sign-in method**: aktifkan **Email/Password**.
3. **Firestore Database**: buat database (mode produksi, lalu pasang rules di langkah 3.3).
4. **Project settings → Your apps**: tambahkan aplikasi **Web** (`</>`) dan salin nilai konfigurasinya. Aplikasi memakai Firebase JS SDK untuk Auth dan Firestore, jadi `google-services.json` / `GoogleService-Info.plist` tidak dipakai untuk konfigurasi inti tersebut. Untuk push notification Android pada Sprint 3, `google-services.json` tetap diperlukan lewat `android.googleServicesFile`; lihat [`PRD.md`](PRD.md).

> Project `praktikum-ppk-3` saat ini masih memakai paket **Spark**. Auth dan
> Firestore berjalan, tetapi Cloud Functions Sprint 3 memerlukan paket **Blaze**.
> Notifikasi push tetap bisa dijalankan tanpa Blaze lewat worker Heroku; lihat
> [`functions/README.md`](functions/README.md).

### 3.2 Isi file `.env`

Salin contoh lalu isi nilainya:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Catatan:

- Keenam variabel `EXPO_PUBLIC_FIREBASE_*` wajib terisi. Nilainya dibaca saat Metro dijalankan, jadi **setelah mengubah `.env`, restart dengan `npx expo start -c`**.
- Peta memakai OpenStreetMap/Leaflet melalui WebView dan tidak memerlukan Google Maps API key. Karena `react-native-webview` adalah modul native, build ulang development client setelah menarik perubahan ini; Fast Refresh tidak cukup.
- `.env` sudah ada di `.gitignore`. Jangan di-commit.

### 3.3 Pasang Firestore Security Rules

Aturan akses ada di `firestore.rules` (sudah dirujuk oleh `firebase.json`). Pasang ke proyekmu:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project <PROJECT_ID>
```

Atau salin isi `firestore.rules` ke **Firestore → Rules** di Console lalu **Publish**. Tanpa rules ini, banyak aksi akan gagal dengan pesan *"Kamu tidak punya akses untuk tindakan ini."*

Ringkasan aturan:

| Koleksi | Baca | Tulis |
|---|---|---|
| `users` | pemilik atau asisten | pemilik membuat profil `praktikan`; admin mengubah peran |
| `classes` | semua yang login | asisten |
| `enrollments` | pemilik atau asisten | asisten |
| `sessions` | semua yang login | asisten; status `open` wajib memakai laboratorium aktif |
| `laboratories` | semua yang login | asisten (soft delete, tanpa hapus permanen) |
| `attendance` | pemilik atau asisten | praktikan membuat sendiri lewat fallback (ID `{sessionId}_{uid}`, satu kali); update/hapus oleh asisten |
| `permissionRequests` | pemilik atau asisten | praktikan membuat (`pending`); asisten meninjau |
| `auditLogs` | asisten | semua yang login boleh membuat catatan atas namanya; tidak bisa diubah/dihapus |
| `notificationLogs` | asisten | hanya Admin SDK (Cloud Functions atau worker Heroku) |
| `notificationState` | tidak ada | hanya Admin SDK; baseline internal worker |
| `invitationCodes` | semua yang login | admin membuat/menghapus |

Catatan: rules `sessions` mengizinkan semua pengguna yang login membaca semua sesi. Pembatasan praktikan hanya melihat sesi kelasnya sendiri dilakukan di sisi aplikasi (lewat `enrollments`), bukan di rules.

Sprint 3 sudah menambahkan rules `laboratories`, `notificationLogs`, dan validasi laboratorium aktif pada sesi. Rules `attendance` memakai jalur **fallback** (PRD 14.1) selama project masih Spark: create hanya diterima dari praktikan terdaftar, saat sesi `open`, untuk lab aktif, dengan bukti lokasi lengkap. Catatan `attendance` hanya dapat dibaca pemiliknya atau asisten karena berisi koordinat lokasi. Rules ini baru berlaku setelah dideploy ulang; lihat bagian 9.

## 4. Menjalankan aplikasi

```bash
# 1. Pasang dependensi
npm install

# 2. Isi .env (bagian 3.2)

# 3. Jalankan
npm run web          # di browser (paling mudah untuk mencoba)
npm start            # menu Expo: pilih Android / iOS / web
```

Opsi lain:

```bash
npx expo start -c            # jalankan dengan cache Metro dibersihkan
npx expo start --web -c      # web, cache dibersihkan
npm run android              # development build lokal (butuh Android Studio)
npm run ios                  # development build lokal (butuh Xcode, macOS)
```

`npm run android` / `npm run ios` menjalankan `expo run:*` dan membuat folder `ios/` dan `android/`. Folder itu dibuat otomatis (Continuous Native Generation); **jangan diedit manual**. Atur perilaku native lewat `app.json`.

Setelah menambah paket yang berisi kode native, aplikasi perlu di-build ulang (bukan sekadar reload).

## 5. Akun dan peran

Ada dua peran: `praktikan` dan `asisten`, ditambah penanda `isAdmin` untuk asisten yang boleh mengelola pengguna.

- **Registrasi di aplikasi selalu membuat akun `praktikan`** (aturan Firestore menolak yang lain).
- **Asisten** dibuat oleh admin: admin membuka tab **Admin** (hanya tampil jika `isAdmin == true`) lalu mengubah peran pengguna menjadi asisten. Perubahan itu tercatat di audit log.
- **Admin pertama harus dibuat manual**, karena belum ada admin yang bisa mengangkat siapa pun:
  1. Daftar lewat aplikasi seperti biasa.
  2. Di Firebase Console → Firestore → `users/{uid akun itu}`, ubah `role` menjadi `asisten` dan `isAdmin` menjadi `true`.
  3. Keluar lalu masuk lagi di aplikasi.

> Koleksi `invitationCodes` sudah ada di `firestore.rules`, tetapi belum ada kode aplikasi yang memakainya. Saat ini peran asisten diberikan lewat layar Admin.

## 6. Struktur proyek

```text
.
├── ai/                          Model sentimen lokal (model-edom.json, sentiment.js, README.md)
├── assets/
│   ├── asisten/                 Ikon SVG area asisten
│   ├── praktikan/               Ikon dan ilustrasi SVG area praktikan
│   ├── images/                  Ikon aplikasi, splash, favicon
│   └── expo.icon                Ikon iOS
├── docs/                        Catatan lokal (di-gitignore), kecuali arsip sprint
│   ├── sprint-1-rancangan-pembagian-tugas.md
│   └── sprint-2-plan.md
├── scripts/                     Skrip bawaan template (reset-project.js)
├── src/
│   ├── app/                     RUTE (Expo Router). Hanya berkas rute di sini
│   │   ├── _layout.tsx          Root: provider, guard peran (Stack.Protected)
│   │   ├── index.tsx            Redirect sesuai peran
│   │   ├── (auth)/              login, register
│   │   ├── (praktikan)/         tab Praktikan: jadwal, riwayat, izin, peta, profil
│   │   ├── praktikan/sesi/[id]  detail sesi Praktikan
│   │   ├── praktikan/presensi/[id]  halaman presensi berbasis lokasi (Dev 2)
│   │   └── asisten/
│   │       ├── (tabs)/          tab Asisten: beranda, jadwal, rekap, admin, profil
│   │       ├── kelas/           kelola kelas (Dev 2)
│   │       ├── peserta/         kelola peserta per kelas (Dev 2)
│   │       ├── lab/             daftar dan form laboratorium (Dev 1)
│   │       ├── peta.tsx         peta laboratorium Asisten (Dev 3)
│   │       ├── atur-sesi/       tambah, ubah, hapus jadwal dan sesi (Dev 2)
│   │       ├── sesi/[id]        kelola sesi: buka/tutup dan daftar hadir
│   │       └── izin/            daftar dan tinjau izin
│   ├── components/              Komponen bersama (Toast, ConfirmModal, LoadingState, ErrorState, BottomSheet, form/)
│   ├── constants/               Konstanta (transisi tab)
│   ├── context/                 auth-context, session-context, theme-context, blur-target, tab-bar-inset
│   ├── data/dummy.ts            Data contoh Sprint 1 (masih dipakai sebagian layar)
│   ├── hooks/                   Hook warna/tema
│   ├── lib/
│   │   ├── firebase/            app, auth (web/native), firestore, audit (logAction), errors, converters
│   │   ├── class-service.ts        CRUD kelas (Dev 2)
│   │   ├── enrollment-service.ts   CRUD peserta/enrollment, cegah daftar ganda (Dev 2)
│   │   ├── laboratory-service.ts   CRUD laboratorium dan listener (Dev 1)
│   │   ├── laboratory-validation.ts Validasi field laboratorium (Dev 1)
│   │   ├── geo.ts                  Haversine dan validasi koordinat/radius (Dev 1)
│   │   ├── device-location.ts      Izin dan posisi foreground (Dev 1)
│   │   ├── session-service.ts      CRUD jadwal dan sesi, query per kelas/asisten/praktikan (Dev 2)
│   │   ├── praktikum-helpers.ts    Validasi tanggal dan jam, format WIB, pemetaan galat layanan (Dev 2)
│   │   ├── session-actions.ts      Buka/tutup sesi + listener Firestore
│   │   ├── useSessionFirestore.ts  Hook realtime untuk jadwal, sesi, presensi
│   │   ├── attendance-service.ts   Presensi lokasi: pilih jalur callable atau fallback, listener
│   │   ├── permission-service.ts   Pengajuan dan peninjauan izin
│   │   ├── ai-service.ts        Pembungkus model sentimen (timeout + fallback)
│   │   ├── kesan-pesan-service.ts  Kesan pesan sesi + label sentimen AI
│   │   └── validation/          Validasi form login/registrasi
│   ├── screens/                 Isi layar, dipisah per area
│   │   ├── asisten/             Beranda, jadwal, sesi, rekap, admin, izin + components/
│   │   │   ├── kelas/           Daftar kelas, form tambah/ubah, konfirmasi hapus (Dev 2)
│   │   │   ├── lab/             Daftar dan form laboratorium (Dev 1)
│   │   │   ├── peserta/         Daftar peserta, tambah (cari nama/NIM), konfirmasi hapus (Dev 2)
│   │   │   └── sesi/            Daftar sesi per kelas, form tambah/ubah, konfirmasi hapus (Dev 2)
│   │   ├── praktikan/           Jadwal, detail, riwayat, izin + components/
│   │   │   └── use-praktikan-schedule.ts  Memuat sesi praktikan, difilter lewat enrollment (Dev 2)
│   │   └── shared/              Profil dan komponen yang dipakai bersama
│   ├── theme/                   Token warna, tipografi, jarak, radius (useTheme / useThemedStyles)
│   └── types/index.ts           Tipe inti (Role, Session, PracticumClass, Enrollment, UserProfile, AuditLog, ...)
├── firestore.rules              Security Rules Firestore
├── firebase.json                Menunjuk ke firestore.rules
├── eas.json                     Profil build EAS
├── app.json                     Konfigurasi Expo
├── .env.example                 Contoh variabel lingkungan
├── DESIGN.md                    Sistem visual dan antarmuka
└── AGENTS.md                    Panduan untuk asisten coding (Expo, perintah, aturan)
```

Folder `docs/` bersifat lokal dan tidak di-commit, kecuali arsip sprint
`docs/sprint-*.md`. Dokumen tim yang dibagikan ada di root repository.

Aturan umum:

- Alias impor `@/` menunjuk ke `src/` (lihat `tsconfig.json`), contoh `import { useAuth } from '@/context/auth-context'`.
- Berkas di `src/app/` hanya untuk rute. Komponen, hook, dan utilitas ditaruh di luar folder itu.
- Warna dan gaya memakai `useTheme()` / `useThemedStyles()` dari `@/theme`, bukan nilai warna tertulis langsung.
- Setiap tambah/ubah/hapus data sebaiknya memanggil `logAction(...)` atau `logActionInBatch(...)` dari `src/lib/firebase/audit.ts`. Service Dev 2 memakai `logActionInBatch` agar data dan audit log tersimpan dalam satu batch.
- Galat dari service Dev 2 dipetakan lewat `rethrowServiceError` di `praktikum-helpers.ts`, jadi layar menampilkan pesan Indonesia yang jelas, bukan kode Firebase mentah.
- Teks antarmuka berbahasa Indonesia; tampilan waktu memakai WIB.

## 7. Rute aplikasi

| Rute | Layar |
|---|---|
| `/login`, `/register` | Masuk dan registrasi |
| `/asisten` | Beranda Asisten (menu: Jadwal, Rekap, Kelas, Peserta, Lab, Peta, Atur Sesi, Izin) |
| `/asisten/jadwal` | Jadwal praktikum |
| `/asisten/rekap` | Rekap presensi |
| `/asisten/admin` | Kelola pengguna (khusus admin) |
| `/asisten/profil` | Profil Asisten |
| `/asisten/kelas` | Kelola kelas: tambah, ubah, hapus, lalu buka peserta kelas |
| `/asisten/peserta?classId=<id>` | Kelola peserta satu kelas: tambah dan hapus |
| `/asisten/lab`, `/asisten/lab/baru`, `/asisten/lab/[id]` | Daftar, tambah, dan ubah laboratorium |
| `/asisten/peta` | Peta laboratorium Asisten (OpenStreetMap, aktivitas realtime) |
| `/asisten/atur-sesi` | Kelola jadwal dan sesi: tambah, ubah, hapus, filter per kelas; sesi baru wajib memilih lab |
| `/asisten/sesi/[id]` | Kelola sesi: buka/tutup dan daftar hadir |
| `/asisten/izin` dan `/asisten/izin/[id]` | Daftar dan tinjau izin |
| `/asisten/kesan-pesan` dan `/asisten/kesan-pesan/[sessionId]` | Kesan pesan praktikan per sesi beserta label sentimen AI |
| `/(praktikan)` | Jadwal Praktikan |
| `/(praktikan)/riwayat`, `/(praktikan)/izin`, `/(praktikan)/peta`, `/(praktikan)/profil` | Riwayat, izin, peta, profil |
| `/praktikan/sesi/[id]` | Detail sesi dan tautan ke halaman presensi |
| `/praktikan/presensi/[id]` | Presensi berbasis lokasi: izin lokasi, jarak ke lab, konfirmasi |

Penjagaan rute ada di `src/app/_layout.tsx` (`Stack.Protected`): pengguna tanpa profil hanya melihat grup `(auth)`, praktikan hanya area praktikan, asisten hanya area asisten. Rute `kelas`, `peserta`, `lab`, `peta`, dan `atur-sesi` terdaftar di dalam grup asisten.

## 8. Struktur data Firestore

| Koleksi | Isi utama |
|---|---|
| `users/{uid}` | `name`, `nim`, `email`, `role`, `isAdmin`, `createdAt`, `updatedAt` |
| `classes/{id}` | `name`, `description` (opsional), `assistantId`, `createdAt` |
| `enrollments/{classId}_{uid}` | `classId`, `userId`, `userName`, `enrolledAt` |
| `laboratories/{id}` | `name`, `code`, `building`, `floor`, `room`, `latitude`, `longitude`, `radiusMeters` (10–500), `description`, `isActive`, `createdAt`, `updatedAt`, `updatedBy` |
| `sessions/{id}` | `classId`, `title`, `date` (`YYYY-MM-DD`), `startTime`, `endTime` (`HH:MM`), `room`, `assistantId`, `assistantName` (nama asisten saat sesi dibuat, kosong pada sesi lama), `laboratoryId`, `status` (`scheduled` / `open` / `closed`), `createdAt`, `openedAt`, `closedAt` |
| `attendance/{sessionId}_{uid}` | `sessionId`, `userId`, `userName`, `userNim`, `recordedAt`, bukti lokasi (`latitude`, `longitude`, `accuracyMeters`, `distanceMeters`, `radiusMeters`, `laboratoryId`, `locationVerifiedAt`, `mocked`, `source`) |
| `permissionRequests/{id}` | `userId`, `userName`, `sessionId`, `reason`, `status` (`pending` / `approved` / `rejected`), hasil AI (`aiLabel`, `aiConfidence`), peninjauan (`reviewedBy`, `reviewedAt`, `reviewNote`), `createdAt` |
| `kesanPesan/{sessionId}_{uid}` | `sessionId`, `classId`, `userId`, `userName`, `text` (10 sampai 500 karakter), hasil AI (`aiLabel`, `aiConfidence`; `null` berarti tidak terbaca), `createdAt`. Diisi praktikan yang hadir setelah sesi ditutup, satu kali per sesi; label AI hanya ditampilkan ke asisten |
| `auditLogs/{id}` | `action`, `collection`, `docId`, `actorUid`, `actorRole`, `before`, `after`, `timestamp` |

Alur status sesi: `scheduled → open → closed` (tidak ada transisi lain). Sesi baru dari layar Atur Sesi selalu berstatus `scheduled` dan wajib memilih laboratorium aktif. Sesi lama tanpa `laboratoryId` tetap bisa dibaca, tetapi tidak dapat dibuka sebelum lab diisi.

Hubungan antar data: kelas memiliki banyak sesi (`sessions.classId`) dan banyak peserta (`enrollments.classId`). Sesi menunjuk laboratorium lewat `sessions.laboratoryId`. Praktikan hanya melihat sesi dari kelas tempat dia terdaftar di `enrollments`. ID enrollment berupa `{classId}_{uid}` sehingga satu praktikan tidak bisa terdaftar dua kali di kelas yang sama.

### Membuat data untuk pengujian

Semua data praktikum kini dibuat lewat aplikasi, tanpa perlu Firebase Console. Urutannya mengikuti alur Dev 2:

1. Masuk sebagai **asisten**, buka menu **Lab**, lalu tambah laboratorium: isi nama, kode, gedung, ruang, koordinat, dan radius 10–500 m. Lab baru aktif secara default.
2. Buka menu **Kelas**, lalu tambah kelas (nama wajib, deskripsi opsional).
3. Dari daftar kelas, buka **Peserta**, lalu tambah praktikan dengan mencari nama atau NIM. Praktikan harus sudah registrasi lebih dulu.
4. Buka menu **Atur Sesi**, pilih kelas, lalu tambah sesi. Aturan isian:
   - Judul dan ruangan wajib diisi.
   - Laboratorium wajib dipilih dan harus aktif.
   - Tanggal berformat `YYYY-MM-DD` dan harus tanggal kalender yang ada (contoh `2026-11-20`).
   - Jam berformat `HH:mm` 24 jam, dan jam selesai harus lebih akhir dari jam mulai.
5. Masuk sebagai praktikan yang sudah didaftarkan. Sesi tersebut muncul di jadwal praktikan.
6. Asisten membuka sesi dari `/asisten/sesi/[id]`, praktikan presensi, lalu asisten menutup sesi.

Alternatif lewat Firebase Console (misalnya untuk mengisi data cepat): buat dokumen di koleksi `sessions` dengan isi berikut, lalu pastikan praktikan terdaftar di `enrollments` untuk `classId` yang sama.

```text
classId:     "<id dokumen kelas>"
title:       "Praktikum Basis Data - Pertemuan 3"
date:        "2026-11-20"
startTime:   "08:00"
endTime:     "09:40"
room:        "Lab Komputer A"
assistantId: "<uid asisten>"
assistantName: "<nama asisten>"
laboratoryId: "<id dokumen laboratorium>"
status:      "scheduled"
createdAt:   <timestamp>
```

Beranda, jadwal, rekap, dan detail sesi Asisten membaca Firestore. Bila belum ada sesi, layar menampilkan keadaan kosong, bukan data contoh.

## 9. Status pengerjaan

Berdasarkan isi kode saat ini.

> Sprint 3 sudah mencakup fondasi laboratorium, integrasi lab ke sesi, helper lokasi, rules lab/sesi, presensi berbasis lokasi lewat jalur fallback, dan peta laboratorium untuk kedua peran. Notifikasi masih dikerjakan Dev 4. Rencana lengkap ada di [`PRD.md`](PRD.md).

| Area | Keadaan |
|---|---|
| **Dev 1: Fondasi & auth** | Ada: setup Firebase, login/registrasi/logout, profil `users`, auth context dan persist sesi, navigasi per peran, `logAction`, pemetaan galat Firebase, komponen loading/empty/error. |
| **Dev 1: Fondasi Sprint 3** | Ada: CRUD laboratorium + validasi, `listenAllClasses`, helper Haversine dan validasi radius, `device-location` foreground, `laboratoryId` pada sesi, guard lab aktif saat buka sesi, rules `laboratories` + validasi sesi, dan route peta. |
| **Dev 2: Data praktikum** | Ada: CRUD kelas (`class-service`, layar Kelas), CRUD peserta (`enrollment-service`, layar Peserta, cegah daftar ganda), CRUD jadwal dan sesi (`session-service`, layar Atur Sesi, validasi tanggal dan jam), filter jadwal dan riwayat praktikan lewat enrollment (`usePraktikanSchedule`), dan audit log pada setiap tambah/ubah/hapus. Sebagian: penggantian seluruh data dummy ke Firestore belum tuntas (lihat keterbatasan). |
| **Dev 3: Sesi, presensi & peta** | Ada: buka/tutup sesi dengan audit log, presensi hanya saat sesi `open`, pencegahan presensi ganda, rekap realtime, peta laboratorium OpenStreetMap/Leaflet, aktivitas Sekarang/Berikutnya, dan mode daftar. |
| **Dev 4: Izin & AI** | Ada: form izin, modul AI dengan timeout dan fallback, penyimpanan `permissionRequests`, riwayat izin praktikan, daftar dan peninjauan izin oleh asisten. |
| **E2E** | Ada: harness rules Firestore (18 skenario), 5 flow critical web Playwright (presensi, luar radius, kehadiran asisten, lab/siklus sesi, izin), dan 3 flow critical Android Maestro (presensi, luar radius, kehadiran asisten). |

E2E Android dijalankan dengan Maestro pada emulator API 35. Build APK E2E
(`npm run android:e2e:build`), boot emulator, lalu `npm run test:android`.
Prasyarat: Android SDK, Maestro, Java 21+, dan KVM untuk CI.

## E2E tiers

- `npm run test:web` — 5 flow critical web (CI).
- `npm run test:android` — 3 flow critical Android (CI).
- `npm run test:web:full` — seluruh ID UAT web yang dapat diotomasi (lokal).
- `npm run test:android:full` — flow native best-effort (lokal).
- `npm run uat:check` — memeriksa matriks 65 ID dan tag test.

Full tier membutuhkan Firebase Emulator, Java 21+, Chromium, dan untuk Android:
API 35 emulator, Maestro, dan `npm run android:e2e:build`. Full tier tidak
berjalan di CI. Checklist manual ada di `e2e/uat/manual-checklist.md` dan
matriks di `e2e/uat/coverage.md`.

Keterbatasan yang perlu diketahui:

- **Peta memakai OpenStreetMap/Leaflet di WebView.** Web default ke mode daftar; peta interaktif web tersedia lewat tombol **Peta**. Leaflet dimuat dari CDN, jadi peta memerlukan koneksi internet; bila gagal dimuat, aplikasi beralih ke mode daftar. Build Android/iOS yang sudah ada perlu di-build ulang karena `react-native-webview` adalah modul native.
- **Presensi berbasis lokasi memakai jalur fallback (PRD 14.1).** Project masih Spark, jadi callable `submitAttendance` belum bisa dideploy. Aplikasi mencatat presensi lewat transaksi Firestore dengan validasi yang sama (`validasiPresensi`). Keputusan tim 23 November 2026.
- **Klaim keamanan presensi diturunkan menjadi client-enforced untuk lokasi.** Setelah rules dideploy, server memeriksa: praktikan terdaftar di kelas, sesi `open`, lab aktif dan sama dengan sesi, radius sama dengan lab, akurasi ≤ 100 m, `distanceMeters ≤ radiusMeters`, `mocked == false`, waktu server, dan tidak ada presensi ganda. Jarak Haversine tidak bisa dihitung di rules, sehingga koordinat dan jarak dipercaya dari aplikasi. Jalur callable juga menerima koordinat dari perangkat, jadi tidak ada jalur yang bisa membuktikan koordinat asli.
- **Pindah ke callable** setelah project Blaze: deploy `submitAttendance`, ganti `JALUR_PRESENSI` di `src/lib/attendance-service.ts` menjadi `'callable'`, lalu ubah rules create `attendance` menjadi `false`. Urutan ini penting supaya presensi tidak mati di tengah jalan.
- **Notifikasi push punya jalur worker Heroku tanpa Blaze.** `functions/src/worker.ts` memakai Firestore `onSnapshot` dan baseline `notificationState/*`; wrapper Cloud Functions tetap tersedia di `functions/src/notifications.ts`. Deploy dan batasannya ada di `functions/README.md`. Worker ini tidak memindahkan `submitAttendance`.
- Rules `attendance` (fallback), `notificationLogs`, dan `notificationState` baru berlaku setelah rules dideploy ulang.
- **Beranda, jadwal, rekap, dan detail sesi Asisten sudah Firestore-first**; `AssistantPreviewProvider` sudah dihapus. Sebagian layar Praktikan masih memakai `SessionContext` yang diisi `src/data/dummy.ts`, dan data itu hilang saat aplikasi dimuat ulang.
- Layar jadwal Asisten menampilkan satu tanggal: hari ini bila ada sesi, jika tidak tanggal terdekat berikutnya, lalu tanggal terakhir. Untuk melihat semua sesi dan mengelolanya, pakai layar **Atur Sesi**.
- Layar **Atur Sesi** tanpa filter kelas hanya menampilkan sesi milik asisten yang sedang login (`assistantId`).
- Menghapus kelas **tidak** ikut menghapus sesi dan peserta kelas itu (tidak ada penghapusan berantai). Hapus sesi dan peserta lebih dulu bila perlu data bersih.
- Daftar peserta per sesi (`participantIds`) di layar jadwal dan rekap Asisten dihitung dari `enrollments`; layar detail sesi memakai roster kelas yang sama.
- Ada dua jalur data sesi: `session-service.ts` (Dev 2, baca sekali untuk daftar dan CRUD) dan `session-actions.ts` / `useSessionFirestore.ts` (Dev 3, realtime untuk jadwal, buka/tutup, dan presensi). Keduanya menulis ke koleksi `sessions` yang sama dengan format tanggal `YYYY-MM-DD`.
- `listenSessionsByClass` di `session-actions.ts` memakai `where` + dua `orderBy`, sehingga butuh indeks komposit Firestore jika kelak dipakai. Saat ini belum dipanggil di mana pun.
- `invitationCodes` belum dipakai kode aplikasi.

## 10. Perintah yang sering dipakai

| Perintah | Fungsi |
|---|---|
| `npm install` | Pasang dependensi |
| `npm start` | Jalankan server pengembangan Expo |
| `npm run web` | Jalankan versi web |
| `npm run android` / `npm run ios` | Build dan jalankan development build lokal |
| `npm run lint` | ESLint (`expo lint`) |
| `npm run typecheck` | Periksa tipe TypeScript (`tsc --noEmit`) |
| `npm test` | Jalankan test Jest |
| `npm run test:ci` | Jalankan test sekali seperti CI |
| `npm run test:rules` | Jalankan E2E Firestore rules di emulator (butuh Java 21+) |
| `npm run test:web` | Jalankan 5 flow critical web Playwright (butuh Java 21+ dan Chromium) |
| `npm run android:e2e:build` | Build APK release-like untuk E2E Android |
| `npm run test:android` | Jalankan 3 flow critical Android Maestro (butuh APK + emulator API 35) |
| `npm run verify` | Lint, typecheck, dan test sekaligus |
| `npm --prefix functions test` | Jalankan test Cloud Functions |
| `npm --prefix functions run build` | Build Cloud Functions |
| `npx expo-doctor` | Periksa masalah dependensi dan konfigurasi (advisory) |
| `npx expo install --fix` | Samakan versi paket dengan SDK |
| `npx expo install <paket>` | Pasang paket dengan versi yang cocok dengan SDK |

Jalankan `npm run verify`, `npm run test:rules`, `npm run test:web`, `npm run test:web:full`, `npm run test:android:full`, `npm --prefix functions test`, `npm --prefix functions run build`, dan `git diff --check` sebelum membuka pull request. `test:rules` dan `test:web` membutuhkan Java 21+ dan Firebase Emulator; `test:web` juga membutuhkan Chromium. `test:web` menjalankan tier critical; full tier (`test:web:full`, `test:android:full`, dan `uat:check`) hanya berjalan lokal dan tidak di CI. CI menjalankan langkah yang sama untuk critical, rules, dan `uat:check`; lihat `.github/workflows/ci.yml`.

## 11. Build dengan EAS

Profil build ada di `eas.json`: `development` (development client, distribusi internal), `preview` (distribusi internal), dan `production` (versi naik otomatis).

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

`app.json` sudah berisi `owner` dan `extra.eas.projectId` milik tim. Agar bisa membangun lewat EAS, akunmu harus punya akses ke organisasi tersebut, atau ganti dua nilai itu dengan milikmu sendiri. Variabel `EXPO_PUBLIC_*` juga harus diset di EAS (secret/environment variable) agar ikut masuk ke build. Peta OpenStreetMap tidak memerlukan API key tambahan; cukup build ulang development client agar `react-native-webview` ikut terpasang.

## 12. Pemecahan masalah

| Gejala | Penyebab dan solusi |
|---|---|
| `Unable to resolve module expo-blur` (atau modul lain) | Dependensi belum terpasang. Jalankan `npm install`, lalu `npx expo start -c`. Jika baru menambah paket native di development build, build ulang. |
| Layar "Konfigurasi Firebase belum lengkap" | Ada variabel `EXPO_PUBLIC_FIREBASE_*` yang kosong atau `.env` belum dibuat. Isi lalu restart dengan `-c`. |
| "Metode login belum diaktifkan" | Aktifkan Email/Password di Firebase Authentication. |
| "Kamu tidak punya akses untuk tindakan ini" | Rules belum dipasang, atau akun belum berperan `asisten` untuk aksi yang butuh itu. Pastikan rules terbaru sudah dideploy; `laboratories` dan validasi sesi baru ada di Sprint 3. |
| Peta kosong atau gagal dimuat | Periksa koneksi internet dan akses ke `unpkg.com`/`tile.openstreetmap.org`. Pastikan development client di-build ulang setelah `react-native-webview` ditambahkan. Bila peta tetap gagal, aplikasi otomatis beralih ke mode daftar. |
| Login berhasil tetapi muncul "Profil tidak ditemukan" | Dokumen `users/{uid}` belum ada. Buat lewat registrasi di aplikasi, atau tambahkan manual di Firestore. |
| Tab Admin tidak muncul | `isAdmin` pada profil belum `true`. Keluar dan masuk lagi setelah mengubahnya. |
| Jadwal Asisten menampilkan data contoh | Koleksi `sessions` masih kosong. Tambahkan sesi lewat layar Atur Sesi (bagian 8). |
| Jadwal Asisten tampak kosong padahal ada sesi | Layar jadwal menampilkan satu tanggal: hari ini, tanggal terdekat berikutnya, atau tanggal terakhir. Cek sesi yang dicari lewat layar Atur Sesi. |
| Jadwal Praktikan kosong padahal sesi sudah dibuat | Praktikan belum didaftarkan ke kelas sesi itu. Tambahkan lewat Kelas → Peserta. Jadwal praktikan difilter berdasarkan `enrollments`. |
| "Praktikan sudah terdaftar di kelas ini." | Praktikan itu sudah punya enrollment di kelas yang sama. Tidak perlu ditambah lagi. |
| Pencarian praktikan di layar Peserta tidak menemukan siapa pun | Praktikan belum registrasi, atau nama/NIM yang dicari berbeda. Minta praktikan registrasi dulu. |
| "Format tanggal harus YYYY-MM-DD" atau "Tanggal kalender tidak valid" | Isi tanggal di form sesi dengan format `2026-11-20` dan pastikan tanggalnya ada di kalender. |
| "Jam selesai harus lebih akhir dari jam mulai" | Periksa jam di form sesi. Format `HH:mm` 24 jam, contoh `08:00` dan `10:00`. |
| Perubahan `.env` tidak terbaca | Restart dengan `npx expo start -c`. |
| Tampilan blur tidak muncul di Android | Efek blur bergantung pada perangkat dan versi `expo-blur`; di web memakai `backdrop-filter`. |

## 13. Dokumen lain

- [`PRD.md`](PRD.md): dokumen tunggal Sprint 3: product requirement, SRS (Lampiran A), UAT (Lampiran B), dan pembagian tugas empat developer (Lampiran C).
- [`DESIGN.md`](DESIGN.md): sistem visual, rute, pola komponen, aksesibilitas.
- [`docs/sprint-2-plan.md`](docs/sprint-2-plan.md): arsip pembagian tugas Sprint 2 dan ketergantungan antar developer. Bukan acuan perilaku saat ini.
- [`ai/README.md`](ai/README.md): cara memakai dan melatih model sentimen. Catatan: berkas pelatihan yang disebut di sana (`train_edom.py`, `edom-data.csv`) tidak ada di repositori ini.
- `docs/`: catatan lokal (diabaikan Git; tidak ikut clone), kecuali arsip `docs/sprint-*.md` yang ikut di-commit. Dokumen tim yang dibagikan ada di root repository.
- [`AGENTS.md`](AGENTS.md): aturan teknis untuk contributor dan asisten coding.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): alur Git, commit, test, dan pull request.

Lisensi: lihat [`LICENSE`](LICENSE).
