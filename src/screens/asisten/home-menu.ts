import type { Href } from 'expo-router';

import type { ScheduleIconName } from './components/schedule-icon';

export type HomeMenuItem = {
  id: string;
  title: string;
  icon: ScheduleIconName;
  href: Href;
};

export const homeMenu: HomeMenuItem[] = [
  { id: 'jadwal', title: 'Jadwal', icon: 'calendar', href: '/asisten/jadwal' },
  { id: 'rekap', title: 'Rekap', icon: 'chartPrimary', href: '/asisten/rekap' },
  { id: 'kelas', title: 'Kelas', icon: 'calendarPlus', href: '/asisten/kelas' as Href },
  { id: 'peserta', title: 'Peserta', icon: 'usersPrimary', href: '/asisten/peserta' as Href },
  { id: 'lab', title: 'Lab', icon: 'formPin', href: '/asisten/lab' as Href },
  { id: 'peta', title: 'Peta', icon: 'pin', href: '/asisten/peta' as Href },
  { id: 'atur-sesi', title: 'Atur Sesi', icon: 'clock', href: '/asisten/atur-sesi' as Href },
  { id: 'izin', title: 'Izin', icon: 'formInfo', href: '/asisten/izin' },
];
