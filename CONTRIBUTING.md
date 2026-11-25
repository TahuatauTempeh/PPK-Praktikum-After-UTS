# Berkontribusi ke Presensi Praktikum

Terima kasih sudah berkontribusi ke Presensi Praktikum. Panduan ini menjelaskan
alur kerja Git dan GitHub yang dipakai tim, dari menyiapkan repository sampai
mengirim pull request (PR).

Aturan produk ada di `PRD.md`, aturan visual di `DESIGN.md`, dan aturan teknis di
`AGENTS.md`. `README.md` menjelaskan cara menjalankan aplikasi dan perilaku yang
sudah ada. Jika panduan ini berbeda dengan dokumen tersebut, ikuti aturan yang
lebih spesifik dan terbaru.

Sprint 2 selesai. Fondasi Sprint 3 sudah berjalan, tetapi notifikasi dan
callable presensi belum final; jangan mengerjakan fitur Sprint 3 tanpa task yang
jelas.

## Daftar Isi

- [Sebelum Mulai](#sebelum-mulai)
- [Prasyarat](#prasyarat)
- [Menyiapkan Repository Lokal](#menyiapkan-repository-lokal)
- [Memahami Status Perubahan Git](#memahami-status-perubahan-git)
- [File yang Tidak Boleh Di-commit](#file-yang-tidak-boleh-di-commit)
- [Memilih Task dan Menyinkronkan `main`](#memilih-task-dan-menyinkronkan-main)
- [Membuat Branch Kerja](#membuat-branch-kerja)
- [Aturan Implementasi](#aturan-implementasi)
- [Meninjau dan Men-stage Perubahan](#meninjau-dan-men-stage-perubahan)
- [Menulis Commit](#menulis-commit)
- [Menjalankan Tes](#menjalankan-tes)
- [Menjalankan Verifikasi Lokal](#menjalankan-verifikasi-lokal)
- [Menyinkronkan Branch Sebelum Push](#menyinkronkan-branch-sebelum-push)
- [Push dan Pull Request](#push-dan-pull-request)
- [CI](#ci)
- [Build dan Distribusi dengan EAS](#build-dan-distribusi-dengan-eas)
- [Review dan Merge](#review-dan-merge)
- [Menangani Merge Conflict](#menangani-merge-conflict)
- [Masalah Umum](#masalah-umum)
- [Checklist Kontributor](#checklist-kontributor)
- [Glosarium Perintah Git](#glosarium-perintah-git)
- [Referensi](#referensi)

## Sebelum Mulai

1. Baca `README.md` untuk cara menjalankan aplikasi dan struktur Firestore.
2. Baca bagian `PRD.md` yang berkaitan dengan task. `PRD.md` memuat ruang
   lingkup, aturan bisnis, UAT, dan pembagian tugas empat developer.
3. Baca `DESIGN.md` sebelum mengubah tampilan.
4. Koordinasikan task dengan anggota tim agar tidak ada dua orang mengubah area
   yang sama tanpa sengaja.
5. Kerjakan satu perubahan logis dalam satu branch.
6. Jangan mengerjakan fitur langsung pada `main`. Gunakan branch kerja dan
   ajukan PR ke `main`.
7. Jangan memasukkan perbaikan atau refactor yang tidak berkaitan dengan task.

Kontributor yang punya akses tulis dapat clone repository utama. Jika tidak,
buat fork di GitHub, clone fork tersebut, lalu arahkan PR ke repository utama.

## Prasyarat

Pastikan perangkat memiliki:

- Git;
- Node.js 22.13+ atau 24.3+ (Expo SDK 58 mendukung `^22.13.0 || ^24.3.0`);
- npm (proyek memakai `package-lock.json`, bukan pnpm/yarn/bun);
- akses ke project Firebase tim `praktikum-ppk-3` (Authentication dan Cloud Firestore);
- Android Studio dan emulator/perangkat Android, atau development build;
- akses ke organisasi EAS `kemal-fazas-team` bila akan membuat build;
- akses ke repository GitHub.

Periksa versi tool:

```bash
git --version
node --version
npm --version
```

Atur identitas Git jika belum pernah dilakukan:

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email@contoh.com"
```

Gunakan email yang terhubung ke akun GitHub agar kontribusi tercatat pada profil
yang benar. Periksa dengan `git config --global --list`.

## Menyiapkan Repository Lokal

Clone repository dan masuk ke direktorinya. HTTPS adalah pilihan termudah jika
SSH key GitHub belum disiapkan:

```bash
git clone https://github.com/TahuatauTempeh/PPK-Praktikum-After-UTS.git
cd PPK-Praktikum-After-UTS
```

Jika memakai SSH:

```bash
git clone git@github.com:TahuatauTempeh/PPK-Praktikum-After-UTS.git
```

Pada alur fork, clone fork sendiri sebagai `origin`, lalu tambahkan repository
utama sebagai `upstream`:

```bash
git clone https://github.com/nama-pengguna/PPK-Praktikum-After-UTS.git
cd PPK-Praktikum-After-UTS
git remote add upstream https://github.com/TahuatauTempeh/PPK-Praktikum-After-UTS.git
git remote -v
```

Ambil pembaruan `main` dari `upstream`, tetapi push branch ke `origin`.

### Konfigurasi Firebase dan `.env`

Aplikasi tidak bisa berjalan tanpa konfigurasi Firebase. Salin contoh lalu isi
enam variabel dari Web App di Firebase Console:

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

Langkah di Firebase Console:

1. Buka project tim, atau buat project baru bila memang task-mu membutuhkannya.
2. **Authentication → Sign-in method**: aktifkan **Email/Password**.
3. **Firestore Database**: buat database.
4. **Project settings → Your apps**: tambahkan aplikasi **Web** (`</>`), lalu
   salin konfigurasinya ke `.env`.
5. Pasang security rules:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project <PROJECT_ID>
```

Atau salin `firestore.rules` ke **Firestore → Rules** di Console lalu
**Publish**.

Catatan:

- Metro membaca `.env` saat start. Setelah mengubah `.env`, jalankan
  `npx expo start -c`.
- `.env` tidak boleh di-commit. `.env.example` hanya berisi placeholder.
- `google-services.json` tidak dipakai untuk Auth/Firestore inti dan diabaikan
  Git. Untuk push notification Android pada Sprint 3, file itu akan dipakai
  lewat `android.googleServicesFile`; jangan commit file tersebut.
- `docs/` diabaikan Git, kecuali arsip `docs/sprint-*.md`, jadi jangan
  mengandalkan tautan ke file lain di dalamnya untuk kontributor lain. Setup
  Firebase di atas sengaja ditulis di panduan ini.

### Menjalankan aplikasi

```bash
npm install
npm run web          # browser, paling cepat untuk mencoba UI
npm start            # menu Expo: Android / iOS / web
npm run android      # development build lokal
npm run ios          # development build lokal, macOS
```

Aplikasi memakai modul native seperti `@expo/ui`, `expo-blur`,
`expo-glass-effect`, dan `expo-symbols`. Jika Expo Go menampilkan galat modul
native, gunakan development build. `npm run android` / `npm run ios` membuat
folder `android/` dan `ios/`; folder itu digenerate dan diabaikan Git. Jangan
mengeditnya manual. Setelah menambah paket native, build ulang development
client.

### Admin pertama

Registrasi di aplikasi selalu membuat akun `praktikan`. Admin pertama dibuat
manual:

1. Daftar lewat aplikasi.
2. Buka Firestore → `users/{uid}` akun tersebut.
3. Ubah `role` menjadi `asisten` dan `isAdmin` menjadi `true`.
4. Keluar lalu masuk lagi di aplikasi.

Asisten berikutnya dipromosikan lewat tab **Admin**, bukan lewat Console.
`invitationCodes` ada di rules tetapi belum dipakai kode aplikasi.

## Memahami Status Perubahan Git

File dalam working tree berpindah melalui beberapa keadaan:

1. **Untracked**: file baru yang belum dipantau Git.
2. **Modified**: file yang dipantau Git dan sudah diubah.
3. **Staged**: perubahan yang dipilih untuk commit berikutnya.
4. **Committed**: snapshot yang sudah tersimpan di riwayat lokal.
5. **Ignored**: file yang sengaja tidak dipantau berdasarkan `.gitignore`.

Periksa keadaan repository sesering mungkin:

```bash
git status
```

Pilih satu file untuk staging:

```bash
git add src/lib/class-service.ts
```

Batalkan staging tanpa membuang perubahan lokal:

```bash
git restore --staged src/lib/class-service.ts
```

Simpan perubahan staged sebagai commit:

```bash
git commit -m "feat(kelas): tambahkan validasi nama kelas"
```

## File yang Tidak Boleh Di-commit

`.gitignore` mencegah file lokal, rahasia, dan hasil generate masuk ke
repository. Jangan commit:

- `.env` atau file environment lokal lain;
- `node_modules/`, `.expo/`, `dist/`, dan `web-build/`;
- `android/` dan `ios/` hasil generate;
- `expo-env.d.ts` hasil generate;
- `google-services.json`;
- `.codegraph/`;
- `coverage/` hasil test;
- file kunci/keystore (`*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`);
- `docs/` yang memang diabaikan (catatan lokal), kecuali arsip `docs/sprint-*.md`;
- file SQL lokal atau dokumen yang tidak terkait task.

Dokumen yang perlu dibagikan taruh di root repository, bukan di `docs/`, kecuali
arsip sprint yang memang disimpan di `docs/`.

`.env.example` harus tetap tersedia sebagai contoh tanpa secret. Periksa alasan
sebuah file diabaikan:

```bash
git check-ignore -v .env
```

Jika file yang seharusnya diabaikan telanjur dipantau, hapus hanya dari Git tanpa
menghapus file lokal:

```bash
git rm --cached -- path/ke/file
```

Kemudian perbaiki `.gitignore` dan tinjau perubahan sebelum commit.

### Jika secret telanjur masuk ke commit

1. Jangan push commit tersebut.
2. Beri tahu maintainer dan hapus secret dari perubahan serta riwayat lokal yang
   belum dibagikan.
3. Jika commit sudah terkirim ke remote, anggap secret bocor: segera rotasi atau
   cabut secret tersebut.
4. Koordinasikan pembersihan riwayat dengan maintainer. Jangan force push sendiri
   karena dapat merusak pekerjaan anggota lain.

Menghapus teks secret dari commit terbaru tidak membuat secret yang sudah
terkirim menjadi aman. Rotasi tetap wajib.

## Memilih Task dan Menyinkronkan `main`

Pilih task berdasarkan pembagian di `PRD.md` dan dependensi antarmodul. Sprint 3
memakai empat developer:

1. **Dev 1**: platform, data laboratorium, integrasi sesi.
2. **Dev 2**: presensi berbasis lokasi dan callable attendance.
3. **Dev 3**: peta dan aktivitas laboratorium.
4. **Dev 4**: notifikasi dan kondisi perangkat.

Sprint 2 memiliki pembagian sendiri di `docs/sprint-2-plan.md` (arsip):
fondasi/auth, data praktikum, sesi/presensi/rules, dan izin/AI. Gunakan pembagian
itu sebagai konteks historis, bukan alasan untuk mencampur pekerjaan baru ke
area yang tidak dimiliki.

Sebelum membuat branch baru, sinkronkan `main` lokal:

```bash
git switch main
git fetch origin
git pull --ff-only origin main
```

Pada alur fork, sumber pembaruan adalah `upstream`:

```bash
git fetch upstream
git pull --ff-only upstream main
```

Pastikan working tree bersih sebelum berpindah branch:

```bash
git status
```

## Membuat Branch Kerja

Buat branch dari `main` yang sudah terbaru:

```bash
git switch -c feat/presensi-lokasi
```

Gunakan nama singkat kebab-case dengan prefix yang sesuai:

| Prefix | Kegunaan | Contoh |
| --- | --- | --- |
| `feat/` | Fitur baru | `feat/presensi-lokasi` |
| `fix/` | Perbaikan bug | `fix/validasi-jam-sesi` |
| `chore/` | Tooling atau pemeliharaan | `chore/perbarui-jest` |
| `docs/` | Dokumentasi saja | `docs/panduan-kontribusi` |
| `test/` | Menambah atau memperbaiki test | `test/guard-presensi` |

Perintah branch yang umum:

```bash
git branch
git switch nama-branch
git switch -c nama-branch-baru
```

## Aturan Implementasi

### Pisahkan rute, layar, service, dan tema

- **Rute**: `src/app/` hanya berisi file rute dan `_layout.tsx`.
- **Layar**: `src/screens/` berisi implementasi UI per area.
- **Komponen bersama**: `src/components/`.
- **State**: `src/context/`.
- **Akses data**: service di `src/lib/` dan hook realtime.
- **Tema**: `src/theme/` adalah satu-satunya sumber warna, tipografi, jarak, dan
  radius.
- **Tipe**: `src/types/index.ts`.

Jangan membuat direktori `/views`. Jangan menaruh komponen, hook, atau utilitas
baru di `src/app/`. Gunakan alias `@/` untuk `src/` dan `@/assets/` untuk
`assets/`.

Layar tidak boleh mengimpor `firebase/firestore` langsung; gunakan service atau
hook. Pengecualian lama ada di `admin-screen.tsx`, `use-sesi-izin.ts`, dan
`shared/izin.ts`; pindahkan ke service saat menyentuh file tersebut.
`auth-context.tsx` adalah batas auth dan boleh memakai Firebase Auth langsung.

`src/lib/firebase/auth.ts` adalah pintu masuk lintas platform. Metro memilih
`auth.native.ts` di Android/iOS dan `auth.web.ts` di web. Jangan mengimpor file
platform secara langsung dari layar.

### Ikuti aturan domain

- Registrasi selalu membuat `praktikan`; hanya admin yang boleh mengubah peran.
- Status sesi Firestore: `scheduled → open → closed`. Transisi lain ditolak.
- Sesi baru selalu `scheduled`.
- Presensi hanya saat sesi `open`; satu catatan per sesi dengan ID
  `{sessionId}_{uid}`.
- Jalur fallback presensi (PRD 14.1) memeriksa enrollment di rules. Jangan
  mengklaim jarak, akurasi, atau deteksi mock juga diperiksa server selama
  fallback aktif; nilai itu masih client-enforced sampai callable ter-deploy.
- Izin berstatus `pending`, `approved`, atau `rejected`; praktikan hanya membuat
  `pending`, asisten yang meninjau.
- Label AI bersifat saran. `null` berarti hasil tidak tersedia, bukan `netral`.
- Setiap tambah/ubah/hapus data praktikum harus menulis audit log lewat
  `logAction`/`logActionInBatch`.
- ID enrollment adalah `{classId}_{uid}`. Jangan membuat mekanisme duplikat lain.
- Menghapus kelas tidak menghapus sesi/peserta. Jangan menambahkan cascade di
  layar; taruh aturan bersama di service bila memang dibutuhkan.
- Tanggal `YYYY-MM-DD`, jam `HH:mm`, tampilan WIB, label Indonesia.
- Nilai status di data berbahasa Inggris; label pengguna berbahasa Indonesia.

### Validasi dan keamanan

- Validasi input di batas sistem dan tampilkan pesan yang aman bagi pengguna.
- Jangan mempercayai validasi client sebagai satu-satunya perlindungan.
- Jangan menonaktifkan error handling, pengecekan peran, rules, atau CI agar
  perubahan terlihat berhasil.
- Jangan mencatat password, token, connection string, atau data sensitif lain.
- Perubahan `firestore.rules` harus diuji pada project uji dan dijelaskan di PR.
  CI menjalankan `npm run test:rules` di job `rules-e2e`.
- Penulisan langsung ke `attendance` hanya boleh lewat jalur fallback
  `src/lib/attendance-fallback.ts` selama project masih Spark. Jangan menambah
  jalur tulis lain, dan jangan menghapus pemeriksaan rules pada fallback.

### Test

- Tambahkan test untuk logika baru dan perbaikan bug yang bisa diuji tanpa
  perangkat.
- Letakkan test di samping file sumber: `*.test.ts` atau `*.test.tsx`.
- Mock Firebase di batas modul; unit test tidak boleh memakai kredensial atau
  emulator.
- Uji perilaku, bukan detail implementasi. Jangan menulis snapshot UI.
- Jangan menghapus atau melemahkan test hanya agar CI hijau.

## Meninjau dan Men-stage Perubahan

Tinjau perubahan sebelum memilih file untuk commit:

```bash
git status
git diff
```

Stage hanya file yang berhubungan dengan satu perubahan logis:

```bash
git add src/lib/session-service.ts
git add src/lib/praktikum-helpers.test.ts
```

Hindari `git add .` karena mudah memasukkan file yang tidak terkait atau
sensitif. Untuk memisahkan bagian dalam satu file, gunakan patch staging:

```bash
git add -p src/lib/session-service.ts
```

Periksa snapshot yang benar-benar akan di-commit:

```bash
git diff --staged
git status
```

Batalkan staging satu file tanpa kehilangan edit:

```bash
git restore --staged path/ke/file
```

`git restore path/ke/file` membuang perubahan lokal dan tidak dapat dipulihkan
dengan mudah; gunakan hanya setelah yakin.

## Menulis Commit

Gunakan format Conventional Commits:

```text
<type>(<scope>): <deskripsi singkat>
```

Scope opsional. Type yang digunakan:

| Type | Kegunaan |
| --- | --- |
| `feat` | Menambah fitur |
| `fix` | Memperbaiki bug |
| `docs` | Mengubah dokumentasi |
| `style` | Mengubah format tanpa mengubah perilaku |
| `refactor` | Merapikan struktur tanpa mengubah perilaku |
| `perf` | Meningkatkan performa |
| `test` | Menambah atau memperbaiki test |
| `chore` | Pemeliharaan atau tooling |
| `ci` | Mengubah pipeline CI |
| `revert` | Membatalkan commit sebelumnya |

Tulis deskripsi sebagai perintah, huruf kecil, bahasa Indonesia, tanpa titik di
akhir, dan idealnya 50–72 karakter. Contoh:

```bash
git commit -m "feat(presensi): tambahkan validasi radius laboratorium"
git commit -m "fix(sesi): cegah penutupan sesi yang belum dibuka"
git commit -m "test(izin): tambahkan guard peninjauan ganda"
git commit -m "docs: tambahkan panduan kontribusi"
```

Satu commit harus atomic: satu tujuan yang dapat dijelaskan dan ditinjau sendiri.
Jangan mencampur fitur, refactor tak terkait, dan perubahan format.

Gunakan body jika alasannya tidak jelas dari judul:

```bash
git commit -m "fix(presensi): periksa status sesi sebelum menulis" \
  -m "Mencegah presensi tercatat saat sesi sudah ditutup oleh asisten."
```

## Menjalankan Tes

Test memakai Jest 30 dengan preset `jest-expo` dan React Native Testing Library
14. File test diletakkan co-located di samping sumbernya.

```bash
npm test              # mode lokal
npm run test:watch    # watch saat mengembangkan
npm run test:ci       # sekali jalan, dipakai CI (--ci --runInBand)
npm run test:coverage # laporan coverage ke coverage/
```

Pemeriksaan saat ini mencakup validasi auth, helper tanggal/jam, pemetaan error
Firebase, konversi profil, guard buka/tutup sesi, guard presensi, pencegahan
enrollment ganda, analisis AI, normalisasi izin, format WIB, rekap, dan komponen
inti (LoadingState, ErrorState, ConfirmModal, StatusLabel).

Contoh test komponen:

```tsx
import { render } from '@testing-library/react-native';

import { LoadingState } from './LoadingState';

it('menampilkan pesan default', async () => {
  const { getByText } = await render(<LoadingState />);

  expect(getByText('Memuat data...')).toBeTruthy();
});
```

Aturan penting:

- RNTL 14 memakai render async: `await render(...)`. Untuk press, gunakan
  `await fireEvent.press(...)` atau `await user.press(...)`.
- Mock `firebase/firestore` dan `@/lib/firebase/*` pada service test. Jangan
  menginisialisasi Firebase asli.
- Jangan menguji teks implementasi internal atau memakai snapshot. Uji hasil yang
  terlihat pengguna dan efek samping yang penting.
- Test yang butuh perangkat atau modul native bukan unit test; catat sebagai
  langkah UAT manual. Test rules Firestore ditambahkan ke `e2e/rules/` dan
  dijalankan dengan `npm run test:rules`.

Firestore rules E2E sudah dicakup otomatis lewat `npm run test:rules`
(Firestore emulator + Java 21+). E2E web Playwright tersedia lewat
`npm run test:web` (Chromium + Java 21+) dan menjalankan 5 flow critical.
Android E2E tersedia lewat `npm run test:android` (Maestro, emulator API 35,
Java 21+) dan menjalankan 3 flow critical; build APK dulu dengan
`npm run android:e2e:build` dan boot emulator. Prasyarat lokal: Android SDK,
`adb`, Maestro, Java 21+, dan KVM untuk CI. `npm run test:android` bukan bagian
dari `npm run verify`. Full UAT tersedia lokal lewat `npm run test:web:full`
(seluruh ID UAT web yang dapat diotomasi) dan `npm run test:android:full` (flow
native best-effort); `npm run uat:check` memeriksa matriks 65 ID dan tag test.
Full tier tidak berjalan di CI. Yang belum dicakup otomatis: push notification,
marker peta native, DEV-04, DEV-07, dan build native. Perubahan pada area itu
tetap memerlukan pengujian manual; lihat `e2e/uat/manual-checklist.md`. Skenario
harness rules saat ini fokus pada `attendance`; rules koleksi lain belum
dicakup.

## Menjalankan Verifikasi Lokal

Jalankan pemeriksaan yang sama dengan CI:

```bash
npm run lint
npm run typecheck
npm run test:ci
npm run test:rules
npm run test:web
npm --prefix functions test -- --ci --runInBand
npm --prefix functions run build
git diff --check
```

`npm run test:rules` membutuhkan Java 21+ dan Firebase Emulator. Bila `java`
default masih 17, set `JAVA_HOME`/`PATH` ke JDK 21 atau lebih baru sebelum
menjalankan perintah.

`npm run test:web` juga membutuhkan Chromium:

```bash
npx playwright install chromium
```

Akun seed E2E: `praktikan1@test.local`, `praktikan2@test.local`, dan
`asisten@test.local`, semuanya dengan password `e2e-password`. Seed mereset
Firestore dan Auth emulator di awal setiap run.

`npm run verify` menjalankan lint, typecheck, dan `test:ci` sekaligus. `typecheck`
memakai `tsc --noEmit`; `lint` memakai `expo lint`. CI juga menginstal, menguji,
dan membangun `functions/`.

`npx expo-doctor` boleh dijalankan saat menaikkan SDK atau menambah dependency,
tetapi saat ini dapat melaporkan drift patch/minor dan membutuhkan akses ke
Expo API. Jangan menjadikannya syarat merge tanpa memperbaiki versinya.

Jika perubahan menyentuh database atau aturan akses:

```bash
npx firebase-tools deploy --only firestore:rules --project <PROJECT_ID>
```

Uji alur yang terdampak secara manual:

- login, register, logout, dan redirect sesuai peran;
- CRUD kelas, peserta, dan sesi;
- buka/tutup sesi;
- presensi saat sesi `open`, penolakan saat `closed`, dan pencegahan duplikat;
- pengajuan izin, hasil AI, dan peninjauan asisten;
- promosi peran di tab Admin.

Untuk perubahan UI native, uji di Android development build, bukan hanya web.

## Menyinkronkan Branch Sebelum Push

Ambil perubahan terbaru dari remote:

```bash
git fetch origin
```

Untuk branch pribadi yang belum dibagikan, rapikan commit di atas `main`
terbaru:

```bash
git rebase origin/main
```

Pada alur fork, gunakan `upstream/main`:

```bash
git fetch upstream
git rebase upstream/main
```

Jangan rebase branch yang dipakai bersama. Untuk branch PR yang sudah dibagikan,
sinkronkan tanpa menulis ulang riwayat:

```bash
git merge origin/main
```

Setelah sinkronisasi, jalankan `npm run verify` lagi. Jika muncul konflik, ikuti
bagian [Menangani Merge Conflict](#menangani-merge-conflict).

## Push dan Pull Request

Push pertama sekaligus memasang upstream:

```bash
git push -u origin feat/presensi-lokasi
```

Push berikutnya:

```bash
git push
```

Buka PR ke `main`. Deskripsi PR sebaiknya memuat:

- ringkasan perubahan dan alasannya;
- task/modul/requirement terkait;
- langkah pengujian yang sudah dijalankan, termasuk `npm run verify`;
- screenshot sebelum/sesudah untuk perubahan UI;
- perubahan `firestore.rules`, konfigurasi Firebase, `.env.example`, atau
  dependency baru;
- risiko atau dampak ke modul lain.

Pastikan diff PR tidak memuat `.env`, secret, file hasil generate, debug log,
atau perubahan di luar scope. Jangan mengubah `README.md`, `PRD.md`, atau
`DESIGN.md` tanpa alasan yang jelas bila task hanya menyentuh kode.

## CI

Workflow ada di `.github/workflows/ci.yml` dan berjalan pada:

- pull request ke `main`;
- push ke `main`;
- `workflow_dispatch` manual.

Langkahnya:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:ci
```

Job `rules-e2e` menjalankan `npm run test:rules` dengan Java 21.

Job `web-e2e` menjalankan `npm run test:web` dengan Java 21 dan Chromium.

CI memakai Node 24 dan cache npm. Tidak ada secret Firebase yang diperlukan
karena unit test memock Firebase.

Cara mereproduksi kegagalan CI:

```bash
npm ci
npm run verify
npm ci --prefix functions
npm --prefix functions test -- --ci --runInBand
npm --prefix functions run build
```

Untuk kegagalan job `rules-e2e`, jalankan `npm run test:rules` dengan Java 21+.

Yang tidak dijalankan CI: `expo-doctor` dan EAS build. Rules Firestore, web
E2E, dan Android E2E dijalankan lewat job `rules-e2e`, `web-e2e`, dan
`android-e2e`; perubahan pada area lain tetap memerlukan verifikasi manual dan
hasilnya ditulis di PR.

## Build dan Distribusi dengan EAS

Profil di `eas.json`:

- `development`: development client, distribusi internal;
- `preview`: build internal;
- `production`: versi naik otomatis.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

`app.json` sudah berisi `owner` dan `extra.eas.projectId` tim. Akunmu harus punya
akses ke organisasi tersebut, atau ganti nilainya dengan milikmu sendiri untuk
fork. Semua `EXPO_PUBLIC_FIREBASE_*` harus disetel di environment EAS agar ikut
ter-inline ke build.

Tidak ada auto-deploy atau workflow rilis otomatis di repository ini. Build dan
distribusi dilakukan manual; jangan mengklaim rilis production otomatis.

## Review dan Merge

1. Tunggu seluruh pemeriksaan CI lulus.
2. Tanggapi komentar reviewer secara teknis dan jelas.
3. Tambahkan perbaikan review sebagai commit baru agar mudah ditinjau.
4. Minta review ulang setelah perubahan penting.
5. Gunakan metode merge yang disepakati maintainer.
6. Setelah PR di-merge, perbarui `main` lokal dan hapus branch yang tidak perlu.

```bash
git switch main
git pull --ff-only origin main
git branch -d feat/presensi-lokasi
```

Pada alur fork, perbarui `main` dari `upstream/main`. Gunakan `git branch -d`
sebagai default; `-D` hanya setelah memastikan PR sudah di-merge.

## Menangani Merge Conflict

Konflik terjadi ketika Git tidak dapat menggabungkan perubahan otomatis. Periksa
file yang konflik:

```bash
git status
```

Git menandai bagian yang perlu dipilih dengan:

- `<<<<<<< HEAD` — awal perubahan pada branch saat ini;
- `=======` — pemisah antara kedua versi;
- `>>>>>>> origin/main` — akhir perubahan yang masuk.

Langkah penyelesaian:

1. Buka setiap file konflik.
2. Pahami kedua perubahan dan pilih atau gabungkan hasil yang benar.
3. Hapus semua marker `<<<<<<<`, `=======`, dan `>>>>>>>`.
4. Stage file dengan `git add path/ke/file`.
5. Lanjutkan operasi yang sedang berjalan.

Jika rebase:

```bash
git rebase --continue
```

Jika merge, selesaikan setelah semua konflik staged:

```bash
git commit
```

Untuk membatalkan:

```bash
git rebase --abort
# atau
git merge --abort
```

Jangan hanya menghapus marker tanpa memahami perilaku yang harus dipertahankan.
Setelah selesai, jalankan `npm run verify` dan uji alur yang terdampak.

## Masalah Umum

### “Konfigurasi Firebase belum lengkap”

Ada variabel `EXPO_PUBLIC_FIREBASE_*` yang kosong atau `.env` belum dibuat. Isi
lalu restart:

```bash
npx expo start -c
```

### Modul native tidak ditemukan

Dependency belum terpasang atau development client perlu dibangun ulang:

```bash
npm install
npx expo start -c
npm run android
```

Jika baru menambah paket native, rebuild development client; Fast Refresh tidak
cukup.

### “Kamu tidak punya akses untuk tindakan ini”

Rules belum dipasang, atau akun belum berperan `asisten`/`isAdmin` untuk aksi
tersebut. Deploy `firestore.rules`, lalu cek dokumen `users/{uid}`.

### “Profil tidak ditemukan”

Dokumen `users/{uid}` belum ada. Daftar ulang lewat aplikasi atau buat dokumen
profil yang sesuai. Untuk admin pertama, ikuti langkah bootstrap di atas.

### Tab Admin tidak muncul

`isAdmin` pada profil belum `true`. Ubah di Firestore, lalu keluar dan masuk
lagi agar profil dimuat ulang.

### Jadwal Asisten kosong

Beranda, jadwal, dan rekap Asisten membaca Firestore. Bila koleksi `sessions`
masih kosong, tambahkan sesi lewat **Atur Sesi** lalu cek kembali. Data contoh
Asisten sudah dihapus, jadi jadwal kosong berarti memang belum ada sesi.

### Jadwal praktikan kosong

Praktikan belum terdaftar di kelas sesi tersebut. Tambahkan lewat
**Kelas → Peserta**. Jadwal praktikan difilter berdasarkan `enrollments`.

### Presensi ditolak

Periksa:

- status sesi harus `open`;
- praktikan harus terdaftar di kelas;
- belum ada catatan dengan ID `{sessionId}_{uid}`;
- rules sudah ter-deploy.

### Format tanggal atau jam salah

Gunakan tanggal `YYYY-MM-DD` yang benar-benar ada di kalender dan jam `HH:mm`
24 jam. Jam selesai harus lebih akhir dari jam mulai.

### Test gagal menemukan alias `@/`

`jest-expo` membaca `paths` dari `tsconfig.json`. Pastikan `jest.config.js`
memakai preset tersebut dan tidak mengganti `moduleNameMapper` preset dengan
objek kosong. Untuk CSS, stub sudah disediakan di `test/style-mock.js`.

### Test gagal mengimpor Firebase

Mock `firebase/firestore` dan modul `@/lib/firebase/*` pada service test. Jangan
memanggil `initializeApp` atau memakai kredensial di unit test.

### `render` mengembalikan Promise

RNTL 14 memakai render async. Gunakan `await render(...)` dan
`await fireEvent.press(...)`; jangan memakai pola sinkron dari versi lama.

### `npm ci` gagal karena peer dependency

Pastikan `@react-native/jest-preset` dan `jest-expo` terpasang dengan versi yang
cocok dengan React Native/Expo. Perbarui lockfile dengan `npm install`, lalu
jalankan `npm ci` lagi. Jangan menghapus peer dependency untuk memaksa install.

### `expo-doctor` melaporkan masalah

Periksa pesan versi. Saat ini proyek dapat melaporkan drift patch/minor dan
kegagalan koneksi ke Expo API. `expo-doctor` bukan gate CI; perbaiki hanya saat
memang menaikkan SDK atau dependency.

### Push ditolak karena remote lebih baru

Jangan langsung force push. Ambil branch remote, tinjau commit-nya, lalu
gabungkan:

```bash
git fetch origin
git log --oneline HEAD..origin/feat/presensi-lokasi
git merge origin/feat/presensi-lokasi
git push
```

Ganti nama branch sesuai branch yang dipakai. Jika commit remote berasal dari
anggota lain, koordinasikan dulu.

## Checklist Kontributor

### Sebelum commit

- [ ] Perubahan hanya mencakup satu tujuan logis.
- [ ] Perilaku sesuai `PRD.md`/`DESIGN.md` untuk area yang disentuh.
- [ ] Rute, layar, service, dan tema tetap terpisah.
- [ ] Tidak ada impor `firebase/firestore` baru di layar.
- [ ] Test ditambahkan atau diperbarui untuk logika yang berubah.
- [ ] `npm run verify` lulus.
- [ ] `npm run test:rules` lulus (butuh Java 21+).
- [ ] `npm run test:web` lulus (5 flow critical; butuh Java 21+ dan Chromium).
- [ ] `npm run test:android` lulus bila menyentuh alur Android (3 flow critical;
      butuh APK, Maestro, dan emulator API 35).
- [ ] Tidak ada secret, `.env`, file generate, atau debug log.
- [ ] `git diff` dan `git diff --staged` sudah ditinjau.
- [ ] Pesan commit mengikuti Conventional Commits dan bahasa Indonesia.

### Sebelum pull request

- [ ] Branch sudah disinkronkan dengan `origin/main` atau `upstream/main`.
- [ ] CI hijau.
- [ ] Perubahan `firestore.rules` sudah diuji di project uji dan dijelaskan.
- [ ] Alur manual yang terdampak sudah dicoba di web/Android sesuai kebutuhan.
- [ ] Tidak ada perubahan di luar scope pada diff PR.
- [ ] Deskripsi PR menjelaskan apa, mengapa, dan cara menguji.
- [ ] Screenshot disertakan jika tampilan berubah.
- [ ] Dampak lintas modul dan risiko dijelaskan.

## Glosarium Perintah Git

| Perintah | Fungsi |
| --- | --- |
| `git clone <url>` | Menyalin repository remote ke lokal |
| `git status` | Melihat keadaan working tree dan staging area |
| `git diff` | Melihat perubahan yang belum staged |
| `git diff --staged` | Melihat perubahan yang akan di-commit |
| `git add <path>` | Memilih perubahan untuk commit berikutnya |
| `git add -p <path>` | Memilih bagian perubahan secara interaktif |
| `git restore --staged <path>` | Membatalkan staging tanpa membuang edit |
| `git restore <path>` | Membuang edit lokal yang belum di-commit |
| `git check-ignore -v <path>` | Menjelaskan aturan ignore yang cocok |
| `git rm --cached -- <path>` | Menghapus file dari tracking tanpa menghapus file lokal |
| `git commit -m "pesan"` | Menyimpan snapshot staged ke riwayat lokal |
| `git log --oneline` | Melihat ringkasan riwayat commit |
| `git branch` | Melihat daftar branch lokal |
| `git switch <branch>` | Berpindah branch |
| `git switch -c <branch>` | Membuat dan berpindah ke branch baru |
| `git fetch origin` | Mengambil informasi terbaru tanpa menggabungkan |
| `git pull --ff-only origin main` | Memperbarui branch tanpa merge commit baru |
| `git merge origin/main` | Menggabungkan `main` remote ke branch saat ini |
| `git rebase origin/main` | Memindahkan commit lokal ke atas `main` terbaru |
| `git rebase --continue` | Melanjutkan rebase setelah konflik selesai |
| `git rebase --abort` | Membatalkan rebase |
| `git merge --abort` | Membatalkan merge yang berkonflik |
| `git remote -v` | Melihat remote dan URL-nya |
| `git push -u origin <branch>` | Push pertama dan memasang upstream |
| `git push` | Mengirim commit berikutnya ke upstream |
| `git branch -d <branch>` | Menghapus branch lokal yang sudah tergabung |

## Referensi

- [`README.md`](README.md) — setup, rute, struktur Firestore, batasan saat ini.
- [`PRD.md`](PRD.md) — Sprint 3, SRS, UAT, dan pembagian tugas.
- [`DESIGN.md`](DESIGN.md) — sistem visual dan aksesibilitas.
- [`AGENTS.md`](AGENTS.md) — aturan teknis untuk kontributor dan coding agent.
- [`docs/sprint-2-plan.md`](docs/sprint-2-plan.md) — arsip pembagian tugas Sprint 2.
- [Expo Unit Testing](https://docs.expo.dev/develop/unit-testing/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest](https://jestjs.io/docs/getting-started)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
