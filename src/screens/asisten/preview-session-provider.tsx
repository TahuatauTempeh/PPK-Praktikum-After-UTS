import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import {
  type AssistantSession, type AssistantAttendance, type AssistantParticipant,
  previewSessions, previewAttendance, previewParticipants,
} from './schedule-data';

type SessionSource = {
  sessions: readonly AssistantSession[];
  attendance: readonly AssistantAttendance[];
  participants: readonly AssistantParticipant[];
  openSession: (id: string) => void;
  closeSession: (id: string) => void;
};
const PreviewSessionContext = createContext<SessionSource | null>(null);

/** Adapter demo sisi Asisten saja, bukan implementasi SessionContext bersama P1. */
export function AssistantPreviewProvider({ children }: PropsWithChildren) {
  const [sessions, setSessions] = useState(previewSessions);

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
      sessions, attendance: previewAttendance, participants: previewParticipants, openSession, closeSession,
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
