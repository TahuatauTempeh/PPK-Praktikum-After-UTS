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

const offsetWIB = 7 * 60 * 60 * 1000;

/** Sapaan menurut jam WIB; aturannya sama dengan sisi Praktikan. */
export function sapaanWIB(now: Date = new Date()) {
  const hour = new Date(now.getTime() + offsetWIB).getUTCHours();
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/** Nama praktikum: mata kuliah + kode praktikum, mis. "Basis Data C2". */
export function formatPraktikumName(session: Pick<AssistantSession, 'course' | 'code'>) {
  // Sesi Firestore tidak punya kode terpisah (code kosong), jadi spasi sisa dibuang.
  return `${session.course} ${session.code}`.trim();
}
