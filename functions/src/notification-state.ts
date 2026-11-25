/**
 * Baseline state dan adapter snapshot untuk worker notifikasi di luar Cloud Functions.
 *
 * Firestore `onSnapshot` hanya memberi data dokumen terbaru, bukan data sebelum
 * perubahan. Worker menyimpan baseline dokumen di `notificationState/*`, lalu
 * membandingkannya dengan snapshot terbaru untuk membentuk event before/after
 * yang sama seperti trigger Cloud Functions.
 */

import type { FirestoreUpdateEvent, SnapshotLike } from './notification-handlers';
import { formatSessionDate, isScheduleChanged } from './notification-helpers';

export type NotificationCollection = 'sessions' | 'permissionRequests';

export interface BaselineEntry {
  data: Record<string, unknown>;
  updateTime: string | null;
}

export interface BaselineState {
  docs: Record<string, BaselineEntry>;
}

export type Normalizer = (data: Record<string, unknown>) => Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Menormalkan field sesi yang dipakai untuk mendeteksi sesi dibuka dan
 * perubahan jadwal. Tanggal lama yang masih berupa Timestamp diubah ke
 * `YYYY-MM-DD` agar perbandingan baseline tidak menghasilkan false positive.
 */
export function normalizeSessionData(data: Record<string, unknown>): Record<string, unknown> {
  return {
    status: asString(data.status),
    classId: asString(data.classId),
    title: asString(data.title),
    date: formatSessionDate(data.date),
    startTime: asString(data.startTime),
    endTime: asString(data.endTime),
    room: asString(data.room),
    laboratoryId: asString(data.laboratoryId),
  };
}

/**
 * Menormalkan field permintaan izin yang dipakai untuk mendeteksi keputusan
 * asisten.
 */
export function normalizePermissionData(data: Record<string, unknown>): Record<string, unknown> {
  return {
    status: asString(data.status),
    userId: asString(data.userId),
    sessionId: asString(data.sessionId),
    reviewNote: typeof data.reviewNote === 'string' ? data.reviewNote : null,
  };
}

export function normalizerFor(collection: NotificationCollection): Normalizer {
  return collection === 'sessions' ? normalizeSessionData : normalizePermissionData;
}

/** Mengubah waktu update Firestore menjadi ISO string yang stabil untuk dedupe. */
export function toIsoString(updateTime?: { toDate(): Date }): string | null {
  if (!updateTime) return null;

  try {
    return updateTime.toDate().toISOString();
  } catch {
    return null;
  }
}

export function entryFromSnapshot(
  snapshot: SnapshotLike,
  normalize: Normalizer
): BaselineEntry {
  return {
    data: normalize(snapshot.data() ?? {}),
    updateTime: toIsoString(snapshot.updateTime),
  };
}

/**
 * Membaca baseline dari dokumen `notificationState/*`. Data yang tidak valid
 * diabaikan agar worker bisa melakukan baseline ulang tanpa crash.
 */
export function parseBaseline(value: unknown, normalize: Normalizer): BaselineState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { docs: {} };
  }

  const rawDocs = (value as { docs?: unknown }).docs;
  if (!rawDocs || typeof rawDocs !== 'object' || Array.isArray(rawDocs)) {
    return { docs: {} };
  }

  const docs: Record<string, BaselineEntry> = {};

  for (const [id, rawEntry] of Object.entries(rawDocs as Record<string, unknown>)) {
    if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) continue;

    const entry = rawEntry as { data?: unknown; updateTime?: unknown };
    if (!entry.data || typeof entry.data !== 'object' || Array.isArray(entry.data)) continue;

    docs[id] = {
      data: normalize(entry.data as Record<string, unknown>),
      updateTime: typeof entry.updateTime === 'string' ? entry.updateTime : null,
    };
  }

  return { docs };
}

/** Bentuk yang aman disimpan ke Firestore. */
export function serializeBaseline(state: BaselineState): { docs: Record<string, BaselineEntry> } {
  return { docs: state.docs };
}

export function setBaselineEntry(
  state: BaselineState,
  id: string,
  entry: BaselineEntry
): BaselineState {
  return {
    docs: {
      ...state.docs,
      [id]: entry,
    },
  };
}

export function removeBaselineEntry(state: BaselineState, id: string): BaselineState {
  if (!(id in state.docs)) return state;

  const docs = { ...state.docs };
  delete docs[id];
  return { docs };
}

/**
 * Membentuk event with before/after dari baseline dan snapshot terbaru.
 * `after` memakai data yang sudah dinormalkan agar perbandingan konsisten
 * dengan baseline, sementara `updateTime` tetap berasal dari snapshot asli.
 */
export function buildUpdateEvent<TParams>(
  before: BaselineEntry,
  after: SnapshotLike,
  params: TParams,
  normalize: Normalizer
): FirestoreUpdateEvent<TParams> {
  const afterData = normalize(after.data() ?? {});
  const afterSnapshot: SnapshotLike = {
    data: () => afterData,
    updateTime: after.updateTime,
  };

  return {
    data: {
      before: { data: () => before.data },
      after: afterSnapshot,
    },
    params,
    time: toIsoString(after.updateTime) ?? new Date().toISOString(),
  };
}

/** Apakah perubahan sesi ini layak dinotifikasi. */
export function isSessionChangeNotifiable(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): boolean {
  return (before.status !== 'open' && after.status === 'open') || isScheduleChanged(before, after);
}

/** Apakah perubahan izin ini layak dinotifikasi. */
export function isPermissionChangeNotifiable(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): boolean {
  return (
    (before.status === 'pending' && after.status === 'approved') ||
    (before.status === 'pending' && after.status === 'rejected')
  );
}
