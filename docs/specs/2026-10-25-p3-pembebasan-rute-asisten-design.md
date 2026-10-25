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

- Rute aktif: `src/app/(tabs)/index.tsx`, `src/app/(tabs)/rekap.tsx`, `src/app/sesi/[id].tsx`, `src/app/tambah-sesi.tsx`, dan `src/app/explore.tsx` (`/explore`, sisa template).
- `src/app/(tabs)/_layout.tsx` memasang bar bawah sendiri lewat `AssistantNavigation`, bukan `Tabs` bawaan.
- Path di `src/app/(tabs)/_layout.tsx:10-11` dan `:22-23` masih `'/rekap'` dan `'/'`.
- `src/app/(tabs)/index.tsx:9-15` memakai parameter `tanggal` dan `baru`, prop `feedback`, dan tombol tambah sesi. Baris `:4` mengimpor `isValidDate` hanya untuk parameter `tanggal`.
- `src/screens/asisten/preview-session-provider.tsx:15` mendefinisikan field `addSession` pada tipe `SessionSource`, dan `:27-32` mengisi field itu dengan fungsi lokal. Nilai yang diekspor provider hanya `AssistantPreviewProvider` dan `useAssistantSessions`.
- `session-form.ts` diimpor oleh `add-session-screen.tsx:11`, `components/session-input-picker.tsx:6`, dan `preview-session-provider.tsx:8`. `components/session-form-field.tsx` tidak mengimpornya.
- `experiments.typedRoutes: true`. Union rute ada di `.expo/types/router.d.ts`, berkas gitignored dan termasuk `tsconfig.json:17`.
- `npx tsc --noEmit` exit 0 dan `npx expo lint` exit 0 sebelum perubahan.

## 3. Keputusan yang disepakati

1. Lingkup sesi ini hanya pembebasan rute dan pencabutan tambah sesi. Penyambungan `useSession` ditunda sampai Programmer 1 mendarat.
2. Bar bawah dipertahankan apa adanya. `(tabs)/_layout.tsx` dan `AssistantNavigation` pindah, bukan diganti `Tabs`.
3. Folder rute lama `src/app/(tabs)/` dihapus seluruhnya. Tidak ada dua rute untuk alamat yang sama.
4. Tambah sesi dicabut sekalian, bukan dipindah ke `/asisten/tambah-sesi`.
5. Rute `/` dibiarkan kosong sampai Programmer 1 membuatnya. Tidak ada stub redirect di folder Programmer 1.
6. `src/app/asisten/_layout.tsx` belum dibuat. Isinya nanti hanya `RoleGuard('asisten')`, dan guard itu butuh context.
7. Dua berkas template mati dihapus: `src/components/app-tabs.tsx` dan `src/components/app-tabs.web.tsx`. Keduanya tidak diimpor kode mana pun, tetapi `app-tabs.web.tsx:24` memakai `href="/"` sehingga `tsc` gagal setelah rute `/` hilang. Menghapus lebih baik daripada mengedit isi folder Programmer 1. Bila Programmer 1 membutuhkannya, berkas dapat diambil lagi dari riwayat git.

## 4. Perubahan berkas

Pindah dengan `git mv`. Kutip path yang mengandung `[id]` karena shell sesi ini zsh:

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
| `src/components/app-tabs.tsx` | Sisa template, tidak diimpor siapa pun |
| `src/components/app-tabs.web.tsx` | Sisa template, tidak diimpor siapa pun, memuat `href="/"` |

Ubah isi:

| Berkas | Perubahan |
|---|---|
| `src/app/asisten/(tabs)/_layout.tsx` | `tabFromPath` memetakan `'/asisten'` dan `'/asisten/rekap'`; `goTo` memakai `'/asisten/rekap'` dan `dismissTo('/asisten')` |
| `src/app/asisten/(tabs)/index.tsx` | Buang import `isValidDate` (`:4`), `useLocalSearchParams`, `tanggal`, `baru`, `feedback`, prop `onAdd`, dan `key`; `date` memakai `scheduleDate` dari provider; `onManage` memakai `'/asisten/sesi/[id]'` |
| `src/app/asisten/(tabs)/rekap.tsx` | `onSchedule` memakai `dismissTo('/asisten')`; `onDetail` memakai `'/asisten/sesi/[id]'` |
| `src/app/asisten/sesi/[id].tsx` | `onRecap` memakai `'/asisten/rekap'`; fallback `replace('/asisten')` |
| `src/screens/asisten/preview-session-provider.tsx` | Buang `addSession`, `sequence`, import `useRef`, `createSession`, `sessionChoices`, dan `SessionForm`; `scheduleDate` menjadi `previewDate` tetap |
| `src/screens/asisten/schedule-screen.tsx` | Buang prop `onAdd` dan `feedback`, banner feedback, state `dismissed`, tombol Tambah sesi, tombol Tambah sesi pertama, dan style `add`, `addText`, `feedback`, `feedbackText`, `dismiss`, `disabled` |

Tidak disentuh: `src/app/_layout.tsx`, `src/app/explore.tsx`, `src/app/asisten/_layout.tsx` (belum ada), `src/screens/asisten/schedule-data.ts`, `recap-data.ts`, `session-format.ts`, `src/constants/`, `src/hooks/`, dan `src/screens/asisten/theme.ts`.

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

`(tabs)/index.tsx`:

- Import `isValidDate` dihapus karena tidak ada lagi validasi parameter `tanggal`.
- Prop `date` diisi `scheduleDate` dari provider.

`preview-session-provider.tsx`:

- Tipe `SessionSource` tidak lagi punya `addSession`.
- `openSession` dan `closeSession` tidak berubah.
- Nilai provider tidak lagi mengirim `addSession`.

## 7. Verifikasi

Urutan perintah, semuanya dari akar repo:

1. Penjaga isi: `rg -n --pcre2 "tambah-sesi|addSession|add-session-screen|session-form\b|session-input-picker|onAdd|SessionForm|emptySessionForm|validateSessionForm|createSession|sessionChoices" src` harus kosong.
2. Penjaga literal rute: `rg -n "'/rekap'|'/sesi/|'/tambah-sesi'" src` harus kosong.
3. Penjaga berkas: `git ls-files 'src/app/(tabs)' 'src/app/sesi' 'src/app/tambah-sesi.tsx' 'src/screens/asisten/add-session-screen.tsx' 'src/screens/asisten/session-form.ts' 'src/screens/asisten/components/session-form-field.tsx' 'src/screens/asisten/components/session-input-picker.tsx' 'src/components/app-tabs.tsx' 'src/components/app-tabs.web.tsx'` harus kosong.
4. `npx expo lint` harus exit 0.
5. `timeout 45 env CI=1 npx expo start --web --port 8099` untuk meregenerasi `.expo/types/router.d.ts`. Mekanisme ini sudah terbukti pada 2026-10-25: berkas itu berubah waktu dev server dijalankan.
6. `npx tsc --noEmit` harus exit 0. Tanpa langkah 5, `tsc` gagal karena union rute masih lama.
7. Jalankan `npx expo start --web --port 8099` di latar, lalu cek `http://127.0.0.1:8099/asisten`, `/asisten/rekap`, dan `/asisten/sesi/web-04`. Ketiganya harus merespons tanpa "Unmatched Route".
8. Cek manual di browser: tab Jadwal dan tab Rekap berpindah, tombol detail membuka kelola sesi, dan bar bawah tetap tampil hanya di dua tab.
9. Smoke test native di emulator Android 15 (`emulator-5554`), memakai development build yang sudah terpasang (`com.ppk.presensipraktikum`, terpasang 2026-10-24 23.04). Perubahan hanya JavaScript, jadi build tidak perlu dibuat ulang selama dependensi native tidak berubah.
   - `npx expo start --dev-client --port 8081` di latar.
   - `adb shell am start -a android.intent.action.VIEW -d 'presensipraktikum:///asisten'`.
   - Tiga alur wajib: (a) tab Rekap lalu kembali ke tab Jadwal, menguji `dismissTo('/asisten')`; (b) jadwal, buka detail sesi, tekan tombol Rekap, menguji `navigate('/asisten/rekap')` dengan parameter; (c) cold open `presensipraktikum:///asisten/sesi/web-04` lalu tombol kembali, menguji fallback `replace('/asisten')`.
   - Lulus bila tidak ada layar kosong atau "Unmatched Route", tab Jadwal kembali tanpa menutup aplikasi, dan tombol kembali dari detail mendarat di `/asisten`.
   - Bila emulator tidak tersedia, langkah ini dilaporkan belum dijalankan dan pekerjaan tidak dinyatakan selesai. Jika build terpasang gagal tersambung ke Metro, jalankan `npx expo run:android`.

Catatan: `expo lint` hanya memberi peringatan untuk variabel atau prop yang tidak terpakai, jadi langkah 1 sampai 3 yang menjaga kebersihan kode, bukan langkah 4.

Kegagalan yang diharapkan: membuka `/` menampilkan rute tidak ditemukan. Ini konsekuensi keputusan 5 dan hilang saat Programmer 1 membuat `src/app/index.tsx`.

## 8. Sisa risiko

1. `router.dismissTo` dipakai bar bawah untuk kembali ke jadwal. Perilakunya bergantung pada state navigator, bukan kecocokan URL. Bukti lulusnya hanya dari langkah verifikasi 8 (browser) dan 9 (native).
2. Aplikasi tidak dapat dibuka dari `/` sampai Programmer 1 mendarat. Selama itu, buka lewat `/asisten`.
3. Penghapusan `src/components/app-tabs.tsx` dan `src/components/app-tabs.web.tsx` menyentuh folder Programmer 1. Keduanya tidak dipakai, dan riwayat git menyimpannya. Programmer 1 perlu tahu supaya tidak menambahkannya kembali.

## 9. Di luar lingkup

- `useSession`, `SessionContext`, dan `RoleGuard`.
- NIM praktikan di daftar hadir.
- Filter dan hitungan rekap.
- Penyambungan data ke context bersama.
- Penghapusan berkas sisa template lain: `src/app/explore.tsx`, `src/components/themed-*`, `animated-icon*`, `hint-row.tsx`, `web-badge.tsx`, `external-link.tsx`, dan `ui/collapsible.tsx`. Yang dihapus hanya dua berkas `app-tabs`.
- Demo penuh di Android. Satu smoke test native tetap masuk lingkup lewat §7 langkah 9. Demo penuh adalah kriteria akhir P3 dan menunggu fondasi Programmer 1.

## 10. Kriteria selesai

- Tidak ada berkas rute lama di `src/app/(tabs)/`, `src/app/sesi/`, dan `src/app/tambah-sesi.tsx`.
- Tiga rute `/asisten*` merender layar yang sama seperti sebelum migrasi.
- Tidak ada jejak tambah sesi di kode: rute, layar, form, tombol, dan aksi provider.
- Berkas `src/components/app-tabs.tsx` dan `src/components/app-tabs.web.tsx` tidak ada lagi, dan tidak ada berkas template lain yang memakai rute `/`.
- `npx expo lint` dan `npx tsc --noEmit` exit 0.
- Smoke test native tiga alur navigasi di emulator Android lulus sesuai §7 langkah 9.
- Bar bawah tetap tampil di tab Jadwal dan Rekap, dan tidak tampil di layar kelola sesi.
