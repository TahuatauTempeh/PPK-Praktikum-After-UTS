/**
 * selectors.ts: fungsi murni untuk menyaring laboratorium aktif, menggabungkan
 * nama kelas, memformat ringkasan praktikum Sekarang/Berikutnya, dan
 * menentukan wilayah awal peta. Dipakai oleh PetaScreen (Dev 3).
 */

import { formatDistanceMeters, isValidLatitude, isValidLongitude } from '@/lib/geo';
import {
  getSessionStatusLabel,
  getWibDateAndTime,
  normalizeSessionDate,
  selectLaboratoryActivity,
  type ActivitySession,
} from '@/lib/laboratory-activity';
import { formatRentangWIB, formatTanggalPendek } from '@/screens/praktikan/format';
import type { Laboratory, PracticumClass, SessionStatus } from '@/types';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_DELTA = 0.006;

/** Wilayah default pusat kampus saat belum ada laboratorium aktif. */
export const DEFAULT_CAMPUS_REGION = {
  latitude: -7.0519,
  longitude: 110.4383,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
} as const;

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapSessionSummary {
  id: string;
  title: string;
  className: string;
  date: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  timeRangeWib: string;
  room: string;
  status: SessionStatus;
  statusLabel: string;
}

export interface LaboratoryMapItem {
  lab: Laboratory;
  locationLabel: string;
  radiusLabel: string;
  current: MapSessionSummary | null;
  next: MapSessionSummary | null;
  hasAnyActivity: boolean;
}

/** Menyaring laboratorium yang masih aktif untuk ditampilkan di peta dan daftar. */
export function filterActiveLaboratories(labs: readonly Laboratory[]): Laboratory[] {
  return labs.filter((lab) => lab.isActive);
}

/** Membuat lookup map `classId -> PracticumClass`. */
export function buildClassMap(
  classes: readonly PracticumClass[]
): Map<string, PracticumClass> {
  const map = new Map<string, PracticumClass>();
  for (const item of classes) {
    map.set(item.id, item);
  }
  return map;
}

/** Menggabungkan gedung, lantai (bila ada), dan ruang laboratorium menjadi label ringkas. */
export function formatLabLocationLabel(lab: Pick<Laboratory, 'building' | 'floor' | 'room'>): string {
  const parts = [lab.building.trim(), lab.floor.trim(), lab.room.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '-';
}

function formatDateLabel(dateStr: string, todayWib: string): string {
  if (!DATE_ONLY_PATTERN.test(dateStr)) return '-';
  if (dateStr === todayWib) return 'Hari ini';
  const month = Number(dateStr.slice(5, 7));
  if (month < 1 || month > 12) return dateStr;
  return formatTanggalPendek(dateStr);
}

/** Memformat satu sesi menjadi ringkasan siap tampil pada panel aktivitas lab. */
export function formatSessionSummary(
  session: ActivitySession,
  classMap: ReadonlyMap<string, PracticumClass>,
  todayWib: string = getWibDateAndTime().today
): MapSessionSummary {
  const date = normalizeSessionDate(session.date);
  const className = classMap.get(session.classId)?.name.trim() || 'Praktikum';
  const timeRangeWib =
    session.startTime && session.endTime
      ? formatRentangWIB(`${session.startTime} - ${session.endTime}`)
      : '-';

  return {
    id: session.id,
    title: session.title,
    className,
    date,
    dateLabel: formatDateLabel(date, todayWib),
    startTime: session.startTime,
    endTime: session.endTime,
    timeRangeWib,
    room: session.room,
    status: session.status,
    statusLabel: getSessionStatusLabel(session.status),
  };
}

/** Menggabungkan laboratorium aktif, sesi, dan kelas menjadi data siap tampil di peta. */
export function buildLaboratoryMapItems(
  labs: readonly Laboratory[],
  sessions: readonly ActivitySession[],
  classes: readonly PracticumClass[],
  now: Date = new Date()
): LaboratoryMapItem[] {
  const activeLabs = filterActiveLaboratories(labs);
  const classMap = buildClassMap(classes);
  const { today } = getWibDateAndTime(now);

  return activeLabs.map((lab) => {
    const activity = selectLaboratoryActivity(lab.id, sessions, now);
    const current = activity.current
      ? formatSessionSummary(activity.current, classMap, today)
      : null;
    const next = activity.next
      ? formatSessionSummary(activity.next, classMap, today)
      : null;

    return {
      lab,
      locationLabel: formatLabLocationLabel(lab),
      radiusLabel: formatDistanceMeters(lab.radiusMeters),
      current,
      next,
      hasAnyActivity: current !== null || next !== null,
    };
  });
}

/** Mengambil item laboratorium terpilih berdasarkan ID. */
export function findSelectedLabItem(
  items: readonly LaboratoryMapItem[],
  selectedLabId: string | null
): LaboratoryMapItem | null {
  if (!selectedLabId) return null;
  return items.find((item) => item.lab.id === selectedLabId) ?? null;
}

/** Menentukan region awal peta: laboratorium aktif pertama, atau pusat kampus bila kosong. */
export function getInitialMapRegion(labs: readonly Laboratory[]): MapRegion {
  const firstValid = labs.find(
    (lab) =>
      lab.isActive &&
      isValidLatitude(lab.latitude) &&
      isValidLongitude(lab.longitude)
  );
  if (!firstValid) {
    return { ...DEFAULT_CAMPUS_REGION };
  }
  return {
    latitude: firstValid.latitude,
    longitude: firstValid.longitude,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  };
}
