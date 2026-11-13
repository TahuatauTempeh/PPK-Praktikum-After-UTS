import type { Href } from 'expo-router';

import type { ScheduleIconName } from './components/schedule-icon';

export type HomeMenuItem = {
  id: string;
  title: string;
  icon: ScheduleIconName;
  href: Href;
  adminOnly?: boolean;
};

export const homeMenu: HomeMenuItem[] = [
  { id: 'rekap', title: 'Rekap', icon: 'chartPrimary', href: '/asisten/rekap' },
  { id: 'pengguna', title: 'Kelola Pengguna', icon: 'usersPrimary', href: '/pengguna', adminOnly: true },
];
