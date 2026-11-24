import { render, screen } from '@testing-library/react-native';
import React from 'react';

import ScheduleScreen from './schedule-screen';

// Kerangka layar membutuhkan NavigationContainer; yang diuji hanya isi jadwal.
jest.mock('./components/assistant-screen', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AssistantScreen: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

it('menampilkan keadaan kosong tanpa data preview', async () => {
  await render(<ScheduleScreen sessions={[]} attendance={[]} date="2026-11-24" />);
  expect(screen.getByText('0 sesi')).toBeTruthy();
});
