# Matriks Cakupan UAT

Legenda tier: `critical` (CI), `uat` (lokal), `manual`, `rules`, `ci`.
Status: `covered`, `partial`, `manual`, `blocked`, `rules`, `ci`, `pending`.
`pending` hanya boleh selama Phase 2 berjalan; `--strict` menolaknya.

| ID | Ringkasan | Tier | Platform | Bukti otomatis | Status |
|---|---|---|---|---|---|
| UAT-LAB-01 | Tambah lab lengkap | critical | web | e2e/web/specs/lab-session.e2e.ts::asisten menyiapkan lab dan siklus sesi | covered |
| UAT-LAB-02 | Validasi koordinat dan radius | uat | web | e2e/web/specs/labs.e2e.ts::[UAT-LAB-02] validasi koordinat dan radius | covered |
| UAT-LAB-03 | Gunakan lokasi saya | uat | web | e2e/web/specs/labs.e2e.ts::[UAT-LAB-03] gunakan lokasi saya | covered |
| UAT-LAB-04 | Ubah nama dan radius lab | uat | web | e2e/web/specs/labs.e2e.ts::[UAT-LAB-04] ubah nama dan radius | covered |
| UAT-LAB-05 | Nonaktifkan lab | uat | web | e2e/web/specs/labs.e2e.ts::[UAT-LAB-05] nonaktifkan lab | covered |
| UAT-LAB-06 | Guard praktikan di halaman lab | uat | web | e2e/web/specs/labs.e2e.ts::[UAT-LAB-06] guard praktikan | covered |
| UAT-LAB-07 | Form sesi menolak lab kosong | uat | web | e2e/web/specs/sessions.e2e.ts::[UAT-LAB-07] form sesi menolak laboratorium kosong | covered |
| UAT-LAB-08 | Buka sesi tanpa lab ditolak | uat | web | e2e/web/specs/sessions.e2e.ts::[UAT-LAB-08] buka sesi tanpa lab ditolak | covered |
| UAT-ATT-01 | Presensi dalam radius | critical | web | e2e/web/specs/presensi.e2e.ts::praktikan mencatat presensi di dalam radius | covered |
| UAT-ATT-02 | Presensi luar radius | critical | web | e2e/web/specs/presensi-luar-radius.e2e.ts::menolak presensi di luar area absen tanpa menulis dokumen | covered |
| UAT-ATT-03 | Izin lokasi ditolak | uat | android | e2e/android/flows/izin-lokasi-ditolak.yaml::Izin lokasi ditolak | covered |
| UAT-ATT-04 | Izin lokasi diblokir permanen | manual | manual | e2e/uat/manual-checklist.md#UAT-ATT-04 | manual |
| UAT-ATT-05 | Layanan lokasi mati | uat | android | e2e/android/flows/layanan-lokasi-mati.yaml::Layanan lokasi mati | covered |
| UAT-ATT-06 | GPS tanpa fix | manual | manual | e2e/uat/manual-checklist.md#UAT-ATT-06 | manual |
| UAT-ATT-07 | Akurasi lebih dari 100 m | uat | web | e2e/web/specs/attendance.e2e.ts::[UAT-ATT-07] akurasi rendah menonaktifkan presensi | covered |
| UAT-ATT-08 | Sesi scheduled dan closed | uat | web | e2e/web/specs/attendance.e2e.ts::[UAT-ATT-08] sesi scheduled dan closed menolak presensi | covered |
| UAT-ATT-09 | Sesi ditutup realtime | uat | web | e2e/web/specs/attendance.e2e.ts::[UAT-ATT-09] penutupan sesi realtime | covered |
| UAT-ATT-10 | Duplikat presensi | uat | web | e2e/web/specs/attendance.e2e.ts::[UAT-ATT-10] duplikat presensi ditolak | covered |
| UAT-ATT-11 | Tidak terdaftar di sesi | uat | web | e2e/web/specs/attendance.e2e.ts::[UAT-ATT-11] praktikan tidak terdaftar | covered |
| UAT-ATT-12 | Offline saat presensi | manual | manual | e2e/uat/manual-checklist.md#UAT-ATT-12 | manual |
| UAT-ATT-13 | Direct write ditolak rules | rules | rules | npm run test:rules | rules |
| UAT-ATT-14 | Rekap kehadiran asisten | critical | web | e2e/web/specs/asisten-kehadiran.e2e.ts::asisten melihat kehadiran pada sesi tertutup | covered |
| UAT-ATT-15 | Sesi tanpa lab atau lab nonaktif | uat | web | e2e/web/specs/attendance.e2e.ts::[UAT-ATT-15] sesi tanpa lab dan lab nonaktif | covered |
| UAT-MAP-01 | Tiga marker lab dan marker user | manual | manual | e2e/uat/manual-checklist.md#UAT-MAP-01 | manual |
| UAT-MAP-02 | Marker user bergerak | manual | manual | e2e/uat/manual-checklist.md#UAT-MAP-02 | manual |
| UAT-MAP-03 | Ketuk marker lab | manual | manual | e2e/uat/manual-checklist.md#UAT-MAP-03 | manual |
| UAT-MAP-04 | Panel Sekarang | uat | web | e2e/web/specs/map.e2e.ts::[UAT-MAP-04] panel Sekarang | covered |
| UAT-MAP-05 | Panel Berikutnya | uat | web | e2e/web/specs/map.e2e.ts::[UAT-MAP-05] panel Berikutnya | covered |
| UAT-MAP-06 | Lab tanpa sesi | uat | web | e2e/web/specs/map.e2e.ts::[UAT-MAP-06] lab tanpa sesi | covered |
| UAT-MAP-07 | Update jadwal realtime | uat | web | e2e/web/specs/map.e2e.ts::[UAT-MAP-07] update jadwal realtime | covered |
| UAT-MAP-08 | Buka dan tutup sesi realtime | uat | web | e2e/web/specs/map.e2e.ts::[UAT-MAP-08] buka tutup sesi realtime | covered |
| UAT-MAP-09 | Izin lokasi ditolak di peta | manual | manual | e2e/uat/manual-checklist.md#UAT-MAP-09 | manual |
| UAT-MAP-10 | Tidak ada lab aktif | uat | web | e2e/web/specs/map.e2e.ts::[UAT-MAP-10] tidak ada lab aktif | covered |
| UAT-MAP-11 | Web list mode | uat | web | e2e/web/specs/map.e2e.ts::[UAT-MAP-11] web list mode | covered |
| UAT-MAP-12 | Toggle daftar dan peta | uat | web | e2e/web/specs/map.e2e.ts::[UAT-MAP-12] toggle daftar peta | covered |
| UAT-NOT-01 | Token push terdaftar | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-01 | manual |
| UAT-NOT-02 | Notifikasi sesi dibuka | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-02 | manual |
| UAT-NOT-03 | Penerima kelas lain tidak dapat | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-03 | manual |
| UAT-NOT-04 | Notifikasi jadwal berubah | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-04 | manual |
| UAT-NOT-05 | Notifikasi izin disetujui | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-05 | manual |
| UAT-NOT-06 | Notifikasi izin ditolak | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-06 | manual |
| UAT-NOT-07 | Banner foreground | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-07 | manual |
| UAT-NOT-08 | Deep link notifikasi | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-08 | manual |
| UAT-NOT-09 | Izin notifikasi ditolak | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-09 | manual |
| UAT-NOT-10 | Web tidak mendukung push | uat | web | e2e/web/specs/regression.e2e.ts::[UAT-NOT-10][UAT-DEV-05] web tidak mendukung notifikasi | covered |
| UAT-NOT-11 | Token gagal didaftarkan | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-11 | manual |
| UAT-NOT-12 | Dedupe notifikasi | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-12 | manual |
| UAT-NOT-13 | Log notifikasi | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-13 | manual |
| UAT-NOT-14 | Token invalid dibersihkan | manual | manual | e2e/uat/manual-checklist.md#UAT-NOT-14 | manual |
| UAT-DEV-01 | Izin lokasi ditolak di peta | manual | manual | e2e/uat/manual-checklist.md#UAT-DEV-01 | manual |
| UAT-DEV-02 | Layanan lokasi mati di peta | manual | manual | e2e/uat/manual-checklist.md#UAT-DEV-02 | manual |
| UAT-DEV-03 | GPS tidak tersedia di presensi | manual | manual | e2e/uat/manual-checklist.md#UAT-DEV-03 | manual |
| UAT-DEV-04 | Koneksi mati di peta | manual | manual | e2e/uat/manual-checklist.md#UAT-DEV-04 | blocked |
| UAT-DEV-05 | Web profil notifikasi tidak didukung | uat | web | e2e/web/specs/regression.e2e.ts::[UAT-NOT-10][UAT-DEV-05] web tidak mendukung notifikasi | covered |
| UAT-DEV-06 | CDN Leaflet diblokir | uat | web | e2e/web/specs/device.e2e.ts::[UAT-DEV-06] CDN Leaflet diblokir | covered |
| UAT-DEV-07 | Sesi lama tanpa lab di detail | manual | manual | e2e/uat/manual-checklist.md#UAT-DEV-07 | blocked |
| UAT-DEV-08 | Sesi login bertahan | uat | web | e2e/web/specs/regression.e2e.ts::[UAT-DEV-08] sesi login bertahan setelah reload | covered |
| UAT-REG-01 | Login, logout, guard peran | uat | web | e2e/web/specs/auth.e2e.ts::[UAT-REG-01] login, logout, dan guard peran | covered |
| UAT-REG-02 | CRUD kelas dan audit | uat | web | e2e/web/specs/classes.e2e.ts::[UAT-REG-02] CRUD kelas dan audit | covered |
| UAT-REG-03 | Tambah hapus dan duplikat peserta | uat | web | e2e/web/specs/classes.e2e.ts::[UAT-REG-03] tambah, hapus, dan cegah duplikat peserta | covered |
| UAT-REG-04 | CRUD sesi dan lab | uat | web | e2e/web/specs/sessions.e2e.ts::[UAT-REG-04] ubah dan hapus sesi | covered |
| UAT-REG-05 | Buka presensi tutup rekap | uat | web | e2e/web/specs/recap.e2e.ts::[UAT-REG-05] buka, presensi, tutup, dan rekap | covered |
| UAT-REG-06 | Ajukan dan tinjau izin | uat | web | e2e/web/specs/permissions.e2e.ts::[UAT-REG-06] tolak izin dan kunci setelah review | covered |
| UAT-REG-07 | Tema terang dan gelap | uat | web | e2e/web/specs/regression.e2e.ts::[UAT-REG-07] tema terang dan gelap tetap terbaca | covered |
| UAT-REG-08 | tsc lint dan expo-doctor | ci | ci | npm run verify | ci |

## Catatan runtime

| Tanggal | Suite | Hasil | Waktu |
|---|---|---|---|
| 2026-11-25 | Web critical (`npm run test:web`) | 5/5 passed | 1,3 menit |
| 2026-11-25 | Web full run 1 (`npm run test:web:full`) | 43/43 passed | 6,6 menit |
| 2026-11-25 | Web full run 2 (`npm run test:web:full`) | 43/43 passed | 6,2 menit |
| 2026-11-25 | Android critical (`npm run test:android`) | 3/3 passed | 85 detik durasi flow |
| 2026-11-25 | Android full run 1 (`npm run test:android:full`) | 8/8 passed | 246 detik durasi flow |
| 2026-11-25 | Android full run 2 (`npm run test:android:full`) | 8/8 passed | 244 detik durasi flow |
| 2026-11-25 | Rules (`npm run test:rules`) | 18/18 passed | — |
| 2026-11-25 | Static (`npm run verify`) | 53 suite / 409 test Jest, `uat:check` valid | 4,5 detik Jest |

APK Android dibangun dengan `npm run android:e2e:build` (release, x86_64) dan
emulator API 35 (`PPKFresh`). Full Android menjalankan 3 flow critical + 5 flow
UAT; `UAT-ATT-04` dipindahkan ke manual.

## Hasil acceptance

- Tanggal run: 25 November 2026.
- Web: 5 critical dan 43 full, dua run full berturut-turut lulus tanpa retry.
- Android: 3 critical dan 8 full, dua run full berturut-turut lulus tanpa retry.
- `uat:check` strict: `UAT coverage valid: 65 baris, 43 spec Playwright.`
- `npm run verify`, `npm run test:rules`, dan `git diff --check` lulus.
- Tidak ada koneksi ke project produksi: seluruh run memakai project demo
  `demo-ppk-e2e` dan `seed.js` menolak project non-`demo-`.
- Tidak ada perubahan `firestore.rules` untuk test.
- Checklist manual **belum dijalankan** pada run ini; belum ada ID manual yang
  memiliki bukti. Jalankan `e2e/uat/manual-checklist.md` di perangkat/akun yang
  sesuai sebelum menutup gap manual.
- `blocked/gap` yang tersisa: `UAT-ATT-04` (dipindahkan ke manual karena
  `pm revoke` menghasilkan `denied`/`canAskAgain=true`, bukan `blocked`),
  `UAT-DEV-04`, `UAT-DEV-07`, seluruh `UAT-NOT-*` (push dapat memakai worker
  Heroku tanpa Blaze, tetapi tetap memerlukan dua perangkat/akun dan kredensial
  Expo/FCM V1), serta pemeriksaan visual peta native `UAT-MAP-01..03` dan
  `UAT-MAP-09`.
