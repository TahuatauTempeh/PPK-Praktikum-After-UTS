import { type AssistantAttendance, type AssistantSession, countAttendance } from './schedule-data';

export type DateRange = { start: string; end: string };

export function monthRange(date: string): DateRange {
  const [year, month] = date.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { start: `${date.slice(0, 7)}-01`, end: `${date.slice(0, 7)}-${lastDay}` };
}

export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function buildRecap(sessions: readonly AssistantSession[], attendance: readonly AssistantAttendance[],
  range: DateRange | null, selectedId: string) {
  const rows = sessions.filter(session => session.status === 'closed'
    && (!range || (session.date >= range.start && session.date <= range.end))
    && (!selectedId || session.id === selectedId))
    .sort((a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`) || a.id.localeCompare(b.id))
    .map(session => {
      const total = new Set(session.participantIds).size;
      const present = countAttendance(session, attendance);
      return { session, total, present, absent: total - present, percent: total ? Math.round(present / total * 100) : null };
    });
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const present = rows.reduce((sum, row) => sum + row.present, 0);
  return { rows, total, present, percent: total ? Math.round(present / total * 100) : null };
}
