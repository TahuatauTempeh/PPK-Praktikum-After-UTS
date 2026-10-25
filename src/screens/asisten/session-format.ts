import { type AssistantSession } from './schedule-data';

export function formatSessionDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(`${date}T00:00:00+07:00`));
}

export function formatAttendanceTime(instant: string) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date(instant));
}

export function splitSessionTopic(topic: string) {
  const match = /^Sesi\s+(\d+)\s*\|\s*(.*)$/.exec(topic);
  return {
    number: match?.[1] ?? null,
    topic: match ? match[2].trim() : topic,
  };
}

/** Nama praktikum: mata kuliah + kode praktikum, mis. "Basis Data C2". */
export function formatPraktikumName(session: Pick<AssistantSession, 'course' | 'code'>) {
  return `${session.course} ${session.code}`;
}
