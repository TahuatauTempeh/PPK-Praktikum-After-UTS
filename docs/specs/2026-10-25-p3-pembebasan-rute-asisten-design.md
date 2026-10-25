# Pembebasan Rute Asisten — Desain P3

Status: disetujui. Tanggal: 2026-10-25. Pemilik: Programmer 3.
Rujukan: `rancangan-pembagian-tugas.md` bagian 5.3, 9, 10, dan 12.

## 1. Tujuan

Langkah ini memindahkan rute asisten ke bawah `/asisten` dan mencabut tambah sesi.
Fondasi Programmer 1 belum ada, jadi langkah ini tidak menyambung ke `SessionContext`.
Sumber data tetap `AssistantPreviewProvider`.

Hasil yang diminta:

1. Rute lama `/`, `/rekap`, `/sesi/[id]`, dan `/tambah-sesi` tidak ada lagi.
2. Rute baru `/asisten`, `/asisten/rekap`, dan `/asisten/sesi/[id]` menampilkan layar yang sama.
3. Tidak ada tombol, form, atau aksi tambah sesi yang tersisa.
4. `npx expo lint` dan `npx tsc --noEmit` lulus.

## 2. Kondisi awal

Fakta yang diverifikasi pada 2026-10-25:

- Rute aktif: `src/app/(tabs)/index.tsx`, `src/app/(tabs)/rekap.tsx`, `src/app/sesi/[id].tsx`, `src/app/tambah-sesi.tsx`.
- `src/app/(tabs)/_layout.tsx` memasang bar bawah sendiri lewat `AssistantNavigation`, bukan `Tabs` bawaan.
- Path di `src/app/(tabs)/_layout.tsx:10` dan `:22-23` masih `'/rekap'` dan `'/'`.
- `src/app/(tabs)/index.tsx:9-15` memakai parameter `tanggal` dan `baru`, prop `feedback`, dan tombol tambah sesi.
- `src/screens/asisten/preview-session-provider.tsx:15` dan `:27-32` mengekspor `addSession`.
- `session-form.ts` hanya dipakai oleh `add-session-screen.tsx`, `session-form-field.tsx`, `session-input-picker.tsx`, dan `preview-session-provider.tsx`.
- `experiments.typedRoutes: true`. Union rute ada di `.expo/types/router.d.ts`, berkas gitignored.
- `npx tsc --noEmit` exit 0 dan `npx expo lint` exit 0 sebelum perubahan.

## 3. Keputusan yang disepakati

1. Lingkup sesi ini hanya pembebasan rute dan pencabutan tambah sesi. Penyambungan `useSession` ditunda sampai Programmer 1 mendarat.
2. Bar bawah dipertahankan apa adanya. `(tabs)/_layout.tsx` dan `AssistantNavigation` pindah, bukan diganti `Tabs`.
3. Folder rute lama `src/app/(tabs)/` dihapus seluruhnya. Tidak ada dua rute untuk alamat yang sama.
4. Tambah sesi dicabut sekalian, bukan dipindah ke `/asisten/tambah-sesi`.
5. Rute `/` dibiarkan kosong sampai Programmer 1 membuatnya. Tidak ada stub redirect di folder Programmer 1.
6. `src/app/asisten/_layout.tsx` belum dibuat. Isinya nanti hanya `RoleGuard('asisten')`, dan guard itu butuh context.

## 4. Perubahan berkas

Pindah dengan `git mv`:

| Dari | Ke |
|---|---|
| `src/app/(tabs)/index.tsx` | `src/app/asisten/(tabs)/index.tsx` |
| `src/app/(tabs)/rekap.tsx` | `src/app/asisten/(tabs)/rekap.tsx` |
| `src/app/(tabs)/_layout.tsx` | `src/app/asisten/(tabs)/_layout.tsx` |
| `src/app/sesi/[id].tsx` | `src/app/asisten/sesi/[id].tsx` |

Hapus:

| Berkas | Alasan |
|---|---|
| `src/app/tambah-sesi.tsx` | Rute tambah sesi dicabut |
| `src/screens/asisten/add-session-screen.tsx` | Layar tambah sesi dicabut |
| `src/screens/asisten/session-form.ts` | Hanya dipakai alur tambah sesi |
| `src/screens/asisten/components/session-form-field.tsx` | Hanya dipakai `add-session-screen` |
| `src/screens/asisten/components/session-input-picker.tsx` | Hanya dipakai `add-session-screen` |

Ubah isi:

| Berkas | Perubahan |
|---|---|
| `src/app/asisten/(tabs)/_layout.tsx` | `tabFromPath` memetakan `'/asisten'` dan `'/asisten/rekap'`; `goTo` memakai `'/asisten/rekap'` dan `dismissTo('/asisten')` |
| `src/app/asisten/(tabs)/index.tsx` | Buang `useLocalSearchParams`, `tanggal`, `baru`, `feedback`, dan `key`; `onManage` memakai `'/asisten/sesi/[id]'` |
| `src/app/asisten/(tabs)/rekap.tsx` | `onSchedule` memakai `dismissTo('/asisten')`; `onDetail` memakai `'/asisten/sesi/[id]'` |
| `src/app/asisten/sesi/[id].tsx` | `onRecap` memakai `'/asisten/rekap'`; fallback `replace('/asisten')` |
| `src/screens/asisten/preview-session-provider.tsx` | Buang `addSession`, `sequence`, import `useRef`, `createSession`, `sessionChoices`, dan `SessionForm`; `scheduleDate` menjadi `previewDate` tetap |
| `src/screens/asisten/schedule-screen.tsx` | Buang prop `onAdd` dan `feedback`, banner feedback, state `dismissed`, tombol Tambah sesi, tombol Tambah sesi pertama, dan style `add`, `addText`, `feedback`, `feedbackText`, `dismiss`, `disabled` |

Tidak disentuh: `src/app/_layout.tsx`, `src/app/explore.tsx`, `src/app/asisten/_layout.tsx` (belum ada), `src/screens/asisten/schedule-data.ts`, `recap-data.ts`, `session-format.ts`, semua berkas di `src/components/`, `src/constants/`, `src/hooks/`, dan `src/screens/asisten/theme.ts`.

## 5. Pohon rute akhir

```text
src/app/
├── _layout.tsx                    Programmer 1, tidak berubah
├── explore.tsx                    sisa template, tidak berubah
└── asisten/
    ├── (tabs)/
    │   ├── _layout.tsx            Stack dan bar bawah
    │   ├── index.tsx              jadwal asisten, URL /asisten
    │   └── rekap.tsx              rekap presensi, URL /asisten/rekap
    └── sesi/[id].tsx              kelola sesi, URL /asisten/sesi/[id]
```

Detail sesi berada di luar grup `(tabs)` supaya bar bawah tidak tampil. Aturan ini sama dengan kondisi sebelum migrasi.

## 6. Detail perubahan layar

`schedule-screen.tsx`:

- Prop `onAdd` dan `feedback` dihapus dari tipe `Props` dan dari parameter fungsi.
- Banner feedback dan state `dismissed` dihapus.
- Tombol header "Tambah sesi" dihapus. Baris judul daftar tetap ada.
- Tombol "Tambah sesi pertama" di empty state dihapus.
- Teks empty state "Belum ada sesi praktikum yang dijadwalkan. Tambahkan sesi pertama untuk mulai mencatat presensi." diganti "Belum ada sesi praktikum yang dijadwalkan."
- Style yang tersisa dipakai ulang. `reset` tetap dipakai tombol "Tampilkan semua sesi".

`preview-session-provider.tsx`:

- Tipe `SessionSource` tidak lagi punya `addSession`.
- `openSession` dan `closeSession` tidak berubah.
- Nilai provider tidak lagi mengirim `addSession`.

## 7. Verifikasi

Urutan perintah, semuanya dari akar repo:

1. `rg -n "tambah-sesi|addSession|add-session-screen|session-form|onAdd" src` harus kosong.
2. `rg -n "'/rekap'|'/sesi/|'/tambah-sesi'" src` harus kosong.
3. `npx expo lint` harus exit 0.
4. `timeout 40 env CI=1 npx expo start --web --port 8099` untuk meregenerasi `.expo/types/router.d.ts`.
5. `npx tsc --noEmit` harus exit 0.
6. Jalankan `npx expo start --web --port 8099` di latar, lalu cek `http://127.0.0.1:8099/asisten`, `/asisten/rekap`, dan `/asisten/sesi/web-04`. Ketiganya harus merespons tanpa "Unmatched Route".
7. Cek manual di browser: tab Jadwal dan tab Rekap berpindah, tombol detail membuka kelola sesi, dan bar bawah tetap tampil hanya di dua tab.

Kegagalan yang diharapkan: membuka `/` menampilkan rute tidak ditemukan. Ini konsekuensi keputusan 5 dan hilang saat Programmer 1 membuat `src/app/index.tsx`.

## 8. Risiko

1. `src/components/app-tabs.web.tsx:24` dan `:27` masih memakai `href="/"` dan `href="/explore"`. Setelah union rute berubah, `href="/"` bisa membuat `tsc` gagal meski berkas itu tidak diimpor layar mana pun. Penanganan: sentuh hanya bila `tsc` benar-benar merah, dan pilihannya dimintakan ke pengguna karena berkas itu milik Programmer 1.
2. `router.dismissTo` dipakai bar bawah untuk kembali ke jadwal. Perilakunya tidak terbukti lewat cek HTTP, jadi butuh cek manual di browser pada langkah verifikasi 7.
3. Aplikasi tidak dapat dibuka dari `/` sampai Programmer 1 mendarat. Selama itu, buka lewat `/asisten`.

## 9. Di luar lingkup

- `useSession`, `SessionContext`, dan `RoleGuard`.
- NIM praktikan di daftar hadir.
- Filter dan hitungan rekap.
- Penyambungan data ke context bersama.
- Perbaikan atau penghapusan berkas sisa template di `src/app/explore.tsx` dan `src/components/`.
- Demo Android. Demo itu bagian kriteria akhir P3 dan menunggu fondasi Programmer 1.

## 10. Kriteria selesai

- Tidak ada berkas rute lama di `src/app/(tabs)/`, `src/app/sesi/`, dan `src/app/tambah-sesi.tsx`.
- Tiga rute `/asisten*` merender layar yang sama seperti sebelum migrasi.
- Tidak ada jejak tambah sesi di kode: rute, layar, form, tombol, dan aksi provider.
- `npx expo lint` dan `npx tsc --noEmit` exit 0.
- Bar bawah tetap tampil di tab Jadwal dan Rekap, dan tidak tampil di layar kelola sesi.
