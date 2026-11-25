# Alat admin Firebase produksi

Skrip ini dipakai untuk membersihkan dan membangun ulang data project Firebase
nyata (`praktikum-ppk-3`), bukan emulator. Untuk emulator, gunakan
`e2e/shared/seed.js` seperti biasa.

## Prasyarat

1. Service account key dari Firebase Console → **Project settings** →
   **Service accounts** → **Firebase Admin SDK** → **Generate new private key**.
   Simpan di luar repo, misalnya `~/.config/ppk/`, lalu `chmod 600`. File ini
   melewati `firestore.rules`, jadi perlakukan seperti kunci gedung.
2. Variabel lingkungan:

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/ppk/praktikum-ppk-3.json"
   ```

3. `TESTING_PASSWORD` sudah ada di `.env` (dipakai hanya oleh perintah `seed`).

## Perintah

```bash
# Baca jumlah dokumen, daftar lab, dan akun Auth. Tidak mengubah apa pun.
node scripts/firebase/admin.js inspect

# Dump semua koleksi + akun Auth ke ~/ppk-backups/<project>/<waktu>/
node scripts/firebase/admin.js backup

# Hapus SELURUH dokumen Firestore dan akun Auth. Tidak bisa dibatalkan.
node scripts/firebase/admin.js reset --confirm praktikum-ppk-3

# Bangun ulang data demo. Lab B, C, dan D diambil dari backup terbaru.
node scripts/firebase/admin.js seed \
  --class-name "Pengembangan Platform Khusus D2" \
  --confirm praktikum-ppk-3

# Periksa konsistensi referensi setelah seed.
node scripts/firebase/admin.js verify
```

`reset` dan `seed` menolak berjalan tanpa `--confirm <projectId>`, dan keduanya
menolak project berawalan `demo-`.

## Data yang dibuat `seed`

- Akun: `asisten-admin@test.com` (admin), `asisten@test.com`, `praktikan@test.com`.
  Password berasal dari `TESTING_PASSWORD`.
- Lab: B, C, dan D dari backup terbaru, dengan ID, koordinat, dan radius asli.
- Satu kelas, satu enrollment, tiga sesi (terbuka hari ini di Lab D, selesai hari
  ini di Lab D, terjadwal besok di Lab B), satu presensi, satu izin `pending`,
  satu kesan pesan, dan tiga catatan audit.

Nama kelas diatur lewat `--class-name`; nilainya juga bisa diubah dari layar
**Kelas** di aplikasi.

## Catatan

- Backup berupa JSON per koleksi. Pemulihan dilakukan manual; tidak ada perintah
  restore otomatis.
- Backup berisi data pribadi (email, NIM, koordinat). Simpan hanya selama perlu.
- Setelah selesai, cabut service account key di Firebase Console dan hapus file
  lokalnya.
