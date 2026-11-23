import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';

import { listenAllClasses } from '@/lib/class-service';
import { useFirestoreSchedule } from '@/lib/useSessionFirestore';
import { keSesiAsisten, pilihTanggalAktif, tanggalHariIniWIB } from '@/screens/asisten/jadwal-aktif';
import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';
import type { AssistantSession } from '@/screens/asisten/schedule-data';
import ScheduleScreen from '@/screens/asisten/schedule-screen';

export default function ScheduleRoute() {
  const preview = useAssistantSessions();
  const { firestoreSessions } = useFirestoreSchedule();
  const [namaKelas, setNamaKelas] = useState<ReadonlyMap<string, string>>(new Map());

  // Nama kelas untuk judul kartu; tanpa ini kartu menampilkan ID dokumen kelas.
  useEffect(
    () => listenAllClasses((items) => setNamaKelas(new Map(items.map((item) => [item.id, item.name])))),
    []
  );

  const sessions: readonly AssistantSession[] = useMemo(() => {
    if (firestoreSessions.length === 0) return preview.sessions;
    return firestoreSessions.map((s) => keSesiAsisten(s, namaKelas));
  }, [firestoreSessions, preview.sessions, namaKelas]);

  const activeDate =
    pilihTanggalAktif(
      sessions.map((s) => s.date),
      tanggalHariIniWIB()
    ) ?? preview.scheduleDate;

  return (
    <ScheduleScreen
      sessions={sessions}
      attendance={preview.attendance}
      date={activeDate}
      onManage={(id) => router.push({ pathname: '/asisten/sesi/[id]', params: { id } })}
      onBack={() => router.navigate('/asisten')}
    />
  );
}
