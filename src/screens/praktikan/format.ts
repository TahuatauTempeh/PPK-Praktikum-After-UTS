/**
 * Format tanggal dan waktu Bahasa Indonesia untuk sisi praktikan.
 * Waktu dihitung manual dari UTC+7 supaya tidak bergantung dukungan Intl di Hermes.
 */

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const OFFSET_WIB_MS = 7 * 60 * 60 * 1000;

/** "2026-10-27" menjadi "Selasa, 27 Oktober 2026" */
export function formatTanggal(date: string): string {
  const [tahun, bulan, hari] = date.split('-').map(Number);
  const namaHari = HARI[new Date(Date.UTC(tahun, bulan - 1, hari)).getUTCDay()];
  return `${namaHari}, ${hari} ${BULAN[bulan - 1]} ${tahun}`;
}

/** ISO datetime menjadi "HH.mm" dalam WIB */
export function formatJamWIB(iso: string): string {
  const wib = new Date(new Date(iso).getTime() + OFFSET_WIB_MS);
  const jam = String(wib.getUTCHours()).padStart(2, '0');
  const menit = String(wib.getUTCMinutes()).padStart(2, '0');
  return `${jam}.${menit}`;
}

/** "2026-10-27" menjadi "27 Okt 2026" */
export function formatTanggalPendek(date: string): string {
  const [tahun, bulan, hari] = date.split('-').map(Number);
  return `${hari} ${BULAN[bulan - 1].slice(0, 3)} ${tahun}`;
}

/** "08:00 - 10:00" menjadi "08.00–10.00 WIB" */
export function formatRentangWIB(time: string): string {
  return `${time.replace(/:/g, '.').replace(' - ', '–')} WIB`;
}

/** Sapaan menurut jam WIB: pagi 04.00-10.59, siang 11.00-14.59, sore 15.00-17.59, selebihnya malam */
export function sapaanWIB(now: Date = new Date()): string {
  const jam = new Date(now.getTime() + OFFSET_WIB_MS).getUTCHours();
  if (jam >= 4 && jam < 11) return 'Selamat pagi';
  if (jam >= 11 && jam < 15) return 'Selamat siang';
  if (jam >= 15 && jam < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/** Tanggal hari ini dalam WIB, format YYYY-MM-DD */
export function tanggalHariIniWIB(now: Date = new Date()): string {
  return new Date(now.getTime() + OFFSET_WIB_MS).toISOString().slice(0, 10);
}
