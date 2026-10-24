/** Data pratinjau; diganti data SessionContext saat kontrak Programmer 1 tersedia. */
export type SessionStatus = 'pending' | 'open' | 'closed';
export type AssistantSession = {
  id: string;
  course: string;
  topic: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  status: SessionStatus;
  participantIds: readonly string[];
};
export type AssistantAttendance = { sessionId: string; participantId: string };
export const statusLabels: Record<SessionStatus, string> = {
  pending: 'Belum dibuka', open: 'Dibuka', closed: 'Ditutup',
};

const participants = ['231110001', '231110002', '231110003', '231110004', '231110005', '231110006'];
export const previewDate = '2026-10-19';
export const previewSessions: readonly AssistantSession[] = [
  {
    id: 'web-04', course: 'Pemrograman Web', topic: 'Sesi 04 · Formulir & validasi',
    className: 'IF-3A', date: previewDate, startTime: '08:00', endTime: '09:40',
    room: 'Lab Komputer 2', status: 'open', participantIds: participants,
  },
  {
    id: 'basis-data-05', course: 'Basis Data', topic: 'Sesi 05 · JOIN antartabel',
    className: 'IF-3B', date: previewDate, startTime: '10:00', endTime: '11:40',
    room: 'Lab Komputer 2', status: 'pending', participantIds: participants,
  },
];
export const previewAttendance: readonly AssistantAttendance[] = participants.slice(0, 4).map(
  participantId => ({ sessionId: 'web-04', participantId }),
);

export function countAttendance(session: AssistantSession, attendance: readonly AssistantAttendance[]) {
  const registered = new Set(session.participantIds);
  return new Set(attendance.filter(item =>
    item.sessionId === session.id && registered.has(item.participantId),
  ).map(item => item.participantId)).size;
}
