import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { LaboratoryMapItem } from '../selectors';
import { LabListMode } from './lab-list-mode';

jest.mock('firebase/firestore', () => ({
  Timestamp: class {},
}));

const labAItem: LaboratoryMapItem = {
  lab: {
    id: 'lab-a',
    name: 'Lab A201',
    code: 'LAB-A',
    building: 'Gedung A',
    floor: 'Lantai 2',
    room: 'A201',
    latitude: -7.0519,
    longitude: 110.4383,
    radiusMeters: 100,
    description: 'Lab basis data',
    isActive: true,
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z',
    updatedBy: 'asisten-1',
  },
  locationLabel: 'Gedung A · Lantai 2 · A201',
  radiusLabel: '100 m',
  current: {
    id: 's1',
    title: 'Basis Data',
    className: 'IF-3A',
    date: '2026-11-23',
    dateLabel: 'Hari ini',
    startTime: '08:00',
    endTime: '09:40',
    timeRangeWib: '08.00–09.40 WIB',
    room: 'A201',
    status: 'open',
    statusLabel: 'Dibuka',
  },
  next: {
    id: 's3',
    title: 'Struktur Data',
    className: 'IF-3B',
    date: '2026-11-24',
    dateLabel: '24 Nov 2026',
    startTime: '10:00',
    endTime: '11:40',
    timeRangeWib: '10.00–11.40 WIB',
    room: 'A201',
    status: 'scheduled',
    statusLabel: 'Belum dibuka',
  },
  hasAnyActivity: true,
};

const emptyLabItem: LaboratoryMapItem = {
  lab: {
    ...labAItem.lab,
    id: 'lab-c',
    name: 'Lab C301',
    code: 'LAB-C',
    building: 'Gedung C',
    floor: '',
    room: 'C301',
    radiusMeters: 120,
    description: '',
  },
  locationLabel: 'Gedung C · C301',
  radiusLabel: '120 m',
  current: null,
  next: null,
  hasAnyActivity: false,
};

describe('LabListMode', () => {
  it('menampilkan empty state saat tidak ada laboratorium aktif', async () => {
    const { getByText } = await render(
      <LabListMode items={[]} selectedLabId={null} onSelectLab={jest.fn()} />
    );

    expect(getByText('Belum ada laboratorium')).toBeTruthy();
  });

  it('menampilkan ringkasan aktivitas dan status teks untuk setiap lab', async () => {
    const { getByLabelText, getByText } = await render(
      <LabListMode
        items={[labAItem, emptyLabItem]}
        selectedLabId={null}
        onSelectLab={jest.fn()}
      />
    );

    expect(getByText('Lab A201')).toBeTruthy();
    expect(getByText('Dibuka')).toBeTruthy();
    expect(
      getByLabelText(
        'Lab A201, Gedung A · Lantai 2 · A201, radius 100 m. Sekarang Basis Data, IF-3A, Dibuka'
      )
    ).toBeTruthy();
    expect(getByText('Lab C301')).toBeTruthy();
    expect(getByText('Belum ada praktikum terjadwal')).toBeTruthy();
  });

  it('membuka detail lengkap Sekarang dan Berikutnya saat lab dipilih', async () => {
    const onSelectLab = jest.fn();
    const { getByLabelText, getByText } = await render(
      <LabListMode
        items={[labAItem]}
        selectedLabId="lab-a"
        onSelectLab={onSelectLab}
      />
    );

    expect(getByText('SEKARANG')).toBeTruthy();
    expect(getByText('BERIKUTNYA')).toBeTruthy();
    expect(getByText('Struktur Data')).toBeTruthy();
    expect(getByText('Belum dibuka')).toBeTruthy();

    await fireEvent.press(getByLabelText('Tutup detail laboratorium'));
    expect(onSelectLab).toHaveBeenCalledWith(null);
  });
});
