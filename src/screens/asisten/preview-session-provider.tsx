import { createContext, useContext, useRef, useState, type PropsWithChildren } from 'react';

import {
  type AssistantSession, type AssistantAttendance, type AssistantParticipant,
  previewSessions, previewAttendance, previewParticipants, previewDate,
} from './schedule-data';

import { createSession, sessionChoices, type SessionForm } from './session-form';

type SessionSource = {
  scheduleDate: string;
  sessions: readonly AssistantSession[];
  attendance: readonly AssistantAttendance[];
  participants: readonly AssistantParticipant[];
  addSession: (form: SessionForm) => AssistantSession;
  openSession: (id: string) => void;
  closeSession: (id: string) => void;
};
const PreviewSessionContext = createContext<SessionSource | null>(null);

/** Adapter demo sisi Asisten saja, bukan implementasi SessionContext bersama P1. */
export function AssistantPreviewProvider({ children }: PropsWithChildren) {
  const [sessions, setSessions] = useState(previewSessions);
  const [scheduleDate, setScheduleDate] = useState(previewDate);
  const sequence = useRef(0);

  function addSession(form: SessionForm) {
    const session = createSession(form, sessionChoices(sessions), `session-${Date.now()}-${++sequence.current}`);
    setSessions(current => [...current, session]);
    setScheduleDate(session.date);
    return session;
  }

  function openSession(id: string) {
    setSessions(current => current.map(session => session.id === id && session.status === 'pending'
      ? { ...session, status: 'open' } : session));
  }

  function closeSession(id: string) {
    const closedAt = new Date().toISOString();
    setSessions(current => current.map(session => session.id === id && session.status === 'open'
      ? { ...session, status: 'closed', closedAt, closedBy: 'Nadia' } : session));
  }

  return (
    <PreviewSessionContext.Provider value={{
      scheduleDate, sessions, attendance: previewAttendance, participants: previewParticipants, openSession, closeSession, addSession,
    }}>
      {children}
    </PreviewSessionContext.Provider>
  );
}

export function useAssistantSessions() {
  const context = useContext(PreviewSessionContext);
  if (!context) throw new Error('AssistantPreviewProvider diperlukan untuk pratinjau Asisten.');
  return context;
}
