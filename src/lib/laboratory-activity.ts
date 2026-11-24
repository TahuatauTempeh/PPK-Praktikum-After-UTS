/**
 * laboratory-activity.ts: fungsi murni untuk menentukan praktikum
 * "Sekarang" dan "Berikutnya" pada setiap laboratorium dalam zona waktu WIB.
 * Dipakai oleh layar Peta (Dev 3).
 */

import { isValidTimeString, toDateInputValue } from '@/lib/praktikum-helpers';
import type { SessionStatus, TimestampValue } from '@/types';

const OFFSET_WIB_MS = 7 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ActivitySession {
  id: string;
  classId: string;
  title: string;
  date: TimestampValue;
  startTime: string;
  endTime: string;
  room: string;
  status: SessionStatus;
  laboratoryId?: string;
}

export interface LaboratoryActivity<T extends ActivitySession = ActivitySession> {
  current: T | null;
  next: T | null;
}

export interface WibNow {
  today: string;
  nowTime: string;
  nowMs: number;
}

const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Belum dibuka',
  open: 'Dibuka',
  closed: 'Ditutup',
};

const IN_WINDOW_STATUS_PRIORITY: Record<SessionStatus, number> = {
  open: 0,
  scheduled: 1,
  closed: 2,
};

/** Label teks bahasa Indonesia untuk status sesi pada panel aktivitas lab. */
export function getSessionStatusLabel(status: SessionStatus): string {
  return SESSION_STATUS_LABELS[status];
}

/** Tanggal (YYYY-MM-DD) dan jam (HH:mm) saat ini dalam zona waktu WIB (Asia/Jakarta). */
export function getWibDateAndTime(now: Date = new Date()): WibNow {
  const nowMs = now.getTime();
  const wib = new Date(nowMs + OFFSET_WIB_MS);
  const today = wib.toISOString().slice(0, 10);
  const hours = String(wib.getUTCHours()).padStart(2, '0');
  const minutes = String(wib.getUTCMinutes()).padStart(2, '0');
  return { today, nowTime: `${hours}:${minutes}`, nowMs };
}

/** Menormalkan tanggal sesi ke YYYY-MM-DD (WIB). */
export function normalizeSessionDate(date: TimestampValue): string {
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (DATE_ONLY_PATTERN.test(trimmed)) return trimmed;
  }
  return toDateInputValue(date);
}

function parseWibMillis(dateStr: string, timeStr: string): number {
  if (!DATE_ONLY_PATTERN.test(dateStr) || !isValidTimeString(timeStr)) {
    return Number.NaN;
  }
  return Date.parse(`${dateStr}T${timeStr.trim()}:00+07:00`);
}

function distanceToWindowMs(
  dateStr: string,
  startTime: string,
  endTime: string,
  nowMs: number
): number {
  const startMs = parseWibMillis(dateStr, startTime);
  const endMs = parseWibMillis(dateStr, endTime);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return Number.POSITIVE_INFINITY;
  }
  if (nowMs < startMs) return startMs - nowMs;
  if (nowMs >= endMs) return nowMs - endMs;
  return 0;
}

interface NormalizedEntry<T extends ActivitySession> {
  session: T;
  dateStr: string;
}

function compareDesc(a: string, b: string): number {
  return b.localeCompare(a);
}

function compareAsc(a: string, b: string): number {
  return a.localeCompare(b);
}

function pickCurrentSession<T extends ActivitySession>(
  entries: readonly NormalizedEntry<T>[],
  wib: WibNow
): T | null {
  const openEntries = entries.filter((entry) => entry.session.status === 'open');
  if (openEntries.length > 0) {
    const sorted = [...openEntries].sort((a, b) => {
      const distA = distanceToWindowMs(
        a.dateStr,
        a.session.startTime,
        a.session.endTime,
        wib.nowMs
      );
      const distB = distanceToWindowMs(
        b.dateStr,
        b.session.startTime,
        b.session.endTime,
        wib.nowMs
      );
      if (distA !== distB) return distA - distB;
      const dateDiff = compareDesc(a.dateStr, b.dateStr);
      if (dateDiff !== 0) return dateDiff;
      const startDiff = compareDesc(a.session.startTime, b.session.startTime);
      if (startDiff !== 0) return startDiff;
      return compareAsc(a.session.id, b.session.id);
    });
    return sorted[0].session;
  }

  const inWindowEntries = entries.filter(
    (entry) =>
      entry.dateStr === wib.today &&
      entry.session.startTime <= wib.nowTime &&
      wib.nowTime < entry.session.endTime
  );
  if (inWindowEntries.length === 0) return null;

  const sorted = [...inWindowEntries].sort((a, b) => {
    const priorityDiff =
      IN_WINDOW_STATUS_PRIORITY[a.session.status] -
      IN_WINDOW_STATUS_PRIORITY[b.session.status];
    if (priorityDiff !== 0) return priorityDiff;
    const startDiff = compareDesc(a.session.startTime, b.session.startTime);
    if (startDiff !== 0) return startDiff;
    return compareAsc(a.session.id, b.session.id);
  });
  return sorted[0].session;
}

function pickNextSession<T extends ActivitySession>(
  entries: readonly NormalizedEntry<T>[],
  wib: WibNow,
  currentId: string | null
): T | null {
  const upcoming = entries.filter((entry) => {
    if (entry.session.status === 'closed') return false;
    if (currentId !== null && entry.session.id === currentId) return false;
    return (
      entry.dateStr > wib.today ||
      (entry.dateStr === wib.today && entry.session.startTime > wib.nowTime)
    );
  });
  if (upcoming.length === 0) return null;

  const sorted = [...upcoming].sort((a, b) => {
    const dateDiff = compareAsc(a.dateStr, b.dateStr);
    if (dateDiff !== 0) return dateDiff;
    const startDiff = compareAsc(a.session.startTime, b.session.startTime);
    if (startDiff !== 0) return startDiff;
    const endDiff = compareAsc(a.session.endTime, b.session.endTime);
    if (endDiff !== 0) return endDiff;
    return compareAsc(a.session.id, b.session.id);
  });
  return sorted[0].session;
}

/**
 * Memilih sesi "Sekarang" dan "Berikutnya" untuk satu laboratorium.
 * - Sekarang: prioritaskan sesi berstatus `open` paling dekat waktunya; bila tidak ada,
 *   sesi hari ini yang sedang berada di rentang [startTime, endTime).
 * - Berikutnya: sesi paling awal setelah waktu sekarang dengan status selain `closed`,
 *   tidak menduplikasi sesi `current`.
 */
export function selectLaboratoryActivity<T extends ActivitySession>(
  laboratoryId: string,
  sessions: readonly T[],
  now: Date = new Date()
): LaboratoryActivity<T> {
  if (!laboratoryId) return { current: null, next: null };

  const entries: NormalizedEntry<T>[] = [];
  for (const session of sessions) {
    if (session.laboratoryId !== laboratoryId) continue;
    const dateStr = normalizeSessionDate(session.date);
    if (!dateStr) continue;
    entries.push({ session, dateStr });
  }

  if (entries.length === 0) return { current: null, next: null };

  const wib = getWibDateAndTime(now);
  const current = pickCurrentSession(entries, wib);
  const next = pickNextSession(entries, wib, current?.id ?? null);

  return { current, next };
}
