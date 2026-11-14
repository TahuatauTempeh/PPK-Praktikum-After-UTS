import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getAllClasses } from '@/lib/class-service';
import { getSessionsForPraktikan } from '@/lib/session-service';
import { toPraktikanSession } from '@/screens/praktikan/selectors';
import { Session } from '@/types';

/** Memuat daftar sesi praktikan yang sudah difilter berdasarkan enrollment kelasnya. */
export function usePraktikanSchedule(userId: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return [];
    const [rawSessions, classes] = await Promise.all([
      getSessionsForPraktikan(userId),
      getAllClasses(),
    ]);
    const classMap = new Map(classes.map((item) => [item.id, item]));
    return rawSessions.map((item) => toPraktikanSession(item, classMap));
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const mapped = await loadData();
      setSessions(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat jadwal praktikum.');
    } finally {
      setLoading(false);
    }
  }, [loadData, userId]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let active = true;
      loadData()
        .then((mapped) => {
          if (!active) return;
          setSessions(mapped);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          if (!active) return;
          setError(err instanceof Error ? err.message : 'Gagal memuat jadwal praktikum.');
          setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [loadData, userId])
  );

  return { sessions, loading, error, refresh };
}
