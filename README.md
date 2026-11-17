# Presensi Praktikum

Aplikasi mobile (dan web) untuk presensi praktikum. Asisten membuka dan menutup sesi, praktikan mengisi presensi hanya saat sesi dibuka, dan praktikan bisa mengajukan izin yang dinilai awal oleh model sentimen lokal sebelum ditinjau asisten.

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

- **Node.js** (versi LTS terbaru) dan **npm**.
- Sebuah **proyek Firebase** (lihat bagian 3).
- Salah satu cara menjalankan:
  - **Browser** (paling mudah): tidak perlu apa-apa lagi.
  - **Emulator/perangkat Android atau iOS**: Android Studio atau Xcode, atau aplikasi [Expo Go](https://expo.dev/go) di ponsel. Karena proyek memakai modul native (`expo-blur`, `expo-glass-effect`, dan lainnya), jika Expo Go menampilkan galat modul native, gunakan *development build* (lihat bagian 4).

## 3. Konfigurasi Firebase

Aplikasi tidak bisa berjalan tanpa konfigurasi ini. Jika variabel `.env` kosong, aplikasi menampilkan layar *"Konfigurasi Firebase belum lengkap"*.

### 3.1 Buat proyek dan aktifkan layanan

Di [Firebase Console](https://console.firebase.google.com/):

1. Buat proyek baru (atau minta akses ke proyek tim).
2. **Authentication → Sign-in method**: aktifkan **Email/Password**.
3. **Firestore Database**: buat database (mode produksi, lalu pasang rules di langkah 3.3).
4. **Project settings → Your apps**: tambahkan aplikasi **Web** (`</>`) dan salin nilai konfigurasinya. Aplikasi memakai Firebase JS SDK, jadi file `google-services.json` / `GoogleService-Info.plist` **tidak dipakai**.

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
| `classes`, `enrollments`, `sessions` | semua yang login (`enrollments`: pemilik atau asisten) | asisten |
| `attendance` | semua yang login | praktikan membuat sendiri (ID `{sessionId}_{uid}`, satu kali); update/hapus oleh asisten |
| `permissionRequests` | pemilik atau asisten | praktikan membuat (`pending`); asisten meninjau |
| `auditLogs` | asisten | semua yang login boleh membuat catatan atas namanya; tidak bisa diubah/dihapus |
| `invitationCodes` | semua yang login | admin membuat/menghapus |

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
├── docs/                        Rencana dan spesifikasi desain (plans/, specs/)
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
│   │       ├── sesi/[id]        kelola sesi (buka/tutup, daftar hadir)
│   │       └── izin/            daftar dan tinjau izin
│   ├── components/              Komponen bersama (Toast, ConfirmModal, LoadingState, ErrorState, BottomSheet, form/)
│   ├── constants/               Konstanta (transisi tab)
│   ├── context/                 auth-context, session-context, theme-context, blur-target, tab-bar-inset
│   ├── data/dummy.ts            Data contoh Sprint 1 (masih dipakai sebagian layar)
│   ├── hooks/                   Hook warna/tema
│   ├── lib/
│   │   ├── firebase/            app, auth (web/native), firestore, audit (logAction), errors, converters
│   │   ├── session-actions.ts   Buka/tutup sesi + listener Firestore
│   │   ├── useSessionFirestore.ts  Hook realtime untuk jadwal, sesi, presensi
│   │   ├── attendance-service.ts   Presensi (cegah ganda lewat ID dokumen)
│   │   ├── permission-service.ts   Pengajuan dan peninjauan izin
│   │   ├── ai-service.ts        Pembungkus model sentimen (timeout + fallback)
│   │   └── validation/          Validasi form login/registrasi
│   ├── screens/                 Isi layar, dipisah per area
│   │   ├── asisten/             Beranda, jadwal, sesi, rekap, admin, izin + components/
│   │   ├── praktikan/           Jadwal, detail, riwayat, izin + components/
│   │   └── shared/              Profil dan komponen yang dipakai bersama
│   ├── theme/                   Token warna, tipografi, jarak, radius (useTheme / useThemedStyles)
│   └── types/index.ts           Tipe inti (Role, Session, UserProfile, AuditLog, ...)
├── firestore.rules              Security Rules Firestore
├── firebase.json                Menunjuk ke firestore.rules
├── eas.json                     Profil build EAS
├── app.json                     Konfigurasi Expo
├── .env.example                 Contoh variabel lingkungan
├── DESIGN.md                    Sistem visual dan antarmuka
├── SPRINT-2-PLAN.md             Pembagian tugas Sprint 2 (4 developer)
└── AGENTS.md                    Panduan untuk asisten coding (Expo, perintah, aturan)
```

Aturan umum:

- Alias impor `@/` menunjuk ke `src/` (lihat `tsconfig.json`), contoh `import { useAuth } from '@/context/auth-context'`.
- Berkas di `src/app/` hanya untuk rute. Komponen, hook, dan utilitas ditaruh di luar folder itu.
- Warna dan gaya memakai `useTheme()` / `useThemedStyles()` dari `@/theme`, bukan nilai warna tertulis langsung.
- Setiap tambah/ubah/hapus data sebaiknya memanggil `logAction(...)` dari `src/lib/firebase/audit.ts`.
- Teks antarmuka berbahasa Indonesia; tampilan waktu memakai WIB.

## 7. Rute aplikasi

| Rute | Layar |
|---|---|
| `/login`, `/register` | Masuk dan registrasi |
| `/asisten` | Beranda Asisten |
| `/asisten/jadwal` | Jadwal praktikum |
| `/asisten/rekap` | Rekap presensi |
| `/asisten/admin` | Kelola pengguna (khusus admin) |
| `/asisten/profil` | Profil Asisten |
| `/asisten/sesi/[id]` | Kelola sesi: buka/tutup dan daftar hadir |
| `/asisten/izin` dan `/asisten/izin/[id]` | Daftar dan tinjau izin |
| `/(praktikan)` | Jadwal Praktikan |
| `/(praktikan)/riwayat`, `/(praktikan)/izin`, `/(praktikan)/profil` | Riwayat, izin, profil |
| `/praktikan/sesi/[id]` | Detail sesi dan tombol presensi |

Penjagaan rute ada di `src/app/_layout.tsx` (`Stack.Protected`): pengguna tanpa profil hanya melihat grup `(auth)`, praktikan hanya area praktikan, asisten hanya area asisten.

## 8. Struktur data Firestore

| Koleksi | Isi utama |
|---|---|
| `users/{uid}` | `name`, `nim`, `email`, `role`, `isAdmin`, `createdAt`, `updatedAt` |
| `sessions/{id}` | `classId`, `title`, `date` (`YYYY-MM-DD`), `startTime`, `endTime` (`HH:MM`), `room`, `assistantId`, `status` (`scheduled` / `open` / `closed`), `createdAt`, `openedAt`, `closedAt` |
| `attendance/{sessionId}_{uid}` | `sessionId`, `userId`, `userName`, `userNim`, `recordedAt` |
| `permissionRequests/{id}` | `userId`, `userName`, `sessionId`, `reason`, `status` (`pending` / `approved` / `rejected`), hasil AI (`aiLabel`, `aiConfidence`), peninjauan (`reviewedBy`, `reviewedAt`, `reviewNote`), `createdAt` |
| `auditLogs/{id}` | `action`, `collection`, `docId`, `actorUid`, `actorRole`, `before`, `after`, `timestamp` |
| `classes`, `enrollments` | Disiapkan di rules dan konstanta, **belum dipakai kode aplikasi** |

Alur status sesi: `scheduled → open → closed` (tidak ada transisi lain).

### Membuat sesi untuk pengujian

Saat ini belum ada layar untuk membuat sesi (lihat bagian 9). Sementara itu, buat dokumen di koleksi `sessions` lewat Firebase Console:

```text
classId:     "IF-3A"
title:       "Praktikum Basis Data - Pertemuan 3"
date:        "2026-11-20"
startTime:   "08:00"
endTime:     "09:40"
room:        "Lab Komputer A"
assistantId: "<uid asisten>"
status:      "scheduled"
createdAt:   <timestamp>
```

Selama koleksi `sessions` kosong, layar jadwal Asisten menampilkan data contoh. Begitu ada satu sesi sungguhan, data contoh berhenti dipakai di layar itu.

## 9. Status pengerjaan

Berdasarkan pembagian di `SPRINT-2-PLAN.md` dan isi kode saat ini.

| Area | Keadaan |
|---|---|
| **Dev 1: Fondasi & auth** | Ada: setup Firebase, login/registrasi/logout, profil `users`, auth context dan persist sesi, navigasi per peran, `logAction`, pemetaan galat Firebase, komponen loading/empty/error. |
| **Dev 2: Data praktikum** | **Belum ada di repo**: CRUD kelas, CRUD peserta (enrollments), CRUD jadwal dan sesi (tambah/ubah/hapus), filter praktikan berdasarkan enrollment, dan penggantian seluruh data dummy ke Firestore. |
| **Dev 3: Sesi, presensi, rules** | Ada: buka/tutup sesi dengan audit log, presensi hanya saat sesi `open`, pencegahan presensi ganda, rekap realtime, `firestore.rules` untuk semua koleksi. |
| **Dev 4: Izin & AI** | Ada: form izin, modul AI dengan timeout dan fallback, penyimpanan `permissionRequests`, riwayat izin praktikan, daftar dan peninjauan izin oleh asisten. |

Keterbatasan yang perlu diketahui:

- **Asisten belum bisa membuat sesi atau mengubah tanggal/jam/ruang** dari aplikasi. Satu-satunya aksi tulis pada sesi adalah buka dan tutup. Aturan Firestore sudah mengizinkan asisten menulis `sessions`, jadi yang kurang hanya kode aplikasinya (tugas Dev 2, poin 2.3).
- **Sebagian layar masih memakai data contoh**: beranda dan rekap Asisten (`AssistantPreviewProvider`), serta jadwal, detail, riwayat, dan izin Praktikan (`SessionContext` yang diisi `src/data/dummy.ts`). Data ini hilang saat aplikasi dimuat ulang.
- Daftar peserta per sesi (`participantIds`) belum terhubung karena `enrollments` belum dipakai.
- `listenSessionsByClass` di `session-actions.ts` memakai `where` + dua `orderBy`, sehingga butuh indeks komposit Firestore jika kelak dipakai. Saat ini belum dipanggil di mana pun.

## 10. Perintah yang sering dipakai

| Perintah | Fungsi |
|---|---|
| `npm install` | Pasang dependensi |
| `npm start` | Jalankan server pengembangan Expo |
| `npm run web` | Jalankan versi web |
| `npm run android` / `npm run ios` | Build dan jalankan development build lokal |
| `npm run lint` | ESLint (`expo lint`) |
| `npx tsc --noEmit` | Periksa tipe TypeScript |
| `npx expo-doctor` | Periksa masalah dependensi dan konfigurasi |
| `npx expo install --fix` | Samakan versi paket dengan SDK |
| `npx expo install <paket>` | Pasang paket dengan versi yang cocok dengan SDK |

Jalankan `npm run lint` dan `npx tsc --noEmit` sebelum membuka pull request.

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
| Jadwal Asisten menampilkan data contoh | Koleksi `sessions` masih kosong. Tambahkan sesi (bagian 8). |
| Jadwal Asisten tampak kosong padahal ada sesi | Layar jadwal menampilkan satu tanggal saja (tanggal sesi pertama dari Firestore). Pastikan sesi yang dicari ada di tanggal itu. |
| Perubahan `.env` tidak terbaca | Restart dengan `npx expo start -c`. |
| Tampilan blur tidak muncul di Android | Efek blur bergantung pada perangkat dan versi `expo-blur`; di web memakai `backdrop-filter`. |

## 13. Dokumen lain

- [`DESIGN.md`](DESIGN.md): sistem visual, rute, pola komponen, aksesibilitas.
- [`SPRINT-2-PLAN.md`](SPRINT-2-PLAN.md): pembagian tugas Sprint 2 dan ketergantungan antar developer.
- [`ai/README.md`](ai/README.md): cara memakai dan melatih model sentimen. Catatan: berkas pelatihan yang disebut di sana (`train_edom.py`, `edom-data.csv`) tidak ada di repositori ini.
- [`docs/`](docs/): rencana dan spesifikasi desain.
- [`AGENTS.md`](AGENTS.md): panduan Expo dan perintah untuk asisten coding.

Lisensi: lihat [`LICENSE`](LICENSE).
