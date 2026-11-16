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
  { id: 'izin', title: 'Izin', icon: 'formInfo', href: '/asisten/izin' },
];
