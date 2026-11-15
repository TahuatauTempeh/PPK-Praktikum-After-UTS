# DESIGN.md — Aplikasi Presensi Praktikum
## Sistem visual dan antarmuka

Status: diperbarui 15 November 2026.
Sumber: kode di working tree dan audit kontras 14 November 2026 lewat
[stateofcolors.com](https://www.stateofcolors.com/).

Dokumen ini menggantikan versi 25 Oktober 2026 yang masih memakai palet indigo
lama, rute P3, dan form tambah sesi yang tidak lagi ada di rute saat ini.
Fokus dokumen adalah sistem visual: warna, tipografi, layout, navigasi, pola
komponen, dan aksesibilitas. Aturan data dan perilaku bisnis tetap mengikuti
kode di `src/context/` dan `src/screens/`.

Ringkasan keadaan sekarang:

- Aplikasi memiliki empat area: autentikasi, Asisten, Praktikan, dan admin.
- Sistem visual memakai kobalt dan kaca di atas latar bergradien kobalt di
  bagian atas yang memudar ke biru sangat terang, dengan kartu translusen.
- Ada satu sumber token: `src/theme/` menyediakan `useTheme()`,
  `useThemedStyles()`, palet warna, skala tipografi, jarak, dan radius yang
  dipakai semua area. Varian terang dan gelap berada di modul yang sama.
- Admin memakai `AssistantSurface` dan `HeroCard` yang sama dengan Asisten,
  sehingga halaman kelola pengguna mengikuti preferensi tema pengguna.
- Bottom bar mengapung tanpa auto-hide; tinggi bar terukur menjadi padding bawah
  area gulir. Area aman atas tetap dihormati.
- Audit 105 pasangan warna selesai. Setelah perbaikan, seluruh 98 pasangan teks
  lolos WCAG AA normal (4.5:1). Empat pasangan border tetap di bawah 3:1 dan
  dikategorikan dekoratif, bukan satu-satunya penanda kontrol.
- `tsc --noEmit` dan `expo lint` lulus pada 15 November 2026.

## 1. Tujuan dan cakupan

Menyediakan antarmuka mobile untuk:

- Asisten: beranda, jadwal, rekap, detail sesi, dan profil.
- Praktikan: jadwal, riwayat, profil, dan detail sesi.
- Admin: kelola pengguna.
- Autentikasi: login dan registrasi.

Platform: React Native / Expo SDK 58, rute memakai Expo Router.
Bahasa antarmuka: Bahasa Indonesia.
Zona waktu tampilan: Waktu Indonesia Barat (WIB).

Dokumen ini tidak menduplikasi seluruh teks per layar. Teks aktual ada di
komponen masing-masing. Jika copy dan dokumen berbeda, kode adalah sumber
kebenaran; perubahan copy yang disengaja harus dicatat di bagian 12.

## 2. Struktur aplikasi dan rute

| Rute | Berkas | Layar |
|---|---|---|
| `/` | `src/app/index.tsx` | Redirect sesuai peran |
| `/login` | `src/app/(auth)/login.tsx` | Login |
| `/register` | `src/app/(auth)/register.tsx` | Registrasi |
| `/asisten` | `src/app/asisten/(tabs)/index.tsx` | Hub Asisten |
| `/asisten/profil` | `src/app/asisten/(tabs)/profil.tsx` | Profil Asisten |
| `/asisten/jadwal` | `src/app/asisten/(tabs)/jadwal.tsx` | Jadwal praktikum |
| `/asisten/rekap` | `src/app/asisten/(tabs)/rekap.tsx` | Rekap presensi |
| `/asisten/admin` | `src/app/asisten/(tabs)/admin.tsx` | Kelola pengguna (admin) |
| `/asisten/sesi/[id]` | `src/app/asisten/sesi/[id].tsx` | Kelola sesi |
| `/(praktikan)` | `src/app/(praktikan)/index.tsx` | Jadwal Praktikan |
| `/(praktikan)/riwayat` | `src/app/(praktikan)/riwayat.tsx` | Riwayat Praktikan |
| `/(praktikan)/profil` | `src/app/(praktikan)/profil.tsx` | Profil Praktikan |
| `/praktikan/sesi/[id]` | `src/app/praktikan/sesi/[id].tsx` | Detail sesi Praktikan |

Guard rute berada di `src/app/_layout.tsx` memakai `Stack.Protected`:

- Tanpa profil: hanya grup `(auth)`.
- Praktikan: grup `(praktikan)` dan detail sesi Praktikan.
- Asisten: grup `asisten/(tabs)` dan detail sesi Asisten.
- Admin: route `/asisten/admin` di dalam grup tab, hanya dirender jika
  `profile.isAdmin === true`.

Sumber data:

- Asisten memakai `AssistantPreviewProvider` dan data contoh di memori.
- Praktikan memakai `SessionContext` bersama.
- Auth memakai Firebase Authentication dan profil Firestore.

## 3. Arah visual

Karakter:

- Bersih, tenang, dan profesional.
- Latar bergradien kobalt di bagian atas yang memudar ke biru sangat terang.
- Kartu kaca putih translusen dengan garis putih dan bayangan biru lembut.
- Kobalt sebagai aksen utama; lime untuk status sesi dibuka dan kemajuan.
- Status selalu disertai teks, bukan hanya warna.
- Ikon sederhana dan konsisten.

Hindari:

- Dekorasi yang mengganggu pembacaan.
- Terlalu banyak warna aksen.
- Tombol tanpa label yang jelas.
- Informasi penting yang hanya dibedakan dengan warna.
- Memakai satu token warna untuk dua peran berbeda tanpa menguji keduanya.

Ikon Asisten berasal dari Figma, diekspor sebagai 51 berkas SVG di
`assets/asisten/`, dan dirender lewat `expo-image` oleh `ScheduleIcon`.
Praktikan memakai `Ikon` di `src/screens/praktikan/components/ikon.tsx`.

## 4. Token warna

### 4.1 Satu palet semantik

Nilai final di `src/theme/colors.ts`. Satu nama mewakili satu peran di seluruh
area; tidak ada palet terpisah per sisi aplikasi.

| Token | Terang | Gelap | Peran |
|---|---|---|---|
| background | `#E8EFF9` | `#0B1226` | Latar halaman |
| surface | `#FFFFFF` | `#1F2937` | Bidang opak: sheet, dialog, isian form |
| panel | `#F1F6FE` | `#16213D` | Permukaan sheet Asisten |
| textPrimary | `#192138` | `#EAF0FF` | Judul dan teks utama |
| textSecondary | `#4C5D75` | `#9FB0CE` | Metadata dan teks pendukung |
| border | `#CBD8EA` | putih 14% | Garis dekoratif |
| hairline | biru 10% | putih 10% | Garis pemisah halus |
| primary | `#204CAC` | `#8FB0FF` | Teks dan ikon aksen |
| primaryFill | `#204CAC` | `#3A6BDD` | Isian tombol dan chip aktif |
| onPrimary | `#FFFFFF` | `#FFFFFF` | Teks di atas `primaryFill` |
| primarySoft | `#DFE9FA` | `#243564` | Latar aksen lembut dan indikator nav |
| onPrimarySoft | `#D5E3FF` | `#DCE7FF` | Teks sekunder di atas `primaryFill` |
| neutralSoft | `#E5EDF8` | `#1C2947` | Permukaan netral |
| success | `#23765B` | `#5FD0A8` | Teks dan ikon hadir |
| successFill | `#23765B` | `#23765B` | Isian tombol sukses |
| onSuccess | `#FFFFFF` | `#FFFFFF` | Teks di atas `successFill` |
| successSoft | `#E8F5EF` | `#12352B` | Latar sukses lembut |
| error | `#AE3645` | `#F28B96` | Teks kesalahan |
| errorFill | `#AE3645` | `#AE3645` | Isian tombol bahaya |
| onError | `#FFFFFF` | `#FFFFFF` | Teks di atas `errorFill` |
| errorSoft | `#FFF0F1` | `#3A1E24` | Latar kesalahan |
| glassSurface | putih 80% | navy 78% | Kartu kaca |
| glassCard | putih 72% | navy 78% | Kartu menu dan sesi |
| glassMuted | putih 60% | navy 62% | Chip filter dan kotak hasil |
| glassBorder | putih 95% | putih 12% | Garis kartu kaca |
| cardOpen | `rgba(235,243,255,0.75)` | `rgba(34,52,102,0.8)` | Kartu sesi dibuka |
| softSurface | biru 65% | biru 28% | Badge netral dan track progres |
| glassHero | `rgba(20,55,128,0.8)` | `rgba(18,40,96,0.82)` | Banner dan hero semua area |
| heroSoft | `#EDF3FF` | `#DCE7FF` | Teks hero sekunder |
| heroMuted | putih 80% | putih 75% | Baris "Berikutnya" |
| heroLine | putih 20% | putih 18% | Pemisah di hero |
| heroWash | putih 12% | putih 10% | Badge di hero |
| onHero | `#FFFFFF` | `#FFFFFF` | Teks dan ikon di atas hero |
| lime | `#DEF1B4` | `#DEF1B4` | Badge sesi dibuka |
| onLime | `#35501A` | `#35501A` | Teks di atas `lime` |
| iconMuted | `#6D7588` | `#9FB0CE` | Ikon nonaktif |
| navSurface | `rgba(255,255,255,0.85)` | `rgba(24,34,66,0.9)` | Latar bottom bar |
| shadow | biru 7% | hitam 35% | Bayangan kartu |
| shadowSmall | biru 8% | hitam 30% | Bayangan tombol kembali |
| scrim | `rgba(12,32,70,0.42)` | `rgba(2,8,23,0.62)` | Backdrop sheet |
| glassSheenStart/End | putih 94%/65% | navy 95%/70% | Gradien kilau kartu sesi |
| glassGlowBlue/Lime | biru 55%, lime 40% | biru 35%, lime 22% | Glow kartu sesi |

Warna di luar token:

- Gradien atmosfer: `assets/praktikan/atmosfer.svg` (terang) dan
  `assets/praktikan/atmosfer-gelap.svg` (gelap).
- Kilau kaca: `assets/asisten/session-glass.svg` (terang) dan
  `assets/asisten/session-glass-dark.svg` (gelap).
- Gradien kedalaman hero: lapisan `#081840` 14% di dalam `HeroCard`.
- Teks putih pada header biru halaman detail ditulis langsung karena header
  selalu berada di atas atmosfer gelap, bukan di atas `background`.

Status:

- Belum dibuka: netral.
- Dibuka: lime dengan teks `onLime`.
- Ditutup: netral dengan label eksplisit.
- Hadir: `success`.
- Belum hadir atau tidak hadir: netral.
- Kesalahan form: `error`.

### 4.2 Aturan pemakaian

- `primary` untuk teks dan ikon aksen, `primaryFill` untuk isian kontrol, dan
  `onPrimary` untuk label di atasnya. Jangan memakai satu nilai untuk dua
  peran berbeda tanpa menguji keduanya.
- `onHero` khusus teks dan ikon di atas hero. `surface` khusus bidang opak
  seperti sheet, dialog, dan isian form.
- `navSurface`, `primarySoft`, dan `iconMuted` dipakai kedua bottom bar
  (Asisten dan Praktikan), sehingga navigasi tidak meminjam token area lain.
- Di mode gelap, warna teks aksen tetap terang; isian kontrol memakai versi
  gelap agar teks putih tetap lolos AA.
- `border` adalah garis dekoratif. Jika suatu kontrol hanya dapat dikenali dari
  garisnya, gunakan border yang lebih tegas: `#7488A8` di atas terang atau
  `#6B7280` di atas gelap, dan uji ulang.
- Jangan menulis `#FFFFFF` untuk label tombol; pakai token `on*`.

### 4.3 Nilai yang disatukan

Saat tiga palet digabung, nilai yang dipakai mayoritas dipertahankan:

| Peran | Sebelum | Sesudah | Alasan |
|---|---|---|---|
| Aksen isian | `#1D4ED8` (auth), `#204CAC` (Asisten), `#2856B9` (Praktikan) | `#204CAC` | Dua dari tiga sumber |
| Galat | `#AE3645` (auth, Praktikan), `#B83E4D` (Asisten) | `#AE3645` | Dua dari tiga sumber |
| Teks utama | `#000000` (auth), `#192138` (Asisten, Praktikan) | `#192138` | Dua dari tiga sumber |
| Latar halaman | `#FFFFFF` (auth), `#E8EFF9` (Asisten, Praktikan) | `#E8EFF9` | Dua dari tiga sumber |
| Teks sekunder | `#60646C` (auth), `#4C5D75` (Asisten, Praktikan) | `#4C5D75` | Dua dari tiga sumber |
| Hero | alpha 0.6 (Praktikan), 0.8 (Asisten) | 0.8 | Mayoritas, kontras teks lebih aman |
| Lime gelap | `#34481A` (Praktikan), `#DEF1B4` (Asisten) | `#DEF1B4` | Mayoritas; teks `#35501A` tetap |
| Ikon aksen | `#4B4ACF` (Asisten), `#204CAC` | `#204CAC` | Satu peran, satu nilai |
| Garis kartu gelap | putih 10% (Praktikan), 12% (Asisten) | 12% | Mayoritas pemakaian |
| Ikon nonaktif | `#51627C` (Praktikan), `#6D7588` (Asisten) | `#6D7588` | Mayoritas pemakaian |

Konsekuensi visual yang disengaja:

- Halaman auth kini berlatar `#E8EFF9`, bukan putih; isian form memakai
  `surface` putih agar tetap jelas.
- Hero Praktikan dan kartu profil menjadi lebih gelap (alpha 0.8).
- Tombol utama Praktikan memakai `#204CAC`, bukan `#2856B9`.
- Badge dibuka di mode gelap memakai lime terang dengan teks `#35501A`.

Seluruh nilai sesudah penggabungan sudah ada di tabel audit 4.4, jadi tidak ada
pasangan warna baru. Tiga belas pasangan kunci dihitung ulang secara lokal
setelah penggabungan dan semuanya lolos; rasio terendah 3.99:1 pada ikon
nonaktif di atas `background`, yang kebutuhan minimumnya 3:1. Pemeriksaan
visual di perangkat belum dijalankan.

### 4.4 Audit kontras

Metode:

- Setiap pasangan dibuka lewat URL share
  `/contrast?fg=…&bg=…` di stateofcolors.com.
- Warna transparan dihitung sebagai komposit di atas latarnya.
- 105 pasangan diuji: 98 pasangan teks, 5 batas UI, 2 dekoratif.
- Rasio situs sama dengan perhitungan lokal: 0 selisih.

Hasil setelah perbaikan 14 November 2026, saat palet masih terpisah:

| Kelompok | Pasangan teks | Hasil |
|---|---|---|
| Asisten terang | 25 | Semua ≥ 4.5:1 |
| Praktikan terang | 23 | Semua ≥ 4.5:1 |
| Praktikan gelap | 22 | Semua ≥ 4.5:1 |
| Token bersama terang | 14 | Semua ≥ 4.5:1 |
| Token bersama gelap | 14 | Semua ≥ 4.5:1 |

Pasangan kunci (nama token mengikuti palet saat pengukuran):

| Pasangan | Rasio |
|---|---|
| Asisten textPrimary / background | 13.79:1 |
| Asisten textSecondary / background | 5.80:1 |
| Asisten textSecondary / neutralSoft | 5.69:1 |
| Asisten primary / surface | 7.80:1 |
| Asisten surface / primary | 7.80:1 |
| Asisten putih / glassHero | 6.58:1 |
| Asisten #EDF3FF / glassHero | 5.92:1 |
| Asisten putih 80% / glassHero | 4.88:1 |
| Asisten putih / badge hari ini | 4.95:1 |
| Asisten lime / primary | 6.45:1 |
| Asisten #35501A / lime | 7.50:1 |
| Asisten error / errorSoft | 4.95:1 |
| Asisten success / surface | 5.51:1 |
| Asisten gelap textPrimary / background | 16.31:1 |
| Asisten gelap textSecondary / background | 8.48:1 |
| Asisten gelap primary / background | 8.70:1 |
| Asisten gelap putih / primaryFill | 4.85:1 |
| Asisten gelap putih / errorFill | 6.15:1 |
| Asisten gelap error / errorSoft | 6.40:1 |
| Asisten gelap primary / primarySoft | 5.55:1 |
| Asisten gelap #35501A / lime | 7.50:1 |
| Praktikan teks / kartu | 15.38:1 |
| Praktikan teksSekunder / background | 5.80:1 |
| Praktikan diAtasAksen / isiAksen | 6.73:1 |
| Praktikan heroTeks / hero | 8.11:1 |
| Praktikan gelap teks / kartu | 14.35:1 |
| Praktikan gelap teksSekunder / kartu | 7.46:1 |
| Praktikan gelap diAtasAksen / isiAksen | 4.85:1 |
| Praktikan gelap galat / galatLembut | 6.40:1 |
| Bersama primary / putih | 6.70:1 |
| Bersama putih / primaryFill | 6.70:1 |
| Bersama success / successLight | 4.86:1 |
| Bersama danger / dangerLight | 5.04:1 |
| Bersama warning / warningLight | 6.72:1 |
| Bersama gelap primary / primaryLight | 4.52:1 |
| Bersama gelap danger / dangerLight | 5.46:1 |
| Bersama putih / dangerFill | 6.15:1 |

Konteks gradien:

- Teks di area header Asisten kini putih atau `#EDF3FF` di atas `#1546AC`
  dengan rasio 8.39:1 dan 7.54:1. `textSecondary` tetap dipakai di area
  konten yang lebih terang; di atas `#DAE6F9` atau `#C3D9FC` rasionya
  5.33:1 dan 4.68:1.
- Caption Praktikan di atas `#C6D8F4` memakai `#4C5D75` dengan rasio 4.64:1.
- Hero Praktikan berada di atas gradien biru tua; putih dan `#EDF3FF` lolos
  dengan rasio 8.11:1 dan 7.29:1.
- Judul halaman Asisten, judul top bar, dan judul header sesi berada di atas
  gradien `#1546AC` dan memakai putih; rasionya 8.39:1.

Batas yang tidak diklaim lolos:

- `border` Asisten: 1.44:1 di atas putih dan 1.25:1 di atas background.
- `border` token bersama: 1.24:1 di atas putih dan 1.42:1 di atas kartu gelap.
- Keempatnya dekoratif. Jika dipakai sebagai satu-satunya penanda kontrol,
  ganti dengan border yang lebih tegas dan uji ulang.

## 5. Tipografi

Font: Inter, dimuat lewat `@expo-google-fonts/inter`.
Bobot: 400 Regular, 500 Medium, 600 Semi Bold, 700 Bold.

Token implementasi di `src/theme/tokens.ts`. Seluruh token memakai
`fontFamily` Inter, bukan `fontWeight`, karena family Inter dimuat sebagai
berkas terpisah per bobot.

| Token | Ukuran / line height | Bobot | Dipakai untuk |
|---|---|---|---|
| pageTitle | 27 / 34 | Bold | Judul halaman |
| detailTitle | 25 / 32 | Bold | Judul detail |
| sectionTitle | 16 / 22 | Bold | Judul bagian dan header |
| cardTitle | 19 / 25 | Bold | Judul kartu |
| sectionHeading | 20 / 27 | Bold | Judul bagian besar |
| timeDisplay | 30 / 38 | Bold | Waktu presensi |
| numeric | 25 / 32 | Bold | Angka statistik |
| greeting | 13 / 16 | Regular | Sapaan |
| body | 14 / 22 | Regular | Isi |
| label | 15 / 20 | Semi Bold | Label dan nilai |
| caption | 12 / 18 | Regular | Keterangan |
| tiny | 11 / 16 | Regular | Label tab dan status |
| eyebrow | 10 / 16 | Semi Bold | Eyebrow huruf kapital |

Ukuran tambahan ditulis langsung di komponen, misalnya:

| Elemen | Ukuran |
|---|---|
| Judul halaman Rekap | 28 / 35 Bold |
| Judul sheet | 23 / 30 Bold |
| Judul kartu sesi | 20 / 27 Bold |
| Angka kehadiran besar | 30 / 38 Bold |
| Angka metrik Rekap | 25 / 32 Bold |
| Label status kecil | 10–11 |
| Pesan galat form | 11–12 |

Ketentuan:

- Line height ditulis eksplisit, tidak memakai auto.
- Teks pendukung memakai `flexWrap`, tidak dipaksa satu baris.
- Ukuran teks mengikuti skala font perangkat; tidak ada
  `allowFontScaling={false}`.

## 6. Layout, spacing, dan radius

Ukuran frame referensi: 412 × 956. Ukuran itu bukan ukuran tetap aplikasi.

Pola layout:

- Konten vertikal, padding horizontal 24.
- Jarak antarbagian utama 18.
- Lebar konten maksimum 600, rata tengah.
- Footer aksi berada di luar area gulir.
- Halaman detail dan form berfokus pada satu tugas.
- Safe area dihormati lewat `react-native-safe-area-context`.
- Area aman atas tetap dihormati: area gulir berhenti di bawah status bar, lalu
  konten memakai jarak desain 14 px. Tidak ada konten yang lewat di bawah area
  status bar.
- Bottom bar mengapung (`position: absolute`) di atas konten. Area gulir
  menambah padding bawah sebesar tinggi bar terukur (termasuk `insets.bottom`)
  supaya jarak visual 24 ke kapsul tetap sama seperti saat bar ikut flow.
- Target sentuh minimal 44 × 44; tombol utama minimal 48–50.

Spacing di `src/theme/tokens.ts`:

| Token | Nilai |
|---|---|
| xxs | 2 |
| xs | 4 |
| sm | 8 |
| md | 12 |
| base | 16 |
| section | 18 |
| page | 24 |
| lg | 32 |
| xxl | 64 |

Radius di `src/theme/tokens.ts`:

| Token | Nilai | Penggunaan |
|---|---|---|
| control | 20 | Kontrol dan input |
| card | 28 | Kartu |
| panel | 32 | Panel besar dan sheet |
| banner | 30 | Banner hero |
| block | 24 | Blok menu |
| button | 21 | Tombol |
| pill | 999 | Badge dan avatar |

Latar:

- `AssistantAtmosphere` memasang `background` dan gradien
  `atmosfer.svg`/`atmosfer-gelap.svg` setinggi 680, sama dengan halaman
  Profil/Praktikan. Varian dipilih dari `theme.scheme`.
- `Layar` Praktikan memasang `background` dan gradien
  `atmosfer.svg`/`atmosfer-gelap.svg` setinggi 680.
- Gradien memengaruhi kontras; token teks harus diuji pada titik tergelap,
  bukan hanya pada `background`.

## 7. Navigasi dan transisi

### 7.1 Asisten

- Grup tab Asisten memakai `Tabs` di `src/app/asisten/(tabs)/_layout.tsx`
  dengan tab bar kustom; urutan layar: `index`, `jadwal`, `rekap`, `admin`,
  `profil`. `backBehavior="history"` mempertahankan perilaku tombol back.
- Isi tab: Asisten, Admin (hanya untuk admin), dan Profil.
- Tab Asisten adalah hub berisi agenda hari aktif serta menu Jadwal dan Rekap
  pada grid tiga kolom.
- Header hub hanya satu baris sapaan `Selamat <waktu>, <nama depan>`;
  judul "Asisten" dan tanggal tidak ditampilkan.
- `AssistantNavigation` memakai `accessibilityRole="tablist"` dengan anak
  `tab`, indikator aktif `Animated.View`, durasi 240 ms,
  `Easing.out(Easing.cubic)`, `translateX`, dan `useNativeDriver` kecuali web.
  Baris tab dibungkus `View` tanpa border/padding; indikator absolut mengisi
  tinggi wrapper lewat `top: 0` dan `bottom: 0`, dengan lebar dari tab pertama,
  sehingga tidak ada koreksi offset border.
- Bar: lebar 90%, maksimum 552, padding 6, gap 52 untuk dua tab dan 12 untuk
  tiga tab, tinggi tab minimal 60, padding item 10, ikon 18, label 11/16,
  radius tab 26, radius panel. Warna bar memakai token nav bersama
  (`navSurface`, `primarySoft`, `iconMuted`, `primary`) sehingga kedua bottom
  bar ikut preferensi tema terang/gelap tanpa meminjam palet area lain.
- Bar mengapung: root `position: absolute` di dasar layar dengan
  `pointerEvents="box-none"` tanpa latar, dan tinggi bar (termasuk safe area
  bawah) dilaporkan lewat `onLayout` ke `TabBarInsetProvider`. Area gulir
  menambah padding bawah sebesar tinggi itu.
- Jadwal dan Rekap berada di dalam grup tab; bar bawah tetap terlihat dan
  mengapung di atas konten yang lewat di belakangnya.
- Detail sesi berada di luar grup tab; bar bawah tertutup.
- Perpindahan tab memakai `TAB_TRANSITION_SPEC` 240 ms dan
  `tabSlideInterpolator`: layar berindeks lebih besar masuk dari kanan,
  yang lebih kecil masuk dari kiri. Animasi aktif karena `transitionSpec`
  diberikan, tanpa `animation: 'none'`.
- Kembali dari detail: `router.back()`; jika tidak ada tumpukan, kembali ke
  jadwal.
- Kembali dari jadwal/rekap: `router.navigate('/asisten')` karena keduanya
  kini tab, bukan tumpukan layar.
- Admin memakai route `/asisten/admin` tanpa tombol kembali; guard `isAdmin`
  mengarahkan non-admin ke `/asisten`.

### 7.2 Praktikan

- Tab bawah: Jadwal, Riwayat, Profil.
- `NavigasiPraktikan` memakai indikator aktif dan metrik tab yang sama:
  tinggi 60, padding item 10, ikon 18, label 11/16. Indikator juga berada di
  dalam wrapper baris tab dan mengisi tingginya, bukan dihitung dari border bar.
- Detail sesi berada di `/praktikan/sesi/[id]`, di luar tab.
- Bar mengapung dengan aturan yang sama seperti Asisten; padding bawah `Layar`
  mengikuti tinggi bar dari context, dan bernilai 0 di layar detail yang berada
  di luar grup tab.
- Perpindahan tab memakai spec dan interpolator yang sama dengan Asisten,
  sehingga arah geser mengikuti urutan Jadwal, Riwayat, Profil.

### 7.3 Auth dan admin

- Auth memakai stack `(auth)`.
- Admin memakai route `/asisten/admin` di dalam grup `(tabs)`, dijaga guard
  `isAdmin` di layar; grup `(admin)` dihapus.
- Halaman admin memakai `AssistantSurface`, `AssistantText`, `HeroCard`, dan
  `useTheme()`: hero metrik dengan watermark users, pencarian kaca,
  chip filter pil, kartu kaca, serta `AssistantSheet` untuk konfirmasi
  perubahan role. Halaman ini ikut preferensi terang/gelap pengguna.
- Kartu pengguna menaruh nama di kiri dan kelompok badge di kanan dengan
  `alignItems: flex-start`; nama membungkus bila panjang.
- Stack luar (auth, grup role, dan detail sesi) memakai
  `animation: 'slide_from_right'`; perpindahan tab memakai interpolator geser
  penuh yang mengikuti urutan tab.

## 8. Pola komponen

### 8.1 AssistantScreen dan atmosfer

`AssistantScreen` menyusun safe area, atmosfer, header opsional, ScrollView,
dan footer. Konten memakai lebar maksimum 600 dan padding 24. Area aman atas
tetap dihormati lewat `SafeAreaView`, lalu konten diberi jarak desain 14 px;
`Layar` Praktikan memakai aturan yang sama. Header memakai
`AssistantTopBar` bila layar membutuhkan tombol kembali. `AssistantSurface`
adalah kerangka yang sama tanpa ScrollView, dipakai layar yang membawa daftar
sendiri (admin) agar `FlatList` tetap menjadi area gulir. Keduanya memakai
`useAssistantStyles`, sehingga latar dan warna ikut preferensi tema.

### 8.2 HeroCard dan banner hero

`KartuProfil`, `AgendaBanner`, hero admin, heading Rekap, dan `Hero` Praktikan
memakai `HeroCard` bersama dari `src/screens/shared/components/hero-card.tsx`.
Komponen menyediakan surface `overflow: hidden`, border putih 30%, radius 30,
slot watermark kanan atas (opacity 0.12), dan gradien kedalaman yang selalu
dirender. Gradien itu menambahkan lapisan `#081840` 14% di atas, memudar ke 0%
di bawah, mengikuti arah atmosfer halaman. Semua hero memakai gradien yang
sama; tidak ada lagi glow radial per area yang membuat latar kartu
berbeda-beda. Warna dasar berasal dari satu token, `glassHero` 0.8 terang /
0.82 gelap, untuk profil, Praktikan, Asisten, dan admin. Alpha itu dipilih
karena dipakai mayoritas dan menjaga kontras teks terhadap atmosfer. Teks hero
memakai `onHero`, `heroSoft`, atau `heroMuted` (baris Berikutnya) yang sudah
diaudit.

`AgendaBanner` memakai `glassHero`, border putih 30%, dan teks putih. Dengan
alpha `glassHero` 0.8 terang/0.82 gelap, seluruh pasangan teks hero lolos AA
normal. Gradien adalah lapisan dekoratif, bukan pengganti warna teks.

### 8.3 Kartu kaca

Kartu memakai `glassSurface`, `glassBorder`, radius card, dan bayangan
`shadow` (biru di terang, hitam di gelap). `AssistantGlassHighlight`
menambahkan kilau `session-glass.svg`/`session-glass-dark.svg` sesuai skema.
Kartu Praktikan memakai `glassCard`/`cardOpen` dan `KilauKaca`. Blok menu hub
memakai sel 33,333%, tinggi minimal 104, padding 12, ikon 40, label 12,5/16,
dan radius block.

Kartu yang berakhir dengan aksi memakai satu aturan jarak:

- Bingkai 18 (`spacing.section`) di semua sisi.
- Jarak antarkelompok 16 (`spacing.base`), ditulis sebagai `gap` kartu.
- Jarak antarbaris teks 4 (`spacing.xs`) di dalam satu blok teks.
- Aksi selebar konten, tinggi 48, radius 21, padding horizontal 16, dan selalu
  punya latar: putih di atas kartu biru, `softSurface`, atau `primarySoft`.
- Jarak antarbagian di dalam konten (10–14) tidak ikut diseragamkan karena
  bagian-bagian itu bukan satu blok teks.

Kartu yang mengikuti aturan ini: `SesiBerlangsung` (acuan), `SesiCard`,
`ScheduleCard`, `RecapCard`, dan kartu pengguna di halaman admin. Radius tetap
mengikuti jenis permukaan: 28 untuk kartu kaca, 24 untuk kartu solid.

### 8.4 Tombol

- Tombol utama Asisten: latar `primaryFill`, teks `onPrimary`.
- Tombol bahaya Asisten: latar `errorFill`, teks `onError`.
- Tombol sekunder: latar `glassSurface`, border `glassBorder`.
- Tombol Praktikan: `primaryFill` + `onPrimary`, `softSurface` + `primary`,
  atau `lime` untuk aksen terang.
- Tombol shared: `primaryFill` + `onPrimary`, `errorFill` + `onError`,
  `successFill` + `onSuccess`.
- Jangan menulis `#FFFFFF` untuk label tombol; pakai token `on*`.
- Tombol nonaktif tidak memakai opacity rendah untuk teks; gunakan warna
  `textSecondary` agar tetap terbaca.
- Aksi di dalam kartu selalu punya latar dan mengikuti ukuran 48/21/16.
  Varian tanpa latar (`polos`) dan prop `rapat` dihapus 15 November 2026.

### 8.5 Bottom sheet

`AssistantSheet` adalah satu-satunya dialog Asisten, termasuk konfirmasi
perubahan role di halaman admin:

- `Modal` transparan, `animationType="none"`.
- Backdrop `scrim` (navy 42% di terang, hitam 62% di gelap).
- Panel `panel` (`#F1F6FE` terang, `#16213D` gelap), radius panel 32,
  maksimum tinggi 92%, maksimum lebar 600.
- Gagang 40 × 4; geser hanya dari area gagang.
- Buka 260 ms `Easing.out(Easing.cubic)`; tutup 220 ms
  `Easing.in(Easing.cubic)`.
- Ambang tutup: `min(120, max(64, tinggi sheet × 0.2))` atau `vy > 0.9`.
- Kontrak: `children` boleh fungsi `closeSheet => ReactNode`.
- Fokus awal ke tombol Batal; layar di belakang sheet disembunyikan dari
  pembaca layar.
- `KeyboardAvoidingView` hanya menangani iOS; keyboard Android belum
  ditangani penuh.

### 8.6 Preferensi tema

`ThemePreferenceProvider` di `src/context/theme-context.tsx` menyimpan pilihan
tema `system`/`light`/`dark` di AsyncStorage dengan kunci `ppk.theme-mode`.
`useColorScheme` mengembalikan skema hasil preferensi itu. Satu-satunya
pembaca token adalah `useTheme` di `src/theme`, sehingga seluruh halaman ikut
berubah tanpa mengubah komponen pemanggil. Mode
`system` mengikuti skema perangkat.

Halaman Profil punya baris **Tema** di bagian TAMPILAN: label "Tema" di kiri
dan `PemilihTema` di kanan, di dalam kartu berbentuk pil (radius 999, tinggi
56). Pil memakai track padding 4, segmen 40 × 40, ikon 18, tanpa border, dan
berjarak 4 px dari tepi kanan, atas, serta bawah kartu; area sentuh diperluas
`hitSlop` 4. Segmen aktif ditandai satu indikator `primaryFill` 40 × 40 yang bergeser di
belakang ikon memakai `INDICATOR_SLIDE` (240 ms, `Easing.out(Easing.cubic)`),
durasi dan easing yang sama dengan indikator bottom tab. Ikon aktif memakai
`onPrimary`; ikon lain memakai `textSecondary`. Tidak ada keterangan teks di bawah kontrol; maknanya dijaga
`accessibilityRole="radiogroup"` dengan anak `radio` dan
`accessibilityState.checked`.

### 8.7 Status

- Badge selalu berisi teks dan titik warna.
- Asisten: lime untuk sesi dibuka, netral untuk status lain.
- Shared: `successSoft` + `success`, `errorSoft` + `error`,
  `primarySoft` + `primary`.
- Jangan mengandalkan warna saja; label teks wajib.

### 8.8 ConfirmModal

`ConfirmModal` dipakai untuk konfirmasi keluar akun. Backdrop penuh memakai
`Pressable` transparan; ketukan di luar kartu memanggil `onCancel`, sedangkan
kartu dirender setelah backdrop sehingga ketukan di dalam tidak menutup.
Tombol batal memakai `primarySoft` + `primary` agar sama dengan aksi lembut
di halaman admin; tombol konfirmasi memakai `*Fill` + `on*`.

## 9. Aksesibilitas

Ambang yang dipakai:

- Teks normal: 4.5:1.
- Teks besar (≥24 px regular atau ≥18.66 px bold): 3:1.
- Batas UI dan ikon penting: 3:1.

Yang sudah diterapkan:

- Bar bawah memakai `tablist`/`tab` dan `accessibilityState`.
- Bilah kemajuan memakai `progressbar` dan `accessibilityValue`.
- Kolom form memakai `aria-required` dan `aria-invalid`.
- Pesan galat memakai `accessibilityRole="alert"`.
- Judul bagian memakai `accessibilityRole="header"`.
- Layar di belakang sheet disembunyikan dari pembaca layar.
- Fokus pindah ke Batal saat sheet tampil.
- Status selalu punya label teks.
- Target sentuh minimal 44; tombol utama 48–50.
- Teks mengikuti skala font perangkat.

Catatan kontras:

- Semua pasangan teks yang dipakai saat ini lolos AA normal setelah audit
  14 November 2026 dan penambahan halaman admin 15 November 2026.
- Pasangan baru admin memakai token yang sudah diuji: `primary` pada
  `primarySoft`, `error` pada `errorSoft`, `textSecondary` pada `neutralSoft`,
  dan `textPrimary` pada `lime`.
- Border tetap dekoratif. Jika suatu kontrol hanya dikenali dari border,
  perbaiki border sebelum mengklaim kepatuhan 1.4.11.
- Gradien atmosfer dapat menurunkan kontras teks sekunder. Nilai
  `textSecondary` sudah diuji pada titik tergelap gradien.

## 10. Build dan verifikasi

Identitas aplikasi:

| Properti | Nilai |
|---|---|
| name | Presensi Praktikum |
| slug | presensi-praktikum |
| scheme | presensipraktikum |
| android.package | com.ppk.presensipraktikum |
| owner | kemal-fazas-team |
| EAS projectId | 973698af-d649-4bb7-a583-4fbf399f00a2 |

Aplikasi memerlukan development build. Expo Go tidak dapat menjalankannya
karena ada modul native seperti `@expo/ui`, `expo-glass-effect`, dan
`expo-symbols`.

Perintah:

```bash
npx expo start --dev-client
npx expo run:android
npx tsc --noEmit
npx expo lint
git diff --check
```

Gerbang yang dipakai: `tsc --noEmit`, `expo lint`, dan `git diff --check`.
Repo tidak punya test suite otomatis.

## 11. Batasan yang diketahui

- Asisten masih memakai `AssistantPreviewProvider` dengan data contoh di
  memori; perubahan status hilang saat aplikasi dimuat ulang.
- `SessionContext` tersedia untuk Praktikan, tetapi bukan sumber data Asisten.
- Form tambah sesi dari versi P3 tidak lagi ada di rute saat ini.
- iOS belum dijalankan; `ios.bundleIdentifier` sudah diisi
  (`com.ppk.presensipraktikum`).
- Verifikasi perangkat hanya di emulator Android; verifikasi web terbatas.
- `KeyboardAvoidingView` di sheet hanya menangani iOS.
- Border tipis sengaja dekoratif; jangan dipakai sebagai satu-satunya penanda
  kontrol.
- `expo-doctor` pernah melaporkan paket versi lama; belum dijalankan ulang
  setelah perubahan terakhir.
- Tidak ada test suite; verifikasi kontras dilakukan lewat stateofcolors.com
  dan perhitungan WCAG lokal.
- Pemeriksaan visual di perangkat setelah penggabungan palet belum dijalankan;
  nilai yang berubah bergerak ke kombinasi yang sudah diaudit di tabel 4.4.
- Komponen bersama (auth, sheet, toast) masih memakai `fontWeight` sistem,
  bukan `fontFamily` Inter seperti layar Asisten dan Praktikan.

## 12. Riwayat perubahan

| Waktu | Perubahan |
|---|---|
| 24–25 Okt 2026 | Baseline visual P3 dari Figma; 12 commit `b1886c1`–`b27ce7e` |
| 25 Okt 2026 | Perbaikan bottom sheet, grup rute `(tabs)`, indikator tab |
| Nov 2026 | Integrasi auth, `SessionContext`, sisi Praktikan, admin, dan redesain kaca/kobalt |
| 14 Nov 2026 | Audit 105 pasangan warna lewat stateofcolors.com |
| 15 Nov 2026 | Navigasi asisten: tab Asisten/Admin/Profil; Jadwal dan Rekap masuk grup tab |
| 15 Nov 2026 | Beranda: menu tiga kolom ringkas; admin memakai bahasa visual Asisten; item bottom tab lebih lega dengan ikon/label lebih kecil |
| 15 Nov 2026 | Header hub satu baris sapaan + nama depan; badge kartu admin rata kanan; pemisah "Berikutnya" memakai pipe |
| 15 Nov 2026 | HeroCard bersama untuk profile/Asisten/admin/Rekap/Praktikan; watermark users di hero admin; satu gradien kedalaman untuk semua hero |
| 15 Nov 2026 | Latar default Asisten dan admin memakai gradien `atmosfer.svg` yang sama dengan Profil/Praktikan |
| 15 Nov 2026 | Preferensi tema `system`/`light`/`dark` di AsyncStorage; switch Mode gelap di bagian TAMPILAN halaman Profil; bottom bar Asisten mengikuti tema |
| 15 Nov 2026 | TAMPILAN halaman Profil memakai `PemilihTema` tiga segmen ikon (sistem/terang/gelap), menggantikan switch Mode gelap dan tautan Ikuti pengaturan perangkat |
| 15 Nov 2026 | Baris Tema di TAMPILAN memakai ikon `expo-symbols`, tanpa keterangan teks |
| 15 Nov 2026 | Indikator bottom bar mengisi wrapper baris tab, menghapus selisih akibat border pada navigasi Asisten dan Praktikan |
| 15 Nov 2026 | Kartu Tema menjadi pil dengan pemilih 40 px yang menempel ke tepi kanan |
| 15 Nov 2026 | ConfirmModal menutup lewat ketukan di luar kartu; tombol Batal memakai `primaryLight` + `primary` |
| 15 Nov 2026 | Pemilih tema diberi jarak 4 px dari tepi kartu; tombol konfirmasi keluar menjadi "Ya" |
| 15 Nov 2026 | Grup tab Asisten pindah dari Stack ke Tabs; transisi tab Asisten dan Praktikan mengikuti arah urutan tab |
| 15 Nov 2026 | Teks aksi admin memakai "Jadikan Asisten"/"Jadikan Praktikan"; aksi sesi berupa tautan tanpa latar |
| 15 Nov 2026 | Palet gelap Asisten/admin lewat `useAssistantTheme`; seluruh halaman mengikuti preferensi terang/gelap |
| 15 Nov 2026 | Tema disatukan di `src/theme/`: `useTheme`/`useThemedStyles`, satu palet semantik, satu skala tipografi. `assistantTokens`, `usePraktikanTheme`, dan `Colors` dihapus |
| 15 Nov 2026 | Nilai minoritas mengikuti mayoritas: aksen `#204CAC`, galat `#AE3645`, hero alpha 0.8, lime terang di kedua mode, ikon aksen `#204CAC` |
| 15 Nov 2026 | `use-color-scheme.web.ts` dihapus karena identik setelah hidrasi pindah ke `use-device-color-scheme.web.ts` |
| 15 Nov 2026 | Empat komponen bersama tanpa pemakai dihapus: `EmptyState`, `ScreenState`, `SessionCard`, `StatusBadge` |
| 15 Nov 2026 | Spacing kartu beraksi diseragamkan: bingkai 18, jarak ke aksi 16, aksi 48/21/16 berlatar, berlaku di `SesiBerlangsung`, `SesiCard`, `ScheduleCard`, `RecapCard`, dan kartu admin |
| 15 Nov 2026 | Pemilih tema memakai indikator geser 240 ms yang sama dengan bottom tab; `INDICATOR_SLIDE` dipakai bersama ketiganya |
| 15 Nov 2026 | Bottom bar mengapung tanpa auto-hide; tinggi bar terukur menjadi padding bawah area gulir, area aman atas tetap dihormati |

Perbaikan kontras 14 November 2026:

| Commit | Isi |
|---|---|
| `61dbbe4` | Asisten: `textSecondary` #4C5D75 dan `glassHero` alpha 0.8 |
| `bc8ec9b` | Praktikan: `teksSekunder` #4C5D75 |
| `461c3f0` | Shared: palet kontras dan pemisahan token teks/isian |
| `429f59d` | Shared: tombol dan chip memakai `*Fill`/`on*`, bukan putih hardcoded |
| commit dokumen ini | DESIGN.md diselaraskan dengan kode dan hasil audit |

Keputusan yang mengikat:

- Status selalu disertai teks.
- Warna aksen dan isian kontrol dipisahkan per peran.
- Label di atas isian memakai token `on*`.
- Border tipis adalah dekorasi; jika menjadi penanda kontrol, harus diuji 3:1.
- Token teks diuji pada latar tergelap yang mungkin, termasuk gradien.
- Bahasa Indonesia dan WIB di semua label waktu.
