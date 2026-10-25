/** Data pratinjau; diganti data SessionContext saat kontrak Programmer 1 tersedia. */
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

const participants = ['231110001', '231110002', '231110003', '231110004', '231110005', '231110006'];
export const previewDate = '2026-10-19';
const historicalSessions: readonly AssistantSession[] = [
  { id: 'web-03', code: 'C2', course: 'Pemrograman Web', topic: 'Sesi 03 | DOM & interaksi',
    className: 'IF-3A', date: '2026-10-12', startTime: '08:00', endTime: '09:40',
    room: 'Lab Komputer 2', status: 'closed', participantIds: participants,
    closedAt: '2026-10-12T09:40:00+07:00', closedBy: 'Nadia' },
  { id: 'web-02', code: 'C2', course: 'Pemrograman Web', topic: 'Sesi 02 | Dasar JavaScript',
    className: 'IF-3A', date: '2026-10-05', startTime: '08:00', endTime: '09:40',
    room: 'Lab Komputer 2', status: 'closed', participantIds: participants,
    closedAt: '2026-10-05T09:40:00+07:00', closedBy: 'Nadia' },
];
export const previewSessions: readonly AssistantSession[] = [
  ...historicalSessions,
  {
    id: 'web-04', code: 'C2', course: 'Pemrograman Web', topic: 'Sesi 04 | Formulir & validasi',
    className: 'IF-3A', date: previewDate, startTime: '08:00', endTime: '09:40',
    room: 'Lab Komputer 2', status: 'open', participantIds: participants,
  },
  {
    id: 'basis-data-05', code: 'C3', course: 'Basis Data', topic: 'Sesi 05 | JOIN antartabel',
    className: 'IF-3B', date: previewDate, startTime: '10:00', endTime: '11:40',
    room: 'Lab Komputer 2', status: 'pending', participantIds: participants,
  },
];
export const previewAttendance: readonly AssistantAttendance[] = [
  ...participants.slice(0, 4).map((participantId, index) => ({
    sessionId: 'web-04', participantId,
    recordedAt: `2026-10-19T${['08:05:12', '08:07:38', '08:12:06', '08:18:45'][index]}+07:00`,
  })),
  ...historicalSessions.flatMap(session => participants.map(participantId => ({
    sessionId: session.id, participantId, recordedAt: `${session.date}T08:05:00+07:00`,
  }))),
];

export function countAttendance(session: AssistantSession, attendance: readonly AssistantAttendance[]) {
  const registered = new Set(session.participantIds);
  return new Set(attendance.filter(item =>
    item.sessionId === session.id && registered.has(item.participantId),
  ).map(item => item.participantId)).size;
}

export const previewParticipants: readonly AssistantParticipant[] = [
  { id: '231110001', name: 'Aditya Pratama' },
  { id: '231110002', name: 'Bunga Maharani' },
  { id: '231110003', name: 'Citra Lestari' },
  { id: '231110004', name: 'Dimas Saputra' },
  { id: '231110005', name: 'Farhan Hakim' },
  { id: '231110006', name: 'Intan Permata' },
];
