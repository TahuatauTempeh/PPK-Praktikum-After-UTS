/**
 * use-map-data.ts: hook realtime untuk menggabungkan data laboratorium,
 * sesi praktikum, dan kelas bagi layar Peta (Dev 3).
 *
 * Seluruh listener dibersihkan saat unmount, dan waktu WIB dievaluasi
 * ulang berkala agar status "Sekarang" dan "Berikutnya" tetap akurat.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { listenAllClasses } from '@/lib/class-service';
import { listenLaboratories } from '@/lib/laboratory-service';
import { listenAllSessions, type FirestoreSession } from '@/lib/session-actions';
import type { Laboratory, PracticumClass } from '@/types';

import { buildLaboratoryMapItems, type LaboratoryMapItem } from './selectors';

const CLOCK_TICK_MS = 30_000;

export interface MapDataState {
  items: LaboratoryMapItem[];
  activeLabs: Laboratory[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useMapData(): MapDataState {
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [sessions, setSessions] = useState<FirestoreSession[]>([]);
  const [classes, setClasses] = useState<PracticumClass[]>([]);

  const [labsReady, setLabsReady] = useState(false);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [classesReady, setClassesReady] = useState(false);

  const [labsError, setLabsError] = useState<string | null>(null);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [nowTick, setNowTick] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(new Date());
    }, CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribeLabs = listenLaboratories(
      (data) => {
        setLabs(data);
        setLabsError(null);
        setLabsReady(true);
      },
      (message) => {
        setLabsError(message);
        setLabsReady(true);
      }
    );

    const unsubscribeSessions = listenAllSessions((data) => {
      setSessions(data);
      setSessionsReady(true);
    });

    const unsubscribeClasses = listenAllClasses(
      (data) => {
        setClasses(data);
        setClassesError(null);
        setClassesReady(true);
      },
      (message) => {
        setClassesError(message);
        setClassesReady(true);
      }
    );

    return () => {
      unsubscribeLabs();
      unsubscribeSessions();
      unsubscribeClasses();
    };
  }, [retryCount]);

  const retry = useCallback(() => {
    setLabsReady(false);
    setSessionsReady(false);
    setClassesReady(false);
    setLabsError(null);
    setClassesError(null);
    setRetryCount((count) => count + 1);
  }, []);

  const error = labsError ?? classesError;
  const loading = error === null && (!labsReady || !sessionsReady || !classesReady);

  const items = useMemo(
    () => buildLaboratoryMapItems(labs, sessions, classes, nowTick),
    [labs, sessions, classes, nowTick]
  );

  const activeLabs = useMemo(() => items.map((item) => item.lab), [items]);

  return {
    items,
    activeLabs,
    loading,
    error,
    retry,
  };
}
