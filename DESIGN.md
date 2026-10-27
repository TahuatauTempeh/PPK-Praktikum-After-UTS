# DESIGN.md — Aplikasi Presensi Praktikum
## Antarmuka mobile sisi Asisten / Programmer 3

Status: diperbarui 25 Oktober 2026.
Sumber: kode di working tree (HEAD `b27ce7e`), sesi Codex Desktop
24 Okt 21.58 – 25 Okt 00.45 WIB, dan tiga sesi DSH 24 Okt 22.08 – 25 Okt 02.25 WIB.

Ringkasan keadaan sekarang:

- Dua belas tampilan dari Figma ada di kode: empat halaman utama dan delapan
  state pendukung.
- Semua dialog memakai satu komponen bottom sheet.
- Navigasi bawah memakai bar statis dengan indikator aktif yang bergeser.
- Data masih data contoh di memori. `SessionContext` dari Programmer 1 belum tersedia.
- `tsc --noEmit` dan `expo lint` lulus pada 25 Oktober 2026.
- Uji visual berjalan di web dan emulator Android. iOS belum dijalankan.

## 1. Tujuan

Menyediakan antarmuka mobile bagi asisten untuk:

- Melihat jadwal praktikum.
- Membuka sesi presensi.
- Memantau kehadiran praktikan.
- Menutup sesi.
- Melihat rekap kehadiran.
- Menambahkan sesi baru.

Platform: React Native / Expo SDK 58, rute memakai Expo Router.
Bahasa antarmuka: Bahasa Indonesia.
Zona waktu tampilan: Waktu Indonesia Barat (WIB).

Desain Figma adalah acuan visual statis. Implementasi boleh berbeda bila
keputusan sesi menyatakan lain. Perbedaan yang sudah diputuskan dicatat di
bagian 15 dan 19.

## 2. Batasan Scope

Programmer 3 mengerjakan sisi Asisten.

Termasuk:

- Jadwal asisten.
- Kelola sesi.
- Rekap presensi.
- Form tambah sesi.
- Konfirmasi buka dan tutup sesi.
- Validasi form.
- Tampilan data kosong.

Tidak termasuk:

- Login dan pemilihan identitas.
- Pemilihan atau pergantian peran.
- Halaman Praktikan.
- Fondasi navigasi dan `SessionContext`.
- Pembuatan ulang komponen bersama milik Programmer 1.

Catatan implementasi: seluruh layar berjalan di atas adapter pratinjau bernama
`AssistantPreviewProvider`. Adapter ini hanya meniru bentuk data dan aksi.
Adapter ini bukan `SessionContext`. Semua perubahan status hilang saat aplikasi
dimuat ulang.

## 3. Arah Visual

Karakter:

- Bersih, tenang, dan profesional.
- Mengutamakan informasi jadwal dan kehadiran.
- Kartu putih di atas latar abu-abu sangat terang.
- Indigo sebagai aksen utama.
- Status selalu disertai teks, bukan hanya warna.
- Ikon sederhana dan konsisten.

Hindari:

- Dekorasi yang mengganggu pembacaan.
- Terlalu banyak warna aksen.
- Tombol tanpa label yang jelas.
- Informasi penting yang hanya dibedakan dengan warna.

Ikon berasal dari Figma. Ikon diekspor sebagai 39 berkas SVG di `assets/asisten/`
dan dirender lewat `expo-image` oleh komponen `ScheduleIcon`.

## 4. Warna

Token diambil dari desain. Nilai berikut sama dengan `src/screens/asisten/theme.ts`.

| Token | Nilai | Penggunaan |
|---|---|---|
| background | #F6F7FB | Latar halaman |
| surface | #FFFFFF | Kartu, form, sheet |
| primary | #4B4ACF | Aksi utama dan navigasi aktif |
| primarySoft | #ECECFC | Latar aksen dan status aktif |
| textPrimary | #192138 | Judul dan teks utama |
| textSecondary | #6D7588 | Metadata dan teks pendukung |
| neutralSoft | #EFF1F6 | Permukaan netral |
| border | #DDE0EB | Garis batas |
| success | #23765B | Label hadir |
| error | #B83E4D | Pesan kesalahan |
| errorSoft | #FFF0F1 | Latar kesalahan |

Warna di luar token:

- Latar gelap sheet: `rgba(18,23,44,0.5)`.
- Warna teks dan ikon di atas `primary`: `surface`.

Status:

- Belum dibuka: netral.
- Dibuka: indigo.
- Ditutup: netral dengan label eksplisit.
- Hadir: hijau.
- Belum hadir atau tidak hadir: netral.
- Kesalahan form: merah.

## 5. Tipografi

Font: Inter, dimuat lewat `@expo-google-fonts/inter`.
Bobot: 400 Regular, 500 Medium, 600 Semi Bold, 700 Bold.

Token implementasi di `theme.ts`:

| Token | Ukuran / line height | Bobot |
|---|---|---|
| pageTitle | 27 / 34 | Bold |
| detailTitle | 25 / 32 | Bold |
| sectionTitle | 16 / 22 | Bold |
| body | 14 / 22 | Regular |
| greeting | 13 / 16 | Regular |
| label | 15 / 20 | Semi Bold |
| caption | 12 / 18 | Regular |

Ukuran tambahan yang ditulis langsung di komponen:

| Elemen | Ukuran |
|---|---|
| Judul halaman Rekap | 28 / 35 Bold |
| Judul sheet | 23 / 30 Bold |
| Judul kartu sesi dan rekap | 19 / 25 Bold |
| Angka kehadiran besar | 30 / 38 Bold |
| Angka metrik Rekap | 25 / 32 Bold |
| Angka tanggal pada banner | 32 / 39 Bold |
| Label status kecil | 10–11 |
| Pesan galat form | 11–12 |

Rekomendasi implementasi yang sudah dipakai:

- Teks pendukung tidak dipaksa satu baris; kontainer memakai `flexWrap`.
- Line height ditulis eksplisit, tidak memakai auto.
- Ukuran teks mengikuti skala font perangkat. Tidak ada `allowFontScaling={false}`.

## 6. Layout

Ukuran frame referensi: 412 × 956. Ukuran itu bukan ukuran tetap aplikasi.

Pola layout:

- Susunan konten vertikal.
- Padding horizontal konten utama 24.
- Jarak antarbagian utama 18.
- Lebar konten maksimum 600, rata tengah.
- Header detail memakai tombol kembali.
- Halaman Jadwal dan Rekap memakai bar bawah.
- Halaman detail dan form berfokus pada satu tugas.

Radius:

- Kontrol dan input: 12.
- Kartu: 18.
- Panel besar dan sudut atas sheet: 26.
- Badge dan avatar: pill.

Ketentuan yang sudah diterapkan:

- Safe area perangkat dihormati lewat `react-native-safe-area-context`.
- Konten panjang dapat digulir.
- Footer aksi berada di luar area gulir, jadi tidak menutupi konten.
- Target sentuh minimal 44 × 44.
- Status bar sistem tidak digambar ulang sebagai konten aplikasi.

## 7. Struktur Rute dan Navigasi

### 7.1 Peta rute

| Rute | Berkas | Layar |
|---|---|---|
| `/` | `src/app/(tabs)/index.tsx` | Jadwal asisten |
| `/rekap` | `src/app/(tabs)/rekap.tsx` | Rekap presensi |
| `/sesi/[id]` | `src/app/sesi/[id].tsx` | Kelola sesi |
| `/tambah-sesi` | `src/app/tambah-sesi.tsx` | Tambah sesi |

Grup `(tabs)` tidak menambah segmen URL. `/` dan `/rekap` tetap seperti sebelumnya.

`src/app/explore.tsx` masih ada di repo sebagai sisa template. Tidak ada tautan
dari layar Asisten ke rute itu.

### 7.2 Bar bawah statis

Bar bawah dirender satu kali oleh `src/app/(tabs)/_layout.tsx`, bukan oleh
masing-masing layar. Isinya `Stack` untuk dua rute tab, lalu `AssistantNavigation`
di dalam `SafeAreaView` dengan tepi bawah, kiri, dan kanan.

Akibatnya:

- Konten tab berganti di dalam `Stack`; bar tidak ikut bergeser.
- `AssistantScreen` milik layar tab memakai `edges={['top','left','right']}`
  supaya inset bawah hanya dihitung sekali.
- Rute di luar grup, yaitu `/sesi/[id]` dan `/tambah-sesi`, menutup bar sepenuhnya.

Susunan bar: `maxWidth` 600, padding horizontal 42, jarak antartab 52, tinggi
tab minimal 54, latar `surface`, garis atas 1 dengan warna `border`.
Label tab: "Jadwal" dan "Rekap". Peran aksesibilitas: `tablist` dengan anak `tab`.

### 7.3 Indikator tab aktif

Tab aktif ditentukan dari `usePathname()`. Saat pathname bukan `/` atau `/rekap`
(misalnya halaman detail), nilai aktif dipertahankan pada tab terakhir.

Indikator adalah satu `Animated.View` berukuran sama dengan tab pertama.
Posisinya dihitung dari `onLayout` tab pertama:

- Offset target: `index × (lebar tab + 52)`.
- Penempatan pertama memakai `setValue` tanpa animasi.
- Perpindahan setelah itu memakai `Animated.timing`, durasi 240 ms,
  `Easing.out(Easing.cubic)`, `translateX`.
- `useNativeDriver` aktif kecuali di web.

Warna indikator `primarySoft`, radius 12. Latar `selected` per tab sudah dihapus.

### 7.4 Arah transisi

| Perpindahan | Perilaku |
|---|---|
| Jadwal → Rekap | `router.navigate('/rekap')`; layar masuk dari kanan |
| Rekap → Jadwal | `router.dismissTo('/')`; layar keluar ke kanan |
| Jadwal atau Rekap → detail | push; layar masuk dari kanan dan menutup bar |
| Detail atau form → kembali | pop |

Keputusan pengguna: konten tetap bergeser halus, bar diam, indikator aktif ikut
bergeser. Pilihan itu diambil pada sesi 25 Okt 01.29–02.25.

Tombol kembali dari Jadwal keluar dari aplikasi, karena tumpukan rute tidak lagi
bertambah. Perilaku ini normal untuk tab.

## 8. Inventaris Tampilan

Empat halaman utama dan delapan state pendukung:

| No | State | Letak di kode |
|---|---|---|
| 1 | Jadwal asisten | `/` — `schedule-screen.tsx` |
| 2 | Kelola sesi — dibuka, presensi terisi | `/sesi/[id]`, status `open` |
| 3 | Rekap presensi | `/rekap` — `recap-screen.tsx` |
| 4 | Tambah sesi | `/tambah-sesi` — `add-session-screen.tsx` |
| 5 | Kelola sesi — belum dibuka | status `pending` |
| 6 | Kelola sesi — ditutup | status `closed` |
| 7 | Kelola sesi — dibuka, belum ada presensi | status `open`, hadir 0 |
| 8 | Konfirmasi buka sesi | `SessionConfirmation` mode `open` |
| 9 | Konfirmasi tutup sesi | `SessionConfirmation` mode `close` |
| 10 | Tambah sesi — validasi | `errors` pada form |
| 11 | Jadwal kosong | daftar hari kosong |
| 12 | Rekap kosong | tidak ada sesi ditutup pada filter |

State pendukung bukan rute terpisah. Semuanya kondisi data, status, atau sheet.
State 11 dan 12 sudah ada di kode. Keduanya belum diuji visual secara khusus;
yang sudah diuji adalah kondisi kosong akibat filter.

## 9. Jadwal Asisten

Konten:

- Sapaan dan identitas asisten.
- Tanggal aktif pada banner indigo.
- Ringkasan sesi hari itu.
- Filter: Semua, Belum dibuka, Dibuka, Ditutup.
- Daftar kartu sesi.
- Aksi Tambah sesi.
- Bar bawah Jadwal dan Rekap.

Teks:

- Sapaan: "Selamat pagi, Nadia".
- Judul: "Jadwal asisten".
- Label identitas: "Nadia, asisten (identitas contoh)".
- Banner: "19 Okt 2026" dan "{n} sesi hari ini · {n} sedang dibuka".
  Untuk tanggal lain, akhiran "hari ini" hilang.
- Judul daftar: "Sesi hari ini" atau "Sesi pada tanggal ini".

Kartu sesi menampilkan:

- Kelas dan kata "PRAKTIKUM".
- Badge status dengan titik dan label.
- Mata kuliah, 19 px Bold.
- Nomor sesi dan topik.
- Jam mulai–selesai dalam WIB, ditulis dengan titik, misalnya "08.00–09.40 WIB".
- Lokasi.
- Jumlah hadir dibanding terdaftar, atau "{n} praktikan terdaftar" saat belum dibuka.
- Aksi "Pantau sesi" saat dibuka, "Kelola sesi" untuk status lain.

Perilaku:

- Filter membaca `status` sesi, bukan teks label.
- Sesi pada tanggal lain tidak ikut ditampilkan.
- Daftar diurutkan naik berdasarkan jam mulai.
- Tanggal tanpa jam dianggap tengah malam WIB, bukan zona waktu perangkat.
- Semua label waktu memakai `Asia/Jakarta`.

Kondisi kosong:

- Hari tanpa sesi: judul "Jadwal masih kosong", deskripsi
  "Belum ada sesi praktikum yang dijadwalkan. Tambahkan sesi pertama untuk mulai
  mencatat presensi.", aksi "Tambah sesi pertama".
- Filter tanpa hasil: judul "Tidak ada sesi untuk filter ini", aksi
  "Tampilkan semua sesi". Deskripsi tidak ditampilkan.

Setelah sesi baru disimpan, muncul banner "Sesi berhasil ditambahkan." dengan
tombol "Tutup" berlabel aksesibilitas "Tutup pesan". Tanggal jadwal pindah ke
tanggal sesi baru.

## 10. Kelola Sesi

Konten bersama:

- Header "Kelola sesi" dengan tombol kembali.
- Mata kuliah dan topik.
- Kelas dan badge status.
- Tanggal, waktu, dan ruangan.
- Jumlah hadir dibanding jumlah terdaftar.
- Persentase kehadiran.
- Bilah kemajuan kehadiran.
- Area daftar presensi.
- Aksi sesuai status.

Angka kehadiran dihitung dari data, bukan ditulis tetap. Persentase dibulatkan
ke bilangan bulat. Bila jumlah terdaftar nol, persentase tampil "—".

### Belum dibuka

- Presensi belum dapat dilakukan.
- Label: "Belum dimulai".
- Pesan kosong: "Sesi belum dibuka".
  Deskripsi: "Buka sesi agar {n} praktikan kelas {kelas} dapat mulai mengisi presensi."
- Aksi utama: "Buka sesi". Tombol membuka sheet konfirmasi, tidak langsung
  mengubah status.

### Dibuka

- Label: "Waktu nyata".
- Daftar praktikan menampilkan nama, NIM, status, dan waktu presensi.
- Aksi: "Tutup sesi".
- Judul daftar: "Presensi praktikan".

Bila belum ada presensi:

- Judul: "Menunggu praktikan".
- Deskripsi: "Belum ada presensi masuk. Kehadiran akan muncul otomatis saat
  praktikan mengisi presensi."
- Tutup sesi tetap tersedia.

Catatan: label "Waktu nyata" hanya berarti daftar membaca ulang data saat
komponen dirender. Sinkronisasi lintas perangkat memerlukan backend, dan backend
belum ditetapkan oleh pembagian tugas. Data presensi saat ini statis dari data
contoh.

### Ditutup

- Presensi tidak lagi diterima.
- Daftar hanya dapat dilihat. Judul daftar: "Hasil presensi".
- Label di samping judul daftar: "Hanya lihat".
- Peserta tanpa presensi diberi label "Tidak hadir".
- Ringkasan berbunyi "{n} tidak hadir · hasil akhir".
- Aksi utama: "Lihat rekap sesi".
- Catatan kaki: "Ditutup {tanggal} WIB oleh Nadia."
- Tidak ada aksi buka kembali.

Kebijakan tidak dapat membuka kembali masih perlu disepakati dengan Programmer 1
pada aturan shared state.

### Sesi tidak ditemukan

Bila `id` tidak ada di data, layar menampilkan "Sesi tidak ditemukan",
penjelasan singkat, dan tombol "Kembali ke jadwal".

### Umpan balik

- "Sesi berhasil dibuka." dan "Sesi berhasil ditutup." muncul sebagai teks
  `primary` dengan `accessibilityLiveRegion="polite"`.
- Kedua layar, Kelola sesi dan Rekap, menampilkan catatan
  "Data contoh · perubahan sementara akan direset saat aplikasi dimuat ulang."

## 11. Bottom Sheet

Semua dialog memakai satu komponen `AssistantSheet`. Sheet menggantikan modal
terpisah yang dipakai pada versi awal.

### 11.1 Anatomi

- `Modal` transparan dengan `animationType="none"`.
- Latar gelap `rgba(18,23,44,0.5)` sebagai lapisan terpisah.
- `Pressable` selebar layar di belakang sheet. Label aksesibilitas:
  "Tutup sheet".
- Bingkai sheet: `maxHeight` 92%, `maxWidth` 600.
- Panel putih dengan sudut atas radius 26.
- Gagang 40 × 4 di area gagang, dengan `hitSlop` atas 8, bawah 10, kiri dan
  kanan 60.
- Isi digulir di dalam `ScrollView`.
- `KeyboardAvoidingView` dengan `behavior="padding"` untuk iOS. Android tidak
  diubah.

### 11.2 Gerak

| Aksi | Properti | Nilai |
|---|---|---|
| Buka | `translateY` tinggi → 0, latar 0 → 1 | 260 ms, `Easing.out(Easing.cubic)` |
| Tutup | `translateY` 0 → tinggi, latar 1 → 0 | 220 ms, `Easing.in(Easing.cubic)` |
| Lepas gagang | pegas ke 0 | stiffness 320, damping 34, mass 1, tanpa overshoot |
| Ambang tutup | jarak atau kecepatan | `min(120, max(64, tinggi sheet × 0.2))` atau `vy > 0.9` |
| Tab aktif | `translateX` | 240 ms, `Easing.out(Easing.cubic)` |

Animasi memakai `Animated` bawaan React Native dengan `useNativeDriver: false`.
`react-native-reanimated` tersedia sebagai dependensi, tetapi tidak dipakai di sini.

### 11.3 Perilaku tutup

Sheet dapat ditutup dengan empat cara:

- Ketuk latar gelap.
- Tombol kembali Android, lewat `onRequestClose`.
- Geser gagang ke bawah melewati ambang.
- Escape di iOS, lewat `onAccessibilityEscape`.

Geser hanya diterima dari area gagang. Geser di badan sheet tidak menutup sheet,
supaya tidak bentrok dengan daftar yang bisa digulir.

Semua aksi penutup melewati satu fungsi `close(action?)`. Callback aksi berjalan
setelah animasi tutup selesai.

### 11.4 Kontrak komponen

```ts
type CloseSheet = (action?: () => void) => void;
type Props = {
  children: ReactNode | ((close: CloseSheet) => ReactNode);
  onCancel: () => void;
  onShow: () => void;
};
```

Tiga pemakai memakai render prop `closeSheet => …`:

- `session-confirmation.tsx` — konfirmasi buka dan tutup sesi.
- `recap-filter-dialog.tsx` — filter tanggal dan filter sesi.
- `session-input-picker.tsx` — pilihan mata kuliah, kelas, tanggal, dan jam.

Layar di belakang sheet diberi `aria-hidden` dan
`importantForAccessibility="no-hide-descendants"` selama sheet terbuka.

Saat sheet tampil, fokus pindah ke tombol "Batal".

### 11.5 Konfirmasi buka sesi

Judul: "Buka sesi sekarang?"

Pesan: "Praktikan dapat mengisi presensi setelah sesi dibuka."

Tampilkan:

- Mata kuliah dan kelas.
- Topik.
- Tanggal dan waktu.

Aksi: "Ya, buka sesi", "Batal".
Konfirmasi memanggil `openSession` dari adapter. Batal tidak mengubah data.

### 11.6 Konfirmasi tutup sesi

Judul: "Tutup sesi ini?"

Pesan: "Presensi baru tidak akan diterima. Sesi yang ditutup tidak dapat dibuka
kembali."

Tampilkan:

- Identitas sesi.
- "{hadir} dari {total} hadir".
- "{n} belum tercatat hadir".

Aksi: "Ya, tutup sesi", "Batal".
Konfirmasi memanggil `closeSession` dari adapter. Batal mempertahankan sesi
tetap dibuka.

### 11.7 Riwayat keputusan sheet

1. Awalnya dialog memakai `Modal` terpisah dan terpusat. Semua dialog kemudian
   diganti bottom sheet pada commit `2b52c71`.
2. Permintaan pengguna: latar sheet harus langsung muncul, tanpa animasi slide.
   Commit `b27ce7e` mematikan animasi bawaan `Modal` dengan `animationType="none"`.
3. Sesi 25 Okt 00.49–01.29 memperbaiki perilaku sheet. Animasi bawaan Modal
   menggeser seluruh overlay, termasuk latar. Perbaikan yang dipakai adalah
   animasi terkendali: latar memudar di tempat, panel naik dari bawah, gagang
   bisa digeser, dan konten bisa digulir. Angka gerak ada di 11.2.

## 12. Rekap Presensi

Konten:

- Filter rentang tanggal.
- Filter sesi.
- Jumlah sesi ditutup.
- Total kehadiran.
- Persentase kehadiran.
- Ringkasan per sesi.
- Aksi melihat detail presensi.

Teks:

- Judul: "Rekap presensi".
- Deskripsi: "Ringkasan kehadiran sesi yang telah ditutup."
- Metrik: "Sesi ditutup", "Total hadir", "Kehadiran".
- Judul daftar: "Hasil per sesi", keterangan "Terbaru lebih dulu".

Filter tanggal memakai satu bulan penuh sebagai nilai awal. Bulan acuan diambil
dari tanggal sesi yang dibuka, atau dari tanggal data contoh. Label ringkas
memakai bentuk "1–31 Okt 2026" bila awal dan akhir berada di bulan yang sama.
Filter sesi memakai label topik, atau "Semua sesi".

Sheet filter tanggal:

- Judul: "Rentang tanggal".
- Dua input teks berformat `YYYY-MM-DD`.
- Galat: "Gunakan tanggal valid dengan format YYYY-MM-DD." dan
  "Tanggal akhir harus sama atau setelah tanggal awal."
- Aksi: "Terapkan tanggal", "Semua tanggal", "Batal".
- Nilai tidak valid tidak menutup sheet.

Sheet filter sesi:

- Judul: "Pilih sesi".
- Opsi "Semua sesi" dan daftar sesi ditutup.
- Aksi: "Batal".

Kartu rekap:

- Bentuk ringkas berisi topik, mata kuliah, tanggal, kelas, "4/6", "67% hadir".
- Ketuk kartu membuka bentuk penuh: "{n} hadir", "{n} tidak hadir", bilah
  kemajuan, daftar nama "Tidak hadir", dan "Lihat detail presensi".
- Hanya satu kartu terbuka pada satu waktu. Kartu pertama terbuka secara default.

Perhitungan:

- Hadir per sesi = jumlah praktikan unik yang tercatat hadir.
- Tidak hadir = jumlah terdaftar − jumlah hadir.
- Persentase sesi = hadir / terdaftar × 100%.
- Total hadir = penjumlahan kehadiran semua sesi terpilih.
- Persentase keseluruhan = total hadir / total peserta terdaftar seluruh sesi
  terpilih × 100%.

Total hadir lintas sesi bukan jumlah mahasiswa unik lintas sesi.
Persentase dibulatkan ke bilangan bulat. Bila pembagi nol, tampilkan "—".
Rekap hanya memuat sesi berstatus ditutup. Urutan: tanggal dan jam terbaru lebih
dahulu.

Kondisi kosong:

- Tanpa sesi ditutup: "Belum ada rekap", deskripsi
  "Rekap tersedia setelah sesi ditutup. Buka jadwal untuk mengelola sesi
  praktikum Anda.", aksi "Kembali ke jadwal".
- Filter tanpa hasil: "Tidak ada rekap untuk filter ini", aksi "Reset filter",
  lalu "Kembali ke jadwal".

Tidak ada fitur ekspor dalam scope desain.

## 13. Tambah Sesi

Semua kolom wajib diisi. Label kolom diakhiri tanda bintang.

| Kolom | Kontrol |
|---|---|
| Mata kuliah / praktikum | Daftar pilihan dalam bottom sheet |
| Sesi / topik | Input teks |
| Kelas | Daftar pilihan dalam bottom sheet |
| Tanggal | Kalender dalam bottom sheet |
| Jam mulai | Kolom jam dan menit dalam bottom sheet |
| Jam selesai | Kolom jam dan menit dalam bottom sheet |
| Lokasi / ruangan | Input teks |

Judul pengantar: "Siapkan praktikum baru".
Header: "Tambah sesi" dengan tombol kembali dan "Batal".
Tombol simpan: "Tambahkan", tanpa ikon dan tanpa teks tambahan.

Pemilih tanggal adalah kalender yang dibangun sendiri:

- Nama bulan dan tombol "‹" serta "›".
- Urutan hari Senin sampai Minggu.
- Sel hari 44 × 44.
- Teks "Pilihan: {tanggal lengkap}".
- Tombol "Gunakan tanggal".

Pemilih jam memakai dua kolom gulir, jam 0–23 dan menit 0–59, dengan pratinjau
"{HH}.{MM} WIB" dan tombol "Gunakan waktu". Tidak ada dependensi baru untuk
pemilih ini.

Validasi:

- Semua kolom wajib terisi.
- Nilai teks tidak boleh hanya spasi.
- Mata kuliah dan kelas harus termasuk pilihan yang tersedia.
- Tanggal harus valid.
- Jam harus berformat 24 jam yang sah.
- Jam selesai harus setelah jam mulai.
- Kesalahan tampil di bawah kolom terkait, dengan ikon dan `aria-invalid`.
- Input yang sudah benar dipertahankan.
- Sesi tidak disimpan bila masih ada kesalahan.
- Saat validasi gagal, halaman menggulir ke atas dan menampilkan
  "Periksa kembali kolom yang ditandai."

Pesan galat:

- "Mata kuliah wajib dipilih."
- "Sesi / topik wajib diisi."
- "Kelas wajib dipilih."
- "Tanggal wajib dipilih."
- "Pilih tanggal yang valid."
- "Jam mulai wajib dipilih dengan benar."
- "Jam selesai wajib dipilih dengan benar."
- "Harus setelah jam mulai."
- "Lokasi / ruangan wajib diisi."

Setelah berhasil:

- `addSession` dipanggil dan sesi baru berstatus Belum dibuka.
- Jumlah praktikan diambil dari gabungan peserta kelas tersebut.
- Kembali ke Jadwal pada tanggal sesi baru.
- Banner "Sesi berhasil ditambahkan." tampil.
- Bila penyimpanan gagal, form tetap terisi dan menampilkan
  "Sesi belum tersimpan. Periksa isian, lalu coba simpan kembali."
- Tombol simpan dinonaktifkan selama proses, dan klik ganda dicegah.

## 14. Data Contoh

Seluruh nama, NIM, dan sesi adalah data contoh. Nilainya dihitung dari data,
bukan ditulis sebagai angka tetap.

Sesi:

| ID | Mata kuliah | Kelas | Topik | Tanggal | Waktu | Status |
|---|---|---|---|---|---|---|
| web-04 | Pemrograman Web | IF-3A | Sesi 04 · Formulir & validasi | 19 Okt 2026 | 08.00–09.40 | Dibuka |
| basis-data-05 | Basis Data | IF-3B | Sesi 05 · JOIN antartabel | 19 Okt 2026 | 10.00–11.40 | Belum dibuka |
| web-03 | Pemrograman Web | IF-3A | Sesi 03 · DOM & interaksi | 12 Okt 2026 | 08.00–09.40 | Ditutup |
| web-02 | Pemrograman Web | IF-3A | Sesi 02 · Dasar JavaScript | 5 Okt 2026 | 08.00–09.40 | Ditutup |

Lokasi semua sesi: Lab Komputer 2.
Tanggal acuan tampilan: 19 Oktober 2026.

Praktikan kelas IF-3A, enam orang:

| NIM | Nama |
|---|---|
| 231110001 | Aditya Pratama |
| 231110002 | Bunga Maharani |
| 231110003 | Citra Lestari |
| 231110004 | Dimas Saputra |
| 231110005 | Farhan Hakim |
| 231110006 | Intan Permata |

Presensi sesi web-04:

- Hadir: Aditya Pratama 08.05.12, Bunga Maharani 08.07.38,
  Citra Lestari 08.12.06, Dimas Saputra 08.18.45.
- Belum hadir: Farhan Hakim, Intan Permata.
- Kehadiran: 4 dari 6, atau 67%.

Sesi web-03 dan web-02 tercatat hadir penuh, 6 dari 6.

Rekap contoh Oktober 2026, setelah sesi web-04 ditutup:

- 3 sesi ditutup.
- Kehadiran per sesi: 4/6, 6/6, 6/6.
- Total hadir: 16 dari 18 kesempatan hadir.
- Persentase keseluruhan: 89%.

Sebelum web-04 ditutup, rekap hanya berisi dua sesi historis, 12 dari 12
kesempatan hadir, atau 100%.

Kelas IF-3B memakai roster yang sama pada data contoh. Adapter menggabungkan
peserta per kelas saat sesi baru dibuat.

## 15. Perbedaan yang Disepakati dari Figma

Perubahan berikut diminta pengguna lewat tangkapan layar. Empat di antaranya
berlaku pada elemen yang ada di Figma: tiga dihapus dan satu diubah labelnya.

| Elemen | Keputusan | Sumber elemen |
|---|---|---|
| Catatan kaki Jadwal "Semua jadwal menggunakan Waktu Indonesia Barat." | Dihapus | Figma |
| Catatan "Data contoh · identitas dan sesi mengikuti desain." | Dihapus | Tambahan implementasi |
| Teks "Belum ada sesi berstatus ditutup pada tanggal ini." | Dihapus | Tambahan implementasi |
| Petunjuk "Lengkapi detail sesi. Semua kolom wajib diisi." | Dihapus | Figma |
| Kotak info "Sesi baru akan berstatus Belum dibuka. Buka sesi melalui jadwal saat praktikum dimulai." | Dihapus | Figma |
| Tombol simpan "Simpan sesi" dengan ikon centang | Diganti tombol teks "Tambahkan" | Figma |
| Dialog modal terpusat | Diganti bottom sheet | Implementasi awal |

Akibatnya, layar Jadwal dan Tambah sesi lebih ringkas daripada Figma. Bila
paritas visual dengan Figma diminta lagi, elemen di atas harus dikembalikan.

## 16. Aksesibilitas

Yang sudah diterapkan:

- Bar bawah memakai `accessibilityRole="tablist"` dengan anak `tab` dan
  `accessibilityState` berisi `selected` dan `disabled`.
- Bilah kemajuan memakai `accessibilityRole="progressbar"` dengan
  `accessibilityValue`.
- Kolom form memakai `aria-required` dan `aria-invalid`.
- Pesan galat memakai `accessibilityRole="alert"`.
- Judul bagian memakai `accessibilityRole="header"`.
- Layar di belakang sheet disembunyikan dari pembaca layar.
- Fokus pindah ke "Batal" saat sheet tampil.
- Status selalu punya label teks di samping warna.
- Target sentuh minimal 44, tombol utama minimal 48–50.

## 17. Build dan Menjalankan

Identitas aplikasi:

| Properti | Nilai |
|---|---|
| name | Presensi Praktikum |
| slug | presensi-praktikum |
| scheme | presensipraktikum |
| android.package | com.ppk.presensipraktikum |
| owner | kemal-faza |
| EAS projectId | 973698af-d649-4bb7-a583-4fbf399f00a2 |

`package.json` masih bernama `absensi`. Nilai itu nama paket npm, bukan
identitas aplikasi.

EAS:

- `eas.json` memakai `cli.version >= 20.5.1` dan `appVersionSource: remote`.
- Profil `development`: `developmentClient: true`, `distribution: internal`.
- Profil `preview`: `distribution: internal`.
- Profil `production`: `autoIncrement: true`.

Aplikasi memerlukan development build. Expo Go tidak dapat menjalankannya karena
ada modul native seperti `@expo/ui`, `expo-glass-effect`, dan `expo-symbols`.

Langkah menjalankan:

```bash
npx expo start --dev-client     # lalu tekan a untuk Android
eas build:run -p android --latest
eas build -p android --profile development
npx expo run:android            # alternatif lokal
```

Menurut sumber eas-cli 20.5.1, build cloud berjalan di server EAS.
Ctrl+C hanya menghentikan CLI, bukan build.
Jangan menekan Ctrl+C saat tahap unggah, sebelum build masuk antrean.
Ctrl+C pada `expo start` menghentikan Metro.

`ios.bundleIdentifier` belum diisi. Error yang sama kemungkinan muncul di iOS,
tetapi belum diuji.

Pemeriksaan yang dipakai sebagai gerbang: `tsc --noEmit`, `expo lint`,
`git diff --check`. Repo tidak punya test suite.

## 18. Integrasi dan Kepemilikan

Programmer 3:

- Mengimplementasikan tampilan sisi Asisten.
- Membaca `sessions` dan `attendance`.
- Memfilter presensi berdasarkan sesi.
- Menghubungkan aksi `openSession`, `closeSession`, `addSession`.
- Menghitung dan menampilkan rekap.

Programmer 1:

- Menyediakan `SessionContext` dan aturan perubahan data.
- Menyediakan komponen bersama dan theme.
- Mengelola fondasi navigasi.

Komponen yang dipakai saat ini masih milik sisi Asisten, bukan komponen bersama:

- `AssistantSheet` sebagai pengganti sementara `ConfirmModal` dan `BottomSheet`.
- `AssistantText`, `AssistantScreen`, `ScheduleIcon`.
- `ScheduleCard`, `RecapCard`, `SessionConfirmation`.
- `assistantTheme` di `src/screens/asisten/theme.ts`.

Saat komponen bersama Programmer 1 tersedia, komponen di atas dipetakan ke sana.
Token warna dan tipografi tinggal dipetakan.

Kontrak yang harus disepakati:

- Bentuk objek sesi dan attendance.
- Nilai internal untuk status sesi: `pending`, `open`, `closed`.
- Parameter dan hasil setiap action.
- Sumber daftar praktikan terdaftar per kelas.
- Penanganan kegagalan action.
- Metadata waktu dan identitas penutup sesi.

Daftar peserta terdaftar diperlukan untuk menghitung belum hadir dan tidak hadir.
Data attendance saja tidak cukup.

## 19. Riwayat Keputusan dan Commit

| Waktu (WIB) | Sumber | Isi |
|---|---|---|
| 24 Okt 21.58 – 25 Okt 00.45 | Codex Desktop | Implementasi Figma bertahap; 12 commit `b1886c1`–`b27ce7e` |
| 24 Okt 22.08–22.49 | DSH | Perbaikan `android.package`, ganti nama aplikasi, proyek EAS baru, panduan development build |
| 25 Okt 00.49–01.29 | DSH | Perbaikan perilaku bottom sheet: animasi, geser gagang, kontrak render prop |
| 25 Okt 01.29–02.25 | DSH | Arah transisi tab, grup rute `(tabs)`, indikator aktif bergeser |

Keputusan yang mengikat:

- Scope hanya sisi Asisten. `SessionContext` tidak dibuat.
- Data contoh di memori. Reset saat aplikasi dimuat ulang.
- Satu komponen bottom sheet untuk semua dialog.
- Bar bawah statis; konten tab tetap bergeser; indikator aktif bergeser.
- Geser untuk menutup sheet hanya dari gagang.
- Pemilih tanggal dan jam dibuat sendiri, tanpa dependensi baru.
- Bahasa Indonesia dan WIB di semua label waktu.
- Commit per tahap, tanpa push.

Dua belas commit dari sesi Codex:

| Hash | Pesan |
|---|---|
| b1886c1 | feat: establish assistant visual baseline from Figma |
| b7bcaba | feat: implement assistant schedule and status filters |
| ba01c18 | feat: implement assistant session management and confirmation dialogs |
| 269b5a2 | feat: implement attendance recap with date and session filters |
| d1d6a76 | feat: implement assistant session creation form with validation |
| 3cf447b | chore: remove schedule footer notes |
| 159d5e8 | chore: simplify empty schedule filter state |
| 93937b1 | chore: remove add session helper copy |
| 2b671c8 | chore: remove add session status notice |
| 02f4c09 | chore: simplify add session button |
| 2b52c71 | feat: replace assistant dialogs with bottom sheets |
| b27ce7e | chore: show sheets without slide animation |

Jumlah commit di repo: 14. Dua commit lain adalah `0c00cf0 Initial commit` dan
`6f49789 Add: md file`.

Perubahan sesi DSH setelah `b27ce7e` belum di-commit. Isinya: konfigurasi app
dan EAS, pemindahan rute ke grup `(tabs)`, `(tabs)/_layout.tsx` baru, perilaku
sheet, dan indikator tab. `DESIGN.md` juga belum masuk repo.

## 20. Batasan yang Diketahui

- Data hanya data contoh. Tidak ada backend, tidak ada `SessionContext`.
- Tidak ada `submitAttendance` di sisi Asisten, jadi daftar presensi tidak
  berubah selama aplikasi berjalan.
- iOS belum dijalankan. `ios.bundleIdentifier` belum diisi.
- Verifikasi web hanya di sesi Codex. Verifikasi perangkat hanya emulator Android.
- Dua state kosong murni, yaitu Jadwal kosong dan Rekap kosong, belum diuji
  visual satu per satu.
- Layar sempit: isi sheet yang lebih tinggi dari panel memotong aksi bawah sampai
  digulir. Perilaku ini diamati pada 1080 × 1920.
- `KeyboardAvoidingView` di dalam sheet tidak menangani keyboard Android.
  Form Tambah sesi punya penanganan sendiri dengan `behavior="height"`.
- Bar bawah tertutup sepenuhnya oleh halaman detail dan form.
- `baseline-screen.tsx` masih ada tetapi tidak dipakai.
- `expo-doctor` melaporkan 10 paket versi lama pada 24 Oktober. Belum dijalankan
  ulang dan belum diperbaiki.

## 21. Kriteria Penerimaan

| Kriteria | Status | Bukti |
|---|---|---|
| Empat halaman utama tersedia | Terpenuhi | Rute `/`, `/rekap`, `/sesi/[id]`, `/tambah-sesi` ada |
| Semua state pendukung ditangani | Terpenuhi di kode | Ke-12 state ada di kode (lihat bagian 8) |
| Filter jadwal bekerja berdasarkan data | Terpenuhi | Diuji di web untuk tiap filter |
| Buka dan tutup sesi selalu melalui konfirmasi | Terpenuhi | Sheet konfirmasi dipanggil sebelum aksi |
| Pembatalan sheet tidak mengubah status | Terpenuhi | Diuji di web dan di emulator Android |
| Presensi diperbarui ketika data berubah | Belum | Data presensi statis; belum ada sumber perubahan |
| Data presensi tidak tercampur antar sesi | Terpenuhi | Filter `sessionId`; diuji dengan harness |
| Sesi ditutup tidak menerima presensi baru | Terpenuhi sebagian | Hanya aksi buka dan tutup yang diblokir; jalur presensi bukan scope ini |
| Rekap konsisten dengan data kehadiran | Terpenuhi | Harness: 16/18 = 89%, urutan dan filter benar |
| Form menampilkan kesalahan di kolom terkait | Terpenuhi | Diuji di web untuk semua kolom |
| Input tidak hilang saat validasi gagal | Terpenuhi | Nilai form disimpan di state; diuji |
| Sesi baru berstatus Belum dibuka | Terpenuhi | `createSession` menetapkan `pending` |
| Tampilan kosong punya penjelasan dan aksi | Terpenuhi sebagian | Jalur filter diuji; state kosong murni belum |
| Konten tidak terpotong pada perangkat kecil | Terpenuhi sebagian | Bisa digulir; aksi bawah sheet terpotong sampai digulir |
| Keyboard tidak menutupi input atau aksi | Belum terverifikasi | Hanya diperiksa di web |
| Status dapat dipahami tanpa warna | Terpenuhi | Setiap badge punya label teks |
| Komponen dan theme bersama digunakan konsisten | Terpenuhi sebagian | Theme lokal sisi Asisten; komponen bersama P1 belum ada |

Dua kriteria yang belum terpenuhi bergantung pada pekerjaan di luar scope:
`submitAttendance` dari sisi Praktikan dan `SessionContext` dari Programmer 1.
