/**
 * Hook halaman presensi berbasis lokasi (PRD Sprint 3 bagian 7, SRS 7.2, FR-ATT-03..08, FR-DEV-10).
 * Menggabungkan listener sesi, presensi saya, dan laboratorium, status enrollment, serta lokasi
 * perangkat, lalu menghitung kelayakan dengan aturan yang sama dengan callable.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import { kelayakanPresensi, labTerpasang, type AksiLokasi, type KondisiLokasi } from '@/lib/attendance-rules';
import { listenMyAttendance, submitAttendanceWithLocation, type AttendanceDoc } from '@/lib/attendance-service';
import { getClassById } from '@/lib/class-service';
import {
  getForegroundPermission,
  getFreshPosition,
  requestForegroundPermission,
  type DeviceLocationFailureCode,
  type DevicePosition,
} from '@/lib/device-location';
import { getEnrollmentsByUser } from '@/lib/enrollment-service';
import { haversineMeters } from '@/lib/geo';
import { listenLaboratories } from '@/lib/laboratory-service';
import { listenSession, type FirestoreSession } from '@/lib/session-actions';
import { formatJamWIB } from '@/screens/praktikan/format';
import type { CatatanPresensi, PresensiViewModel, StatusKirim } from '@/screens/praktikan/presensi-model';
import type { Laboratory, UserProfile } from '@/types';

/** Seperti KondisiLokasi, tetapi posisi disimpan mentah; jarak dihitung saat lab tersedia */
type TahapLokasi = Exclude<KondisiLokasi, { tahap: 'siap' }> | { tahap: 'ada'; posisi: DevicePosition };

const KODE_PERLU_PERIKSA_ULANG = ['OUT_OF_RADIUS', 'LOCATION_INACCURATE', 'MOCK_LOCATION'];

function dariGagalLokasi(code: DeviceLocationFailureCode): TahapLokasi {
  switch (code) {
    case 'PERMISSION_DENIED':
      return { tahap: 'izin', izin: 'denied' };
    case 'PERMISSION_BLOCKED':
      return { tahap: 'izin', izin: 'blocked' };
    case 'SERVICES_DISABLED':
      return { tahap: 'layanan-mati' };
    case 'TIMEOUT':
    case 'UNAVAILABLE':
      return { tahap: 'tidak-tersedia' };
  }
}

function keIso(nilai: unknown): string | null {
  if (typeof nilai === 'string') return nilai;
  if (nilai && typeof (nilai as { toDate?: unknown }).toDate === 'function') {
    return (nilai as { toDate(): Date }).toDate().toISOString();
  }
  return null;
}

function keCatatan(doc: AttendanceDoc | null): CatatanPresensi | null {
  if (!doc) return null;
  const iso = keIso(doc.recordedAt);
  const adaBukti = typeof doc.distanceMeters === 'number';
  return {
    // recordedAt kosong hanya sesaat pada tulisan serverTimestamp lama yang belum tersinkron
    jam: iso ? formatJamWIB(iso) : '--.--',
    adaBuktiLokasi: adaBukti,
    distanceMeters: adaBukti ? (doc.distanceMeters as number) : null,
  };
}

/**
 * Membaca izin lalu posisi. `terapkan` dipanggil setelah tiap langkah async, termasuk
 * "mencari" selama menunggu GPS (sampai 15 detik). Izin tidak diminta di sini (FR-LOC-01).
 */
async function bacaLokasi(terapkan: (tahap: TahapLokasi) => void): Promise<void> {
  const izin = await getForegroundPermission();
  if (izin === 'undetermined') {
    terapkan({ tahap: 'izin', izin: 'undetermined' });
    return;
  }
  terapkan({ tahap: 'mencari' });
  const hasil = await getFreshPosition();
  terapkan(hasil.ok ? { tahap: 'ada', posisi: hasil.position } : dariGagalLokasi(hasil.code));
}

async function bukaPengaturanLokasi(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      return;
    } catch {
      // Perangkat tanpa layar pengaturan lokasi: jatuh ke pengaturan aplikasi.
    }
  }
  await Linking.openSettings();
}

export interface PresensiHook {
  model: PresensiViewModel;
  onAksiLokasi: (aksi: AksiLokasi) => void;
  onKirim: () => void;
  onMuatUlang: () => void;
}

export function usePresensi(sessionId: string, profile: UserProfile | null): PresensiHook {
  const uid = profile?.id ?? null;
  const [muatKe, setMuatKe] = useState(0);
  const [sesi, setSesi] = useState<FirestoreSession | null | undefined>(undefined);
  const [catatanDoc, setCatatanDoc] = useState<AttendanceDoc | null>(null);
  const [labs, setLabs] = useState<Laboratory[] | undefined>(undefined);
  const [kelasSaya, setKelasSaya] = useState<Set<string> | undefined>(undefined);
  const [namaKelas, setNamaKelas] = useState<{ classId: string; nama: string } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [lokasi, setLokasi] = useState<TahapLokasi>({ tahap: 'memeriksa-izin' });
  const [kirim, setKirim] = useState<StatusKirim>({ tahap: 'diam' });
  const [picu, setPicu] = useState(0);

  // Setiap pemeriksaan lokasi mendapat nomor; hasil dari pemeriksaan lama diabaikan.
  const putaran = useRef(0);
  const sedangKirim = useRef(false);

  // ── Data realtime ──────────────────────────────────────────────────────────
  useEffect(() => listenSession(sessionId, setSesi), [sessionId, muatKe]);

  useEffect(() => {
    if (!uid) return;
    return listenMyAttendance(sessionId, uid, setCatatanDoc, setGalat);
  }, [sessionId, uid, muatKe]);

  useEffect(() => listenLaboratories(setLabs, setGalat), [muatKe]);

  useEffect(() => {
    if (!uid) return;
    let aktif = true;
    getEnrollmentsByUser(uid)
      .then((daftar) => {
        if (aktif) setKelasSaya(new Set(daftar.map((item) => item.classId)));
      })
      .catch((error: unknown) => {
        if (aktif) setGalat(error instanceof Error ? error.message : 'Data peserta belum bisa dimuat.');
      });
    return () => {
      aktif = false;
    };
  }, [uid, muatKe]);

  const classId = sesi?.classId ?? '';
  useEffect(() => {
    if (!classId) return;
    let aktif = true;
    getClassById(classId)
      .then((kelas) => {
        if (aktif && kelas) setNamaKelas({ classId, nama: kelas.name });
      })
      // Nama kelas hanya pelengkap; kegagalannya tidak menghalangi presensi.
      .catch(() => undefined);
    return () => {
      aktif = false;
    };
  }, [classId]);

  // ── Lokasi perangkat ───────────────────────────────────────────────────────
  const periksaLokasi = useCallback(() => {
    const ke = ++putaran.current;
    void bacaLokasi((tahap) => {
      if (ke === putaran.current) setLokasi(tahap);
    });
  }, []);

  useEffect(
    () => () => {
      putaran.current += 1;
    },
    []
  );

  const laboratoryId = sesi?.laboratoryId ?? '';
  const lab: Laboratory | null | undefined =
    sesi === undefined
      ? undefined
      : !laboratoryId
        ? null
        : labs === undefined
          ? undefined
          : (labs.find((item) => item.id === laboratoryId) ?? null);
  const terdaftar = sesi && kelasSaya ? kelasSaya.has(sesi.classId) : undefined;

  // Lokasi hanya dibaca bila hasilnya bisa dipakai untuk presensi (NFR-PRIV-03).
  const sudahTercatat = catatanDoc !== null || kirim.tahap === 'berhasil';
  const perluLokasi =
    sesi?.status === 'open' && !sudahTercatat && terdaftar === true && !!lab && lab.isActive && labTerpasang(lab);

  // Pemicu pemeriksaan: layar fokus dan aplikasi kembali dari background (mis. dari Pengaturan).
  // Callback fokus hanya menaikkan pemicu supaya tidak menangkap `periksaLokasi`.
  useFocusEffect(
    useCallback(() => {
      setPicu((n) => n + 1);
      const langganan = AppState.addEventListener('change', (state) => {
        if (state === 'active') setPicu((n) => n + 1);
      });
      return () => langganan.remove();
    }, [])
  );

  useEffect(() => {
    if (perluLokasi) void periksaLokasi();
  }, [picu, perluLokasi, periksaLokasi]);

  const onAksiLokasi = useCallback(
    (aksi: AksiLokasi) => {
      switch (aksi) {
        case 'izinkan':
        case 'izinkan-lagi':
          void requestForegroundPermission().then((hasil) => {
            if (hasil === 'granted') void periksaLokasi();
            else setLokasi({ tahap: 'izin', izin: hasil });
          });
          return;
        case 'buka-pengaturan':
          void Linking.openSettings();
          return;
        case 'buka-pengaturan-lokasi':
          void bukaPengaturanLokasi();
          return;
        case 'periksa-lagi':
          setLokasi({ tahap: 'mencari' });
          void periksaLokasi();
      }
    },
    [periksaLokasi]
  );

  // ── Turunan untuk tampilan ─────────────────────────────────────────────────
  const posisi = lokasi.tahap === 'ada' ? lokasi.posisi : null;
  const jarak = posisi && lab && labTerpasang(lab) ? haversineMeters(posisi, lab) : null;
  const kondisi: KondisiLokasi =
    lokasi.tahap === 'ada'
      ? { tahap: 'siap', posisi: { accuracyMeters: lokasi.posisi.accuracyMeters, mocked: lokasi.posisi.mocked }, distanceMeters: jarak ?? Number.NaN }
      : lokasi;

  const catatan = keCatatan(catatanDoc);

  const kelayakan = kelayakanPresensi({
    sesi: sesi ? { status: sesi.status } : sesi,
    terdaftar,
    lab,
    jamPresensi: catatan?.jam ?? null,
    lokasi: kondisi,
  });

  const namaLab = lab?.name ?? null;
  const onKirim = useCallback(() => {
    if (!posisi || !kelayakan.tombolAktif || sedangKirim.current) return;
    sedangKirim.current = true;
    setKirim({ tahap: 'mengirim' });
    void submitAttendanceWithLocation(sessionId, posisi, namaLab ?? undefined)
      .then((hasil) => {
        if (hasil.ok) {
          setKirim({
            tahap: 'berhasil',
            jam: formatJamWIB(hasil.recordedAt),
            distanceMeters: hasil.distanceMeters,
            radiusMeters: hasil.radiusMeters,
          });
          return;
        }
        setKirim({ tahap: 'gagal', pesan: hasil.message });
        if (KODE_PERLU_PERIKSA_ULANG.includes(hasil.code)) void periksaLokasi();
      })
      .finally(() => {
        sedangKirim.current = false;
      });
  }, [posisi, kelayakan.tombolAktif, sessionId, namaLab, periksaLokasi]);

  const onMuatUlang = useCallback(() => {
    setGalat(null);
    setMuatKe((n) => n + 1);
  }, []);

  const model: PresensiViewModel = {
    sesi: sesi
      ? {
          id: sesi.id,
          judul: sesi.title,
          kelas: namaKelas?.classId === sesi.classId ? namaKelas.nama : null,
          tanggal: sesi.date,
          waktu: `${sesi.startTime} - ${sesi.endTime}`,
          ruang: sesi.room,
          laboratorium: namaLab,
          asisten: null,
          status: sesi.status,
        }
      : sesi,
    galatMuat: galat,
    kelayakan,
    ukuran: {
      distanceMeters: jarak,
      radiusMeters: lab ? lab.radiusMeters : null,
      accuracyMeters: posisi && Number.isFinite(posisi.accuracyMeters) ? posisi.accuracyMeters : null,
    },
    catatan,
    kirim,
  };

  return { model, onAksiLokasi, onKirim, onMuatUlang };
}
