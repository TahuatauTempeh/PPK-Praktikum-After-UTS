/**
 * SessionContext — State management pusat aplikasi presensi.
 *
 * Menyediakan:
 * - currentUser, sessions, attendance
 * - setUser, logout
 * - addSession, openSession, closeSession
 * - submitAttendance (dengan business rules)
 * - showToast (untuk feedback ke user)
 */

import React, { createContext, useCallback, useContext, useMemo, useReducer, useState } from 'react';

import { dummyAttendance, dummySessions } from '@/data/dummy';
import { AttendanceRecord, Session, SessionStatus, User } from '@/types';

// ─── Toast ───────────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// ─── State ───────────────────────────────────────────────────────────────────

interface SessionState {
  currentUser: User | null;
  sessions: Session[];
  attendance: AttendanceRecord[];
}

const initialState: SessionState = {
  currentUser: null,
  sessions: dummySessions,
  attendance: dummyAttendance,
};

// ─── Actions ─────────────────────────────────────────────────────────────────

type SessionAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_SESSION'; payload: Omit<Session, 'id' | 'status'> }
  | { type: 'OPEN_SESSION'; payload: string }
  | { type: 'CLOSE_SESSION'; payload: string }
  | { type: 'SUBMIT_ATTENDANCE'; payload: AttendanceRecord };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };

    case 'LOGOUT':
      return { ...state, currentUser: null };

    case 'ADD_SESSION': {
      const newSession: Session = {
        ...action.payload,
        id: `s${Date.now()}`,
        status: 'scheduled' as SessionStatus,
      };
      return { ...state, sessions: [...state.sessions, newSession] };
    }

    case 'OPEN_SESSION':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.payload && s.status === 'scheduled' ? { ...s, status: 'open' as SessionStatus } : s
        ),
      };

    case 'CLOSE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.payload && s.status === 'open' ? { ...s, status: 'closed' as SessionStatus } : s
        ),
      };

    case 'SUBMIT_ATTENDANCE':
      return {
        ...state,
        attendance: [...state.attendance, action.payload],
      };

    default:
      return state;
  }
}

// ─── Context Value ───────────────────────────────────────────────────────────

interface SessionContextValue {
  state: SessionState;
  setUser: (user: User) => void;
  logout: () => void;
  addSession: (session: Omit<Session, 'id' | 'status'>) => void;
  openSession: (sessionId: string) => { success: boolean; message: string };
  closeSession: (sessionId: string) => { success: boolean; message: string };
  submitAttendance: (sessionId: string) => { success: boolean; message: string };
  toast: ToastMessage | null;
  showToast: (type: ToastMessage['type'], message: string) => void;
  dismissToast: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = `toast-${Date.now()}`;
    setToast({ id, type, message });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const setUser = useCallback((user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const addSession = useCallback(
    (session: Omit<Session, 'id' | 'status'>) => {
      dispatch({ type: 'ADD_SESSION', payload: session });
      showToast('success', 'Sesi baru berhasil ditambahkan');
    },
    [showToast]
  );

  const openSession = useCallback(
    (sessionId: string): { success: boolean; message: string } => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) {
        const msg = 'Sesi tidak ditemukan';
        showToast('error', msg);
        return { success: false, message: msg };
      }
      if (session.status !== 'scheduled') {
        const msg = `Sesi tidak bisa dibuka (status: ${session.status})`;
        showToast('error', msg);
        return { success: false, message: msg };
      }
      dispatch({ type: 'OPEN_SESSION', payload: sessionId });
      showToast('success', 'Sesi berhasil dibuka');
      return { success: true, message: 'Sesi berhasil dibuka' };
    },
    [state.sessions, showToast]
  );

  const closeSession = useCallback(
    (sessionId: string): { success: boolean; message: string } => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) {
        const msg = 'Sesi tidak ditemukan';
        showToast('error', msg);
        return { success: false, message: msg };
      }
      if (session.status !== 'open') {
        const msg = `Sesi tidak bisa ditutup (status: ${session.status})`;
        showToast('error', msg);
        return { success: false, message: msg };
      }
      dispatch({ type: 'CLOSE_SESSION', payload: sessionId });
      showToast('success', 'Sesi berhasil ditutup');
      return { success: true, message: 'Sesi berhasil ditutup' };
    },
    [state.sessions, showToast]
  );

  const submitAttendance = useCallback(
    (sessionId: string): { success: boolean; message: string } => {
      const { currentUser, sessions, attendance } = state;

      if (!currentUser) {
        const msg = 'User belum login';
        showToast('error', msg);
        return { success: false, message: msg };
      }

      const session = sessions.find((s) => s.id === sessionId);
      if (!session) {
        const msg = 'Sesi tidak ditemukan';
        showToast('error', msg);
        return { success: false, message: msg };
      }

      // Business rule: blokir jika sesi tidak open
      if (session.status !== 'open') {
        const msg =
          session.status === 'scheduled'
            ? 'Sesi belum dibuka oleh asisten'
            : 'Sesi sudah ditutup';
        showToast('error', msg);
        return { success: false, message: msg };
      }

      // Business rule: blokir presensi ganda
      const alreadyAttended = attendance.some(
        (a) => a.sessionId === sessionId && a.userId === currentUser.id
      );
      if (alreadyAttended) {
        const msg = 'Anda sudah melakukan presensi di sesi ini';
        showToast('info', msg);
        return { success: false, message: msg };
      }

      // Catat presensi dengan timestamp otomatis
      const now = new Date().toISOString();
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        sessionId,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: now,
      };

      dispatch({ type: 'SUBMIT_ATTENDANCE', payload: record });

      const timeStr = new Date(now).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      showToast('success', `Presensi berhasil dicatat pukul ${timeStr}`);
      return { success: true, message: `Presensi tercatat pukul ${timeStr}` };
    },
    [state, showToast]
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      setUser,
      logout,
      addSession,
      openSession,
      closeSession,
      submitAttendance,
      toast,
      showToast,
      dismissToast,
    }),
    [state, setUser, logout, addSession, openSession, closeSession, submitAttendance, toast, showToast, dismissToast]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
