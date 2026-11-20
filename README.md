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

- Keenam variabel wajib terisi. Nilainya dibaca saat Metro dijalankan, jadi **setelah mengubah `.env`, restart dengan `npx expo start -c`**.
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
| `sessions` | semua yang login | asisten |
| `attendance` | semua yang login | praktikan membuat sendiri (ID `{sessionId}_{uid}`, satu kali); update/hapus oleh asisten |
| `permissionRequests` | pemilik atau asisten | praktikan membuat (`pending`); asisten meninjau |
| `auditLogs` | asisten | semua yang login boleh membuat catatan atas namanya; tidak bisa diubah/dihapus |
| `invitationCodes` | semua yang login | admin membuat/menghapus |

Catatan: rules `sessions` mengizinkan semua pengguna yang login membaca semua sesi. Pembatasan praktikan hanya melihat sesi kelasnya sendiri dilakukan di sisi aplikasi (lewat `enrollments`), bukan di rules.

Untuk Sprint 3, `firestore.rules` akan ditambah aturan `laboratories`, `notificationLogs`, serta penolakan create langsung pada `attendance` (presensi lewat callable). Rancangannya ada di [`PRD.md`](PRD.md), termasuk SRS di Lampiran A.

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
├── docs/                        Catatan lokal (di-gitignore; tidak ikut clone)
├── scripts/                     Skrip bawaan template (reset-project.js)
├── src/
│   ├── app/                     RUTE (Expo Router). Hanya berkas rute di sini
│   │   ├── _layout.tsx          Root: provider, guard peran (Stack.Protected)
│   │   ├── index.tsx            Redirect sesuai peran
│   │   ├── (auth)/              login, register
│   │   ├── (praktikan)/         tab Praktikan: jadwal, riwayat, izin, profil
│   │   ├── praktikan/sesi/[id]  detail sesi Praktikan
│   │   └── asisten/
│   │       ├── (tabs)/          tab Asisten: beranda, jadwal, rekap, admin, profil
│   │       ├── kelas/           kelola kelas (Dev 2)
│   │       ├── peserta/         kelola peserta per kelas (Dev 2)
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
│   │   ├── session-service.ts      CRUD jadwal dan sesi, query per kelas/asisten/praktikan (Dev 2)
│   │   ├── praktikum-helpers.ts    Validasi tanggal dan jam, format WIB, pemetaan galat layanan (Dev 2)
│   │   ├── session-actions.ts      Buka/tutup sesi + listener Firestore
│   │   ├── useSessionFirestore.ts  Hook realtime untuk jadwal, sesi, presensi
│   │   ├── attendance-service.ts   Presensi (cegah ganda lewat ID dokumen)
│   │   ├── permission-service.ts   Pengajuan dan peninjauan izin
│   │   ├── ai-service.ts        Pembungkus model sentimen (timeout + fallback)
│   │   └── validation/          Validasi form login/registrasi
│   ├── screens/                 Isi layar, dipisah per area
│   │   ├── asisten/             Beranda, jadwal, sesi, rekap, admin, izin + components/
│   │   │   ├── kelas/           Daftar kelas, form tambah/ubah, konfirmasi hapus (Dev 2)
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
├── SPRINT-2-PLAN.md             Pembagian tugas Sprint 2 (4 developer)
└── AGENTS.md                    Panduan untuk asisten coding (Expo, perintah, aturan)
```

Folder `docs/` bersifat lokal dan tidak di-commit. Dokumen tim yang dibagikan ada
di root repository.

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
| `/asisten` | Beranda Asisten (menu: Jadwal, Rekap, Kelas, Peserta, Atur Sesi, Izin) |
| `/asisten/jadwal` | Jadwal praktikum |
| `/asisten/rekap` | Rekap presensi |
| `/asisten/admin` | Kelola pengguna (khusus admin) |
| `/asisten/profil` | Profil Asisten |
| `/asisten/kelas` | Kelola kelas: tambah, ubah, hapus, lalu buka peserta kelas |
| `/asisten/peserta?classId=<id>` | Kelola peserta satu kelas: tambah dan hapus |
| `/asisten/atur-sesi` | Kelola jadwal dan sesi: tambah, ubah, hapus, filter per kelas |
| `/asisten/sesi/[id]` | Kelola sesi: buka/tutup dan daftar hadir |
| `/asisten/izin` dan `/asisten/izin/[id]` | Daftar dan tinjau izin |
| `/(praktikan)` | Jadwal Praktikan |
| `/(praktikan)/riwayat`, `/(praktikan)/izin`, `/(praktikan)/profil` | Riwayat, izin, profil |
| `/praktikan/sesi/[id]` | Detail sesi dan tombol presensi |

Penjagaan rute ada di `src/app/_layout.tsx` (`Stack.Protected`): pengguna tanpa profil hanya melihat grup `(auth)`, praktikan hanya area praktikan, asisten hanya area asisten. Rute `kelas`, `peserta`, dan `atur-sesi` terdaftar di dalam grup asisten.

## 8. Struktur data Firestore

| Koleksi | Isi utama |
|---|---|
| `users/{uid}` | `name`, `nim`, `email`, `role`, `isAdmin`, `createdAt`, `updatedAt` |
| `classes/{id}` | `name`, `description` (opsional), `assistantId`, `createdAt` |
| `enrollments/{classId}_{uid}` | `classId`, `userId`, `userName`, `enrolledAt` |
| `sessions/{id}` | `classId`, `title`, `date` (`YYYY-MM-DD`), `startTime`, `endTime` (`HH:MM`), `room`, `assistantId`, `status` (`scheduled` / `open` / `closed`), `createdAt`, `openedAt`, `closedAt` |
| `attendance/{sessionId}_{uid}` | `sessionId`, `userId`, `userName`, `userNim`, `recordedAt` |
| `permissionRequests/{id}` | `userId`, `userName`, `sessionId`, `reason`, `status` (`pending` / `approved` / `rejected`), hasil AI (`aiLabel`, `aiConfidence`), peninjauan (`reviewedBy`, `reviewedAt`, `reviewNote`), `createdAt` |
| `auditLogs/{id}` | `action`, `collection`, `docId`, `actorUid`, `actorRole`, `before`, `after`, `timestamp` |

Alur status sesi: `scheduled → open → closed` (tidak ada transisi lain). Sesi baru dari layar Atur Sesi selalu berstatus `scheduled`.

Hubungan antar data: kelas memiliki banyak sesi (`sessions.classId`) dan banyak peserta (`enrollments.classId`). Praktikan hanya melihat sesi dari kelas tempat dia terdaftar di `enrollments`. ID enrollment berupa `{classId}_{uid}` sehingga satu praktikan tidak bisa terdaftar dua kali di kelas yang sama.

### Membuat data untuk pengujian

Semua data praktikum kini dibuat lewat aplikasi, tanpa perlu Firebase Console. Urutannya mengikuti alur Dev 2:

1. Masuk sebagai **asisten**, buka menu **Kelas**, lalu tambah kelas (nama wajib, deskripsi opsional).
2. Dari daftar kelas, buka **Peserta**, lalu tambah praktikan dengan mencari nama atau NIM. Praktikan harus sudah registrasi lebih dulu.
3. Buka menu **Atur Sesi**, pilih kelas, lalu tambah sesi. Aturan isian:
   - Judul dan ruangan wajib diisi.
   - Tanggal berformat `YYYY-MM-DD` dan harus tanggal kalender yang ada (contoh `2026-11-20`).
   - Jam berformat `HH:mm` 24 jam, dan jam selesai harus lebih akhir dari jam mulai.
4. Masuk sebagai praktikan yang sudah didaftarkan. Sesi tersebut muncul di jadwal praktikan.
5. Asisten membuka sesi dari `/asisten/sesi/[id]`, praktikan presensi, lalu asisten menutup sesi.

Alternatif lewat Firebase Console (misalnya untuk mengisi data cepat): buat dokumen di koleksi `sessions` dengan isi berikut, lalu pastikan praktikan terdaftar di `enrollments` untuk `classId` yang sama.

```text
classId:     "<id dokumen kelas>"
title:       "Praktikum Basis Data - Pertemuan 3"
date:        "2026-11-20"
startTime:   "08:00"
endTime:     "09:40"
room:        "Lab Komputer A"
assistantId: "<uid asisten>"
status:      "scheduled"
createdAt:   <timestamp>
```

Selama koleksi `sessions` kosong, jadwal Asisten menampilkan data contoh. Begitu ada satu sesi sungguhan, data contoh berhenti dipakai di layar itu.

## 9. Status pengerjaan

Berdasarkan pembagian di `SPRINT-2-PLAN.md` dan isi kode saat ini.

> Sprint 3 masih berupa rencana dan belum diimplementasikan. Seluruh rencana, SRS, UAT, dan pembagian tugas ada di satu dokumen: [`PRD.md`](PRD.md).

| Area | Keadaan |
|---|---|
| **Dev 1: Fondasi & auth** | Ada: setup Firebase, login/registrasi/logout, profil `users`, auth context dan persist sesi, navigasi per peran, `logAction`, pemetaan galat Firebase, komponen loading/empty/error. |
| **Dev 2: Data praktikum** | Ada: CRUD kelas (`class-service`, layar Kelas), CRUD peserta (`enrollment-service`, layar Peserta, cegah daftar ganda), CRUD jadwal dan sesi (`session-service`, layar Atur Sesi, validasi tanggal dan jam), filter jadwal dan riwayat praktikan lewat enrollment (`usePraktikanSchedule`), dan audit log pada setiap tambah/ubah/hapus. Sebagian: penggantian seluruh data dummy ke Firestore belum tuntas (lihat keterbatasan). |
| **Dev 3: Sesi, presensi, rules** | Ada: buka/tutup sesi dengan audit log, presensi hanya saat sesi `open`, pencegahan presensi ganda, rekap realtime, `firestore.rules` untuk semua koleksi. |
| **Dev 4: Izin & AI** | Ada: form izin, modul AI dengan timeout dan fallback, penyimpanan `permissionRequests`, riwayat izin praktikan, daftar dan peninjauan izin oleh asisten. |

Keterbatasan yang perlu diketahui:

- **Sebagian layar masih memakai data contoh**: beranda dan rekap Asisten (`AssistantPreviewProvider`), serta sebagian detail dan presensi Praktikan (`SessionContext` yang diisi `src/data/dummy.ts`). Data ini hilang saat aplikasi dimuat ulang. Jadwal Asisten (`/asisten/jadwal`) memakai Firestore bila ada sesi, dan kembali ke data contoh bila koleksi `sessions` kosong.
- Layar jadwal Asisten menampilkan satu tanggal saja (tanggal sesi pertama dari Firestore). Untuk melihat semua sesi dan mengelolanya, pakai layar **Atur Sesi**.
- Layar **Atur Sesi** tanpa filter kelas hanya menampilkan sesi milik asisten yang sedang login (`assistantId`).
- Menghapus kelas **tidak** ikut menghapus sesi dan peserta kelas itu (tidak ada penghapusan berantai). Hapus sesi dan peserta lebih dulu bila perlu data bersih.
- Daftar peserta per sesi (`participantIds`) di layar jadwal dan rekap Asisten belum terhubung ke `enrollments`.
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
| `npm run verify` | Lint, typecheck, dan test sekaligus |
| `npx expo-doctor` | Periksa masalah dependensi dan konfigurasi (advisory) |
| `npx expo install --fix` | Samakan versi paket dengan SDK |
| `npx expo install <paket>` | Pasang paket dengan versi yang cocok dengan SDK |

Jalankan `npm run verify` dan `git diff --check` sebelum membuka pull request.
CI menjalankan langkah yang sama; lihat `.github/workflows/ci.yml`.

## 11. Build dengan EAS

Profil build ada di `eas.json`: `development` (development client, distribusi internal), `preview` (distribusi internal), dan `production` (versi naik otomatis).

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

`app.json` sudah berisi `owner` dan `extra.eas.projectId` milik tim. Agar bisa membangun lewat EAS, akunmu harus punya akses ke organisasi tersebut, atau ganti dua nilai itu dengan milikmu sendiri. Variabel `EXPO_PUBLIC_*` juga harus diset di EAS (secret/environment variable) agar ikut masuk ke build.

## 12. Pemecahan masalah

| Gejala | Penyebab dan solusi |
|---|---|
| `Unable to resolve module expo-blur` (atau modul lain) | Dependensi belum terpasang. Jalankan `npm install`, lalu `npx expo start -c`. Jika baru menambah paket native di development build, build ulang. |
| Layar "Konfigurasi Firebase belum lengkap" | Ada variabel `EXPO_PUBLIC_FIREBASE_*` yang kosong atau `.env` belum dibuat. Isi lalu restart dengan `-c`. |
| "Metode login belum diaktifkan" | Aktifkan Email/Password di Firebase Authentication. |
| "Kamu tidak punya akses untuk tindakan ini" | Rules belum dipasang, atau akun belum berperan `asisten` untuk aksi yang butuh itu. |
| Login berhasil tetapi muncul "Profil tidak ditemukan" | Dokumen `users/{uid}` belum ada. Buat lewat registrasi di aplikasi, atau tambahkan manual di Firestore. |
| Tab Admin tidak muncul | `isAdmin` pada profil belum `true`. Keluar dan masuk lagi setelah mengubahnya. |
| Jadwal Asisten menampilkan data contoh | Koleksi `sessions` masih kosong. Tambahkan sesi lewat layar Atur Sesi (bagian 8). |
| Jadwal Asisten tampak kosong padahal ada sesi | Layar jadwal menampilkan satu tanggal saja (tanggal sesi pertama dari Firestore). Cek sesi yang dicari lewat layar Atur Sesi. |
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
- [`SPRINT-2-PLAN.md`](SPRINT-2-PLAN.md): pembagian tugas Sprint 2 dan ketergantungan antar developer.
- [`ai/README.md`](ai/README.md): cara memakai dan melatih model sentimen. Catatan: berkas pelatihan yang disebut di sana (`train_edom.py`, `edom-data.csv`) tidak ada di repositori ini.
- `docs/`: catatan lokal (diabaikan Git; tidak ikut clone). Dokumen tim yang dibagikan ada di root repository.
- [`AGENTS.md`](AGENTS.md): aturan teknis untuk contributor dan asisten coding.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): alur Git, commit, test, dan pull request.

Lisensi: lihat [`LICENSE`](LICENSE).
