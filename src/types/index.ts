/**
 * Sesi Firestore untuk menamai izin di sisi Asisten.
 * Sesi dipantau realtime, nama kelas diambil sekali dari class-service (Dev 2).
 * Bentuknya disamakan dengan sesi di Jadwal praktikan lewat toPraktikanSession.
 *
 * Listener ditulis sendiri, bukan listenAllSessions, karena izin perlu tahu saat
 * pemuatan gagal; tanpa itu label "Memuat sesi..." tidak pernah berhenti.
 */

import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { getAllClasses } from '@/lib/class-service';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import { toPraktikanSession } from '@/screens/praktikan/selectors';
import type { KeadaanSesi } from '@/screens/shared/izin';
import type { PracticumClass, PraktikumSession, Session, SessionStatus } from '@/types';

function teks(nilai: unknown, cadangan = ''): string {
  return typeof nilai === 'string' ? nilai : cadangan;
}

function status(nilai: unknown): SessionStatus {
  return nilai === 'open' || nilai === 'closed' ? nilai : 'scheduled';
}

export function useSesiIzin(): { sessions: Session[]; keadaan: KeadaanSesi } {
  const [mentah, setMentah] = useState<PraktikumSession[]>([]);
  const [keadaan, setKeadaan] = useState<KeadaanSesi>('memuat');
  const [kelas, setKelas] = useState<PracticumClass[]>([]);

  useEffect(
      () =>
          onSnapshot(
              collection(getDb(), COLLECTIONS.sessions),
              (hasil) => {
                setMentah(
                    hasil.docs.map((dok) => {
                      const data = dok.data();
                      return {
                        id: dok.id,
                        classId: teks(data.classId),
                        title: teks(data.title),
                        date: data.date ?? '',
                        startTime: teks(data.startTime, '00:00'),
                        endTime: teks(data.endTime, '00:00'),
                        room: teks(data.room),
                        assistantId: teks(data.assistantId),
                        laboratoryId: teks(data.laboratoryId),
                        status: status(data.status),
                        createdAt: '',
                      };
                    })
                );
                setKeadaan('siap');
              },
              (error) => {
                console.warn('[izin] daftar sesi gagal dimuat', error);
                setKeadaan('galat');
              }
          ),
      []
  );

  useEffect(() => {
    let aktif = true;
    // Gagal memuat kelas tidak menghalangi izin; nama kelas jatuh ke 'Praktikum'.
    getAllClasses()
        .then((hasil) => aktif && setKelas(hasil))
        .catch((error) => console.warn('[izin] nama kelas gagal dimuat', error));
    return () => {
      aktif = false;
    };
  }, []);

  const sessions = useMemo(() => {
    const peta = new Map(kelas.map((item) => [item.id, item]));
    return mentah.map((s) => toPraktikanSession(s, peta));
  }, [mentah, kelas]);

  return { sessions, keadaan };
}