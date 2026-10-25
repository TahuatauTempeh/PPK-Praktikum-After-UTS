import { isValidDate } from './recap-data';
import { type AssistantSession } from './schedule-data';

export type SessionForm = {
  course: string; topic: string; className: string; date: string;
  startTime: string; endTime: string; room: string;
};
export type SessionFormErrors = Partial<Record<keyof SessionForm, string>>;
export type SessionChoices = {
  courses: readonly string[];
  classes: readonly { name: string; code: string; participantIds: readonly string[] }[];
};
export const emptySessionForm: SessionForm = {
  course: '', topic: '', className: '', date: '', startTime: '', endTime: '', room: '',
};

export function sessionChoices(sessions: readonly AssistantSession[]): SessionChoices {
  const names = [...new Set(sessions.map(session => session.className))];
  return {
    courses: [...new Set(sessions.map(session => session.course))],
    classes: names.map(name => ({ name, code: sessions.find(session => session.className === name)!.code, participantIds: [...new Set(sessions
      .filter(session => session.className === name).flatMap(session => [...session.participantIds]))] })),
  };
}

export function validateSessionForm(form: SessionForm, choices: SessionChoices): SessionFormErrors {
  const errors: SessionFormErrors = {};
  if (!choices.courses.includes(form.course)) errors.course = 'Mata kuliah wajib dipilih.';
  if (!form.topic.trim()) errors.topic = 'Sesi / topik wajib diisi.';
  if (!choices.classes.some(item => item.name === form.className)) errors.className = 'Kelas wajib dipilih.';
  if (!form.date) errors.date = 'Tanggal wajib dipilih.';
  else if (!isValidDate(form.date)) errors.date = 'Pilih tanggal yang valid.';
  const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (!validTime(form.startTime)) errors.startTime = 'Jam mulai wajib dipilih dengan benar.';
  if (!validTime(form.endTime)) errors.endTime = 'Jam selesai wajib dipilih dengan benar.';
  else if (!errors.startTime && form.endTime <= form.startTime) errors.endTime = 'Harus setelah jam mulai.';
  if (!form.room.trim()) errors.room = 'Lokasi / ruangan wajib diisi.';
  return errors;
}

export function createSession(form: SessionForm, choices: SessionChoices, id: string): AssistantSession {
  if (Object.keys(validateSessionForm(form, choices)).length) throw new Error('Periksa kembali kolom yang ditandai.');
  const selectedClass = choices.classes.find(item => item.name === form.className)!;
  return {
    id, code: selectedClass.code, course: form.course, topic: form.topic.trim(), className: form.className,
    date: form.date, startTime: form.startTime, endTime: form.endTime, room: form.room.trim(),
    status: 'pending', participantIds: [...new Set(selectedClass.participantIds)],
  };
}
