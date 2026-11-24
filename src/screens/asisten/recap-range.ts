/**
 * Rentang rekap asisten: mulai dari bulan berjalan, lalu melebar sekali bila
 * halaman dibuka lewat tautan sesi yang tanggalnya di luar rentang.
 */

import { monthRange, type DateRange } from './recap-data';

export function initialRecapRange(today: string): DateRange {
  return monthRange(today);
}

export function expandRangeForSession(
  range: DateRange | null,
  sessionDate: string | undefined,
  sessionId: string | undefined,
  seenSessionId: string | undefined,
): { range: DateRange | null; seenSessionId: string | undefined } {
  if (!range || !sessionDate || !sessionId || seenSessionId === sessionId) {
    return { range, seenSessionId };
  }
  if (sessionDate >= range.start && sessionDate <= range.end) {
    return { range, seenSessionId: sessionId };
  }
  return {
    range: {
      start: sessionDate < range.start ? sessionDate : range.start,
      end: sessionDate > range.end ? sessionDate : range.end,
    },
    seenSessionId: sessionId,
  };
}
