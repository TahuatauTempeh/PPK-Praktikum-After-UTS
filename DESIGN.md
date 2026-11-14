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
- Ada tiga sumber token: `assistantTokens`/`useAssistantTheme()` untuk Asisten
  dan admin, `usePraktikanTheme()` untuk Praktikan, dan `Colors` untuk
  auth/komponen bersama. Ketiganya punya varian terang dan gelap.
- Admin memakai `useAssistantTheme()`, `AssistantSurface`, dan `HeroCard`,
  sehingga halaman kelola pengguna mengikuti preferensi tema pengguna.
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

### 4.1 Asisten

Nilai final di `src/screens/asisten/theme.ts`:

| Token | Terang | Gelap | Penggunaan |
|---|---|---|---|
| background | `#E8EFF9` | `#0B1226` | Latar halaman |
| surface | `#FFFFFF` | `#FFFFFF` | Teks di atas hero dan isian |
| primary | `#204CAC` | `#8FB0FF` | Teks dan ikon aksen |
| primaryFill | `#204CAC` | `#3A6BDD` | Isian tombol dan badge aktif |
| onPrimary | `#FFFFFF` | `#FFFFFF` | Teks di atas `primaryFill` |
| primarySoft | `#DFE9FA` | `#243564` | Latar aksen lembut |
| onPrimarySoft | `#D5E3FF` | `#DCE7FF` | Teks sekunder di atas `primaryFill` |
| textPrimary | `#192138` | `#EAF0FF` | Judul dan teks utama |
| textSecondary | `#4C5D75` | `#9FB0CE` | Metadata dan teks pendukung |
| neutralSoft | `#E5EDF8` | `#1C2947` | Permukaan netral |
| border | `#CBD8EA` | putih 14% | Garis dekoratif |
| hairline | biru 10% | putih 10% | Garis pemisah halus |
| success | `#23765B` | `#5FD0A8` | Label hadir |
| error | `#B83E4D` | `#F28B96` | Teks kesalahan |
| errorFill | `#B83E4D` | `#AE3645` | Isian tombol bahaya |
| onError | `#FFFFFF` | `#FFFFFF` | Teks di atas `errorFill` |
| errorSoft | `#FFF0F1` | `#3A1E24` | Latar kesalahan |
| glassSurface | putih 80% | navy 78% | Kartu kaca |
| glassCard | putih 72% | navy 78% | Kartu menu dan sesi |
| glassMuted | putih 60% | navy 62% | Chip filter dan kotak hasil |
| glassBorder | putih 95% | putih 12% | Garis kartu kaca |
| cardOpen | `rgba(235,243,255,0.75)` | `rgba(34,52,102,0.8)` | Kartu sesi dibuka |
| softSurface | biru 65% | biru 28% | Badge netral dan track progres |
| glassHero | `rgba(20,55,128,0.8)` | `rgba(18,40,96,0.82)` | Banner hero |
| heroSoft | `#EDF3FF` | `#DCE7FF` | Teks hero sekunder |
| heroMuted | putih 80% | putih 75% | Baris "Berikutnya" |
| heroLine | putih 20% | putih 18% | Pemisah di hero |
| heroWash | putih 12% | putih 10% | Badge di hero |
| lime | `#DEF1B4` | `#DEF1B4` | Badge dibuka |
| onLime | `#35501A` | `#35501A` | Teks di atas `lime` |
| shadow | biru 7% | hitam 35% | Bayangan kartu |
| shadowSmall | biru 8% | hitam 30% | Bayangan tombol kembali |
| panel | `#F1F6FE` | `#16213D` | Permukaan sheet |
| scrim | `rgba(12,32,70,0.42)` | `rgba(2,8,23,0.62)` | Backdrop sheet |
| glassSheenStart/End | putih 94%/65% | navy 95%/70% | Gradien kilau kartu sesi |
| glassGlowBlue/Lime | biru 55%, lime 40% | biru 35%, lime 22% | Glow kartu sesi |

Perubahan dari versi 25 Oktober 2026:

- `textSecondary` dari `#5C6D86` menjadi `#4C5D75`.
- `glassHero` dari alpha `0.6` menjadi `0.8`.
- Palet gelap ditambahkan 15 November 2026 dengan keluarga navy Praktikan.
- Isian tombol dipisahkan dari warna teks aksen lewat
  `primaryFill`/`onPrimary` dan `errorFill`/`onError`.

Warna di luar token:

- Teks dan ikon di atas `primaryFill`: `onPrimary`.
- Gradien atmosfer: `assets/praktikan/atmosfer.svg` (terang) dan
  `assets/praktikan/atmosfer-gelap.svg` (gelap).
- Kilau kaca: `assets/asisten/session-glass.svg` (terang) dan
  `assets/asisten/session-glass-dark.svg` (gelap).

Status:

- Belum dibuka: netral.
- Dibuka: lime dengan teks `#35501A`.
- Ditutup: netral dengan label eksplisit.
- Hadir: hijau.
- Belum hadir atau tidak hadir: netral.
- Kesalahan form: merah.

### 4.2 Praktikan

Nilai final di `src/screens/praktikan/theme.ts`:

| Peran | Terang | Gelap |
|---|---|---|
| background | `#E8EFF9` | `#0B1226` |
| kartu | `rgba(255,255,255,0.72)` | `rgba(24,34,66,0.78)` |
| kartuSorot | `rgba(235,243,255,0.75)` | `rgba(34,52,102,0.8)` |
| teks | `#192138` | `#EAF0FF` |
| teksSekunder | `#4C5D75` | `#9FB0CE` |
| aksen | `#204CAC` | `#8FB0FF` |
| isiAksen | `#2856B9` | `#3A6BDD` |
| diAtasAksen | `#FFFFFF` | `#FFFFFF` |
| isiLembut | `rgba(222,232,248,0.65)` | `rgba(58,90,160,0.28)` |
| teksLembut | `#204CAC` | `#B7CBFF` |
| hero | `rgba(20,55,128,0.6)` | `rgba(20,45,110,0.7)` |
| heroTeks | `#FFFFFF` | `#FFFFFF` |
| heroTeksLembut | `#EDF3FF` | `#DCE7FF` |
| lencanaBuka | `#DEF1B4` | `#34481A` |
| teksLencanaBuka | `#35501A` | `#DEF1B4` |
| sukses | `#23765B` | `#5FD0A8` |
| galat | `#AE3645` | `#F28B96` |
| galatLembut | `#FFF0F1` | `#3A1E24` |
| navLatar | `rgba(255,255,255,0.85)` | `rgba(24,34,66,0.9)` |
| navAktif | `#DFE9FA` | `#243564` |
| ikonNonaktif | `#51627C` | `#9FB0CE` |

Perubahan: `teksSekunder` terang dari `#51627C` menjadi `#4C5D75` agar tetap
lolos di atas gradien atmosfer, bukan hanya di atas `background`.

Pemisahan peran yang wajib dipertahankan:

- `aksen` untuk teks dan ikon di atas permukaan terang/gelap.
- `isiAksen` untuk isian tombol dan chip terpilih.
- `diAtasAksen` untuk teks/ikon di atas `isiAksen`.
- `teksLembut` untuk teks di atas `isiLembut`.

### 4.3 Token bersama

Nilai final di `src/constants/theme.ts`, dipakai auth, admin, dan komponen
shared:

| Token | Terang | Gelap | Peran |
|---|---|---|---|
| text | `#000000` | `#FFFFFF` | Teks utama |
| textSecondary | `#60646C` | `#B0B4BA` | Teks sekunder |
| primary | `#1D4ED8` | `#60A5FA` | Teks/ikon aksen |
| primaryLight | `#DBEAFE` | `#1E3A5F` | Latar aksen lembut |
| primaryFill | `#1D4ED8` | `#1D4ED8` | Isian tombol/chip |
| onPrimary | `#FFFFFF` | `#FFFFFF` | Teks di atas `primaryFill` |
| success | `#23765B` | `#34D399` | Teks/ikon sukses |
| successLight | `#D1FAE5` | `#064E3B` | Latar sukses lembut |
| successFill | `#23765B` | `#23765B` | Isian tombol sukses |
| onSuccess | `#FFFFFF` | `#FFFFFF` | Teks di atas `successFill` |
| danger | `#AE3645` | `#F87171` | Teks/ikon bahaya |
| dangerLight | `#FEE2E2` | `#3A1E24` | Latar bahaya lembut |
| dangerFill | `#AE3645` | `#AE3645` | Isian tombol bahaya |
| onDanger | `#FFFFFF` | `#FFFFFF` | Teks di atas `dangerFill` |
| warning | `#7A4A00` | `#FBBF24` | Teks/ikon peringatan |
| warningLight | `#FEF3C7` | `#78350F` | Latar peringatan lembut |
| border | `#E5E7EB` | `#374151` | Garis dekoratif |
| card | `#FFFFFF` | `#1F2937` | Permukaan kartu |

Perubahan dari palet lama:

- `primary` terang dari `#3B82F6` menjadi `#1D4ED8`.
- `success` terang dari `#10B981` menjadi `#23765B`.
- `danger` terang dari `#EF4444` menjadi `#AE3645`.
- `warning` terang dari `#F59E0B` menjadi `#7A4A00`.
- `dangerLight` gelap dari `#7F1D1D` menjadi `#3A1E24`.

Aturan pemakaian:

- `primary`, `success`, `danger`, dan `warning` adalah warna teks/ikon.
- `primaryFill`, `successFill`, dan `dangerFill` adalah warna isian kontrol.
- Label di atas isian memakai `onPrimary`, `onSuccess`, atau `onDanger`,
  bukan `#FFFFFF` hardcoded.
- Di mode gelap, warna teks aksen tetap terang; isian kontrol memakai versi
  gelap agar teks putih tetap lolos AA.
- `border` adalah garis dekoratif. Jika suatu kontrol hanya dapat dikenali dari
  garisnya, gunakan border yang lebih tegas: `#7488A8` di atas terang atau
  `#6B7280` di atas gelap, dan uji ulang.

### 4.4 Audit kontras

Metode:

- Setiap pasangan dibuka lewat URL share
  `/contrast?fg=…&bg=…` di stateofcolors.com.
- Warna transparan dihitung sebagai komposit di atas latarnya.
- 105 pasangan diuji: 98 pasangan teks, 5 batas UI, 2 dekoratif.
- Rasio situs sama dengan perhitungan lokal: 0 selisih.

Hasil setelah perbaikan:

| Kelompok | Pasangan teks | Hasil |
|---|---|---|
| Asisten terang | 25 | Semua ≥ 4.5:1 |
| Praktikan terang | 23 | Semua ≥ 4.5:1 |
| Praktikan gelap | 22 | Semua ≥ 4.5:1 |
| Token bersama terang | 14 | Semua ≥ 4.5:1 |
| Token bersama gelap | 14 | Semua ≥ 4.5:1 |

Pasangan kunci:

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

Token implementasi di `assistantTokens.typography`:

| Token | Ukuran / line height | Bobot |
|---|---|---|
| pageTitle | 27 / 34 | Bold |
| detailTitle | 25 / 32 | Bold |
| sectionTitle | 16 / 22 | Bold |
| body | 14 / 22 | Regular |
| greeting | 13 / 16 | Regular |
| label | 15 / 20 | Semi Bold |
| caption | 12 / 18 | Regular |

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
- Target sentuh minimal 44 × 44; tombol utama minimal 48–50.

Spacing di `assistantTokens.spacing`:

| Token | Nilai |
|---|---|
| xs | 4 |
| sm | 8 |
| md | 12 |
| section | 18 |
| page | 24 |
| lg | 32 |

Radius di `assistantTokens.radius`:

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
  radius tab 26, radius panel. Warna bar memakai token Praktikan
  (`navLatar`, `navAktif`, `ikonNonaktif`, `aksen`) sehingga ikut preferensi
  tema terang/gelap.
- Jadwal dan Rekap berada di dalam grup tab; bar bawah tetap terlihat.
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
- Perpindahan tab memakai spec dan interpolator yang sama dengan Asisten,
  sehingga arah geser mengikuti urutan Jadwal, Riwayat, Profil.

### 7.3 Auth dan admin

- Auth memakai stack `(auth)`.
- Admin memakai route `/asisten/admin` di dalam grup `(tabs)`, dijaga guard
  `isAdmin` di layar; grup `(admin)` dihapus.
- Halaman admin memakai `AssistantSurface`, `AssistantText`, `HeroCard`, dan
  `useAssistantTheme()`: hero metrik dengan watermark users, pencarian kaca,
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
dan footer. Konten memakai lebar maksimum 600 dan padding 24. Header memakai
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
berbeda-beda. Warna dasar tetap berasal dari token area: `theme.hero` (0.6
terang/0.7 gelap) untuk profile/Praktikan, `glassHero` 0.8 terang/0.82 gelap
untuk Asisten/admin. Perbedaan alpha itu menjaga kontras teks terhadap atmosfer
masing-masing area. Teks hero tetap memakai putih, `heroSoft`, atau putih 80%
(baris Berikutnya) yang sudah diaudit.

`AgendaBanner` memakai `glassHero`, border putih 30%, dan teks putih. Dengan
alpha `glassHero` 0.8 terang/0.82 gelap, seluruh pasangan teks hero lolos AA
normal. Gradien adalah lapisan dekoratif, bukan pengganti warna teks.

### 8.3 Kartu kaca

Kartu memakai `glassSurface`, `glassBorder`, radius card, dan bayangan
`shadow` (biru di terang, hitam di gelap). `AssistantGlassHighlight`
menambahkan kilau `session-glass.svg`/`session-glass-dark.svg` sesuai skema.
Kartu Praktikan memakai `kartu`/`kartuSorot` dan `KilauKaca`. Blok menu hub
memakai sel 33,333%, tinggi minimal 104, padding 12, ikon 40, label 12,5/16,
dan radius block.

### 8.4 Tombol

- Tombol utama Asisten: latar `primaryFill`, teks `onPrimary`.
- Tombol bahaya Asisten: latar `errorFill`, teks `onError`.
- Tombol sekunder: latar `glassSurface`, border `glassBorder`.
- Tombol Praktikan: `isiAksen` + `diAtasAksen`, `isiLembut` + `teksLembut`,
  atau `lencanaBuka` untuk aksen terang.
- Tombol shared: `primaryFill` + `onPrimary`, `dangerFill` + `onDanger`,
  `successFill` + `onSuccess`.
- Jangan menulis `#FFFFFF` untuk label tombol; pakai token `on*`.
- Tombol nonaktif tidak memakai opacity rendah untuk teks; gunakan warna
  `teksSekunder` agar tetap terbaca.

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
`useColorScheme` mengembalikan skema hasil preferensi itu. Ketiga sumber token
membacanya lewat `useTheme`, `usePraktikanTheme`, dan `useAssistantTheme`,
sehingga seluruh halaman ikut berubah tanpa mengubah komponen pemanggil. Mode
`system` mengikuti skema perangkat.

Halaman Profil punya baris **Tema** di bagian TAMPILAN: label "Tema" di kiri
dan `PemilihTema` di kanan, di dalam kartu berbentuk pil (radius 999, tinggi
56). Pil memakai track padding 4, segmen 40 × 40, ikon 18, tanpa border, dan
berjarak 4 px dari tepi kanan, atas, serta bawah kartu; area sentuh diperluas
`hitSlop` 4. Segmen aktif
memakai `isiAksen` dengan ikon `diAtasAksen`; segmen lain memakai
`teksSekunder`. Tidak ada keterangan teks di bawah kontrol; maknanya dijaga
`accessibilityRole="radiogroup"` dengan anak `radio` dan
`accessibilityState.checked`.

### 8.7 Status

- Badge selalu berisi teks dan titik warna.
- Asisten: lime untuk sesi dibuka, netral untuk status lain.
- Shared: `successLight` + `success`, `dangerLight` + `danger`,
  `warningLight` + `warning`, `primaryLight` + `primary`.
- Jangan mengandalkan warna saja; label teks wajib.

### 8.8 ConfirmModal

`ConfirmModal` dipakai untuk konfirmasi keluar akun. Backdrop penuh memakai
`Pressable` transparan; ketukan di luar kartu memanggil `onCancel`, sedangkan
kartu dirender setelah backdrop sehingga ketukan di dalam tidak menutup.
Tombol batal memakai `primaryLight` + `primary` agar sama dengan aksi lembut
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
  `textSecondary`/`teksSekunder` sudah diuji pada titik tergelap gradien.

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
