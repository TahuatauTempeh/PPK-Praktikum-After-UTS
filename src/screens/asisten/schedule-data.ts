/** Tipe dan helper tampilan sesi Asisten. Data berasal dari Firestore. */
export type SessionStatus = 'pending' | 'open' | 'closed';
export type AssistantSession = {
  id: string;
  /** Kode praktikum, mis. C2. */
  code: string;
  course: string;
  topic: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  status: SessionStatus;
  participantIds: readonly string[];
  closedAt?: string;
  closedBy?: string;
};
export type AssistantAttendance = { sessionId: string; participantId: string; recordedAt: string };
export type AssistantParticipant = { id: string; name: string };
export const statusLabels: Record<SessionStatus, string> = {
  pending: 'Belum dibuka', open: 'Dibuka', closed: 'Ditutup',
};

export function countAttendance(session: AssistantSession, attendance: readonly AssistantAttendance[]) {
  const registered = new Set(session.participantIds);
  return new Set(attendance.filter(item =>
    item.sessionId === session.id && registered.has(item.participantId),
  ).map(item => item.participantId)).size;
}
