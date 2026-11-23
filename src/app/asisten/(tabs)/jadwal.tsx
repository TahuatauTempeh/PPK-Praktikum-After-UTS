import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';

import { listenAllAttendance, type AttendanceDoc } from '@/lib/attendance-service';
import { listenAllClasses } from '@/lib/class-service';
import { listenAllEnrollments } from '@/lib/enrollment-service';
import { useFirestoreSchedule } from '@/lib/useSessionFirestore';
import { keSesiAsisten, pilihTanggalAktif, tanggalHariIniWIB } from '@/screens/asisten/jadwal-aktif';
import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';
import {
  buildAssistantAttendance,
  buildAssistantSessions,
} from '@/screens/asisten/schedule-mapping';
import ScheduleScreen from '@/screens/asisten/schedule-screen';
import type { Enrollment } from '@/types';

export default function ScheduleRoute() {
  const preview = useAssistantSessions();
  const { firestoreSessions } = useFirestoreSchedule();
  const [namaKelas, setNamaKelas] = useState<ReadonlyMap<string, string>>(new Map());
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceDocs, setAttendanceDocs] = useState<AttendanceDoc[]>([]);

  useEffect(() => {
    // Nama kelas untuk judul kartu; tanpa ini kartu menampilkan ID dokumen kelas.
    const unsubClasses = listenAllClasses((items) =>
      setNamaKelas(new Map(items.map((item) => [item.id, item.name])))
    );
    const unsubEnrollments = listenAllEnrollments(setEnrollments);
    const unsubAttendance = listenAllAttendance(setAttendanceDocs);

    return () => {
      unsubClasses();
      unsubEnrollments();
      unsubAttendance();
    };
  }, []);

  const sessions = useMemo(() => {
    if (firestoreSessions.length === 0) return preview.sessions;
    // Peserta dari roster enrollment; judul dan nama kelas dari keSesiAsisten.
    return buildAssistantSessions(firestoreSessions, enrollments).map((sesi, i) => ({
      ...keSesiAsisten(firestoreSessions[i], namaKelas),
      participantIds: sesi.participantIds,
    }));
  }, [enrollments, firestoreSessions, preview.sessions, namaKelas]);

  const firestoreAttendance = useMemo(
    () => buildAssistantAttendance(attendanceDocs),
    [attendanceDocs]
  );

  const activeDate =
    pilihTanggalAktif(
      sessions.map((s) => s.date),
      tanggalHariIniWIB()
    ) ?? preview.scheduleDate;
  const activeAttendance =
    firestoreSessions.length === 0 ? preview.attendance : firestoreAttendance;

  return (
    <ScheduleScreen
      sessions={sessions}
      attendance={activeAttendance}
      date={activeDate}
      onManage={(id) => router.push({ pathname: '/asisten/sesi/[id]', params: { id } })}
      onBack={() => router.navigate('/asisten')}
    />
  );
}
