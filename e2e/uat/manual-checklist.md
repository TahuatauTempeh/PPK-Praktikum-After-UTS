# Checklist Manual UAT

Daftar ID manual/blocked. Kolom `Bukti` diisi saat UAT manual (Task 9);
sebelum itu biarkan kosong.

> **Catatan:** `UAT-DEV-04` dan `UAT-DEV-07` berstatus `blocked` karena perilaku
> yang diharapkan belum ada di implementasi (known gap). Jangan menandainya
> lulus dan jangan membuat test otomatis yang seolah-olah lulus.
> `UAT-ATT-04` dipindahkan dari otomatis ke manual karena `pm revoke` pada
> emulator menghasilkan state `denied` dengan `canAskAgain=true`, bukan
> `blocked`; assertion otomatis tidak dapat membedakan keduanya tanpa melemahkan
> perilaku yang diuji.
>
> **Status 25 November 2026:** checklist ini **belum dijalankan** sebagai UAT
> manual. Kolom `Bukti` sengaja dibiarkan kosong. Jalankan di perangkat/akun
> yang sesuai, lalu isi hasil aktual dan path bukti; jangan menandai lulus tanpa
> bukti. ID notifikasi memerlukan Cloud Functions/push dan dua perangkat;
> project E2E masih memakai konfigurasi demo/Spark.

| ID | Langkah | Hasil yang diharapkan | Lingkungan | Bukti |
|---|---|---|---|---|
| UAT-ATT-06 | Buka presensi, tunggu 15 detik tanpa fix GPS | `Lokasi belum tersedia`; tombol coba lagi; tidak ada catatan | Perangkat/emulator dengan GPS dimatikan |  |
| UAT-ATT-12 | Matikan koneksi, tekan presensi | `Koneksi bermasalah. Presensi tidak tercatat.`; tidak ada dokumen | Perangkat online lalu offline |  |
| UAT-ATT-04 | Cabut izin lokasi lewat Pengaturan aplikasi, lalu buka presensi | `Izin lokasi diblokir`; tombol `Buka pengaturan`; presensi nonaktif | Android API 35 | Dipindahkan dari otomatis: `pm revoke` menghasilkan state `denied` dengan `canAskAgain=true`, bukan `blocked`. Verifikasi manual diperlukan. |
| UAT-MAP-01 | Buka peta dengan tiga lab aktif | Tiga marker lab dan marker user muncul ≤ 3 detik | Android/iOS |  |
| UAT-MAP-02 | Ubah lokasi emulator 20 m | Marker user bergerak tanpa reload | Emulator |  |
| UAT-MAP-03 | Ketuk marker LAB-A | Panel nama, gedung/ruang, radius | Android/iOS |  |
| UAT-MAP-09 | Tolak izin lokasi, buka peta | Banner izin; lab tetap tampil; marker user tidak tampil | Perangkat |  |
| UAT-NOT-01 | Profil, aktifkan notifikasi, izinkan | Status `Aktif`; `expoPushToken` terisi | Perangkat dengan push |  |
| UAT-NOT-02 | Asisten membuka sesi; app background | Notifikasi sesi dibuka berisi judul, kelas, waktu, ruang | Dua perangkat |  |
| UAT-NOT-03 | Buka sesi IF-3A; cek praktikan IF-3B | Praktikan kelas lain tidak menerima | Dua akun |  |
| UAT-NOT-04 | Ubah jam sesi | Notifikasi jadwal berubah dengan jam baru | Dua perangkat |  |
| UAT-NOT-05 | Setujui izin | Notifikasi izin disetujui hanya ke pemohon | Dua perangkat |  |
| UAT-NOT-06 | Tolak izin dengan catatan | Notifikasi izin ditolak berisi catatan | Dua perangkat |  |
| UAT-NOT-07 | App foreground; asisten buka sesi | Banner in-app tampil | Perangkat |  |
| UAT-NOT-08 | Ketuk notifikasi saat app tertutup | App terbuka ke `/praktikan/presensi/<id>` | Perangkat |  |
| UAT-NOT-09 | Tolak izin notifikasi; buka Profil | Status `Ditolak`; tombol `Buka pengaturan` | Perangkat |  |
| UAT-NOT-11 | Offline saat aktifkan notifikasi | Status `Gagal`; pesan coba lagi; tidak ada token palsu | Perangkat offline |  |
| UAT-NOT-12 | Picu update sesi berulang | Satu notifikasi per peristiwa; satu dokumen dedupe | Emulator/Functions |  |
| UAT-NOT-13 | Periksa `notificationLogs` | `eventType`, `recipientIds`, `status`, `successCount` | Firebase Console |  |
| UAT-NOT-14 | Kirim ke token tidak valid | Error Expo; token dibersihkan dari `users/{uid}` | Emulator/Functions |  |
| UAT-DEV-01 | Tolak izin lokasi; buka peta | Banner izin; lab tampil; tombol pengaturan | Perangkat |  |
| UAT-DEV-02 | Matikan layanan lokasi; buka peta | Banner layanan; lab tampil | Perangkat |  |
| UAT-DEV-03 | GPS tidak tersedia; buka presensi | State lokasi belum tersedia; tombol coba lagi | Perangkat |  |
| UAT-DEV-04 | Matikan koneksi; buka peta | Cache/empty state dan banner koneksi; tidak crash | Perangkat |  |
| UAT-DEV-07 | Buka detail sesi lama tanpa lab sebagai asisten | Peringatan `Laboratorium belum diatur`; buka sesi ditolak | Web/Android |  |
