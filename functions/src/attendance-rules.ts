/**
 * Aturan presensi berbasis lokasi sebagai fungsi murni (PRD Sprint 3 bagian 7.1, 7.2, 11.2).
 *
 * File ini sengaja tanpa import supaya dapat disalin apa adanya ke `functions/src/`
 * untuk callable `submitAttendance`, dengan test yang sama. Jarak dihitung pemanggil
 * (Haversine di `geo.ts`), jadi aturan di sini hanya membandingkan angka.
 *
 * - `validasiPresensi`: lapis pencatatan (callable, atau fallback klien bila tanpa Blaze).
 * - `kelayakanPresensi`: lapis tampilan, menentukan tombol dan alasan di halaman presensi.
 */

/** Sama dengan MAX_ACCURACY_METERS di `geo.ts` (PRD BR-06) */
export const BATAS_AKURASI_METER = 100;
/** Rentang radius lab yang sah (PRD BR-08) */
export const RADIUS_MIN_METER = 10;
export const RADIUS_MAKS_METER = 500;

export type StatusSesiPresensi = 'scheduled' | 'open' | 'closed';

export interface SesiPresensi {
  status: StatusSesiPresensi;
}

export interface LabPresensi {
  isActive: boolean;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface PosisiPresensi {
  accuracyMeters: number;
  mocked: boolean;
}

function angka(nilai: unknown): nilai is number {
  return typeof nilai === 'number' && Number.isFinite(nilai);
}

/** Koordinat dan radius lab bisa dipakai sebagai acuan presensi */
export function labTerpasang(lab: LabPresensi): boolean {
  return (
    angka(lab.latitude) &&
    angka(lab.longitude) &&
    lab.latitude >= -90 &&
    lab.latitude <= 90 &&
    lab.longitude >= -180 &&
    lab.longitude <= 180 &&
    angka(lab.radiusMeters) &&
    lab.radiusMeters >= RADIUS_MIN_METER &&
    lab.radiusMeters <= RADIUS_MAKS_METER
  );
}

export function akurasiCukup(accuracyMeters: number): boolean {
  return angka(accuracyMeters) && accuracyMeters >= 0 && accuracyMeters <= BATAS_AKURASI_METER;
}

export function dalamRadius(distanceMeters: number, radiusMeters: number): boolean {
  return angka(distanceMeters) && distanceMeters >= 0 && distanceMeters <= radiusMeters;
}

// ─── Lapis pencatatan ─────────────────────────────────────────────────────────

export type KodeTolakPresensi =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_OPEN'
  | 'NOT_ENROLLED'
  | 'LAB_NOT_SET'
  | 'LAB_INACTIVE'
  | 'ALREADY_PRESENT'
  | 'MOCK_LOCATION'
  | 'LOCATION_INACCURATE'
  | 'OUT_OF_RADIUS';

export interface InputValidasi {
  /** null bila dokumen sesi tidak ada */
  sesi: SesiPresensi | null;
  terdaftar: boolean;
  /** null bila sesi tanpa `laboratoryId` atau dokumen lab tidak ada */
  lab: LabPresensi | null;
  sudahPresensi: boolean;
  posisi: PosisiPresensi;
  /** Jarak Haversine posisi ke lab; diabaikan bila lab null */
  distanceMeters: number;
}

export type HasilValidasi =
  | { ok: true; distanceMeters: number; radiusMeters: number }
  | { ok: false; code: KodeTolakPresensi; distanceMeters?: number; radiusMeters?: number };

/** Urutan pemeriksaan mengikuti PRD 7.2; kegagalan pertama yang dikembalikan */
export function validasiPresensi(input: InputValidasi): HasilValidasi {
  const { sesi, lab, posisi, distanceMeters } = input;

  if (!sesi) return { ok: false, code: 'SESSION_NOT_FOUND' };
  if (sesi.status !== 'open') return { ok: false, code: 'SESSION_NOT_OPEN' };
  if (!input.terdaftar) return { ok: false, code: 'NOT_ENROLLED' };
  if (!lab || !labTerpasang(lab)) return { ok: false, code: 'LAB_NOT_SET' };
  if (!lab.isActive) return { ok: false, code: 'LAB_INACTIVE' };
  if (input.sudahPresensi) return { ok: false, code: 'ALREADY_PRESENT' };
  if (posisi.mocked) return { ok: false, code: 'MOCK_LOCATION' };
  if (!akurasiCukup(posisi.accuracyMeters)) return { ok: false, code: 'LOCATION_INACCURATE' };
  if (!dalamRadius(distanceMeters, lab.radiusMeters)) {
    return {
      ok: false,
      code: 'OUT_OF_RADIUS',
      distanceMeters: angka(distanceMeters) ? distanceMeters : undefined,
      radiusMeters: lab.radiusMeters,
    };
  }
  return { ok: true, distanceMeters, radiusMeters: lab.radiusMeters };
}

// ─── Lapis tampilan ───────────────────────────────────────────────────────────

/** Tahap pemeriksaan lokasi perangkat, diisi hook dari `device-location.ts` */
export type KondisiLokasi =
  | { tahap: 'memeriksa-izin' }
  | { tahap: 'izin'; izin: 'undetermined' | 'denied' | 'blocked' }
  | { tahap: 'layanan-mati' }
  | { tahap: 'mencari' }
  | { tahap: 'tidak-tersedia' }
  | { tahap: 'siap'; posisi: PosisiPresensi; distanceMeters: number };

export type StateKelayakan =
  | 'loading'
  | 'session-not-found'
  | 'already-present'
  | 'session-scheduled'
  | 'session-closed'
  | 'not-enrolled'
  | 'lab-missing'
  | 'lab-inactive'
  | 'checking-permission'
  | 'permission-needed'
  | 'permission-denied'
  | 'permission-blocked'
  | 'services-disabled'
  | 'locating'
  | 'location-unavailable'
  | 'mock-location'
  | 'low-accuracy'
  | 'out-of-radius'
  | 'eligible';

/** Aksi pemulihan yang ditampilkan di kartu lokasi (PRD 7.7) */
export type AksiLokasi = 'izinkan' | 'izinkan-lagi' | 'buka-pengaturan' | 'buka-pengaturan-lokasi' | 'periksa-lagi';

export interface InputKelayakan {
  /** undefined: masih dimuat; null: sesi tidak ditemukan */
  sesi: SesiPresensi | null | undefined;
  /** undefined: status enrollment masih dimuat */
  terdaftar: boolean | undefined;
  /** undefined: masih dimuat; null: lab belum diatur atau tidak ada */
  lab: LabPresensi | null | undefined;
  /** Jam presensi lama sudah diformat "HH.mm", atau null bila belum presensi */
  jamPresensi: string | null;
  lokasi: KondisiLokasi;
}

export interface Kelayakan {
  state: StateKelayakan;
  tombolAktif: boolean;
  /** Teks di bawah tombol; status selalu berupa teks (NFR-A11Y-01) */
  alasan: string;
  aksi: AksiLokasi | null;
}

function tolak(state: StateKelayakan, alasan: string, aksi: AksiLokasi | null = null): Kelayakan {
  return { state, tombolAktif: false, alasan, aksi };
}

function meter(nilai: number): string {
  return `${Math.round(nilai)} m`;
}

/**
 * Status data sesi lebih dulu, lalu lokasi perangkat. Presensi yang sudah tercatat
 * selalu menang supaya praktikan melihat jam presensinya, apa pun status sesi.
 */
export function kelayakanPresensi(input: InputKelayakan): Kelayakan {
  const { sesi, lab, lokasi } = input;

  if (input.jamPresensi) return tolak('already-present', `Sudah presensi pukul ${input.jamPresensi} WIB`);
  if (sesi === undefined) return tolak('loading', 'Memuat data sesi');
  if (sesi === null) return tolak('session-not-found', 'Sesi tidak ditemukan');
  if (sesi.status === 'scheduled') return tolak('session-scheduled', 'Sesi belum dibuka');
  if (sesi.status === 'closed') return tolak('session-closed', 'Sesi sudah ditutup');
  if (input.terdaftar === undefined || lab === undefined) return tolak('loading', 'Memuat data sesi');
  if (!input.terdaftar) return tolak('not-enrolled', 'Kamu tidak terdaftar di sesi ini');
  if (lab === null || !labTerpasang(lab)) return tolak('lab-missing', 'Laboratorium sesi belum diatur');
  if (!lab.isActive) return tolak('lab-inactive', 'Laboratorium sedang tidak aktif');

  switch (lokasi.tahap) {
    case 'memeriksa-izin':
      return tolak('checking-permission', 'Memeriksa izin lokasi');
    case 'izin':
      if (lokasi.izin === 'undetermined') {
        return tolak('permission-needed', 'Izin lokasi diperlukan untuk presensi', 'izinkan');
      }
      if (lokasi.izin === 'denied') {
        return tolak('permission-denied', 'Izin lokasi diperlukan untuk presensi', 'izinkan-lagi');
      }
      return tolak('permission-blocked', 'Izin lokasi diblokir', 'buka-pengaturan');
    case 'layanan-mati':
      return tolak('services-disabled', 'Aktifkan layanan lokasi', 'buka-pengaturan-lokasi');
    case 'mencari':
      return tolak('locating', 'Mencari lokasi kamu');
    case 'tidak-tersedia':
      return tolak('location-unavailable', 'Lokasi belum tersedia, coba lagi', 'periksa-lagi');
    case 'siap':
      break;
  }

  if (lokasi.posisi.mocked) return tolak('mock-location', 'Lokasi palsu terdeteksi', 'periksa-lagi');
  if (!akurasiCukup(lokasi.posisi.accuracyMeters)) {
    return tolak('low-accuracy', 'Akurasi lokasi terlalu rendah', 'periksa-lagi');
  }
  if (!dalamRadius(lokasi.distanceMeters, lab.radiusMeters)) {
    const alasan = angka(lokasi.distanceMeters)
      ? `Kamu berada ${meter(lokasi.distanceMeters)} dari lab, radius ${meter(lab.radiusMeters)}`
      : 'Kamu berada di luar radius lab';
    return tolak('out-of-radius', alasan, 'periksa-lagi');
  }
  return { state: 'eligible', tombolAktif: true, alasan: 'Presensi sekarang', aksi: 'periksa-lagi' };
}
