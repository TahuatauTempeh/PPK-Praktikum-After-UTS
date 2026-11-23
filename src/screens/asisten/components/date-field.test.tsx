import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// Implementasi Android diimpor langsung; Jest memakai platform iOS sebagai default.
import { DateFieldDialog as DateField } from './date-field-dialog';
import { dateKeTanggal, tanggalKeDate, tanggalValid } from './date-field-utils';

type PickerProps = {
  mode: string;
  value: Date;
  onValueChange: (event: unknown, date: Date) => void;
  onDismiss: () => void;
};

let pickerTerakhir: PickerProps | null = null;

jest.mock('@expo/ui/community/datetime-picker', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    DateTimePicker: (props: PickerProps) => {
      pickerTerakhir = props;
      return <Text>dialog kalender</Text>;
    },
  };
});

beforeEach(() => {
  pickerTerakhir = null;
});

describe('konversi tanggal', () => {
  it('mengubah "YYYY-MM-DD" menjadi Date lokal dan kembali lagi', () => {
    const tanggal = tanggalKeDate('2026-11-23');
    expect([tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate()]).toEqual([2026, 10, 23]);
    expect(dateKeTanggal(tanggal)).toBe('2026-11-23');
  });

  it('menambah nol di depan bulan dan hari satu digit', () => {
    expect(dateKeTanggal(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });

  it('menolak tanggal yang tidak ada di kalender', () => {
    expect(tanggalValid('2026-02-30')).toBe(false);
    expect(tanggalValid('2026-13-01')).toBe(false);
    expect(tanggalValid('23-11-2026')).toBe(false);
    expect(tanggalValid('')).toBe(false);
    expect(tanggalValid('2028-02-29')).toBe(true);
  });

  it('memakai tanggal cadangan bila tanggal tidak valid', () => {
    expect(dateKeTanggal(tanggalKeDate('salah', new Date(2026, 10, 23, 8)))).toBe('2026-11-23');
  });
});

describe('<DateField /> Android', () => {
  it('menampilkan tanggal yang mudah dibaca dan membuka dialog kalender', async () => {
    const { getByText, queryByText, getByLabelText } = await render(
      <DateField value="2026-11-23" onChange={jest.fn()} accessibilityLabel="Tanggal Sesi" />
    );

    expect(getByText('23 Nov 2026')).toBeTruthy();
    expect(queryByText('dialog kalender')).toBeNull();

    await fireEvent.press(getByLabelText('Tanggal Sesi, 23 Nov 2026'));
    expect(getByText('dialog kalender')).toBeTruthy();
    expect(pickerTerakhir?.mode).toBe('date');
    expect(dateKeTanggal(pickerTerakhir!.value)).toBe('2026-11-23');
  });

  it('mengirim tanggal "YYYY-MM-DD" yang dipilih lalu menutup dialog', async () => {
    const onChange = jest.fn();
    const { getByLabelText, queryByText } = await render(
      <DateField value="2026-11-23" onChange={onChange} accessibilityLabel="Tanggal Sesi" />
    );

    await fireEvent.press(getByLabelText('Tanggal Sesi, 23 Nov 2026'));
    await act(async () => pickerTerakhir!.onValueChange({}, new Date(2026, 11, 1, 12)));

    expect(onChange).toHaveBeenCalledWith('2026-12-01');
    expect(queryByText('dialog kalender')).toBeNull();
  });

  it('tidak mengubah tanggal saat dialog dibatalkan', async () => {
    const onChange = jest.fn();
    const { getByLabelText, queryByText } = await render(
      <DateField value="2026-11-23" onChange={onChange} accessibilityLabel="Tanggal Sesi" />
    );

    await fireEvent.press(getByLabelText('Tanggal Sesi, 23 Nov 2026'));
    await act(async () => pickerTerakhir!.onDismiss());

    expect(onChange).not.toHaveBeenCalled();
    expect(queryByText('dialog kalender')).toBeNull();
  });

  it('menampilkan petunjuk saat tanggal kosong', async () => {
    const { getByText, getByLabelText } = await render(
      <DateField value="" onChange={jest.fn()} accessibilityLabel="Tanggal Sesi" />
    );
    expect(getByText('Pilih tanggal')).toBeTruthy();
    expect(getByLabelText('Tanggal Sesi, belum dipilih')).toBeTruthy();
  });

  it('tidak membuka dialog saat form sedang disimpan', async () => {
    const { getByLabelText, queryByText } = await render(
      <DateField value="2026-11-23" onChange={jest.fn()} accessibilityLabel="Tanggal Sesi" disabled />
    );

    await fireEvent.press(getByLabelText('Tanggal Sesi, 23 Nov 2026'));
    expect(queryByText('dialog kalender')).toBeNull();
  });
});
